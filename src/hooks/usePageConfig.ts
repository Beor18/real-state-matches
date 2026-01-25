'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FeatureFlag } from '@/types/database'
import { PAGES, PageConfig, getControllablePages } from '@/config/pages'

export interface PageState {
  key: string
  enabled: boolean
  config: Record<string, unknown>
  pageConfig: PageConfig
}

interface UsePagesReturn {
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

// Helper to check if Supabase is configured
const isSupabaseConfigured = () => {
  if (typeof window === 'undefined') return false
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Default pages state - all enabled by default
const getDefaultPages = (): PageState[] => {
  return Object.values(PAGES).map(pageConfig => ({
    key: pageConfig.key,
    enabled: true, // All pages enabled by default
    config: {},
    pageConfig
  }))
}

export function usePageConfig(): UsePagesReturn {
  const [pages, setPages] = useState<PageState[]>(getDefaultPages())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPages = useCallback(async () => {
    // If Supabase is not configured, use defaults
    if (!isSupabaseConfigured()) {
      setPages(getDefaultPages())
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      if (!supabase) {
        setPages(getDefaultPages())
        setIsLoading(false)
        return
      }
      
      const { data: flags, error: fetchError } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('category', 'pages')
        .order('sort_order', { ascending: true })
      
      if (fetchError) {
        throw new Error(fetchError.message)
      }
      
      const flagMap = new Map<string, FeatureFlag>(
        (flags || []).map(f => [f.module_key, f])
      )
      
      const pageStates: PageState[] = Object.values(PAGES).map(pageConfig => {
        const flag = flagMap.get(pageConfig.key)
        return {
          key: pageConfig.key,
          // alwaysEnabled pages are always true, otherwise check flag
          enabled: pageConfig.alwaysEnabled ? true : (flag?.enabled ?? true),
          config: (flag?.config as Record<string, unknown>) ?? {},
          pageConfig
        }
      })
      
      setPages(pageStates)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading page config'
      setError(message)
      console.error('usePageConfig error:', err)
      // Use defaults on error
      setPages(getDefaultPages())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  // Subscribe to realtime changes
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    
    const supabase = createClient()
    if (!supabase) return
    
    const channel = supabase
      .channel('page_flags_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feature_flags', filter: "category=eq.pages" },
        () => {
          fetchPages()
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPages])

  const isPageEnabled = useCallback((pageKey: string): boolean => {
    const page = pages.find(p => p.key === pageKey)
    // If page config has alwaysEnabled, return true
    if (page?.pageConfig.alwaysEnabled) return true
    return page?.enabled ?? true
  }, [pages])

  const isRouteEnabled = useCallback((route: string): boolean => {
    const page = pages.find(p => p.pageConfig.route === route)
    if (!page) return true // Unknown routes are allowed
    if (page.pageConfig.alwaysEnabled) return true
    return page.enabled
  }, [pages])

  const getPage = useCallback((pageKey: string): PageState | undefined => {
    return pages.find(p => p.key === pageKey)
  }, [pages])

  // Get navigation items that are enabled
  const getEnabledNavItems = useCallback(() => {
    return pages
      .filter(p => p.enabled && p.pageConfig.showInNav)
      .map(p => ({
        href: p.pageConfig.route,
        label: p.pageConfig.navLabel
      }))
  }, [pages])

  const togglePage = useCallback(async (pageKey: string, enabled: boolean): Promise<boolean> => {
    // Check if page is alwaysEnabled
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
      
      if (!supabase) {
        return false
      }
      
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

  return {
    pages,
    isLoading,
    error,
    isPageEnabled,
    isRouteEnabled,
    getPage,
    getEnabledNavItems,
    refetch: fetchPages,
    togglePage
  }
}

// Simplified hook for checking a single page
export function usePageEnabled(pageKey: string): { enabled: boolean; isLoading: boolean } {
  const { isPageEnabled, isLoading } = usePageConfig()
  return {
    enabled: isPageEnabled(pageKey),
    isLoading
  }
}

// Hook for checking if a route is enabled
export function useRouteEnabled(route: string): { enabled: boolean; isLoading: boolean } {
  const { isRouteEnabled, isLoading } = usePageConfig()
  return {
    enabled: isRouteEnabled(route),
    isLoading
  }
}

