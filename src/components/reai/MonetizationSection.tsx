'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  X,
  Star,
  Crown,
  Gem,
  Zap,
  Users,
  TrendingUp,
  Sparkles,
  BarChart3,
  Calendar,
  Video,
  MessageSquare,
  ArrowRight,
  Loader2
} from 'lucide-react'

interface Plan {
  id: string
  name: string
  price: number
  interval: 'monthly' | 'yearly'
  yearlyPrice: number
  features: string[]
  popular: boolean
  icon: any
  color: string
  badge?: string
}

interface Consulting {
  id: string
  name: string
  price: number
  duration: string
  features: string[]
  color: string
}

export default function MonetizationSection() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const { user, subscription } = useAuth()
  const router = useRouter()

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      // Redirect to login if not authenticated
      router.push('/auth/login?redirectTo=/#monetization')
      return
    }

    setLoadingPlan(planId)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          interval: billingInterval,
        }),
      })

      const data = await response.json()

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        console.error('No checkout URL received')
        alert('Error al crear la sesión de pago. Por favor intenta de nuevo.')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Error al procesar la solicitud. Por favor intenta de nuevo.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
    }
  }

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      yearlyPrice: 24,
      interval: 'monthly',
      features: [
        '5 predicciones de propiedades/mes',
        'Acceso a análisis de zonas básico',
        'Alertas de oportunidades',
        'Contenido viral básico (3/mes)',
        'Lifestyle Match (3 propiedades/mes)',
        'Equity Forecast (1 propiedad)',
        'Soporte por email'
      ],
      popular: false,
      icon: Users,
      color: 'from-emerald-500 to-emerald-600',
      badge: 'Perfecto para empezar'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 49,
      yearlyPrice: 39,
      interval: 'monthly',
      features: [
        'Predicciones ilimitadas',
        'Análisis de zonas avanzado',
        'Alertas en tiempo real',
        'Contenido viral ilimitado',
        'Lifestyle Match ilimitado',
        'Equity Forecast ilimitado',
        'Recomendaciones de remodelación',
        'Análisis de zonificación',
        'Reportes PDF detallados',
        'Soporte prioritario'
      ],
      popular: true,
      icon: Star,
      color: 'from-purple-500 to-purple-600',
      badge: 'Más popular'
    },
    {
      id: 'vip',
      name: 'VIP',
      price: 99,
      yearlyPrice: 79,
      interval: 'monthly',
      features: [
        'Todo lo del plan Pro',
        'Acceso a propiedades exclusivas',
        'Alertas VIP anticipadas (24h)',
        'Scripts personalizados de live',
        'Consultoría mensual 1:1 (30 min)',
        'Análisis de portafolio completo',
        'Acceso a comunidad exclusiva',
        'Eventos en vivo exclusivos',
        'Soporte dedicado 24/7',
        'Comisiones preferenciales'
      ],
      popular: false,
      icon: Crown,
      color: 'from-amber-500 to-amber-600',
      badge: 'Para inversionistas serios'
    }
  ]

  const consulting: Consulting[] = [
    {
      id: 'strategy',
      name: 'Estrategia de Inversión Personalizada',
      price: 200,
      duration: '60 min',
      features: [
        'Análisis de objetivos y presupuesto',
        'Identificación de zonas ideales',
        'Evaluación de propiedades específicas',
        'Estrategia de entrada y salida',
        'Plan de financiamiento',
        'Seguimiento por email (2 semanas)'
      ],
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'portfolio',
      name: 'Consultoría de Portafolio Completo',
      price: 350,
      duration: '90 min',
      features: [
        'Análisis de todas tus propiedades',
        'Optimización de portafolio',
        'Estrategia de plusvalía a 10 años',
        'Análisis de zonificación de cada propiedad',
        'Recomendaciones de remodelación con ROI',
        'Plan de diversificación',
        'Seguimiento mensual (3 meses)'
      ],
      color: 'from-emerald-500 to-emerald-600'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <Badge variant="outline" className="gap-2 mb-4">
          <Gem className="h-3 w-3 text-purple-500" />
          Plans & Pricing
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Planes que se Adaptan a tus Necesidades
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Elige el plan perfecto para tu perfil de inversión o programa una consultoría personalizada
          para maximizar tus retornos en bienes raíces
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <span className={`text-sm ${billingInterval === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}`}>
            Mensual
          </span>
          <button
            onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              billingInterval === 'yearly' ? 'bg-purple-600' : 'bg-muted'
            }`}
          >
            <motion.div
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md ${
                billingInterval === 'yearly' ? 'left-8' : 'left-1'
              }`}
              layout
            />
          </button>
          <span className={`text-sm ${billingInterval === 'yearly' ? 'font-semibold' : 'text-muted-foreground'}`}>
            Anual
          </span>
          {billingInterval === 'yearly' && (
            <Badge className="bg-emerald-500">Ahorra 20%</Badge>
          )}
        </div>
      </motion.div>

      {/* Subscription Plans */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-3 gap-6"
      >
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative ${plan.popular ? 'md:-mt-4' : ''}`}
          >
            <Card className={`h-full transition-all border-2 hover:shadow-xl ${
              plan.popular ? 'border-purple-500 shadow-lg' : 'hover:border-purple-300'
            }`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className={`bg-gradient-to-r ${plan.color} text-white text-xs px-3 py-1`}>
                    {plan.badge}
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pt-8 pb-6">
                <div className={`h-16 w-16 mx-auto rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <plan.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  Para {plan.id === 'starter' ? 'comenzar' : plan.id === 'pro' ? 'inversionistas activos' : 'inversionistas serios'}
                </CardDescription>
                <div className="pt-4 space-y-1">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">
                      ${billingInterval === 'monthly' ? plan.price : plan.yearlyPrice}
                    </span>
                    <span className="text-muted-foreground">/mes</span>
                  </div>
                  {billingInterval === 'yearly' && (
                    <p className="text-xs text-emerald-600 font-medium">
                      Facturado anualmente (${(plan.yearlyPrice * 12).toLocaleString()})
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className={`h-5 w-5 shrink-0 mt-0.5 ${plan.popular ? 'text-purple-600' : 'text-emerald-600'}`} />
                      <span className="flex-1">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full gap-2 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => {
                    if (subscription?.plan_type === plan.id) {
                      handleManageSubscription()
                    } else {
                      handleSubscribe(plan.id)
                    }
                  }}
                  disabled={loadingPlan === plan.id}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : subscription?.plan_type === plan.id ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Plan Actual
                    </>
                  ) : (
                    <>
                      {user ? 'Comenzar' : 'Iniciar Sesión para'} {plan.name}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Commission Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <h3 className="text-xl font-bold">Comisiones por Referidos</h3>
                <p className="text-muted-foreground">
                  Genera ingresos adicionales refiriendo a otros usuarios. Recibe <span className="font-bold text-emerald-600">30% de comisión</span> por cada usuario que suscriba a través de tu enlace.
                </p>
              </div>
              <Button variant="outline" className="gap-2">
                <Zap className="h-4 w-4" />
                Obtener Enlace de Referido
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Consulting Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">Consultorías Personalizadas 1:1</h3>
          <p className="text-muted-foreground">
            Sesiones individuales con expertos en bienes raíces para maximizar tu inversión
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {consulting.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card className="hover:shadow-xl transition-all border-2 h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${session.color} flex items-center justify-center shrink-0`}>
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{session.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {session.duration}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-4">
                    <div className="text-4xl font-bold text-purple-600">${session.price}</div>
                    <p className="text-sm text-muted-foreground">por sesión</p>
                  </div>

                  <ul className="space-y-2">
                    {session.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-purple-600" />
                        <span className="flex-1">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600">
                    <MessageSquare className="h-4 w-4" />
                    Agendar Sesión
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Preguntas Frecuentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">¿Puedo cambiar de plan en cualquier momento?</h4>
              <p className="text-sm text-muted-foreground">
                Sí, puedes actualizar o degradar tu plan en cualquier momento. Los cambios se reflejarán en tu siguiente factura.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">¿Las consultorías incluyen seguimiento?</h4>
              <p className="text-sm text-muted-foreground">
                Las consultorías incluyen seguimiento por email por el período especificado en el plan.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">¿Cómo funcionan las comisiones por referidos?</h4>
              <p className="text-sm text-muted-foreground">
                Cada usuario recibe un enlace único. Cuando alguien suscribe a través de ese enlace, recibes el 30% de su primer pago mensual.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">¿Hay garantía de satisfacción?</h4>
              <p className="text-sm text-muted-foreground">
                Ofrecemos una garantía de 30 días en todos los planes. Si no estás satisfecho, te reembolsamos el 100% sin preguntas.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
