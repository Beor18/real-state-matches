/**
 * Script para importar listings de Xposure (Puerto Rico MLS) a Supabase
 * 
 * Lee el archivo JSON generado por fetch-puerto-rico-listings.ts
 * y hace upsert en la tabla 'properties' de Supabase
 * 
 * Uso: npx tsx scripts/import-xposure-listings.ts
 * 
 * Variables de entorno requeridas:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY para desarrollo)
 */

import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.local' })

// Xposure property format from JSON
interface XposureProperty {
  id: string
  publicKey: string
  uid: string
  xpid: string
  title: string
  type: number
  address: string
  stName: string
  stNum: string
  unit: string
  subdivision: string
  map_area: string
  district: string
  status: string
  statusNum: number
  price_current: string
  price_current_rent: string
  price_sold: string
  bedrooms: string
  bathrooms: string
  sqft_total: string
  lot_sqft: string
  year_built: string
  parking_spaces: string
  lat: number
  lng: number
  thumbnailPhotoURL: string
  pcount: number
  property_icon: string
  is_reported: boolean
  relist: boolean
  change: string
  listing_status_change: string
  occurance: string
  seq: number
  key: string
}

// Database property format for insert
interface DatabasePropertyInsert {
  mls_id: string
  idx_source: string
  title: string
  description: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  neighborhood: string | null
  property_type: string
  listing_type: string
  price: number
  bedrooms: number
  bathrooms: number
  square_feet: number
  lot_size: number | null
  year_built: number | null
  amenities: string[]
  features: string[]
  images: string[]
  agent_name: string | null
  agent_email: string | null
  agent_phone: string | null
  agent_company: string | null
  latitude: number | null
  longitude: number | null
  status: string
  featured: boolean
}

// Parse price from string like "USD $2,300.00"
function parsePrice(priceStr: string): number {
  if (!priceStr) return 0
  const cleaned = priceStr.replace(/[^\d.]/g, '')
  return parseFloat(cleaned) || 0
}

// Parse numeric values from strings like "1,284"
function parseNumber(str: string): number {
  if (!str) return 0
  const cleaned = str.replace(/[^\d.]/g, '')
  return parseFloat(cleaned) || 0
}

// Decode HTML entities in strings
function decodeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&oacute;/g, 'ó')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

// Determine property type from icon
function propertyTypeFromIcon(icon: string): string {
  if (!icon) return 'residential'
  if (icon.includes('apartment')) return 'apartment'
  if (icon.includes('house')) return 'house'
  if (icon.includes('condo')) return 'condo'
  if (icon.includes('land')) return 'land'
  if (icon.includes('commercial')) return 'commercial'
  if (icon.includes('townhouse')) return 'townhouse'
  return 'residential'
}

// Translate property type to Spanish for display
function propertyTypeToSpanish(type: string): string {
  const translations: Record<string, string> = {
    'residential': 'Residencial',
    'apartment': 'Apartamento',
    'house': 'Casa',
    'condo': 'Condominio',
    'land': 'Terreno',
    'commercial': 'Comercial',
    'townhouse': 'Townhouse',
  }
  return translations[type] || 'Propiedad'
}

// Map Xposure status to database status
function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'activo': 'active',
    'active': 'active',
    'pendiente': 'pending',
    'pending': 'pending',
    'vendido': 'sold',
    'sold': 'sold',
    'alquilado': 'sold',
    'rented': 'sold',
  }
  return statusMap[status?.toLowerCase()] || 'active'
}

// Transform Xposure property to database format
function transformToDatabase(xposure: XposureProperty, index: number): DatabasePropertyInsert {
  // Determine if it's for rent or sale
  const isRent = xposure.title?.toLowerCase().includes('alquiler') || 
                 !!xposure.price_current_rent
  
  const price = isRent 
    ? parsePrice(xposure.price_current_rent)
    : parsePrice(xposure.price_current) || parsePrice(xposure.price_sold)

  const city = decodeHtml(xposure.district || 'Puerto Rico')
  const neighborhood = decodeHtml(xposure.map_area || '')
  const propertyType = propertyTypeFromIcon(xposure.property_icon || '')
  const subdivision = decodeHtml(xposure.subdivision || '')
  const listingTypeText = isRent ? 'Alquiler' : 'Venta'
  const addressStr = xposure.address?.trim() || `${xposure.stName || ''} ${xposure.stNum || ''}`.trim()

  // Build title (in Spanish)
  const propertyTypeSpanish = propertyTypeToSpanish(propertyType)
  const title = `${propertyTypeSpanish} en ${listingTypeText} - ${city}`

  // Build description
  const descriptionParts: string[] = []
  descriptionParts.push(`Propiedad en ${neighborhood || city}, Puerto Rico.`)
  if (xposure.bedrooms) descriptionParts.push(`${xposure.bedrooms} habitaciones.`)
  if (xposure.bathrooms) descriptionParts.push(`${xposure.bathrooms} baños.`)
  if (xposure.sqft_total) descriptionParts.push(`${xposure.sqft_total} pies cuadrados.`)
  if (subdivision) descriptionParts.push(`Ubicado en ${subdivision}.`)
  const description = descriptionParts.join(' ')

  // Build features array
  const features: string[] = []
  if (xposure.parking_spaces) {
    features.push(`${xposure.parking_spaces} estacionamiento(s)`)
  }
  if (subdivision) {
    features.push(`Urbanización: ${subdivision}`)
  }

  // Build amenities array (from subdivision type)
  const amenities: string[] = []
  if (subdivision.toLowerCase().includes('condominio')) {
    amenities.push('Condominio')
  }
  if (subdivision.toLowerCase().includes('urbanizacion') || subdivision.toLowerCase().includes('urbanización')) {
    amenities.push('Urbanización')
  }

  // Images array
  const images: string[] = []
  if (xposure.thumbnailPhotoURL) {
    // Convert thumbnail URL to full size URL
    const fullSizeUrl = xposure.thumbnailPhotoURL.replace('&thumbnail', '')
    images.push(fullSizeUrl)
    images.push(xposure.thumbnailPhotoURL) // Also keep thumbnail as backup
  }

  return {
    mls_id: `xposure-${xposure.id}`,
    idx_source: 'xposure',
    title,
    description,
    address: addressStr || 'Dirección no disponible',
    city,
    state: 'PR',
    zip_code: '', // Not available in Xposure data
    country: 'PR',
    neighborhood: neighborhood || null,
    property_type: propertyType,
    listing_type: isRent ? 'rent' : 'sale',
    price,
    bedrooms: parseInt(xposure.bedrooms) || 0,
    bathrooms: parseFloat(xposure.bathrooms) || 0,
    square_feet: parseNumber(xposure.sqft_total),
    lot_size: parseNumber(xposure.lot_sqft) || null,
    year_built: parseInt(xposure.year_built) || null,
    amenities,
    features,
    images,
    agent_name: null,
    agent_email: null,
    agent_phone: null,
    agent_company: null,
    latitude: xposure.lat || null,
    longitude: xposure.lng || null,
    status: mapStatus(xposure.status),
    // Mark first 10 properties with valid price as featured
    featured: index < 10 && price > 0,
  }
}

async function main() {
  console.log('='.repeat(60))
  console.log('📦 Xposure Listings Import to Supabase')
  console.log('='.repeat(60))
  console.log()

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
    console.error('')
    console.error('Create a .env.local file with these variables.')
    process.exit(1)
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Find JSON file
  const scriptDir = dirname(new URL(import.meta.url).pathname)
  const projectRoot = join(scriptDir, '..')
  const jsonPath = join(projectRoot, 'data', 'puerto-rico-listings.json')

  if (!existsSync(jsonPath)) {
    console.error('❌ JSON file not found:', jsonPath)
    console.error('')
    console.error('Run the fetch script first:')
    console.error('  npx tsx scripts/fetch-puerto-rico-listings.ts')
    process.exit(1)
  }

  console.log('📄 Reading JSON file:', jsonPath)
  
  const jsonContent = await readFile(jsonPath, 'utf-8')
  const listings: XposureProperty[] = JSON.parse(jsonContent)

  console.log(`📊 Found ${listings.length} listings to import`)
  console.log()

  // Transform all listings
  console.log('🔄 Transforming listings...')
  const properties = listings
    .filter(l => l.id) // Filter out any without ID
    .map((listing, index) => transformToDatabase(listing, index))

  // Filter properties with valid prices (greater than 0)
  const validProperties = properties.filter(p => p.price > 0)
  const featuredCount = validProperties.filter(p => p.featured).length

  console.log(`✅ Transformed ${properties.length} properties`)
  console.log(`   - With valid price: ${validProperties.length}`)
  console.log(`   - Featured (first 5 with price): ${featuredCount}`)
  console.log()

  // Delete existing Xposure properties first (clean sync)
  console.log('🗑️  Removing old Xposure properties...')
  const { error: deleteError } = await supabase
    .from('properties')
    .delete()
    .eq('idx_source', 'xposure')

  if (deleteError) {
    console.error('⚠️  Warning: Could not delete old properties:', deleteError.message)
  } else {
    console.log('✅ Old properties removed')
  }

  // Insert in batches of 100
  const batchSize = 100
  let inserted = 0
  let errors = 0

  console.log('📤 Importing properties to Supabase...')
  console.log()

  for (let i = 0; i < validProperties.length; i += batchSize) {
    const batch = validProperties.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(validProperties.length / batchSize)

    process.stdout.write(`   Batch ${batchNum}/${totalBatches}: `)

    const { data, error } = await supabase
      .from('properties')
      .insert(batch)
      .select('id')

    if (error) {
      console.log(`❌ Error: ${error.message}`)
      errors += batch.length
    } else {
      const count = data?.length || 0
      console.log(`✅ ${count} properties inserted`)
      inserted += count
    }
  }

  console.log()
  console.log('='.repeat(60))
  console.log('📊 Import Summary')
  console.log('='.repeat(60))
  console.log(`   Total in JSON: ${listings.length}`)
  console.log(`   Valid properties: ${validProperties.length}`)
  console.log(`   Successfully imported: ${inserted}`)
  console.log(`   Featured properties: ${featuredCount}`)
  if (errors > 0) {
    console.log(`   Errors: ${errors}`)
  }
  console.log()
  console.log('✨ Import complete!')
  console.log('='.repeat(60))
}

// Execute
main().catch(error => {
  console.error('❌ Import failed:', error)
  process.exit(1)
})
