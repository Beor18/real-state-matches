'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModuleSection } from '@/components/modules/ModuleWrapper'
import { useModules } from '@/hooks/useModules'
import DemandPredictionEngine from '@/components/reai/DemandPredictionEngine'
import EquityForecast from '@/components/reai/EquityForecast'
import {
  Home,
  Search,
  Heart,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Star,
  User,
  LogOut,
  Menu,
  X,
  MapPin,
  Clock,
  Shield,
  TrendingUp,
  LineChart,
} from 'lucide-react'
import { useState } from 'react'

export default function LandingPage() {
  const { user, signOut, isLoading: authLoading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isEnabled } = useModules()
  
  const hasActiveModules = isEnabled('demand-prediction') || isEnabled('equity-forecast')

  const navItems = [
    { href: '/', label: 'Inicio' },
    { href: '/buscar', label: 'Buscar Casa' },
    { href: '/precios', label: 'Precios' },
  ]

  const benefits = [
    {
      icon: Heart,
      title: 'Matching Personalizado',
      description: 'Describe tu estilo de vida ideal y nuestra IA encuentra las propiedades perfectas para ti.',
    },
    {
      icon: Clock,
      title: 'Ahorra Tiempo',
      description: 'En lugar de buscar entre cientos de listados, recibe solo las opciones que realmente te interesan.',
    },
    {
      icon: Shield,
      title: 'Decisiones Informadas',
      description: 'Accede a análisis de mercado y proyecciones para tomar la mejor decisión de inversión.',
    },
  ]

  const testimonials = [
    {
      name: 'María González',
      location: 'San Juan, PR',
      text: 'Encontré mi apartamento ideal en Condado en solo 2 semanas. El matching por estilo de vida fue clave.',
      avatar: 'M',
    },
    {
      name: 'Carlos Rodríguez',
      location: 'Dorado, PR',
      text: 'Como inversionista, las predicciones de plusvalía me ayudaron a tomar una decisión informada.',
      avatar: 'C',
    },
    {
      name: 'Ana Martínez',
      location: 'Guaynabo, PR',
      text: 'El proceso fue tan simple. Solo describí cómo quería vivir y me mostraron exactamente lo que buscaba.',
      avatar: 'A',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Auth & Mobile Menu */}
            <div className="flex items-center gap-3">
              {!authLoading && (
                <>
                  {user ? (
                    <div className="hidden md:flex items-center gap-2">
                      <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <User className="h-4 w-4" />
                          Mi Cuenta
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => signOut()}>
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Link href="/auth/login" className="hidden md:block">
                      <Button size="sm" variant="outline">
                        Iniciar Sesión
                      </Button>
                    </Link>
                  )}
                </>
              )}

              <Link href="/buscar" className="hidden md:block">
                <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Search className="h-4 w-4" />
                  Buscar Casa
                </Button>
              </Link>

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
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pt-4 pb-2 border-t mt-4"
            >
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="border-t pt-2 mt-2 space-y-2">
                  {user ? (
                    <>
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                          <User className="h-4 w-4" />
                          Mi Cuenta
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 text-red-600"
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
                      <Button variant="outline" size="sm" className="w-full">
                        Iniciar Sesión
                      </Button>
                    </Link>
                  )}
                  <Link href="/buscar" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                      <Search className="h-4 w-4" />
                      Buscar Casa
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center space-y-8"
            >
              <Badge variant="outline" className="gap-2 px-4 py-1.5 text-sm border-emerald-200 bg-emerald-50 text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                Powered by AI
              </Badge>

              <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight">
                Encuentra tu{' '}
                <span className="text-emerald-600">hogar ideal</span>
                <br />
                en Puerto Rico
              </h1>

              <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
                Describe cómo imaginas tu vida perfecta y nuestra inteligencia artificial 
                encontrará las propiedades que mejor se adaptan a tu estilo de vida.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/buscar">
                  <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-base px-8 h-12 w-full sm:w-auto">
                    <Search className="h-5 w-5" />
                    Comenzar Búsqueda Gratis
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-slate-500">
                Sin tarjeta de crédito • Resultados en minutos
              </p>
            </motion.div>
          </div>
        </section>

        {/* How it Works - Simple Steps */}
        <section className="py-16 bg-white border-y">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                ¿Cómo funciona?
              </h2>
              <p className="text-slate-600 max-w-xl mx-auto">
                Tres pasos simples para encontrar tu hogar ideal
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  step: '1',
                  title: 'Describe tu vida ideal',
                  description: 'Cuéntanos cómo imaginas tu día a día: cercanía al mar, vida urbana, espacio para familia, etc.',
                },
                {
                  step: '2',
                  title: 'La IA analiza',
                  description: 'Nuestra inteligencia artificial procesa tu perfil y busca entre cientos de propiedades.',
                },
                {
                  step: '3',
                  title: 'Recibe matches',
                  description: 'Obtén una lista personalizada de propiedades que se adaptan a tu estilo de vida.',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center space-y-4"
                >
                  <div className="h-14 w-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/buscar">
                <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  Comenzar Ahora
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                ¿Por qué usar HogarAI?
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full border-2 hover:border-emerald-200 transition-colors">
                    <CardContent className="p-6 space-y-4">
                      <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <benefit.icon className="h-6 w-6 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">{benefit.title}</h3>
                      <p className="text-slate-600 text-sm">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SREIS Modules Section - Shown only if modules are enabled */}
        {hasActiveModules && (
          <section className="py-20 bg-gradient-to-b from-slate-100 to-white">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <Badge variant="outline" className="gap-2 mb-4 px-4 py-1.5 border-purple-200 bg-purple-50 text-purple-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Inteligencia Avanzada
                </Badge>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  Herramientas de Análisis Profesional
                </h2>
                <p className="text-slate-600 max-w-xl mx-auto">
                  Accede a análisis de mercado impulsados por IA para tomar decisiones informadas
                </p>
              </motion.div>

              <div className="space-y-12">
                {/* Demand Prediction Module */}
                <ModuleSection moduleKey="demand-prediction" className="scroll-mt-20" showHeader={false}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                      <CardContent className="p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">Predicción de Demanda</h3>
                            <p className="text-sm text-slate-600">Identifica zonas calientes antes que otros</p>
                          </div>
                        </div>
                        <DemandPredictionEngine />
                      </CardContent>
                    </Card>
                  </motion.div>
                </ModuleSection>

                {/* Equity Forecast Module */}
                <ModuleSection moduleKey="equity-forecast" className="scroll-mt-20" showHeader={false}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                      <CardContent className="p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <LineChart className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">Proyección de Plusvalía</h3>
                            <p className="text-sm text-slate-600">Conoce el valor futuro de tu inversión</p>
                          </div>
                        </div>
                        <EquityForecast />
                      </CardContent>
                    </Card>
                  </motion.div>
                </ModuleSection>
              </div>
            </div>
          </section>
        )}

        {/* Testimonials Section */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Lo que dicen nuestros usuarios
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full bg-white">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-slate-600 text-sm italic">"{testimonial.text}"</p>
                      <div className="flex items-center gap-3 pt-2">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{testimonial.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {testimonial.location}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center space-y-6"
            >
              <h2 className="text-3xl font-bold text-slate-900">
                ¿Listo para encontrar tu hogar ideal?
              </h2>
              <p className="text-slate-600">
                Comienza tu búsqueda hoy. Es gratis y solo toma unos minutos.
              </p>
              <Link href="/buscar">
                <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-base px-8 h-12">
                  <Search className="h-5 w-5" />
                  Comenzar Búsqueda Gratis
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Home className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900">HogarAI</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2025 HogarAI. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <Link href="#" className="hover:text-slate-900">Términos</Link>
              <Link href="#" className="hover:text-slate-900">Privacidad</Link>
              <Link href="#" className="hover:text-slate-900">Contacto</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

