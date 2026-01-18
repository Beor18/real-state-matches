'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Home, ArrowRight, Sparkles } from 'lucide-react'

export default function SubscriptionSuccessPage() {
  useEffect(() => {
    // Confetti or celebration effect could go here
  }, [])

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
          <Card className="border-2 border-emerald-200">
            <CardContent className="pt-12 pb-10 text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="h-24 w-24 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"
              >
                <CheckCircle className="h-12 w-12 text-white" />
              </motion.div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900">
                  ¡Bienvenido! 🎉
                </h1>
                <p className="text-slate-600">
                  Tu suscripción ha sido activada exitosamente
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl">
                <div className="flex items-center justify-center gap-2 text-emerald-700">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-medium">Ya puedes disfrutar de todas las funciones</span>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Link href="/buscar" className="block">
                  <Button size="lg" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                    Comenzar a Buscar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard" className="block">
                  <Button variant="outline" size="lg" className="w-full">
                    Ir a Mi Cuenta
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
