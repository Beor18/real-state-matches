'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { XCircle, Home, ArrowRight, HelpCircle } from 'lucide-react'

export default function SubscriptionCancelPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="w-full border-b bg-white/90 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-3 w-fit">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Hogar<span className="text-emerald-600">AI</span>
              </h1>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-2">
            <CardContent className="pt-12 pb-10 text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="h-24 w-24 mx-auto rounded-full bg-slate-100 flex items-center justify-center"
              >
                <XCircle className="h-12 w-12 text-slate-400" />
              </motion.div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  Pago cancelado
                </h1>
                <p className="text-slate-600">
                  No se realizó ningún cargo a tu tarjeta
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-600">
                  Si tuviste algún problema durante el pago o tienes preguntas, 
                  no dudes en contactarnos.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Link href="/precios" className="block">
                  <Button size="lg" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                    Ver Planes Disponibles
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/buscar" className="block">
                  <Button variant="outline" size="lg" className="w-full">
                    Continuar Gratis
                  </Button>
                </Link>
              </div>

              <div className="pt-4">
                <a 
                  href="mailto:soporte@sreis.com" 
                  className="text-sm text-slate-500 hover:text-emerald-600 flex items-center justify-center gap-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  ¿Necesitas ayuda? Contáctanos
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
