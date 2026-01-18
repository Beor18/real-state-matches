import { createBrowserClient, SupabaseClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    // Return a mock client during build time
    console.warn('Supabase credentials not found, using mock client')
    return null as unknown as SupabaseClient
  }
  
  return createBrowserClient(url, key)
}

// Singleton instance for client-side usage
let browserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const client = createClient()
    if (client) {
      browserClient = client
    }
  }
  return browserClient!
}

