/**
 * Script para obtener listings de propiedades de Puerto Rico
 * desde la API de xposureapp.com (MLS Puerto Rico)
 * 
 * Uso: npx tsx scripts/fetch-puerto-rico-listings.ts
 * 
 * Requiere: XPOSURE_COOKIE en .env.local
 */

import { mkdir, writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'

// Cargar variables de entorno desde .env.local
async function loadEnv() {
  const scriptDir = dirname(new URL(import.meta.url).pathname)
  const projectRoot = join(scriptDir, '..')
  const envPath = join(projectRoot, '.env.local')
  
  if (existsSync(envPath)) {
    const envContent = await readFile(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=')
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex)
          let value = trimmed.substring(eqIndex + 1)
          // Remover comillas si existen
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }
          process.env[key] = value
        }
      }
    }
  }
}

// Configuración
const API_BASE_URL = 'https://puertorico.xposureapp.com/portal/puerto_rico/ListingData'

const COLUMNS = [
  'seq',
  'property_icon',
  'is_reported',
  'address',
  'subdivision',
  'map_area',
  'district',
  'status',
  'id',
  'title',
  'price_current',
  'price_current_rent',
  'lot_sqft',
  'sqft_total',
  'year_built',
  'bedrooms',
  'bathrooms',
  'parking_spaces',
  'price_sold'
].join(',')

function getHeaders(): Record<string, string> {
  const cookie = process.env.XPOSURE_COOKIE
  if (!cookie) {
    throw new Error('XPOSURE_COOKIE no está definida en .env.local')
  }
  
  return {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://puertorico.xposureapp.com/portal/puerto_rico/MlsDoFullSearch',
    'Cookie': cookie,
    'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Linux"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
  }
}

interface FetchOptions {
  orderByField?: string
  orderByAsc?: boolean
  responsiveMode?: boolean
}

async function fetchPuertoRicoListings(options: FetchOptions = {}) {
  const {
    orderByField = 'price_current',
    orderByAsc = true,
    responsiveMode = true,
  } = options

  // Construir URL con parámetros
  const url = new URL(API_BASE_URL)
  url.searchParams.set('responsiveMode', String(responsiveMode))
  url.searchParams.set('columns', COLUMNS)
  url.searchParams.set('orderByField', orderByField)
  url.searchParams.set('orderByAsc', String(orderByAsc))
  url.searchParams.set('listingsToInclude', '')
  url.searchParams.set('listingsToExclude', '')
  url.searchParams.set('_', String(Date.now()))

  console.log('🏠 Fetching Puerto Rico listings...')
  console.log(`📍 URL: ${url.toString()}`)

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders(),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    
    console.log(`✅ Response received successfully`)
    console.log(`📊 Content-Type: ${response.headers.get('content-type')}`)
    
    return data
  } catch (error) {
    console.error('❌ Error fetching listings:', error)
    throw error
  }
}

async function saveToJson(data: unknown, filename: string) {
  // Obtener directorio del script y construir ruta a data/
  const scriptDir = dirname(new URL(import.meta.url).pathname)
  const projectRoot = join(scriptDir, '..')
  const dataDir = join(projectRoot, 'data')
  const filePath = join(dataDir, filename)

  // Crear directorio data/ si no existe
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true })
    console.log(`📁 Created directory: ${dataDir}`)
  }

  // Guardar JSON con formato legible
  const jsonContent = JSON.stringify(data, null, 2)
  await writeFile(filePath, jsonContent, 'utf-8')
  
  console.log(`💾 Data saved to: ${filePath}`)
  
  // Mostrar estadísticas básicas si es un array
  if (Array.isArray(data)) {
    console.log(`📈 Total listings: ${data.length}`)
  } else if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data)
    console.log(`📈 Response keys: ${keys.join(', ')}`)
    
    // Buscar arrays en el objeto para contar elementos
    for (const key of keys) {
      const value = (data as Record<string, unknown>)[key]
      if (Array.isArray(value)) {
        console.log(`   - ${key}: ${value.length} items`)
      }
    }
  }

  return filePath
}

// Función principal
async function main() {
  console.log('='.repeat(60))
  console.log('🏝️  Puerto Rico MLS Listings Fetcher')
  console.log('='.repeat(60))
  console.log()

  // Cargar variables de entorno
  await loadEnv()
  console.log('🔑 Variables de entorno cargadas')
  console.log()

  try {
    // Fetch listings
    const listings = await fetchPuertoRicoListings({
      orderByField: 'price_current',
      orderByAsc: true,
    })

    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `puerto-rico-listings-${timestamp}.json`

    // Guardar en JSON
    await saveToJson(listings, filename)

    // También guardar una copia sin timestamp para fácil acceso
    await saveToJson(listings, 'puerto-rico-listings.json')

    console.log()
    console.log('✨ Done!')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Failed to fetch and save listings:', error)
    process.exit(1)
  }
}

// Ejecutar
main()
