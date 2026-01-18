'use client'

import { ReactNode } from 'react'
import { useModuleEnabled } from '@/hooks/useModules'
import { MODULES } from '@/config/modules'
import { Skeleton } from '@/components/ui/skeleton'
import { Lock } from 'lucide-react'

interface ModuleWrapperProps {
  moduleKey: string
  children: ReactNode
  fallback?: ReactNode
  showLoading?: boolean
  showDisabledMessage?: boolean
}

/**
 * ModuleWrapper - Conditionally renders children based on module enabled status
 * 
 * Usage:
 * <ModuleWrapper moduleKey="demand-prediction">
 *   <DemandPredictionEngine />
 * </ModuleWrapper>
 */
export function ModuleWrapper({
  moduleKey,
  children,
  fallback,
  showLoading = true,
  showDisabledMessage = false
}: ModuleWrapperProps) {
  const { enabled, isLoading } = useModuleEnabled(moduleKey)
  const moduleConfig = MODULES[moduleKey]

  // Loading state
  if (isLoading && showLoading) {
    return (
      <div className="w-full p-4">
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    )
  }

  // Module not enabled
  if (!enabled) {
    // Show custom fallback if provided
    if (fallback) {
      return <>{fallback}</>
    }

    // Show disabled message if requested
    if (showDisabledMessage && moduleConfig) {
      return (
        <div className="w-full p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 text-gray-500">
            <Lock className="h-5 w-5" />
            <div>
              <p className="font-medium">{moduleConfig.shortName}</p>
              <p className="text-sm">Este módulo no está habilitado actualmente.</p>
            </div>
          </div>
        </div>
      )
    }

    // Default: render nothing
    return null
  }

  // Module enabled: render children
  return <>{children}</>
}

/**
 * ModuleGate - HOC version for wrapping entire components
 */
export function withModuleGate<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  moduleKey: string
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  const ComponentWithGate = (props: P) => {
    return (
      <ModuleWrapper moduleKey={moduleKey}>
        <WrappedComponent {...props} />
      </ModuleWrapper>
    )
  }

  ComponentWithGate.displayName = `withModuleGate(${displayName})`

  return ComponentWithGate
}

/**
 * ModuleSection - Renders a section with module info and content
 */
interface ModuleSectionProps {
  moduleKey: string
  children: ReactNode
  className?: string
  showHeader?: boolean
}

export function ModuleSection({
  moduleKey,
  children,
  className = '',
  showHeader = false
}: ModuleSectionProps) {
  const { enabled, isLoading } = useModuleEnabled(moduleKey)
  const moduleConfig = MODULES[moduleKey]

  if (isLoading) {
    return (
      <section className={`w-full ${className}`}>
        <Skeleton className="h-48 w-full rounded-lg" />
      </section>
    )
  }

  if (!enabled) {
    return null
  }

  return (
    <section className={`w-full ${className}`}>
      {showHeader && moduleConfig && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {moduleConfig.shortName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {moduleConfig.description}
          </p>
        </div>
      )}
      {children}
    </section>
  )
}


