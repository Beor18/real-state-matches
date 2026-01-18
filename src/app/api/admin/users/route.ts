import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/admin/users - List users with pagination, search and filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const hasSubscription = searchParams.get('hasSubscription')
    const isVip = searchParams.get('isVip')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Build query for users with their active subscription
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        avatar_url,
        phone,
        role,
        is_vip,
        stripe_customer_id,
        created_at,
        updated_at,
        subscriptions!left (
          id,
          plan_type,
          plan_name,
          status,
          current_period_end
        )
      `, { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
    }

    // Apply role filter
    if (role && ['user', 'admin', 'agent'].includes(role)) {
      query = query.eq('role', role)
    }

    // Apply VIP filter
    if (isVip === 'true') {
      query = query.eq('is_vip', true)
    } else if (isVip === 'false') {
      query = query.eq('is_vip', false)
    }

    // Apply sorting
    const validSortFields = ['created_at', 'email', 'name', 'role', 'updated_at']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: users, error, count } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data to include only active subscription
    const usersWithActiveSubscription = users?.map(user => {
      const subscriptions = user.subscriptions as any[]
      const activeSubscription = subscriptions?.find(sub => sub.status === 'active') || null
      
      return {
        ...user,
        subscription: activeSubscription ? {
          id: activeSubscription.id,
          plan_type: activeSubscription.plan_type,
          plan_name: activeSubscription.plan_name,
          status: activeSubscription.status,
          current_period_end: activeSubscription.current_period_end,
        } : null,
        subscriptions: undefined, // Remove raw subscriptions array
      }
    }) || []

    // Filter by subscription status if requested (post-fetch filtering)
    let filteredUsers = usersWithActiveSubscription
    if (hasSubscription === 'true') {
      filteredUsers = usersWithActiveSubscription.filter(u => u.subscription !== null)
    } else if (hasSubscription === 'false') {
      filteredUsers = usersWithActiveSubscription.filter(u => u.subscription === null)
    }

    return NextResponse.json({
      success: true,
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in admin users API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET stats for dashboard
export async function HEAD(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse(null, { status: 401 })
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminUser?.role !== 'admin') {
      return new NextResponse(null, { status: 403 })
    }

    // Get counts
    const [totalUsers, activeSubscriptions, vipUsers, admins] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_vip', true),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
    ])

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Total-Users': String(totalUsers.count || 0),
        'X-Active-Subscriptions': String(activeSubscriptions.count || 0),
        'X-VIP-Users': String(vipUsers.count || 0),
        'X-Admin-Users': String(admins.count || 0),
      },
    })
  } catch (error) {
    console.error('Error in admin users stats:', error)
    return new NextResponse(null, { status: 500 })
  }
}

