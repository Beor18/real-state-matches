// Database client - Now using Supabase instead of Prisma
// This file is kept for backwards compatibility
// Use @/lib/supabase/server or @/lib/supabase/client for new code

export { createClient } from './supabase/server'
export { getSupabaseBrowserClient } from './supabase/client'

// Re-export types for convenience
export type {
  User,
  Property,
  PropertyPrediction,
  LifestyleProfile,
  PropertyMatch,
  Subscription,
  ViralContent,
  Alert,
} from '@/types/database'
