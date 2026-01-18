'use client'

import { useState } from 'react'
import { useModules } from '@/hooks/useModules'
import { MODULE_CATEGORIES, ModuleCategory } from '@/config/modules'
import { 
  TrendingUp, 
  Heart, 
  Building2, 
  LineChart, 
  Sparkles, 
  Bell,
  Brain,
  Megaphone,
  BellRing,
  Settings,
  Check,
  X,
  Loader2,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  Heart,
  Building2,
  LineChart,
  Sparkles,
  Bell,
  Brain,
  Megaphone,
  BellRing,
  Settings
}

const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'sreis-engines': Brain,
  'marketing': Megaphone,
  'notifications': BellRing,
  'general': Settings
}

export default function ModulesPage() {
  const { modules, isLoading, toggleModule } = useModules()
  const [togglingModules, setTogglingModules] = useState<Set<string>>(new Set())

  const handleToggle = async (moduleKey: string, currentEnabled: boolean) => {
    setTogglingModules(prev => new Set(prev).add(moduleKey))
    
    await toggleModule(moduleKey, !currentEnabled)
    
    setTogglingModules(prev => {
      const next = new Set(prev)
      next.delete(moduleKey)
      return next
    })
  }

  // Group modules by category
  const modulesByCategory = modules.reduce((acc, module) => {
    const category = module.moduleConfig.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(module)
    return acc
  }, {} as Record<ModuleCategory, typeof modules>)

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="space-y-8">
          {[1, 2].map(i => (
            <div key={i}>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(j => (
                  <Skeleton key={j} className="h-48" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gestión de Módulos
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Activa o desactiva los módulos SREIS según las necesidades del negocio
        </p>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            <strong className="text-gray-900 dark:text-white">
              {modules.filter(m => m.enabled).length}
            </strong> activos
          </span>
        </div>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700" />
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            <strong className="text-gray-900 dark:text-white">
              {modules.filter(m => !m.enabled).length}
            </strong> inactivos
          </span>
        </div>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          <strong className="text-gray-900 dark:text-white">
            {modules.length}
          </strong> módulos totales
        </span>
      </div>

      {/* Modules by Category */}
      <div className="space-y-8">
        {(Object.keys(MODULE_CATEGORIES) as ModuleCategory[]).map(category => {
          const categoryModules = modulesByCategory[category] || []
          if (categoryModules.length === 0) return null

          const CategoryIcon = categoryIconMap[category] || Settings
          const categoryInfo = MODULE_CATEGORIES[category]

          return (
            <div key={category}>
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <CategoryIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {categoryInfo.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {categoryInfo.description}
                  </p>
                </div>
              </div>

              {/* Module Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {categoryModules.map(module => {
                  const Icon = iconMap[module.moduleConfig.icon] || Settings
                  const isToggling = togglingModules.has(module.key)

                  return (
                    <Card 
                      key={module.key}
                      className={`transition-all ${
                        module.enabled 
                          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10' 
                          : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${module.moduleConfig.color} flex items-center justify-center`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {module.moduleConfig.name}
                                {module.moduleConfig.requiredPlan && (
                                  <Badge variant="outline" className="text-xs">
                                    {module.moduleConfig.requiredPlan.toUpperCase()}
                                  </Badge>
                                )}
                              </CardTitle>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isToggling ? (
                              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            ) : module.enabled ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400" />
                            )}
                            <Switch
                              checked={module.enabled}
                              onCheckedChange={() => handleToggle(module.key, module.enabled)}
                              disabled={isToggling}
                            />
                          </div>
                        </div>
                        <CardDescription className="mt-2">
                          {module.moduleConfig.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Features List */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                            <Info className="h-3 w-3" />
                            <span>Funcionalidades incluidas:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {module.moduleConfig.features.slice(0, 3).map((feature, idx) => (
                              <TooltipProvider key={idx}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge 
                                      variant="secondary" 
                                      className="text-xs cursor-default"
                                    >
                                      {feature.length > 25 ? feature.slice(0, 25) + '...' : feature}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{feature}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                            {module.moduleConfig.features.length > 3 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs cursor-default"
                                    >
                                      +{module.moduleConfig.features.length - 3} más
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <ul className="list-disc list-inside">
                                      {module.moduleConfig.features.slice(3).map((f, i) => (
                                        <li key={i}>{f}</li>
                                      ))}
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>

                        {/* Dependencies */}
                        {module.moduleConfig.dependencies && module.moduleConfig.dependencies.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Requiere: {module.moduleConfig.dependencies.join(', ')}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


