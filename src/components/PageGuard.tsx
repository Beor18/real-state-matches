'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { usePageEnabled } from '@/hooks/usePageConfig'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Lock, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PageGuardProps {
  children: ReactNode
  pageKey: string
  /** If true, show a loading state while checking. Default: true */
  showLoading?: boolean
  /** If true, redirect to home instead of showing message. Default: false */
  redirectOnDisabled?: boolean
  /** Custom message to show when page is disabled */
  disabledMessage?: string
  /** Custom title to show when page is disabled */
  disabledTitle?: string
}

export function PageGuard({
  children,
  pageKey,
  showLoading = true,
  redirectOnDisabled = false,
  disabledMessage = 'Esta página no está disponible en este momento.',
  disabledTitle = 'Página no disponible',
}: PageGuardProps) {
  const router = useRouter()
  const { enabled, isLoading } = usePageEnabled(pageKey)
  const { dbUser } = useAuth()

  // Admins can always see disabled pages
  const isAdmin = dbUser?.role === 'admin'

  useEffect(() => {
    if (!isLoading && !enabled && !isAdmin && redirectOnDisabled) {
      router.replace('/')
    }
  }, [isLoading, enabled, isAdmin, redirectOnDisabled, router])

  // Show loading state
  if (isLoading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-slate-500">Cargando...</p>
        </motion.div>
      </div>
    )
  }

  // If disabled and not admin, show message or redirect
  if (!enabled && !isAdmin) {
    if (redirectOnDisabled) {
      return null // Will redirect via useEffect
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="border-2 border-slate-200">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                <Lock className="h-8 w-8 text-slate-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {disabledTitle}
              </h1>
              <p className="text-slate-500 mb-6">
                {disabledMessage}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
                <Link href="/">
                  <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Home className="h-4 w-4" />
                    Ir al inicio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // If admin viewing disabled page, show warning banner
  if (!enabled && isAdmin) {
    return (
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500 text-white py-2 px-4 text-center text-sm font-medium sticky top-0 z-50"
        >
          <Lock className="h-4 w-4 inline-block mr-2" />
          Esta página está deshabilitada para los usuarios. Solo visible para administradores.
        </motion.div>
        {children}
      </div>
    )
  }

  // Page is enabled, render children normally
  return <>{children}</>
}

export default PageGuard

