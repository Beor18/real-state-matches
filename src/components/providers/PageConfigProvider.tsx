'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PAGES, PageConfig } from '@/config/pages'
import { PageConfigState } from '@/lib/page-config-server'

export interface PageState {
  key: string
  enabled: boolean
  config: Record<string, unknown>
  pageConfig: PageConfig
}

interface PageConfigContextType {
  pages: PageState[]
  isLoading: boolean
  error: string | null
  isPageEnabled: (pageKey: string) => boolean
  isRouteEnabled: (route: string) => boolean
  getPage: (pageKey: string) => PageState | undefined
  getEnabledNavItems: () => Array<{ href: string; label: string }>
  refetch: () => Promise<void>
  togglePage: (pageKey: string, enabled: boolean) => Promise<boolean>
}

const PageConfigContext = createContext<PageConfigContextType | undefined>(undefined)

interface PageConfigProviderProps {
  children: ReactNode
  initialConfig: PageConfigState[]
}

// Helper to check if Supabase is configured (client-side)
const isSupabaseConfigured = () => {
  if (typeof window === 'undefined') return false
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Convert server config to full PageState with pageConfig
function buildPageStates(serverConfig: PageConfigState[]): PageState[] {
  const configMap = new Map(serverConfig.map(c => [c.key, c]))
  
  return Object.values(PAGES).map(pageConfig => {
    const config = configMap.get(pageConfig.key)
    return {
      key: pageConfig.key,
      enabled: pageConfig.alwaysEnabled ? true : (config?.enabled ?? true),
      config: config?.config ?? {},
      pageConfig
    }
  })
}

/**
 * PageConfigProvider - Provides page configuration to the app
 * 
 * Receives initial config from server (via layout.tsx) so there's no loading flash.
 * Maintains realtime subscription for live updates from admin panel.
 */
export function PageConfigProvider({ children, initialConfig }: PageConfigProviderProps) {
  // Initialize with server data - NO loading state needed
  const [pages, setPages] = useState<PageState[]>(() => buildPageStates(initialConfig))
  const [isLoading, setIsLoading] = useState(false) // Start as false - we have server data
  const [error, setError] = useState<string | null>(null)

  // Fetch pages from client (used for refetch and realtime updates)
  const fetchPages = useCallback(async () => {
    if (!isSupabaseConfigured()) return

    try {
      const supabase = createClient()
      if (!supabase) return

      const { data: flags, error: fetchError } = await supabase
        .from('feature_flags')
        .select('module_key, enabled, config')
        .eq('category', 'pages')

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      const serverConfig: PageConfigState[] = Object.values(PAGES).map(pageConfig => {
        const flag = flags?.find(f => f.module_key === pageConfig.key)
        return {
          key: pageConfig.key,
          enabled: pageConfig.alwaysEnabled ? true : (flag?.enabled ?? true),
          config: (flag?.config as Record<string, unknown>) ?? {},
        }
      })

      setPages(buildPageStates(serverConfig))
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading page config'
      setError(message)
      console.error('PageConfigProvider fetch error:', err)
    }
  }, [])

  // Subscribe to realtime changes for live updates from admin
  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const supabase = createClient()
    if (!supabase) return

    const channel = supabase
      .channel('page_config_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feature_flags', filter: 'category=eq.pages' },
        () => {
          // Refetch when admin makes changes
          fetchPages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPages])

  // isPageEnabled - check if a specific page is enabled
  const isPageEnabled = useCallback((pageKey: string): boolean => {
    const page = pages.find(p => p.key === pageKey)
    if (page?.pageConfig.alwaysEnabled) return true
    return page?.enabled ?? true
  }, [pages])

  // isRouteEnabled - check if a route is enabled
  const isRouteEnabled = useCallback((route: string): boolean => {
    const page = pages.find(p => p.pageConfig.route === route)
    if (!page) return true // Unknown routes are allowed
    if (page.pageConfig.alwaysEnabled) return true
    return page.enabled
  }, [pages])

  // getPage - get full page state
  const getPage = useCallback((pageKey: string): PageState | undefined => {
    return pages.find(p => p.key === pageKey)
  }, [pages])

  // getEnabledNavItems - get navigation items that are enabled
  const getEnabledNavItems = useCallback(() => {
    return pages
      .filter(p => p.enabled && p.pageConfig.showInNav)
      .map(p => ({
        href: p.pageConfig.route,
        label: p.pageConfig.navLabel
      }))
  }, [pages])

  // togglePage - toggle a page's enabled state (for admin use)
  const togglePage = useCallback(async (pageKey: string, enabled: boolean): Promise<boolean> => {
    const page = pages.find(p => p.key === pageKey)
    if (page?.pageConfig.alwaysEnabled) {
      console.warn(`Cannot toggle page ${pageKey}: alwaysEnabled`)
      return false
    }

    if (!isSupabaseConfigured()) {
      // Optimistic update only when no Supabase
      setPages(prev =>
        prev.map(p =>
          p.key === pageKey ? { ...p, enabled } : p
        )
      )
      return true
    }

    try {
      const supabase = createClient()
      if (!supabase) return false

      const { error: updateError } = await supabase
        .from('feature_flags')
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq('module_key', pageKey)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Optimistic update
      setPages(prev =>
        prev.map(p =>
          p.key === pageKey ? { ...p, enabled } : p
        )
      )

      return true
    } catch (err) {
      console.error('Toggle page error:', err)
      return false
    }
  }, [pages])

  return (
    <PageConfigContext.Provider
      value={{
        pages,
        isLoading,
        error,
        isPageEnabled,
        isRouteEnabled,
        getPage,
        getEnabledNavItems,
        refetch: fetchPages,
        togglePage
      }}
    >
      {children}
    </PageConfigContext.Provider>
  )
}

/**
 * usePageConfigContext - Access page config from the provider
 * Throws if used outside of PageConfigProvider
 */
export function usePageConfigContext(): PageConfigContextType {
  const context = useContext(PageConfigContext)
  if (context === undefined) {
    throw new Error('usePageConfigContext must be used within a PageConfigProvider')
  }
  return context
}
