'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, 
  Puzzle, 
  Users, 
  Settings, 
  ChevronLeft,
  LogOut,
  Home,
  Brain,
  Database
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface AdminLayoutProps {
  children: ReactNode
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/modules', label: 'Módulos', icon: Puzzle },
  { href: '/admin/ai', label: 'Configuración IA', icon: Brain },
  { href: '/admin/property-providers', label: 'Proveedores de Datos', icon: Database },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/settings', label: 'Configuración', icon: Settings },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsAdmin(false)
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role, name, email')
        .eq('id', user.id)
        .single()
      
      setIsAdmin(userData?.role === 'admin')
      setUserName(userData?.name || userData?.email || 'Admin')
    }

    checkAdmin()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Loading state
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex">
        <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  // Not admin - show error
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChevronLeft className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acceso Denegado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No tienes permisos de administrador para acceder a esta sección.
          </p>
          <Link href="/dashboard">
            <Button>Volver al Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">HA</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white">HogarAI</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 block">Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span className="font-medium">Ver Sitio</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
            {userName}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}


