'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Gift,
  AlertCircle,
  Check,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  RefreshCw
} from 'lucide-react'

interface Subscription {
  id: string
  user_id: string
  plan_type: string
  plan_name: string
  price: number
  interval: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  is_manual: boolean
  stripe_subscription_id: string | null
  notes: string | null
  created_at: string
  users?: {
    id: string
    email: string
    name: string
  }
}

interface Plan {
  id: string
  plan_key: string
  name: string
  price_monthly: number
  price_yearly: number
}

interface User {
  id: string
  email: string
  name: string | null
}

interface Stats {
  totalActive: number
  mrrEstimate: number
  byPlan: Record<string, number>
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  canceled: 'bg-red-100 text-red-800',
  past_due: 'bg-amber-100 text-amber-800',
  trialing: 'bg-blue-100 text-blue-800',
  incomplete: 'bg-gray-100 text-gray-800',
}

const planColors: Record<string, string> = {
  starter: 'bg-slate-100 text-slate-800',
  pro: 'bg-indigo-100 text-indigo-800',
  vip: 'bg-amber-100 text-amber-800',
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<Stats>({ totalActive: 0, mrrEstimate: 0, byPlan: {} })
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Grant modal
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [grantLoading, setGrantLoading] = useState(false)
  const [grantError, setGrantError] = useState<string | null>(null)
  const [grantSuccess, setGrantSuccess] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [duration, setDuration] = useState('30')
  const [customDuration, setCustomDuration] = useState('')
  const [grantNotes, setGrantNotes] = useState('')
  
  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelSubscription, setCancelSubscription] = useState<Subscription | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (planFilter !== 'all') params.set('plan', planFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/admin/subscriptions?${params}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setSubscriptions(data.subscriptions)
      setStats(data.stats)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, planFilter, typeFilter, search])

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans')
      const data = await res.json()
      if (data.success) {
        setPlans(data.plans)
      }
    } catch (err) {
      console.error('Error fetching plans:', err)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
    fetchPlans()
  }, [fetchSubscriptions])

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=10`)
      const data = await res.json()
      if (data.success) {
        setSearchResults(data.users)
      }
    } catch (err) {
      console.error('Error searching users:', err)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearch) searchUsers(userSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [userSearch])

  const handleGrant = async () => {
    if (!selectedUser || !selectedPlan) return
    
    setGrantLoading(true)
    setGrantError(null)
    
    const durationDays = duration === 'custom' ? parseInt(customDuration) : parseInt(duration)
    
    if (!durationDays || durationDays < 1) {
      setGrantError('Invalid duration')
      setGrantLoading(false)
      return
    }
    
    try {
      const res = await fetch('/api/admin/subscriptions/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          plan_key: selectedPlan,
          duration_days: durationDays,
          notes: grantNotes,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setGrantSuccess(true)
      setTimeout(() => {
        setShowGrantModal(false)
        setGrantSuccess(false)
        resetGrantForm()
        fetchSubscriptions()
      }, 2000)
    } catch (err: any) {
      setGrantError(err.message)
    } finally {
      setGrantLoading(false)
    }
  }

  const resetGrantForm = () => {
    setSelectedUser(null)
    setSelectedPlan('')
    setDuration('30')
    setCustomDuration('')
    setGrantNotes('')
    setUserSearch('')
    setSearchResults([])
    setGrantError(null)
  }

  const handleCancel = async (immediately: boolean) => {
    if (!cancelSubscription) return
    
    setCancelLoading(true)
    
    try {
      const res = await fetch(`/api/admin/subscriptions?id=${cancelSubscription.id}&immediately=${immediately}`, {
        method: 'DELETE',
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setShowCancelModal(false)
      setCancelSubscription(null)
      fetchSubscriptions()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCancelLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suscripciones</h1>
          <p className="text-gray-600 mt-1">Gestiona las suscripciones activas y otorga planes</p>
        </div>
        <button
          onClick={() => setShowGrantModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Gift className="w-5 h-5" />
          Otorgar Plan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Activas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalActive}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">MRR Estimado</p>
              <p className="text-2xl font-bold text-gray-900">${stats.mrrEstimate.toLocaleString('en-US')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">VIP</p>
              <p className="text-2xl font-bold text-gray-900">{stats.byPlan.vip || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pro</p>
              <p className="text-2xl font-bold text-gray-900">{stats.byPlan.pro || 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por email o nombre..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="canceled">Canceladas</option>
            <option value="past_due">Pago pendiente</option>
            <option value="trialing">En prueba</option>
          </select>
          
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los planes</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="vip">VIP</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="stripe">Stripe</option>
            <option value="manual">Manual</option>
          </select>
          
          <button
            onClick={() => fetchSubscriptions()}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <CreditCard className="w-12 h-12 mb-3 text-gray-300" />
            <p>No se encontraron suscripciones</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{sub.users?.name || 'Sin nombre'}</p>
                        <p className="text-sm text-gray-500">{sub.users?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${planColors[sub.plan_type] || 'bg-gray-100 text-gray-800'}`}>
                        {sub.plan_name}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">{sub.interval}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[sub.status]}`}>
                        {sub.status}
                      </span>
                      {sub.cancel_at_period_end && (
                        <span className="text-xs text-amber-600 ml-2">Cancelará al final</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${sub.is_manual ? 'text-purple-600' : 'text-gray-600'}`}>
                        {sub.is_manual ? 'Manual' : 'Stripe'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">${sub.price}</span>
                      <span className="text-gray-500 text-sm">/{sub.interval === 'yearly' ? 'año' : 'mes'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {new Date(sub.current_period_end).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {sub.status === 'active' && !sub.cancel_at_period_end && (
                        <button
                          onClick={() => { setCancelSubscription(sub); setShowCancelModal(true) }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Mostrando {subscriptions.length} de {total} suscripciones
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grant Modal */}
      <AnimatePresence>
        {showGrantModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => { setShowGrantModal(false); resetGrantForm() }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Otorgar Plan</h2>
                <button
                  onClick={() => { setShowGrantModal(false); resetGrantForm() }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {grantSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Plan otorgado exitosamente</h3>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* User Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                    {selectedUser ? (
                      <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{selectedUser.name || 'Sin nombre'}</p>
                          <p className="text-sm text-gray-600">{selectedUser.email}</p>
                        </div>
                        <button
                          onClick={() => { setSelectedUser(null); setUserSearch('') }}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Buscar usuario por email..."
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        {searchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                            {searchResults.map((user) => (
                              <button
                                key={user.id}
                                onClick={() => { setSelectedUser(user); setSearchResults([]) }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50"
                              >
                                <p className="font-medium text-gray-900">{user.name || 'Sin nombre'}</p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Plan Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Seleccionar plan...</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.plan_key}>
                          {plan.name} (${plan.price_monthly}/mes)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="30">30 días</option>
                      <option value="90">90 días</option>
                      <option value="365">1 año</option>
                      <option value="custom">Personalizado</option>
                    </select>
                    {duration === 'custom' && (
                      <input
                        type="number"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        placeholder="Días"
                        min="1"
                        className="w-full mt-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                    <textarea
                      value={grantNotes}
                      onChange={(e) => setGrantNotes(e.target.value)}
                      placeholder="Razón del otorgamiento..."
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {grantError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-700">{grantError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleGrant}
                    disabled={!selectedUser || !selectedPlan || grantLoading}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {grantLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Otorgando...
                      </>
                    ) : (
                      <>
                        <Gift className="w-5 h-5" />
                        Otorgar Plan
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && cancelSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => { setShowCancelModal(false); setCancelSubscription(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Cancelar Suscripción</h2>
                <button
                  onClick={() => { setShowCancelModal(false); setCancelSubscription(null) }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  ¿Cómo deseas cancelar la suscripción de{' '}
                  <span className="font-medium">{cancelSubscription.users?.email}</span>?
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">{cancelSubscription.plan_name}</p>
                  <p className="text-sm text-gray-600">
                    Período actual termina: {new Date(cancelSubscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleCancel(false)}
                  disabled={cancelLoading}
                  className="w-full py-3 border-2 border-amber-500 text-amber-600 rounded-lg font-medium hover:bg-amber-50 disabled:opacity-50"
                >
                  Cancelar al final del período
                </button>
                <button
                  onClick={() => handleCancel(true)}
                  disabled={cancelLoading}
                  className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelLoading ? 'Cancelando...' : 'Cancelar inmediatamente'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

