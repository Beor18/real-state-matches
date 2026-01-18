'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Home,
  TrendingUp,
  Heart,
  LineChart,
  Sparkles,
  DollarSign,
  Bell,
  Menu,
  X,
  MapPin,
  BarChart3,
  Zap,
  Users,
  Star,
  LogIn,
  User,
  Crown,
  LogOut
} from 'lucide-react'
import Link from 'next/link'
import DemandPredictionEngine from './DemandPredictionEngine'
import LifestyleMatch from './LifestyleMatch'
import EquityForecast from './EquityForecast'
import EngagementHub from './EngagementHub'
import MonetizationSection from './MonetizationSection'

export default function REAIPlatform() {
  const { currentView, setCurrentView } = useAppStore()
  const { user, dbUser, subscription, isLoading: authLoading, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stats, setStats] = useState({
    activeUsers: 315000,
    predictions: 1247,
    hotZones: 23,
    avgReturn: 87
  })

  // Animated counter effect
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10),
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const navItems = [
    { id: 'dashboard' as const, icon: Home, label: 'Dashboard' },
    { id: 'demand' as const, icon: TrendingUp, label: 'Predicción Demanda' },
    { id: 'lifestyle' as const, icon: Heart, label: 'Lifestyle Match' },
    { id: 'equity' as const, icon: LineChart, label: 'Equity Forecast' },
    { id: 'engagement' as const, icon: Sparkles, label: 'Engagement Hub' },
    { id: 'monetization' as const, icon: DollarSign, label: 'Planes & Precios' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-lg dark:bg-slate-950/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center"
              >
                <Home className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  REAI Ecosystem
                </h1>
                <p className="text-xs text-muted-foreground">Real Estate Intelligence Platform</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView(item.id)}
                  className={`gap-2 transition-all ${
                    currentView === item.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : ''
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </nav>

            {/* Auth & Mobile Menu */}
            <div className="flex items-center gap-2">
              {/* Auth Buttons */}
              {!authLoading && (
                <>
                  {user ? (
                    <div className="hidden md:flex items-center gap-2">
                      {subscription && (
                        <Badge className="gap-1 bg-gradient-to-r from-purple-600 to-pink-600">
                          <Crown className="h-3 w-3" />
                          {subscription.plan_name}
                        </Badge>
                      )}
                      <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <User className="h-4 w-4" />
                          {dbUser?.name || user.email?.split('@')[0]}
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => signOut()}>
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Link href="/auth/login" className="hidden md:block">
                      <Button size="sm" className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600">
                        <LogIn className="h-4 w-4" />
                        Iniciar Sesión
                      </Button>
                    </Link>
                  )}
                </>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden pt-4 border-t"
              >
                <div className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={currentView === item.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        setCurrentView(item.id)
                        setMobileMenuOpen(false)
                      }}
                      className="justify-start gap-2 w-full"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  ))}
                  
                  {/* Mobile Auth */}
                  <div className="border-t pt-2 mt-2">
                    {user ? (
                      <>
                        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" size="sm" className="justify-start gap-2 w-full">
                            <User className="h-4 w-4" />
                            Mi Dashboard
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="justify-start gap-2 w-full text-red-600"
                          onClick={() => {
                            signOut()
                            setMobileMenuOpen(false)
                          }}
                        >
                          <LogOut className="h-4 w-4" />
                          Cerrar Sesión
                        </Button>
                      </>
                    ) : (
                      <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button size="sm" className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600">
                          <LogIn className="h-4 w-4" />
                          Iniciar Sesión
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="container mx-auto px-4 py-8"
          >
            {currentView === 'dashboard' && (
              <div className="space-y-8">
                {/* Hero Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-4 mb-12"
                >
                  <Badge variant="outline" className="gap-2 mb-4">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    Potenciado por IA Multimodal
                  </Badge>
                  <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Real Estate Intelligence
                  </h2>
                  <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                    Predice tendencias, encuentra tu hogar ideal por estilo de vida, y proyecta plusvalía
                    con inteligencia artificial avanzada para Puerto Rico y Latam
                  </p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                  <StatsCard
                    icon={Users}
                    label="Fanbase Activo"
                    value={formatNumber(stats.activeUsers)}
                    change="+12.5%"
                    trend="up"
                  />
                  <StatsCard
                    icon={BarChart3}
                    label="Predicciones IA"
                    value={formatNumber(stats.predictions)}
                    change="+23.1%"
                    trend="up"
                  />
                  <StatsCard
                    icon={MapPin}
                    label="Zonas Hot"
                    value={stats.hotZones.toString()}
                    change="+8 zonas"
                    trend="up"
                  />
                  <StatsCard
                    icon={TrendingUp}
                    label="ROI Promedio"
                    value={`${stats.avgReturn}%`}
                    change="+5.2%"
                    trend="up"
                  />
                </div>

                {/* Quick Access */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <QuickAccessCard
                    icon={TrendingUp}
                    title="Predicción de Demanda"
                    description="Descubre zonas infravaloradas y tendencias migratorias"
                    color="from-purple-500 to-purple-600"
                    onClick={() => setCurrentView('demand')}
                  />
                  <QuickAccessCard
                    icon={Heart}
                    title="Lifestyle Match"
                    description="Encuentra casas perfectas basadas en tu estilo de vida"
                    color="from-pink-500 to-pink-600"
                    onClick={() => setCurrentView('lifestyle')}
                  />
                  <QuickAccessCard
                    icon={LineChart}
                    title="Equity Forecast"
                    description="Proyección de plusvalía 3-10 años y ROI de remodelaciones"
                    color="from-emerald-500 to-emerald-600"
                    onClick={() => setCurrentView('equity')}
                  />
                  <QuickAccessCard
                    icon={Sparkles}
                    title="Engagement Hub"
                    description="Contenido viral IA, lives y alertas exclusivas"
                    color="from-amber-500 to-amber-600"
                    onClick={() => setCurrentView('engagement')}
                  />
                </div>
              </div>
            )}

            {currentView === 'demand' && <DemandPredictionEngine />}
            {currentView === 'lifestyle' && <LifestyleMatch />}
            {currentView === 'equity' && <EquityForecast />}
            {currentView === 'engagement' && <EngagementHub />}
            {currentView === 'monetization' && <MonetizationSection />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm dark:bg-slate-950/50 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © 2025 REAI Ecosystem. Potenciado por OpenAI GPT-4o
            </p>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-2">
                <Star className="h-3 w-3 text-yellow-500" />
                Next.js 15 + TypeScript + Supabase + Stripe
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Stats Card Component
function StatsCard({
  icon: Icon,
  label,
  value,
  change,
  trend,
}: {
  icon: any
  label: string
  value: string
  change: string
  trend: 'up' | 'down'
}) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 400 }}>
      <Card className="border-2 bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="text-3xl font-bold">{value}</p>
              <Badge
                variant={trend === 'up' ? 'default' : 'destructive'}
                className="gap-1"
              >
                <TrendingUp className="h-3 w-3" />
                {change}
              </Badge>
            </div>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Quick Access Card Component
function QuickAccessCard({
  icon: Icon,
  title,
  description,
  color,
  onClick,
}: {
  icon: any
  title: string
  description: string
  color: string
  onClick: () => void
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <Card
        className="cursor-pointer border-2 bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all dark:bg-slate-900/50"
        onClick={onClick}
      >
        <CardHeader>
          <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardHeader>
      </Card>
    </motion.div>
  )
}
