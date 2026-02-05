'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useModules } from '@/hooks/useModules'
import { 
  Puzzle, 
  Users, 
  Home,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface Stats {
  totalUsers: number
  totalProperties: number
  activeSubscriptions: number
  enabledModules: number
  totalModules: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { modules, isLoading: modulesLoading } = useModules()

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      // Fetch counts in parallel
      const [usersResult, propertiesResult, subscriptionsResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('properties').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active')
      ])

      setStats({
        totalUsers: usersResult.count || 0,
        totalProperties: propertiesResult.count || 0,
        activeSubscriptions: subscriptionsResult.count || 0,
        enabledModules: modules.filter(m => m.enabled).length,
        totalModules: modules.length
      })
      setIsLoading(false)
    }

    if (!modulesLoading) {
      fetchStats()
    }
  }, [modules, modulesLoading])

  const statsCards = [
    { 
      title: 'Usuarios Totales', 
      value: stats?.totalUsers || 0, 
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    { 
      title: 'Propiedades', 
      value: stats?.totalProperties || 0, 
      icon: Home,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
    },
    { 
      title: 'Suscripciones Activas', 
      value: stats?.activeSubscriptions || 0, 
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    { 
      title: 'Módulos Activos', 
      value: `${stats?.enabledModules || 0}/${stats?.totalModules || 0}`, 
      icon: Puzzle,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Panel de Administración
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Bienvenido al panel de control de Smarlin
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading || modulesLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          statsCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Modules Overview */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Estado de Módulos</CardTitle>
          <Link href="/admin/modules">
            <Button variant="outline" size="sm">
              Gestionar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {modulesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map(module => (
                <div 
                  key={module.key}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${module.enabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {module.moduleConfig.shortName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {module.moduleConfig.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {module.enabled ? (
                      <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <XCircle className="h-4 w-4" />
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/modules">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                <Puzzle className="h-6 w-6" />
                <span>Configurar Módulos</span>
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <span>Gestionar Usuarios</span>
              </Button>
            </Link>
            <Link href="/" target="_blank">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                <Home className="h-6 w-6" />
                <span>Ver Sitio Público</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


