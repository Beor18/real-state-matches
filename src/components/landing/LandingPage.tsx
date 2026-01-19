'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ModuleSection } from '@/components/modules/ModuleWrapper'
import { useModules } from '@/hooks/useModules'
import DemandPredictionEngine from '@/components/reai/DemandPredictionEngine'
import EquityForecast from '@/components/reai/EquityForecast'
import Header from '@/components/layout/Header'
import {
  Home,
  Search,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Star,
  Crown,
  MapPin,
  Zap,
  Brain,
  Target,
  TrendingUp,
  LineChart,
  ChevronRight,
  Play,
  Mail,
  Loader2,
} from 'lucide-react'
import { useState, useEffect } from 'react'

// Animated text that types out
function TypewriterText({ words, className }: { words: string[]; className?: string }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const word = words[currentWordIndex]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < word.length) {
          setCurrentText(word.slice(0, currentText.length + 1))
        } else {
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(word.slice(0, currentText.length - 1))
        } else {
          setIsDeleting(false)
          setCurrentWordIndex((prev) => (prev + 1) % words.length)
        }
      }
    }, isDeleting ? 50 : 100)

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, currentWordIndex, words])

  return (
    <span className={className}>
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

interface Plan {
  id: string
  plan_key: string
  name: string
  description: string | null
  price_monthly: number
  price_yearly: number
  features: string[]
  popular?: boolean
}

// Icon mapping based on plan key
const planIcons: Record<string, typeof Star> = {
  starter: Sparkles,
  pro: Star,
  vip: Crown,
}

// Plan colors based on plan key
const planColors: Record<string, string> = {
  starter: 'border-slate-200',
  pro: 'border-emerald-500',
  vip: 'border-amber-500',
}

export default function LandingPage() {
  const { isEnabled } = useModules()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  
  const hasActiveModules = isEnabled('demand-prediction') || isEnabled('equity-forecast')

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/plans')
        const data = await res.json()
        if (data.success) {
          const plansWithPopular = data.plans.map((plan: Plan) => ({
            ...plan,
            popular: plan.plan_key === 'pro',
          }))
          setPlans(plansWithPopular)
        }
      } catch (error) {
        console.error('Error fetching plans:', error)
      } finally {
        setLoadingPlans(false)
      }
    }
    fetchPlans()
  }, [])

  const stats = [
    { value: '2,500+', label: 'Propiedades analizadas' },
    { value: '98%', label: 'Clientes satisfechos' },
    { value: '<2min', label: 'Para encontrar matches' },
    { value: '24/7', label: 'Siempre disponible' },
  ]

  const steps = [
    {
      icon: Brain,
      title: 'Describe tu vida ideal',
      description: 'Cuéntanos cómo imaginas tu día a día perfecto.',
    },
    {
      icon: Zap,
      title: 'Análisis instantáneo',
      description: 'Procesamos tu perfil contra miles de propiedades.',
    },
    {
      icon: Target,
      title: 'Matches personalizados',
      description: 'Recibe propiedades que realmente encajan contigo.',
    },
  ]


  const testimonials = [
    {
      name: 'María González',
      role: 'Compradora',
      location: 'San Juan, PR',
      text: 'Encontré mi apartamento ideal en Condado en solo 2 semanas. El matching por estilo de vida cambió todo.',
      avatar: 'M',
    },
    {
      name: 'Carlos Rodríguez',
      role: 'Inversionista',
      location: 'Dorado, PR',
      text: 'Las predicciones de plusvalía me dieron la confianza para invertir. Ya tengo 3 propiedades.',
      avatar: 'C',
    },
    {
      name: 'Ana Martínez',
      role: 'Nómada Digital',
      location: 'Rincón, PR',
      text: 'Describí que quería surf y trabajo remoto. Me encontraron exactamente eso cerca de la playa.',
      avatar: 'A',
    },
  ]

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  }

  const staggerContainer = {
    initial: {},
    whileInView: { transition: { staggerChildren: 0.1 } },
    viewport: { once: true },
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <Header showCTA />

      {/* Main Content */}
      <main className="flex-1 pt-20">
        {/* Hero Section - Clean & Impactful */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-white" />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                La forma más inteligente de buscar propiedades
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                Encuentra tu hogar
                <br />
                <span className="text-emerald-600">
                  <TypewriterText words={['ideal', 'perfecto', 'soñado']} />
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
                Describe cómo quieres vivir y recibe propiedades 
                que realmente se adaptan a tu estilo de vida.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/buscar">
                  <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 h-14 text-base">
                    <Search className="h-5 w-5 mr-2" />
                    Comenzar ahora
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base border-slate-200">
                  <Play className="h-5 w-5 mr-2" />
                  Ver cómo funciona
                </Button>
              </div>

              {/* Trust indicators */}
              <p className="text-sm text-slate-400 pt-2">
                Sin compromiso · Resultados en 2 minutos
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-slate-100 bg-slate-50/50">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <motion.div 
              {...fadeInUp}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How it Works - 3 Steps */}
        <section className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div {...fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Tan simple como 1, 2, 3
              </h2>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Olvídate de filtros complicados. Solo describe tu vida ideal.
              </p>
            </motion.div>

            <motion.div 
              {...staggerContainer}
              className="grid md:grid-cols-3 gap-8 md:gap-12"
            >
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="relative"
                >
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-slate-200 to-transparent" />
                  )}
                  
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl bg-slate-100 mx-auto">
                      <step.icon className="h-10 w-10 text-slate-700" />
                    </div>
                    <div className="text-sm font-medium text-emerald-600">Paso {index + 1}</div>
                    <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                    <p className="text-slate-500">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div {...fadeInUp} className="text-center mt-16">
              <Link href="/buscar">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-8 h-14">
                  Probarlo ahora
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* AI Features Highlight */}
        <section className="py-24 md:py-32 bg-slate-900 text-white overflow-hidden">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div {...fadeInUp} className="space-y-8">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Tecnología Inteligente
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  No buscas propiedades.
                  <br />
                  <span className="text-emerald-400">Describes tu vida.</span>
                </h2>
                <p className="text-lg text-slate-400 leading-relaxed">
                  Entendemos tus palabras y las traducimos en características 
                  concretas: ubicación, amenidades, estilo, presupuesto. Todo automáticamente.
                </p>
                <ul className="space-y-4">
                  {[
                    'Análisis semántico de tus preferencias',
                    'Matching con scoring de compatibilidad',
                    'Predicciones de valorización',
                    'Alertas inteligentes personalizadas',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-slate-300">
                      <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-3xl" />
                <Card className="relative bg-slate-800/50 border-slate-700 backdrop-blur">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Brain className="h-5 w-5 text-emerald-400" />
                        </div>
                        <span className="text-slate-300">Análisis inteligente</span>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-xl">
                        <p className="text-slate-400 text-sm italic">
                          "Quiero vivir cerca del mar, trabajar remoto con buen internet, 
                          y tener cafeterías cerca para las mañanas..."
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Compatibilidad</span>
                          <span className="text-emerald-400 font-medium">94%</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: '94%' }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['Costero', 'WiFi rápido', 'Cafeterías', 'Trabajo remoto'].map((tag) => (
                          <span key={tag} className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div {...fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Invierte en encontrar tu lugar
              </h2>
              <p className="text-lg text-slate-500">
                Planes flexibles que se adaptan a tu búsqueda. Cancela cuando quieras.
              </p>
            </motion.div>

            {loadingPlans ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <motion.div 
                {...staggerContainer}
                className={`grid gap-6 max-w-4xl mx-auto ${
                  plans.length === 1 
                    ? 'md:grid-cols-1 max-w-md' 
                    : plans.length === 2 
                      ? 'md:grid-cols-2 max-w-2xl' 
                      : 'md:grid-cols-3'
                }`}
              >
                {plans.map((plan, index) => {
                  const color = planColors[plan.plan_key] || 'border-slate-200'
                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`relative h-full border-2 ${color} ${plan.popular ? 'shadow-lg shadow-emerald-500/10' : ''}`}>
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Badge className="bg-emerald-600 text-white">Más popular</Badge>
                          </div>
                        )}
                        <CardContent className="p-6 space-y-6">
                          <div>
                            <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                            <p className="text-sm text-slate-500">{plan.description}</p>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-slate-900">${plan.price_monthly}</span>
                            <span className="text-slate-500">/mes</span>
                          </div>
                          <ul className="space-y-3">
                            {plan.features.map((feature) => (
                              <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <Link href="/precios" className="block">
                            <Button 
                              variant={plan.popular ? 'default' : 'outline'} 
                              className={`w-full ${plan.popular ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                            >
                              Elegir plan
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}

            <motion.div {...fadeInUp} className="text-center mt-8">
              <Link href="/precios" className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 text-sm font-medium">
                Ver todos los detalles
                <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 md:py-32 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div {...fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Lo que dicen nuestros usuarios
              </h2>
            </motion.div>

            <motion.div 
              {...staggerContainer}
              className="grid md:grid-cols-3 gap-6"
            >
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full bg-white border-0 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-slate-600 leading-relaxed">"{testimonial.text}"</p>
                      <div className="flex items-center gap-3 pt-2">
                        <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-medium">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{testimonial.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            {testimonial.role} · <MapPin className="h-3 w-3" /> {testimonial.location}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* SREIS Modules Section - Shown only if modules are enabled */}
        {hasActiveModules && (
          <section className="py-24 md:py-32">
            <div className="max-w-6xl mx-auto px-6">
              <motion.div {...fadeInUp} className="text-center mb-16">
                <Badge variant="outline" className="gap-2 mb-4 px-4 py-1.5 border-purple-200 bg-purple-50 text-purple-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Herramientas Pro
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Análisis profesional de mercado
                </h2>
                <p className="text-lg text-slate-500 max-w-xl mx-auto">
                  Accede a insights exclusivos para tomar mejores decisiones
                </p>
              </motion.div>

              <div className="space-y-8">
                <ModuleSection moduleKey="demand-prediction" showHeader={false}>
                  <motion.div {...fadeInUp}>
                    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
                      <CardContent className="p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">Predicción de Demanda</h3>
                            <p className="text-sm text-slate-500">Identifica zonas calientes</p>
                          </div>
                        </div>
                        <DemandPredictionEngine />
                      </CardContent>
                    </Card>
                  </motion.div>
                </ModuleSection>

                <ModuleSection moduleKey="equity-forecast" showHeader={false}>
                  <motion.div {...fadeInUp}>
                    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/50">
                      <CardContent className="p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <LineChart className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">Proyección de Plusvalía</h3>
                            <p className="text-sm text-slate-500">Valor futuro de tu inversión</p>
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

        {/* Final CTA */}
        <section className="py-24 md:py-32 bg-slate-900 text-white">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <motion.div {...fadeInUp} className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold">
                ¿Listo para encontrar tu lugar?
              </h2>
              <p className="text-xl text-slate-400">
                Únete a miles de personas que ya encontraron donde quieren vivir.
              </p>
              <Link href="/buscar">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-10 h-14 text-base font-medium">
                  Comenzar ahora
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 border-t border-slate-100">
          <div className="max-w-xl mx-auto px-6 text-center">
            <motion.div {...fadeInUp} className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Recibe las mejores propiedades en tu inbox
              </h3>
              <p className="text-sm text-slate-500">
                Alertas semanales de nuevas propiedades que coinciden con tu perfil.
              </p>
              <form className="flex gap-2 max-w-md mx-auto">
                <Input 
                  type="email" 
                  placeholder="tu@email.com" 
                  className="flex-1 rounded-full border-slate-200"
                />
                <Button type="submit" className="rounded-full bg-slate-900 hover:bg-slate-800 px-6">
                  <Mail className="h-4 w-4 mr-2" />
                  Suscribir
                </Button>
              </form>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer - Clean & Minimal */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <Home className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-slate-900">HogarAI</span>
              </Link>
              <p className="text-sm text-slate-500">
                La forma más inteligente de encontrar tu próximo hogar.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="/buscar" className="hover:text-slate-900">Buscar Casa</Link></li>
                <li><Link href="/precios" className="hover:text-slate-900">Precios</Link></li>
                <li><Link href="#" className="hover:text-slate-900">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="#" className="hover:text-slate-900">Sobre Nosotros</Link></li>
                <li><Link href="#" className="hover:text-slate-900">Blog</Link></li>
                <li><Link href="#" className="hover:text-slate-900">Contacto</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="#" className="hover:text-slate-900">Términos</Link></li>
                <li><Link href="#" className="hover:text-slate-900">Privacidad</Link></li>
                <li><Link href="#" className="hover:text-slate-900">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} HogarAI. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                Made with ❤️ in Puerto Rico
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
