'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Crown,
  Shield,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  AlertCircle,
  CreditCard,
  Activity,
  RefreshCw,
  MoreVertical,
  Star,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'

interface UserWithSubscription {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  phone: string | null
  role: 'user' | 'admin' | 'agent'
  is_vip: boolean
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
  subscription: {
    id: string
    plan_type: string
    plan_name: string
    status: string
    current_period_end: string
  } | null
}

interface UserDetail extends UserWithSubscription {
  subscriptionHistory: any[]
  lifestyleProfile: any | null
  activity: {
    recentMatches: any[]
    totalAlerts: number
  }
}

interface Stats {
  totalUsers: number
  activeSubscriptions: number
  vipUsers: number
  adminUsers: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithSubscription[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all')
  const [vipFilter, setVipFilter] = useState<string>('all')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const limit = 10

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Delete confirmation
  const [userToDelete, setUserToDelete] = useState<UserWithSubscription | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    role: '',
    is_vip: false,
  })

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
      })

      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (subscriptionFilter === 'active') params.set('hasSubscription', 'true')
      if (subscriptionFilter === 'none') params.set('hasSubscription', 'false')
      if (vipFilter === 'vip') params.set('isVip', 'true')
      if (vipFilter === 'regular') params.set('isVip', 'false')

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error fetching users')
      }

      setUsers(data.users)
      setTotalPages(data.pagination.totalPages)
      setTotalUsers(data.pagination.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading users')
    } finally {
      setIsLoading(false)
    }
  }, [page, search, roleFilter, subscriptionFilter, vipFilter])

  // Fetch stats
  const fetchStats = async () => {
    try {
      const supabase = createClient()
      
      const [totalUsersRes, activeSubsRes, vipRes, adminsRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_vip', true),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
      ])

      setStats({
        totalUsers: totalUsersRes.count || 0,
        activeSubscriptions: activeSubsRes.count || 0,
        vipUsers: vipRes.count || 0,
        adminUsers: adminsRes.count || 0,
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  // Fetch user details
  const fetchUserDetail = async (userId: string) => {
    setIsLoadingDetail(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error fetching user details')
      }

      setSelectedUser(data.user)
      setEditForm({
        name: data.user.name || '',
        phone: data.user.phone || '',
        role: data.user.role,
        is_vip: data.user.is_vip,
      })
    } catch (err) {
      console.error('Error fetching user detail:', err)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  // Update user
  const updateUser = async () => {
    if (!selectedUser) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error updating user')
      }

      // Update local state
      setSelectedUser({ ...selectedUser, ...data.user })
      setIsEditMode(false)
      fetchUsers() // Refresh list
      fetchStats() // Refresh stats
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error updating user')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete user
  const deleteUser = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error deleting user')
      }

      setUserToDelete(null)
      fetchUsers()
      fetchStats()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error deleting user')
    } finally {
      setIsDeleting(false)
    }
  }

  // Quick toggle VIP
  const toggleVip = async (user: UserWithSubscription) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_vip: !user.is_vip }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error updating VIP status')
      }

      fetchUsers()
      fetchStats()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error updating VIP status')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    fetchStats()
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"><Shield className="h-3 w-3 mr-1" />Admin</Badge>
      case 'agent':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><UserIcon className="h-3 w-3 mr-1" />Agente</Badge>
      default:
        return <Badge variant="secondary"><UserIcon className="h-3 w-3 mr-1" />Usuario</Badge>
    }
  }

  const getPlanBadge = (subscription: UserWithSubscription['subscription']) => {
    if (!subscription) {
      return <Badge variant="outline" className="text-slate-400">Sin plan</Badge>
    }

    const colors: Record<string, string> = {
      starter: 'bg-slate-100 text-slate-700',
      pro: 'bg-emerald-100 text-emerald-700',
      vip: 'bg-amber-100 text-amber-700',
    }

    const icons: Record<string, any> = {
      starter: Sparkles,
      pro: Star,
      vip: Crown,
    }

    const Icon = icons[subscription.plan_type] || Sparkles

    return (
      <Badge className={colors[subscription.plan_type] || 'bg-slate-100 text-slate-700'}>
        <Icon className="h-3 w-3 mr-1" />
        {subscription.plan_type.charAt(0).toUpperCase() + subscription.plan_type.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gestión de Usuarios
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Administra todos los usuarios de la plataforma
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Usuarios', value: stats?.totalUsers || 0, icon: Users, color: 'blue' },
          { label: 'Con Suscripción', value: stats?.activeSubscriptions || 0, icon: CreditCard, color: 'emerald' },
          { label: 'Usuarios VIP', value: stats?.vipUsers || 0, icon: Crown, color: 'amber' },
          { label: 'Administradores', value: stats?.adminUsers || 0, icon: Shield, color: 'purple' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30 flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por email o nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setPage(1) }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={subscriptionFilter} onValueChange={(value) => { setSubscriptionFilter(value); setPage(1) }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Suscripción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Con plan activo</SelectItem>
                  <SelectItem value="none">Sin plan</SelectItem>
                </SelectContent>
              </Select>

              <Select value={vipFilter} onValueChange={(value) => { setVipFilter(value); setPage(1) }}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="VIP" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="vip">Solo VIP</SelectItem>
                  <SelectItem value="regular">No VIP</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={() => { fetchUsers(); fetchStats() }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error al cargar usuarios</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={fetchUsers}>Reintentar</Button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No se encontraron usuarios</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {search ? 'Intenta con otra búsqueda' : 'No hay usuarios registrados'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rol</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
                    <th className="text-center px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">VIP</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Registro</th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.name || 'Sin nombre'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4">{getPlanBadge(user.subscription)}</td>
                      <td className="px-6 py-4 text-center">
                        <Switch
                          checked={user.is_vip}
                          onCheckedChange={() => toggleVip(user)}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              fetchUserDetail(user.id)
                              setIsDetailModalOpen(true)
                              setIsEditMode(false)
                            }}>
                              <UserIcon className="h-4 w-4 mr-2" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              fetchUserDetail(user.id)
                              setIsDetailModalOpen(true)
                              setIsEditMode(true)
                            }}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => setUserToDelete(user)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && users.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, totalUsers)} de {totalUsers} usuarios
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1
                    if (totalPages > 5) {
                      if (page > 3) pageNum = page - 2 + i
                      if (page > totalPages - 2) pageNum = totalPages - 4 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-8"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail/Edit Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={(open) => {
        setIsDetailModalOpen(open)
        if (!open) {
          setSelectedUser(null)
          setIsEditMode(false)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedUser && (
                <>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      selectedUser.name?.charAt(0).toUpperCase() || selectedUser.email.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p>{selectedUser.name || 'Sin nombre'}</p>
                    <p className="text-sm font-normal text-gray-500">{selectedUser.email}</p>
                  </div>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Edita la información del usuario' : 'Información detallada del usuario'}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : selectedUser && (
            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="subscription">Suscripciones</TabsTrigger>
                <TabsTrigger value="activity">Actividad</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                {isEditMode ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuario</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="agent">Agente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Estado VIP</Label>
                        <div className="flex items-center gap-2 h-10">
                          <Switch
                            checked={editForm.is_vip}
                            onCheckedChange={(checked) => setEditForm({ ...editForm, is_vip: checked })}
                          />
                          <span className="text-sm text-gray-500">
                            {editForm.is_vip ? 'Usuario VIP' : 'Usuario regular'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {selectedUser.email}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Teléfono</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {selectedUser.phone || 'No especificado'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rol</p>
                        <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Estado VIP</p>
                        <div className="mt-1">
                          {selectedUser.is_vip ? (
                            <Badge className="bg-amber-100 text-amber-700"><Crown className="h-3 w-3 mr-1" />VIP</Badge>
                          ) : (
                            <Badge variant="secondary">Regular</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fecha de registro</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(selectedUser.created_at)}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ID de usuario</p>
                        <p className="font-mono text-xs text-gray-600 dark:text-gray-300 truncate">
                          {selectedUser.id}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="subscription" className="mt-4">
                {selectedUser.subscription ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-emerald-900 dark:text-emerald-100">Plan Activo</p>
                        {getPlanBadge(selectedUser.subscription)}
                      </div>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        Válido hasta: {formatDate(selectedUser.subscription.current_period_end)}
                      </p>
                    </div>

                    {selectedUser.subscriptionHistory.length > 1 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Historial</h4>
                        <div className="space-y-2">
                          {selectedUser.subscriptionHistory.slice(1).map((sub: any) => (
                            <div key={sub.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{sub.plan_name}</p>
                                <p className="text-xs text-gray-500">{formatDate(sub.created_at)}</p>
                              </div>
                              <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                                {sub.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Este usuario no tiene suscripción activa</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <div className="space-y-4">
                  {selectedUser.lifestyleProfile && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Perfil de Lifestyle</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                        {selectedUser.lifestyleProfile.ideal_life_description}
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-white">Alertas</h4>
                      <Badge variant="secondary">{selectedUser.activity.totalAlerts} total</Badge>
                    </div>
                  </div>

                  {selectedUser.activity.recentMatches.length > 0 ? (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Matches recientes</h4>
                      <div className="space-y-2">
                        {selectedUser.activity.recentMatches.map((match: any) => (
                          <div key={match.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                Match {match.match_score}% - {match.lifestyle_fit}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{formatDate(match.created_at)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Sin actividad de matches reciente</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-6">
            {isEditMode ? (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button onClick={updateUser} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Guardar cambios
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => setIsEditMode(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al usuario <strong>{userToDelete?.email}</strong> y todos sus datos asociados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

