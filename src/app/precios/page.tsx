'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  CheckCircle,
  Star,
  Crown,
  ArrowRight,
  Loader2,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  yearlyPrice: number
  features: string[]
  popular: boolean
  icon: typeof Star
  color: string
}

export default function PreciosPage() {
  const { user, subscription, signOut, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Para comenzar tu búsqueda',
      price: 29,
      yearlyPrice: 24,
      features: [
        '5 búsquedas de propiedades/mes',
        'Matching básico por estilo de vida',
        'Alertas de nuevas propiedades',
        'Soporte por email',
      ],
      popular: false,
      icon: Sparkles,
      color: 'from-slate-500 to-slate-600',
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Para búsquedas serias',
      price: 49,
      yearlyPrice: 39,
      features: [
        'Búsquedas ilimitadas',
        'Matching avanzado con IA',
        'Alertas en tiempo real',
        'Análisis de mercado por zona',
        'Proyecciones de plusvalía',
        'Reportes PDF detallados',
        'Soporte prioritario',
      ],
      popular: true,
      icon: Star,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'vip',
      name: 'VIP',
      description: 'Para inversionistas',
      price: 99,
      yearlyPrice: 79,
      features: [
        'Todo lo del plan Pro',
        'Acceso anticipado a propiedades',
        'Consultoría mensual 1:1 (30 min)',
        'Análisis de portafolio completo',
        'Acceso a comunidad exclusiva',
        'Soporte dedicado 24/7',
      ],
      popular: false,
      icon: Crown,
      color: 'from-amber-500 to-orange-600',
    },
  ]

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
              <Link href="/precios" className="text-sm font-medium text-emerald-600">
                Precios
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              {!authLoading && (
                <>
                  {user ? (
                    <div className="flex items-center gap-2">
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
                    <Link href="/auth/login">
                      <Button size="sm" variant="outline">
                        Iniciar Sesión
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            Planes que se adaptan a ti
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            Elige el plan perfecto para tu búsqueda de hogar. Cancela cuando quieras.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <span className={`text-sm ${billingInterval === 'monthly' ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
              Mensual
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingInterval === 'yearly' ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <motion.div
                className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                animate={{ left: billingInterval === 'yearly' ? '32px' : '4px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm ${billingInterval === 'yearly' ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
              Anual
            </span>
            {billingInterval === 'yearly' && (
              <Badge className="bg-emerald-600">Ahorra 20%</Badge>
            )}
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={plan.popular ? 'md:-mt-4' : ''}
            >
              <Card className={`h-full border-2 transition-all ${
                plan.popular 
                  ? 'border-emerald-500 shadow-xl shadow-emerald-100' 
                  : 'hover:border-slate-300'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white px-4">
                      Más Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-8 pb-4">
                  <div className={`h-14 w-14 mx-auto rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                    <plan.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-slate-900">
                        ${billingInterval === 'monthly' ? plan.price : plan.yearlyPrice}
                      </span>
                      <span className="text-slate-500">/mes</span>
                    </div>
                    {billingInterval === 'yearly' && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">
                        Facturado anualmente (${plan.yearlyPrice * 12})
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className={`h-5 w-5 shrink-0 ${plan.popular ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full gap-2 ${
                      plan.popular ? 'bg-emerald-600 hover:bg-emerald-700' : ''
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
                        {user ? 'Elegir' : 'Comenzar con'} {plan.name}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto mt-16"
        >
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
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
              <Card key={idx} className="border">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                  <p className="text-sm text-slate-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-slate-600 mb-4">
            ¿Tienes preguntas? Escríbenos a{' '}
            <a href="mailto:soporte@hogarai.com" className="text-emerald-600 hover:underline">
              soporte@hogarai.com
            </a>
          </p>
        </motion.div>
      </main>
    </div>
  )
}

