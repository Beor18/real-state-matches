'use client'

import { Suspense } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import LoginForm from '@/components/auth/LoginForm'
import { Home, Search, Heart, Sparkles } from 'lucide-react'

function LoginContent() {
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
        <div className="w-full max-w-md space-y-8">
          {/* Background decoration */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl" />
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <FeatureCard
              icon={Search}
              title="Búsqueda IA"
              description="Encuentra fácil"
            />
            <FeatureCard
              icon={Heart}
              title="Matching"
              description="Tu estilo de vida"
            />
            <FeatureCard
              icon={Sparkles}
              title="Gratis"
              description="Sin compromiso"
            />
          </div>
        </div>
      </main>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="p-4 rounded-xl bg-white border shadow-sm space-y-2">
      <Icon className="h-5 w-5 mx-auto text-emerald-600" />
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
