'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Lock, 
  LogIn, 
  Crown, 
  Sparkles, 
  ArrowRight,
  CheckCircle,
  Loader2,
} from 'lucide-react'

interface SubscriptionGateProps {
  children: ReactNode
  /** Minimum plan required to access. If not specified, any active subscription works */
  requiredPlan?: 'starter' | 'pro' | 'vip'
  /** Custom title for the gate overlay */
  title?: string
  /** Custom description for the gate overlay */
  description?: string
  /** Whether to show a blurred preview of the content */
  showPreview?: boolean
  /** Class name for the container */
  className?: string
}

/**
 * SubscriptionGate - A component that gates content behind authentication and subscription
 * 
 * Logic:
 * - No user logged in → Show login prompt
 * - User logged in but no subscription → Show upgrade prompt
 * - User logged in with subscription → Show content
 * - Admin users → Always show content (bypass)
 */
export function SubscriptionGate({
  children,
  requiredPlan,
  title,
  description,
  showPreview = true,
  className = '',
}: SubscriptionGateProps) {
  const { user, subscription, dbUser, isLoading } = useAuth()

  // Loading state
  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    )
  }

  // Check access
  const isAdmin = dbUser?.role === 'admin'
  const hasActiveSubscription = subscription?.status === 'active'
  const userPlanType = subscription?.plan_type as 'starter' | 'pro' | 'vip' | undefined

  // Plan hierarchy for comparison
  const planHierarchy = { starter: 1, pro: 2, vip: 3 }
  
  const hasRequiredPlan = () => {
    if (!requiredPlan) return hasActiveSubscription
    if (!userPlanType) return false
    return planHierarchy[userPlanType] >= planHierarchy[requiredPlan]
  }

  // Admin bypass - always has access
  if (isAdmin) {
    return <>{children}</>
  }

  // User has required access
  if (user && hasActiveSubscription && hasRequiredPlan()) {
    return <>{children}</>
  }

  // Determine which overlay to show
  const needsLogin = !user
  const needsUpgrade = user && !hasActiveSubscription
  const needsHigherPlan = user && hasActiveSubscription && !hasRequiredPlan()

  const overlayContent = {
    login: {
      icon: LogIn,
      badge: 'Acceso Requerido',
      badgeColor: 'bg-slate-100 text-slate-700',
      title: title || 'Inicia sesión para continuar',
      description: description || 'Necesitas una cuenta para acceder a esta funcionalidad.',
      primaryButton: { href: '/auth/login', label: 'Iniciar Sesión' },
      secondaryButton: { href: '/precios', label: 'Ver Planes' },
    },
    upgrade: {
      icon: Sparkles,
      badge: 'Plan Requerido',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      title: title || 'Activa un plan para comenzar',
      description: description || 'Esta funcionalidad está disponible para usuarios con un plan activo.',
      primaryButton: { href: '/precios', label: 'Ver Planes' },
      secondaryButton: null,
      features: ['Búsquedas ilimitadas', 'Matching con IA', 'Alertas personalizadas'],
    },
    higherPlan: {
      icon: Crown,
      badge: `Requiere Plan ${requiredPlan?.charAt(0).toUpperCase()}${requiredPlan?.slice(1)}`,
      badgeColor: 'bg-amber-100 text-amber-700',
      title: title || 'Actualiza tu plan',
      description: description || `Esta funcionalidad requiere el plan ${requiredPlan} o superior.`,
      primaryButton: { href: '/precios', label: 'Actualizar Plan' },
      secondaryButton: null,
    },
  }

  const content = needsLogin 
    ? overlayContent.login 
    : needsHigherPlan 
      ? overlayContent.higherPlan 
      : overlayContent.upgrade

  const IconComponent = content.icon

  return (
    <div className={`relative ${className}`}>
      {/* Content with blur/opacity effect */}
      {showPreview && (
        <div 
          className="pointer-events-none select-none"
          aria-hidden="true"
        >
          <div className="opacity-40 blur-[2px] saturate-50">
            {children}
          </div>
        </div>
      )}

      {/* Overlay */}
      <div 
        className={`${showPreview ? 'absolute inset-0' : ''} flex items-center justify-center p-4`}
        style={showPreview ? { minHeight: '400px' } : {}}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="border-2 border-slate-200 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8 text-center space-y-6">
              {/* Icon */}
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-100 mx-auto">
                <IconComponent className="h-8 w-8 text-slate-700" />
              </div>

              {/* Badge */}
              <Badge className={`${content.badgeColor} border-0`}>
                <Lock className="h-3 w-3 mr-1" />
                {content.badge}
              </Badge>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-900">
                  {content.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {content.description}
                </p>
              </div>

              {/* Features list for upgrade prompt */}
              {'features' in content && content.features && (
                <ul className="space-y-2 text-left">
                  {content.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <Link href={content.primaryButton.href} className="w-full">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 h-11">
                    {content.primaryButton.label}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                
                {content.secondaryButton && (
                  <Link href={content.secondaryButton.href} className="w-full">
                    <Button variant="outline" className="w-full h-11">
                      {content.secondaryButton.label}
                    </Button>
                  </Link>
                )}
              </div>

              {/* Help text */}
              {needsLogin && (
                <p className="text-xs text-slate-500">
                  ¿No tienes cuenta?{' '}
                  <Link href="/auth/login" className="text-emerald-600 hover:underline">
                    Regístrate gratis
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

/**
 * Hook to check if user has access to a feature
 */
export function useHasAccess(requiredPlan?: 'starter' | 'pro' | 'vip'): {
  hasAccess: boolean
  isLoading: boolean
  isAdmin: boolean
  hasSubscription: boolean
  isLoggedIn: boolean
} {
  const { user, subscription, dbUser, isLoading } = useAuth()

  const isAdmin = dbUser?.role === 'admin'
  const hasSubscription = subscription?.status === 'active'
  const isLoggedIn = !!user
  const userPlanType = subscription?.plan_type as 'starter' | 'pro' | 'vip' | undefined

  const planHierarchy = { starter: 1, pro: 2, vip: 3 }
  
  const hasRequiredPlan = () => {
    if (!requiredPlan) return hasSubscription
    if (!userPlanType) return false
    return planHierarchy[userPlanType] >= planHierarchy[requiredPlan]
  }

  const hasAccess = isAdmin || (isLoggedIn && hasSubscription && hasRequiredPlan())

  return {
    hasAccess,
    isLoading,
    isAdmin,
    hasSubscription,
    isLoggedIn,
  }
}

export default SubscriptionGate

