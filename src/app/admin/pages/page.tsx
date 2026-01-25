'use client'

import { useState } from 'react'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PAGES, getControllablePages } from '@/config/pages'
import { 
  FileText,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Info,
  ExternalLink,
  Lock,
  Home,
  Search,
  CreditCard,
  LayoutDashboard,
  Globe,
  Settings,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Search,
  CreditCard,
  LayoutDashboard,
  FileText,
  Globe,
  Settings,
}

export default function AdminPagesPage() {
  const { pages, isLoading, togglePage } = usePageConfig()
  const [togglingPages, setTogglingPages] = useState<Set<string>>(new Set())

  const handleToggle = async (pageKey: string, currentEnabled: boolean) => {
    // Check if page is always enabled
    const pageConfig = PAGES[pageKey]
    if (pageConfig?.alwaysEnabled) {
      return
    }

    setTogglingPages(prev => new Set(prev).add(pageKey))
    
    await togglePage(pageKey, !currentEnabled)
    
    setTogglingPages(prev => {
      const next = new Set(prev)
      next.delete(pageKey)
      return next
    })
  }

  // Get controllable pages
  const controllablePages = getControllablePages()

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  const enabledCount = pages.filter(p => p.enabled && !p.pageConfig.alwaysEnabled).length
  const disabledCount = pages.filter(p => !p.enabled && !p.pageConfig.alwaysEnabled).length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Páginas Públicas
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Controla qué páginas son visibles para los usuarios en la navegación
        </p>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-emerald-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            <strong className="text-gray-900 dark:text-white">
              {enabledCount}
            </strong> visibles
          </span>
        </div>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700" />
        <div className="flex items-center gap-2">
          <EyeOff className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            <strong className="text-gray-900 dark:text-white">
              {disabledCount}
            </strong> ocultas
          </span>
        </div>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700" />
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            <strong className="text-gray-900 dark:text-white">1</strong> siempre visible
          </span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
              Cómo funciona
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Al desactivar una página, esta desaparece del menú de navegación y los usuarios no pueden acceder a ella directamente.
              Como administrador, siempre podrás ver las páginas desactivadas con una advertencia.
            </p>
          </div>
        </div>
      </div>

      {/* Always Enabled Pages */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-500" />
          Páginas siempre visibles
        </h2>
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <Home className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Página de Inicio</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    La página principal no puede ser desactivada
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-amber-500 text-amber-600">
                <Lock className="h-3 w-3 mr-1" />
                Siempre activa
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controllable Pages */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4 text-gray-500" />
          Páginas configurables
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pages
            .filter(p => !p.pageConfig.alwaysEnabled)
            .map(page => {
              const Icon = page.pageConfig.icon || FileText
              const isToggling = togglingPages.has(page.key)

              return (
                <Card 
                  key={page.key}
                  className={`transition-all ${
                    page.enabled 
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10' 
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          page.enabled 
                            ? 'bg-emerald-100 dark:bg-emerald-900' 
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            page.enabled 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {page.pageConfig.name}
                            {page.pageConfig.requiresAuth && (
                              <Badge variant="outline" className="text-xs">
                                Requiere login
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {page.pageConfig.route}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isToggling ? (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        ) : page.enabled ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        <Switch
                          checked={page.enabled}
                          onCheckedChange={() => handleToggle(page.key, page.enabled)}
                          disabled={isToggling}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-3">
                      {page.pageConfig.description}
                    </CardDescription>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {page.enabled ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0">
                            <Eye className="h-3 w-3 mr-1" />
                            Visible
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-gray-600">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Oculta
                          </Badge>
                        )}
                        {page.pageConfig.showInNav && (
                          <Badge variant="outline" className="text-xs">
                            En navegación
                          </Badge>
                        )}
                      </div>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={page.pageConfig.route} target="_blank">
                              <Button variant="ghost" size="sm" className="text-gray-500">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver página</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      </div>

      {/* Navigation Preview */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-gray-500" />
          Vista previa de navegación
        </h2>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Así verán los usuarios el menú de navegación:
            </p>
            <div className="flex items-center gap-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                HogarAI
              </span>
              <div className="flex items-center gap-4">
                {pages
                  .filter(p => p.enabled && p.pageConfig.showInNav)
                  .map(page => (
                    <span 
                      key={page.key}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                    >
                      {page.pageConfig.navLabel}
                    </span>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

