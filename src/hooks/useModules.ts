'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FeatureFlag } from '@/types/database'
import { MODULES, ModuleConfig } from '@/config/modules'

export interface ModuleState {
  key: string
  enabled: boolean
  config: Record<string, unknown>
  moduleConfig: ModuleConfig
}

interface UseModulesReturn {
  modules: ModuleState[]
  isLoading: boolean
  error: string | null
  isEnabled: (moduleKey: string) => boolean
  getModule: (moduleKey: string) => ModuleState | undefined
  refetch: () => Promise<void>
  toggleModule: (moduleKey: string, enabled: boolean) => Promise<boolean>
}

// Helper to check if Supabase is configured
const isSupabaseConfigured = () => {
  if (typeof window === 'undefined') return false
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Default modules when Supabase is not available
const getDefaultModules = (): ModuleState[] => {
  return Object.values(MODULES).map(moduleConfig => ({
    key: moduleConfig.key,
    enabled: moduleConfig.key === 'lifestyle-matcher', // Only lifestyle-matcher enabled by default
    config: {},
    moduleConfig
  }))
}

export function useModules(): UseModulesReturn {
  const [modules, setModules] = useState<ModuleState[]>(getDefaultModules())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModules = useCallback(async () => {
    // If Supabase is not configured, use defaults
    if (!isSupabaseConfigured()) {
      setModules(getDefaultModules())
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      if (!supabase) {
        setModules(getDefaultModules())
        setIsLoading(false)
        return
      }
      
      const { data: flags, error: fetchError } = await supabase
        .from('feature_flags')
        .select('*')
        .order('sort_order', { ascending: true })
      
      if (fetchError) {
        throw new Error(fetchError.message)
      }
      
      const flagMap = new Map<string, FeatureFlag>(
        (flags || []).map(f => [f.module_key, f])
      )
      
      const moduleStates: ModuleState[] = Object.values(MODULES).map(moduleConfig => {
        const flag = flagMap.get(moduleConfig.key)
        return {
          key: moduleConfig.key,
          enabled: flag?.enabled ?? false,
          config: (flag?.config as Record<string, unknown>) ?? {},
          moduleConfig
        }
      })
      
      setModules(moduleStates)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading modules'
      setError(message)
      console.error('useModules error:', err)
      // Use defaults on error
      setModules(getDefaultModules())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  // Subscribe to realtime changes (only if Supabase is configured)
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    
    const supabase = createClient()
    if (!supabase) return
    
    const channel = supabase
      .channel('feature_flags_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feature_flags' },
        () => {
          fetchModules()
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchModules])

  const isEnabled = useCallback((moduleKey: string): boolean => {
    const module = modules.find(m => m.key === moduleKey)
    return module?.enabled ?? false
  }, [modules])

  const getModule = useCallback((moduleKey: string): ModuleState | undefined => {
    return modules.find(m => m.key === moduleKey)
  }, [modules])

  const toggleModule = useCallback(async (moduleKey: string, enabled: boolean): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      // Optimistic update only when no Supabase
      setModules(prev => 
        prev.map(m => 
          m.key === moduleKey ? { ...m, enabled } : m
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
        .eq('module_key', moduleKey)
      
      if (updateError) {
        throw new Error(updateError.message)
      }
      
      // Optimistic update
      setModules(prev => 
        prev.map(m => 
          m.key === moduleKey ? { ...m, enabled } : m
        )
      )
      
      return true
    } catch (err) {
      console.error('Toggle module error:', err)
      return false
    }
  }, [])

  return {
    modules,
    isLoading,
    error,
    isEnabled,
    getModule,
    refetch: fetchModules,
    toggleModule
  }
}

// Simplified hook for checking a single module
export function useModuleEnabled(moduleKey: string): { enabled: boolean; isLoading: boolean } {
  const { isEnabled, isLoading } = useModules()
  return {
    enabled: isEnabled(moduleKey),
    isLoading
  }
}
