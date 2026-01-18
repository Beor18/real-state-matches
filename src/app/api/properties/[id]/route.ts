import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getShowcaseIDXClient, MOCK_IDX_PROPERTIES } from '@/services/showcase-idx/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check if it's an IDX property (prefixed with idx-)
    if (id.startsWith('idx-')) {
      const idxId = id.replace('idx-', '')
      const idxClient = getShowcaseIDXClient()

      try {
        if (process.env.SHOWCASE_IDX_API_KEY) {
          const listing = await idxClient.getListing(idxId)
          const property = {
            ...idxClient.transformToProperty(listing),
            id,
            created_at: listing.listDate,
            updated_at: listing.modifiedDate,
          }

          return NextResponse.json({
            success: true,
            property,
          })
        } else {
          // Use mock data
          const mockListing = MOCK_IDX_PROPERTIES.find(p => p.listingId === idxId)
          if (mockListing) {
            const property = {
              ...idxClient.transformToProperty(mockListing),
              id,
              created_at: mockListing.listDate,
              updated_at: mockListing.modifiedDate,
            }

            return NextResponse.json({
              success: true,
              property,
            })
          }
        }
      } catch (idxError) {
        console.error('Error fetching from IDX:', idxError)
      }
    }

    // Fetch from local database
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      )
    }

    // Get predictions if available
    const { data: predictions } = await supabase
      .from('property_predictions')
      .select('*')
      .eq('property_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      success: true,
      property: {
        ...(property as object),
        predictions: predictions || null,
      },
    })
  } catch (error) {
    console.error('Error fetching property:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch property' },
      { status: 500 }
    )
  }
}

