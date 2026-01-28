'use client'

import { usePageConfigContext, PageState } from '@/components/providers/PageConfigProvider'

// Re-export PageState type for backward compatibility
export type { PageState }

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

/**
 * usePageConfig - Hook to access page configuration
 * 
 * This hook now consumes from PageConfigProvider which receives
 * initial data from the server, eliminating any loading flash.
 * 
 * The API remains the same for backward compatibility with all
 * existing components that use this hook.
 */
export function usePageConfig(): UsePagesReturn {
  return usePageConfigContext()
}

/**
 * usePageEnabled - Simplified hook for checking a single page
 */
export function usePageEnabled(pageKey: string): { enabled: boolean; isLoading: boolean } {
  const { isPageEnabled, isLoading } = usePageConfig()
  return {
    enabled: isPageEnabled(pageKey),
    isLoading
  }
}

/**
 * useRouteEnabled - Hook for checking if a route is enabled
 */
export function useRouteEnabled(route: string): { enabled: boolean; isLoading: boolean } {
  const { isRouteEnabled, isLoading } = usePageConfig()
  return {
    enabled: isRouteEnabled(route),
    isLoading
  }
}
