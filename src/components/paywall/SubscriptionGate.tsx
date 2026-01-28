'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/auth/AuthProvider'
import { usePageConfig } from '@/hooks/usePageConfig'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, 
  Sparkles, 
  ArrowRight,
  Loader2,
  UserPlus,
  Zap,
  Search,
  Bell,
  Brain,
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
  const { isPageEnabled } = usePageConfig()
  const isPreciosEnabled = isPageEnabled('page-precios')

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
  const needsHigherPlan = user && hasActiveSubscription && !hasRequiredPlan()

  // Feature items with icons for better visual appeal
  const featureItems = [
    { icon: Search, label: 'Búsquedas ilimitadas' },
    { icon: Brain, label: 'Matching inteligente con IA' },
    { icon: Bell, label: 'Alertas personalizadas' },
  ]

  const overlayContent = {
    login: {
      icon: UserPlus,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      badge: 'Crea tu cuenta gratis',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: title || 'Únete para comenzar tu búsqueda',
      description: description || 'Crea una cuenta gratuita en segundos y accede a nuestra búsqueda inteligente de propiedades.',
      primaryButton: { href: '/auth/login', label: 'Crear cuenta gratis', icon: UserPlus },
      secondaryText: '¿Ya tienes cuenta?',
      secondaryLink: { href: '/auth/login', label: 'Inicia sesión' },
      showFeatures: true,
    },
    upgrade: {
      icon: Sparkles,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      badge: 'Desbloquea esta función',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      title: title || 'Activa tu plan para continuar',
      description: description || 'Esta función premium te ayuda a encontrar propiedades que realmente se adaptan a tu estilo de vida.',
      primaryButton: isPreciosEnabled 
        ? { href: '/precios', label: 'Ver planes disponibles', icon: Zap }
        : { href: '/dashboard', label: 'Ir al dashboard', icon: ArrowRight },
      secondaryText: null,
      secondaryLink: null,
      showFeatures: true,
    },
    higherPlan: {
      icon: Crown,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      badge: `Requiere Plan ${requiredPlan?.charAt(0).toUpperCase()}${requiredPlan?.slice(1)}`,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      title: title || 'Mejora tu plan actual',
      description: description || `Para acceder a esta función necesitas el plan ${requiredPlan} o superior. Mejora ahora y desbloquea más beneficios.`,
      primaryButton: isPreciosEnabled 
        ? { href: '/precios', label: 'Mejorar mi plan', icon: Crown }
        : { href: '/dashboard', label: 'Ir al dashboard', icon: ArrowRight },
      secondaryText: null,
      secondaryLink: null,
      showFeatures: false,
    },
  }

  const content = needsLogin 
    ? overlayContent.login 
    : needsHigherPlan 
      ? overlayContent.higherPlan 
      : overlayContent.upgrade

  const IconComponent = content.icon
  const ButtonIcon = content.primaryButton.icon

  return (
    <div className={`relative ${className}`}>
      {/* Content with blur/opacity effect */}
      {showPreview && (
        <div 
          className="pointer-events-none select-none"
          aria-hidden="true"
        >
          <div className="opacity-30 blur-[3px] saturate-50">
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <Card className="border border-slate-200 shadow-2xl bg-white overflow-hidden">
            {/* Decorative top gradient */}
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            
            <CardContent className="p-8 space-y-6">
              {/* Icon and Badge */}
              <div className="flex flex-col items-center gap-4">
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl ${content.iconBg}`}
                >
                  <IconComponent className={`h-8 w-8 ${content.iconColor}`} />
                </motion.div>

                <Badge variant="outline" className={`${content.badgeColor} font-medium px-3 py-1`}>
                  {content.badge}
                </Badge>
              </div>

              {/* Title & Description */}
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {content.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
                  {content.description}
                </p>
              </div>

              {/* Features list */}
              {content.showFeatures && (
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                    Incluye
                  </p>
                  <ul className="space-y-2.5">
                    {featureItems.map((feature) => {
                      const FeatureIcon = feature.icon
                      return (
                        <li key={feature.label} className="flex items-center gap-3 text-sm text-slate-700">
                          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-100">
                            <FeatureIcon className="h-4 w-4 text-emerald-600" />
                          </div>
                          {feature.label}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Primary Button */}
              <Link href={content.primaryButton.href} className="block">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 h-12 text-base font-medium gap-2 rounded-xl transition-all hover:shadow-lg">
                  <ButtonIcon className="h-5 w-5" />
                  {content.primaryButton.label}
                </Button>
              </Link>

              {/* Secondary link */}
              {content.secondaryText && content.secondaryLink && (
                <p className="text-center text-sm text-slate-500">
                  {content.secondaryText}{' '}
                  <Link 
                    href={content.secondaryLink.href} 
                    className="text-emerald-600 font-medium hover:text-emerald-700 hover:underline"
                  >
                    {content.secondaryLink.label}
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

