import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getShowcaseIDXClient, MOCK_IDX_PROPERTIES } from '@/services/showcase-idx/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    
    const city = searchParams.get('city')
    const propertyType = searchParams.get('propertyType')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const bedrooms = searchParams.get('bedrooms')
    const status = searchParams.get('status') || 'active'
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const source = searchParams.get('source') || 'all' // 'all', 'local', 'idx'

    // Build query for local database
    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (city) query = query.ilike('city', `%${city}%`)
    if (propertyType) query = query.eq('property_type', propertyType)
    if (minPrice) query = query.gte('price', parseFloat(minPrice))
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice))
    if (bedrooms) query = query.eq('bedrooms', parseInt(bedrooms))
    if (featured === 'true') query = query.eq('featured', true)

    const { data: localProperties, count, error } = await query

    if (error) {
      console.error('Error fetching properties:', error)
    }

    let allProperties: any[] = localProperties || []

    // If no local properties or requesting IDX data, try Showcase IDX
    if ((allProperties.length === 0 || source === 'idx' || source === 'all') && source !== 'local') {
      try {
        const idxClient = getShowcaseIDXClient()
        
        // Check if API key is configured
        if (process.env.SHOWCASE_IDX_API_KEY) {
          const idxResponse = await idxClient.searchListings({
            city: city || undefined,
            propertyType: propertyType || undefined,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
            status: status as 'active' | 'pending' | 'sold',
            limit,
          })

          // Transform and merge IDX properties
          const idxProperties = idxResponse.listings.map(listing => ({
            ...idxClient.transformToProperty(listing),
            id: `idx-${listing.listingId}`,
            created_at: listing.listDate,
            updated_at: listing.modifiedDate,
          }))

          // Merge with local, avoiding duplicates by mls_id
          const existingMlsIds = new Set(allProperties.map(p => p.mls_id))
          const newIdxProperties = idxProperties.filter(p => !existingMlsIds.has(p.mls_id))
          allProperties = [...allProperties, ...newIdxProperties]
        } else {
          // Use mock data in development
          console.log('Using mock IDX data (API key not configured)')
          const mockProperties = MOCK_IDX_PROPERTIES
            .filter(p => {
              if (city && !p.address.city.toLowerCase().includes(city.toLowerCase())) return false
              if (minPrice && p.price < parseFloat(minPrice)) return false
              if (maxPrice && p.price > parseFloat(maxPrice)) return false
              if (bedrooms && p.details.bedrooms < parseInt(bedrooms)) return false
              return true
            })
            .map(listing => ({
              ...idxClient.transformToProperty(listing),
              id: `idx-${listing.listingId}`,
              created_at: listing.listDate,
              updated_at: listing.modifiedDate,
            }))

          const existingMlsIds = new Set(allProperties.map(p => p.mls_id))
          const newMockProperties = mockProperties.filter(p => !existingMlsIds.has(p.mls_id))
          allProperties = [...allProperties, ...newMockProperties]
        }
      } catch (idxError) {
        console.error('Error fetching from Showcase IDX:', idxError)
        // Continue with local properties only
      }
    }

    return NextResponse.json({
      success: true,
      properties: allProperties,
      meta: {
        total: count || allProperties.length,
        limit,
        offset,
        hasMore: (count || allProperties.length) > offset + limit,
      },
    })
  } catch (error) {
    console.error('Error in properties API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}

// Sync properties from Showcase IDX to local database
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Verify admin access
    const { data: { user } } = await (await createClient()).auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (dbUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, properties } = body

    if (action === 'sync_idx') {
      // Sync from Showcase IDX
      const idxClient = getShowcaseIDXClient()
      
      let listings: any[] = []
      
      if (process.env.SHOWCASE_IDX_API_KEY) {
        const idxResponse = await idxClient.getFeaturedListings(50)
        listings = idxResponse.listings
      } else {
        // Use mock data
        listings = MOCK_IDX_PROPERTIES
      }

      let synced = 0
      let errors = 0

      for (const listing of listings) {
        const propertyData = idxClient.transformToProperty(listing)
        
        const { error } = await supabase
          .from('properties')
          .upsert(propertyData as any, {
            onConflict: 'mls_id',
          })

        if (error) {
          console.error('Error syncing property:', error)
          errors++
        } else {
          synced++
        }
      }

      return NextResponse.json({
        success: true,
        message: `Synced ${synced} properties, ${errors} errors`,
        synced,
        errors,
      })
    }

    if (action === 'add' && properties) {
      // Add properties manually
      const { data, error } = await supabase
        .from('properties')
        .insert(properties as any)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        properties: data,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in properties POST:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

