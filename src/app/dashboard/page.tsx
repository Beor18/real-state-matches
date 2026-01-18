'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth, useHasSubscription } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  Search,
  Crown,
  LogOut,
  Bell,
  Settings,
  ArrowRight,
  Loader2,
  Heart,
  Sparkles,
  CreditCard,
} from 'lucide-react'

export default function DashboardPage() {
  const { user, dbUser, subscription, isLoading, signOut } = useAuth()
  const hasSubscription = useHasSubscription()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Hogar<span className="text-emerald-600">AI</span>
                </h1>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
                Inicio
              </Link>
              <Link href="/buscar" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
                Buscar Casa
              </Link>
              <Link href="/precios" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
                Precios
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              {subscription && (
                <Badge className="gap-1 bg-emerald-600">
                  <Crown className="h-3 w-3" />
                  {subscription.plan_name}
                </Badge>
              )}
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                {dbUser?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  ¡Hola, {dbUser?.name || user.email?.split('@')[0]}!
                </h2>
                <p className="text-slate-600">{user.email}</p>
              </div>
            </div>
          </motion.div>

          {/* Subscription CTA (if no subscription) */}
          {!hasSubscription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-2 border-emerald-200 bg-emerald-50">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Crown className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900">Desbloquea más funciones</h3>
                        <p className="text-sm text-slate-600">
                          Suscríbete para búsquedas ilimitadas, alertas y más
                        </p>
                      </div>
                    </div>
                    <Link href="/precios">
                      <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                        Ver Planes
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Quick Actions Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-slate-900">Acceso Rápido</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <QuickActionCard
                href="/buscar"
                icon={Search}
                title="Buscar Casa"
                description="Encuentra tu hogar ideal"
                color="from-emerald-500 to-teal-600"
              />
              <QuickActionCard
                href="/precios"
                icon={Crown}
                title="Mi Plan"
                description={subscription?.plan_name || 'Ver planes disponibles'}
                color="from-amber-500 to-orange-600"
              />
              <QuickActionCard
                href="#"
                icon={Heart}
                title="Guardados"
                description="Propiedades favoritas"
                color="from-pink-500 to-rose-600"
              />
            </div>
          </motion.div>

          {/* Recent Activity / Saved Searches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Búsquedas Recientes</CardTitle>
                <CardDescription>Tus últimas búsquedas de propiedades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p>Aún no has realizado búsquedas</p>
                  <Link href="/buscar">
                    <Button variant="link" className="mt-2 text-emerald-600">
                      Comenzar a buscar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subscription Management */}
          {subscription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Mi Suscripción</CardTitle>
                  <CardDescription>Gestiona tu plan y facturación</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{subscription.plan_name}</p>
                        <p className="text-sm text-slate-600">
                          {subscription.status === 'active' ? 'Activo' : subscription.status}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleManageSubscription}>
                      Gestionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  color,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <Card className="cursor-pointer border-2 hover:border-emerald-200 hover:shadow-lg transition-all h-full">
          <CardContent className="p-6">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <h4 className="font-semibold text-slate-900">{title}</h4>
            <p className="text-sm text-slate-600">{description}</p>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}
