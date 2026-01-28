import { createClient } from '@/lib/supabase/server'
import { PAGES } from '@/config/pages'

export interface PageConfigState {
  key: string
  enabled: boolean
  config: Record<string, unknown>
}

interface FeatureFlagRow {
  module_key: string
  enabled: boolean
  config: Record<string, unknown> | null
}

/**
 * Fetches page configuration from Supabase on the server side.
 * This function is meant to be called from Server Components (like layout.tsx)
 * to provide initial data to the client without any loading state.
 */
export async function getPageConfigFromServer(): Promise<PageConfigState[]> {
  try {
    const supabase = await createClient()
    const { data: flags, error } = await supabase
      .from('feature_flags')
      .select('module_key, enabled, config')
      .eq('category', 'pages')

    if (error) {
      // Only log if it's not a static generation error (expected behavior)
      if (!error.message?.includes('DYNAMIC_SERVER_USAGE')) {
        console.error('Error fetching page config from server:', error)
      }
      // Return defaults on error
      return getDefaultPageConfig()
    }

    const flagMap = new Map<string, FeatureFlagRow>(
      (flags as FeatureFlagRow[] | null)?.map((f) => [f.module_key, f]) || []
    )

    return Object.values(PAGES).map((pageConfig) => ({
      key: pageConfig.key,
      enabled: pageConfig.alwaysEnabled
        ? true
        : (flagMap.get(pageConfig.key)?.enabled ?? true),
      config:
        (flagMap.get(pageConfig.key)?.config as Record<string, unknown>) ?? {},
    }))
  } catch (error) {
    // Silent fail for static generation attempts (expected behavior)
    // At runtime, cookies will be available and this will work
    const errorMessage = error instanceof Error ? error.message : ''
    if (!errorMessage.includes('DYNAMIC_SERVER_USAGE') && !errorMessage.includes('cookies')) {
      console.error('Error in getPageConfigFromServer:', error)
    }
    // Return defaults on error
    return getDefaultPageConfig()
  }
}

/**
 * Returns default page configuration with all pages enabled.
 * Used as fallback when Supabase is not available or errors occur.
 */
function getDefaultPageConfig(): PageConfigState[] {
  return Object.values(PAGES).map((p) => ({
    key: p.key,
    enabled: true,
    config: {},
  }))
}
