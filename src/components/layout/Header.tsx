'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  User,
  LogOut,
  Menu,
  X,
  ArrowRight,
  Crown,
  Bell,
  Settings,
  Shield,
} from 'lucide-react'

interface HeaderProps {
  variant?: 'default' | 'minimal' | 'dashboard'
  showCTA?: boolean
  transparent?: boolean
  activeItem?: string
}

const navItems = [
  { href: '/', label: 'Inicio' },
  { href: '/buscar', label: 'Buscar Casa' },
  { href: '/precios', label: 'Precios' },
]

export default function Header({ 
  variant = 'default', 
  showCTA = false,
  transparent = false,
  activeItem,
}: HeaderProps) {
  const { user, dbUser, subscription, signOut, isLoading: authLoading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isAdmin = dbUser?.role === 'admin'
  const hasSubscription = subscription?.status === 'active'

  // Determine active nav item
  const getActiveItem = () => {
    if (activeItem) return activeItem
    if (pathname === '/') return '/'
    if (pathname.startsWith('/buscar')) return '/buscar'
    if (pathname.startsWith('/precios')) return '/precios'
    if (pathname.startsWith('/dashboard')) return '/dashboard'
    return pathname
  }

  const currentActiveItem = getActiveItem()

  // Header positioning and styling based on variant
  const getHeaderClasses = () => {
    const base = 'w-full z-50 border-b transition-all'
    
    if (variant === 'minimal') {
      return `${base} bg-white/90 backdrop-blur-md border-slate-100`
    }
    
    if (variant === 'dashboard') {
      return `${base} sticky top-0 bg-white/90 backdrop-blur-md border-slate-100`
    }
    
    // Default variant
    return `${base} fixed top-0 left-0 right-0 ${
      transparent 
        ? 'bg-transparent border-transparent' 
        : 'bg-white/80 backdrop-blur-xl border-slate-100'
    }`
  }

  const handleSignOut = async () => {
    await signOut()
    setMobileMenuOpen(false)
  }

  // Minimal variant - just logo
  if (variant === 'minimal') {
    return (
      <header className={getHeaderClasses()}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              Hogar<span className="text-emerald-600">AI</span>
            </span>
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header className={getHeaderClasses()}>
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              Hogar<span className="text-emerald-600">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  currentActiveItem === item.href
                    ? 'text-emerald-600 font-medium'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {!authLoading && (
              <>
                {user ? (
                  <>
                    {/* Desktop auth buttons */}
                    <div className="hidden md:flex items-center gap-2">
                      {/* Subscription badge */}
                      {hasSubscription && subscription && (
                        <Badge className="gap-1 bg-emerald-600 text-white">
                          <Crown className="h-3 w-3" />
                          {subscription.plan_name}
                        </Badge>
                      )}

                      {/* Admin link */}
                      {isAdmin && (
                        <Link href="/admin">
                          <Button variant="ghost" size="sm" className="text-slate-600">
                            <Shield className="h-4 w-4 mr-2" />
                            Admin
                          </Button>
                        </Link>
                      )}

                      {/* Dashboard icons for dashboard variant */}
                      {variant === 'dashboard' && (
                        <>
                          <Button variant="ghost" size="icon">
                            <Bell className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Settings className="h-5 w-5" />
                          </Button>
                        </>
                      )}

                      {/* Account link */}
                      <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="text-slate-600">
                          <User className="h-4 w-4 mr-2" />
                          {variant === 'dashboard' ? '' : 'Mi Cuenta'}
                        </Button>
                      </Link>

                      {/* Logout */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleSignOut} 
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <Link href="/auth/login" className="hidden md:block">
                    <Button variant="ghost" size="sm" className="text-slate-600">
                      Iniciar Sesión
                    </Button>
                  </Link>
                )}
              </>
            )}

            {/* CTA Button (optional, for landing page) */}
            {showCTA && (
              <Link href="/buscar" className="hidden md:block">
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-5">
                  Comenzar
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
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
              className="md:hidden pt-4 pb-2 border-t mt-4"
            >
              <div className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 text-sm rounded-lg transition-colors ${
                      currentActiveItem === item.href
                        ? 'bg-emerald-50 text-emerald-600 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* Admin link in mobile */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Panel Admin
                  </Link>
                )}

                <div className="border-t pt-3 mt-2 space-y-2">
                  {user ? (
                    <>
                      {/* Subscription badge mobile */}
                      {hasSubscription && subscription && (
                        <div className="px-3 py-2">
                          <Badge className="gap-1 bg-emerald-600 text-white">
                            <Crown className="h-3 w-3" />
                            {subscription.plan_name}
                          </Badge>
                        </div>
                      )}

                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <User className="h-4 w-4 mr-2" />
                          Mi Cuenta
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-red-600"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
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

                  {/* CTA in mobile menu */}
                  {showCTA && (
                    <Link href="/buscar" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" className="w-full bg-slate-900 hover:bg-slate-800">
                        Comenzar Búsqueda
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
  )
}


