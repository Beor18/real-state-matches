'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { User, Session, SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { User as DBUser, Subscription } from '@/types/database'

interface AuthContextType {
  user: User | null
  dbUser: DBUser | null
  subscription: Subscription | null
  session: Session | null
  isLoading: boolean
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [dbUser, setDbUser] = useState<DBUser | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  // Initialize supabase client on mount (client-side only)
  useEffect(() => {
    const client = getSupabaseBrowserClient()
    setSupabase(client)
  }, [])

  // Fetch user profile and subscription from database
  const fetchUserData = useCallback(async (userId: string) => {
    if (!supabase) return
    
    try {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user:', userError)
      } else {
        setDbUser(userData as DBUser)
      }

      // Fetch active subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (subError && subError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subError)
      } else {
        setSubscription(subData as Subscription)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }, [supabase])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (user?.id) {
      await fetchUserData(user.id)
    }
  }, [user?.id, fetchUserData])

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
        
        if (initialSession?.user) {
          await fetchUserData(initialSession.user.id)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          // Small delay to ensure the user record is created by the trigger
          setTimeout(() => fetchUserData(newSession.user.id), 500)
        } else {
          setDbUser(null)
          setSubscription(null)
        }

        setIsLoading(false)
      }
    )

    return () => {
      authSubscription.unsubscribe()
    }
  }, [supabase, fetchUserData])

  // Sign in with magic link
  const signInWithMagicLink = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Authentication not available') }
    }
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Sign out
  const signOut = async () => {
    if (!supabase) return
    
    await supabase.auth.signOut()
    setUser(null)
    setDbUser(null)
    setSubscription(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        subscription,
        session,
        isLoading,
        signInWithMagicLink,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper hook to check if user has an active subscription
export function useHasSubscription(requiredPlan?: 'starter' | 'pro' | 'vip') {
  const { subscription } = useAuth()
  
  if (!subscription || subscription.status !== 'active') {
    return false
  }

  if (!requiredPlan) {
    return true
  }

  const planHierarchy = { starter: 1, pro: 2, vip: 3 }
  const userPlanLevel = planHierarchy[subscription.plan_type as keyof typeof planHierarchy] || 0
  const requiredLevel = planHierarchy[requiredPlan]

  return userPlanLevel >= requiredLevel
}

// Helper hook to check if user is VIP
export function useIsVIP() {
  const { dbUser, subscription } = useAuth()
  return dbUser?.is_vip || subscription?.plan_type === 'vip'
}

