import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Helper to verify admin access
async function verifyAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { authorized: false, error: 'Unauthorized', status: 401, currentUserId: null }
  }

  const { data: adminUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminUser?.role !== 'admin') {
    return { authorized: false, error: 'Forbidden - Admin access required', status: 403, currentUserId: null }
  }

  return { authorized: true, error: null, status: 200, currentUserId: user.id }
}

// GET /api/admin/users/[id] - Get user details with subscriptions and activity
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { authorized, error, status } = await verifyAdmin(supabase)
    if (!authorized) {
      return NextResponse.json({ error }, { status })
    }

    // Fetch user with all related data
    const { data: user, error: userError } = await supabase
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
        updated_at
      `)
      .eq('id', id)
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Fetch all subscriptions (history)
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    // Fetch lifestyle profile if exists
    const { data: lifestyleProfile } = await supabase
      .from('lifestyle_profiles')
      .select('*')
      .eq('user_id', id)
      .single()

    // Fetch recent property matches (activity)
    const { data: recentMatches } = await supabase
      .from('property_matches')
      .select(`
        id,
        match_score,
        lifestyle_fit,
        viewed,
        favorited,
        created_at
      `)
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Fetch alerts count
    const { count: alertsCount } = await supabase
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)

    // Find active subscription
    const activeSubscription = subscriptions?.find(sub => sub.status === 'active') || null

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        subscription: activeSubscription,
        subscriptionHistory: subscriptions || [],
        lifestyleProfile: lifestyleProfile || null,
        activity: {
          recentMatches: recentMatches || [],
          totalAlerts: alertsCount || 0,
        },
      },
    })
  } catch (error) {
    console.error('Error in admin user detail API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { authorized, error, status, currentUserId } = await verifyAdmin(supabase)
    if (!authorized) {
      return NextResponse.json({ error }, { status })
    }

    const body = await request.json()
    const { name, phone, role, is_vip } = body

    // Validate role if provided
    if (role && !['user', 'admin', 'agent'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be user, admin, or agent' },
        { status: 400 }
      )
    }

    // Prevent changing own role (safety measure)
    if (role && id === currentUserId) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    // If demoting an admin, check if they're the last admin
    if (role && role !== 'admin') {
      const { data: targetUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', id)
        .single()

      if (targetUser?.role === 'admin') {
        const { count: adminCount } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'admin')

        if (adminCount && adminCount <= 1) {
          return NextResponse.json(
            { error: 'Cannot demote the last admin' },
            { status: 400 }
          )
        }
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) updateData.role = role
    if (is_vip !== undefined) updateData.is_vip = is_vip

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error('Error in admin user update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { authorized, error, status, currentUserId } = await verifyAdmin(supabase)
    if (!authorized) {
      return NextResponse.json({ error }, { status })
    }

    // Prevent deleting yourself
    if (id === currentUserId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists and get their role
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // If deleting an admin, check if they're the last admin
    if (targetUser?.role === 'admin') {
      const { count: adminCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')

      if (adminCount && adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin' },
          { status: 400 }
        )
      }
    }

    // Delete user (cascades to related tables via foreign keys)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    console.error('Error in admin user delete API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

