import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de propiedad requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get current user (optional - for checking saved properties)
    const { data: { user } } = await supabase.auth.getUser()

    // 1. First, check if user has this property saved (has full data)
    if (user) {
      const { data: savedProperty } = await supabase
        .from('saved_properties')
        .select('property_data')
        .eq('user_id', user.id)
        .eq('property_id', id)
        .single()

      if (savedProperty?.property_data) {
        console.log(`Property ${id} found in saved_properties`)
        return NextResponse.json({
          success: true,
          property: savedProperty.property_data,
          source: 'saved',
        })
      }
    }

    // 2. For Xposure properties, query the local database
    if (id.startsWith('xposure-')) {
      const mlsId = id.replace('xposure-', '')
      
      const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('mls_id', mlsId)
        .eq('idx_source', 'xposure')
        .single()

      if (!error && property) {
        // Transform to normalized format (excluding agent info for business model)
        const normalizedProperty = {
          id: `${property.idx_source}-${property.mls_id}`,
          sourceProvider: property.idx_source,
          mlsNumber: property.mls_id,
          title: property.title || `Propiedad en ${property.city}`,
          description: property.description || (property.neighborhood 
            ? `Propiedad ubicada en ${property.neighborhood}, ${property.city}, Puerto Rico.`
            : `Propiedad ubicada en ${property.city}, Puerto Rico.`),
          price: property.price,
          listingType: property.listing_type,
          address: {
            street: property.address,
            city: property.city,
            state: property.state,
            zipCode: property.zip_code || '',
            country: property.country || 'PR',
            neighborhood: property.neighborhood,
          },
          coordinates: property.latitude && property.longitude ? {
            latitude: property.latitude,
            longitude: property.longitude,
          } : null,
          details: {
            propertyType: property.property_type,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            squareFeet: property.square_feet,
            lotSize: property.lot_size,
            yearBuilt: property.year_built,
          },
          features: property.features || [],
          amenities: property.amenities || [],
          images: property.images || [],
          virtualTourUrl: property.virtual_tour_url,
          listDate: property.created_at,
          modifiedDate: property.updated_at,
          status: property.status,
          featured: property.featured,
        }

        return NextResponse.json({
          success: true,
          property: normalizedProperty,
          source: 'database',
        })
      }
    }

    // 3. For other providers (bridge, realtor), data should come from sessionStorage
    // If we reach here, the property was not found
    console.log(`Property ${id} not found in any source`)
    return NextResponse.json(
      { success: false, error: 'Propiedad no encontrada. Intenta acceder desde los resultados de búsqueda.' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error in property detail API:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener la propiedad' },
      { status: 500 }
    )
  }
}
