// Feature Flags Library
// Server and client utilities for reading module enabled states from Supabase

import { createClient } from '@/lib/supabase/client'
import { FeatureFlag } from '@/types/database'
import { MODULES, ModuleConfig } from '@/config/modules'

export interface ModuleWithStatus extends ModuleConfig {
  enabled: boolean
  dbConfig: Record<string, unknown>
}

// Client-side: Fetch all feature flags
export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('sort_order', { ascending: true })
  
  if (error) {
    console.error('Error fetching feature flags:', error)
    return []
  }
  
  return data || []
}

// Client-side: Check if a specific module is enabled
export async function isModuleEnabled(moduleKey: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('module_key', moduleKey)
    .single()
  
  if (error) {
    console.error(`Error checking module ${moduleKey}:`, error)
    return false
  }
  
  return data?.enabled ?? false
}

// Client-side: Get all modules with their enabled status
export async function getModulesWithStatus(): Promise<ModuleWithStatus[]> {
  const flags = await getFeatureFlags()
  const flagMap = new Map(flags.map(f => [f.module_key, f]))
  
  return Object.values(MODULES).map(module => {
    const flag = flagMap.get(module.key)
    return {
      ...module,
      enabled: flag?.enabled ?? false,
      dbConfig: (flag?.config as Record<string, unknown>) ?? {}
    }
  })
}

// Client-side: Toggle module enabled state (for admin)
export async function toggleModule(moduleKey: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('feature_flags')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('module_key', moduleKey)
  
  if (error) {
    console.error(`Error toggling module ${moduleKey}:`, error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// Client-side: Update module config (for admin)
export async function updateModuleConfig(
  moduleKey: string, 
  config: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('feature_flags')
    .update({ config, updated_at: new Date().toISOString() })
    .eq('module_key', moduleKey)
  
  if (error) {
    console.error(`Error updating module config ${moduleKey}:`, error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// Check if user has required plan for a module
export function userHasRequiredPlan(
  userPlan: 'starter' | 'pro' | 'vip' | null,
  requiredPlan?: 'starter' | 'pro' | 'vip'
): boolean {
  if (!requiredPlan) return true
  if (!userPlan) return false
  
  const planHierarchy = { starter: 1, pro: 2, vip: 3 }
  return planHierarchy[userPlan] >= planHierarchy[requiredPlan]
}


