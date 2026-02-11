'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { PageGuard } from '@/components/PageGuard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Header from '@/components/layout/Header'
import {
  CheckCircle,
  Star,
  Crown,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react'

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

export default function PreciosPage() {
  const { user, subscription } = useAuth()
  const router = useRouter()
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/plans')
        const data = await res.json()
        if (data.success) {
          // Mark 'pro' as popular
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

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      router.push('/auth/login?redirectTo=/precios')
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
        window.location.href = data.url
      } else {
        alert('Error al crear la sesión de pago. Por favor intenta de nuevo.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar la solicitud.')
    } finally {
      setLoadingPlan(null)
    }
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
    <PageGuard 
      pageKey="page-precios"
      disabledTitle="Precios no disponibles"
      disabledMessage="La página de precios no está disponible en este momento. Contacta al administrador para más información."
    >
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header activeItem="/precios" />

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section - Dark */}
        <section className="bg-slate-900 text-white py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Planes flexibles
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Invierte en encontrar
                <br />
                <span className="text-emerald-400">tu lugar ideal</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Planes que se adaptan a tu búsqueda. Sin contratos, cancela cuando quieras.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 pt-4">
                <span className={`text-sm ${billingInterval === 'monthly' ? 'font-semibold text-white' : 'text-slate-400'}`}>
                  Mensual
                </span>
                <button
                  onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    billingInterval === 'yearly' ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}
                >
                  <motion.div
                    className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                    animate={{ left: billingInterval === 'yearly' ? '32px' : '4px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
                <span className={`text-sm ${billingInterval === 'yearly' ? 'font-semibold text-white' : 'text-slate-400'}`}>
                  Anual
                </span>
                {billingInterval === 'yearly' && (
                  <Badge className="bg-emerald-500 text-white border-0">-20%</Badge>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Plans Grid - White background */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            {loadingPlans ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className={`grid gap-6 ${
                plans.length === 1 
                  ? 'md:grid-cols-1 max-w-md mx-auto' 
                  : plans.length === 2 
                    ? 'md:grid-cols-2 max-w-2xl mx-auto' 
                    : 'md:grid-cols-3'
              }`}>
                {plans.map((plan, index) => {
                  const PlanIcon = planIcons[plan.plan_key] || Star
                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={plan.popular ? 'md:-mt-8' : ''}
                    >
                      <Card className={`h-full border-0 transition-all shadow-lg ${
                        plan.popular 
                          ? 'ring-2 ring-emerald-500 shadow-xl' 
                          : 'hover:shadow-xl'
                      }`}>
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-slate-900 text-white px-4 py-1">
                              Más Popular
                            </Badge>
                          </div>
                        )}
                        <CardHeader className="text-center pt-10 pb-4">
                          <div className={`h-14 w-14 mx-auto rounded-xl bg-slate-100 flex items-center justify-center mb-4`}>
                            <PlanIcon className={`h-7 w-7 ${plan.popular ? 'text-emerald-600' : 'text-slate-600'}`} />
                          </div>
                          <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                          <CardDescription className="text-slate-500">{plan.description}</CardDescription>
                          <div className="pt-6">
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-5xl font-bold text-slate-900">
                                ${billingInterval === 'monthly' ? plan.price_monthly : plan.price_yearly}
                              </span>
                              <span className="text-slate-400">/mes</span>
                            </div>
                            {billingInterval === 'yearly' && (
                              <p className="text-xs text-emerald-600 font-medium mt-2">
                                Facturado anualmente (${plan.price_yearly * 12})
                              </p>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pb-8">
                          <ul className="space-y-3">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-3 text-sm">
                                <CheckCircle className={`h-5 w-5 shrink-0 ${plan.popular ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span className="text-slate-600">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Button
                            className={`w-full gap-2 h-12 rounded-xl ${
                              plan.popular ? 'bg-slate-900 hover:bg-slate-800' : ''
                            }`}
                            variant={plan.popular ? 'default' : 'outline'}
                            onClick={() => {
                              if (subscription?.plan_type === plan.plan_key) {
                                handleManageSubscription()
                              } else {
                                handleSubscribe(plan.plan_key)
                              }
                            }}
                            disabled={loadingPlan === plan.plan_key}
                          >
                            {loadingPlan === plan.plan_key ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Procesando...
                              </>
                            ) : subscription?.plan_type === plan.plan_key ? (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Plan Actual
                              </>
                            ) : (
                              <>
                                Elegir {plan.name}
                                <ArrowRight className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* FAQ Section - Dark background */}
        <section className="py-16 md:py-20 bg-slate-900 text-white">
          <div className="max-w-2xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
                Preguntas Frecuentes
              </h2>
              <div className="space-y-4">
                {[
                  {
                    q: '¿Puedo cambiar de plan en cualquier momento?',
                    a: 'Sí, puedes actualizar o cambiar tu plan cuando quieras. Los cambios se reflejan en tu siguiente factura.',
                  },
                  {
                    q: '¿Hay garantía de satisfacción?',
                    a: 'Ofrecemos 30 días de garantía. Si no estás satisfecho, te reembolsamos el 100% sin preguntas.',
                  },
                  {
                    q: '¿Puedo cancelar en cualquier momento?',
                    a: 'Sí, puedes cancelar cuando quieras desde tu cuenta. No hay contratos ni compromisos.',
                  },
                  {
                    q: '¿Qué métodos de pago aceptan?',
                    a: 'Aceptamos todas las tarjetas de crédito y débito principales a través de Stripe.',
                  },
                ].map((faq, idx) => (
                  <Card key={idx} className="border-0 bg-slate-800/50 backdrop-blur">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                      <p className="text-sm text-slate-400">{faq.a}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section - White */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                ¿Listo para encontrar tu lugar?
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Comienza tu búsqueda hoy. Sin riesgos, con garantía de 30 días.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/buscar">
                  <Button size="lg" className="bg-slate-900 hover:bg-slate-800 rounded-full px-8 h-14">
                    Comenzar ahora
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-slate-400 pt-4">
                ¿Tienes preguntas? Escríbenos a{' '}
                <a href="mailto:soporte@smarlin.com" className="text-emerald-600 hover:underline">
                  soporte@smarlin.com
                </a>
              </p>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
    </PageGuard>
  )
}

