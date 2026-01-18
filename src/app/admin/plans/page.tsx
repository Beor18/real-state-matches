'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  AlertCircle,
  Check,
  DollarSign,
  RefreshCw,
  Eye,
  EyeOff,
  GripVertical
} from 'lucide-react'

interface Plan {
  id: string
  plan_key: string
  name: string
  description: string | null
  price_monthly: number
  price_yearly: number
  stripe_price_monthly: string | null
  stripe_price_yearly: string | null
  features: string[]
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface EditingPlan extends Partial<Plan> {
  isNew?: boolean
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Editing state
  const [editingPlan, setEditingPlan] = useState<EditingPlan | null>(null)
  const [saving, setSaving] = useState(false)
  
  // New feature input
  const [newFeature, setNewFeature] = useState('')

  const fetchPlans = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/admin/plans?includeInactive=true')
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setPlans(data.plans)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const startEditing = (plan: Plan) => {
    setEditingPlan({ ...plan })
    setNewFeature('')
  }

  const startNewPlan = () => {
    setEditingPlan({
      isNew: true,
      plan_key: '',
      name: '',
      description: '',
      price_monthly: 0,
      price_yearly: 0,
      stripe_price_monthly: '',
      stripe_price_yearly: '',
      features: [],
      is_active: true,
      sort_order: plans.length + 1,
    })
    setNewFeature('')
  }

  const cancelEditing = () => {
    setEditingPlan(null)
    setNewFeature('')
  }

  const updateEditingPlan = (updates: Partial<EditingPlan>) => {
    setEditingPlan(prev => prev ? { ...prev, ...updates } : null)
  }

  const addFeature = () => {
    if (newFeature.trim() && editingPlan) {
      updateEditingPlan({
        features: [...(editingPlan.features || []), newFeature.trim()]
      })
      setNewFeature('')
    }
  }

  const removeFeature = (index: number) => {
    if (editingPlan) {
      updateEditingPlan({
        features: (editingPlan.features || []).filter((_, i) => i !== index)
      })
    }
  }

  const savePlan = async () => {
    if (!editingPlan) return
    
    setSaving(true)
    setError(null)
    
    try {
      const method = editingPlan.isNew ? 'POST' : 'PUT'
      const res = await fetch('/api/admin/plans', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPlan),
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setSuccess(editingPlan.isNew ? 'Plan creado exitosamente' : 'Plan actualizado exitosamente')
      setTimeout(() => setSuccess(null), 3000)
      
      cancelEditing()
      fetchPlans()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const togglePlanActive = async (plan: Plan) => {
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: plan.id,
          is_active: !plan.is_active,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      fetchPlans()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deletePlan = async (planId: string) => {
    if (!confirm('¿Estás seguro de desactivar este plan?')) return
    
    try {
      const res = await fetch(`/api/admin/plans?id=${planId}`, {
        method: 'DELETE',
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setSuccess('Plan desactivado exitosamente')
      setTimeout(() => setSuccess(null), 3000)
      fetchPlans()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planes de Suscripción</h1>
          <p className="text-gray-600 mt-1">Configura precios, features y Stripe IDs</p>
        </div>
        <button
          onClick={startNewPlan}
          disabled={!!editingPlan}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          Nuevo Plan
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-5 h-5 text-red-600" />
          </button>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3"
        >
          <Check className="w-5 h-5 text-emerald-600" />
          <p className="text-emerald-700">{success}</p>
        </motion.div>
      )}

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Editing/New Plan Card */}
          <AnimatePresence>
            {editingPlan && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-2xl shadow-lg border-2 border-indigo-500 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">
                      {editingPlan.isNew ? 'Nuevo Plan' : `Editando: ${editingPlan.name}`}
                    </h3>
                    <button
                      onClick={cancelEditing}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column - Basic Info */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Clave del Plan (única)
                        </label>
                        <input
                          type="text"
                          value={editingPlan.plan_key || ''}
                          onChange={(e) => updateEditingPlan({ plan_key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                          disabled={!editingPlan.isNew}
                          placeholder="ej: starter, pro, enterprise"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={editingPlan.name || ''}
                          onChange={(e) => updateEditingPlan({ name: e.target.value })}
                          placeholder="Nombre del plan"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción
                        </label>
                        <input
                          type="text"
                          value={editingPlan.description || ''}
                          onChange={(e) => updateEditingPlan({ description: e.target.value })}
                          placeholder="Breve descripción"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio Mensual
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              value={editingPlan.price_monthly || 0}
                              onChange={(e) => updateEditingPlan({ price_monthly: parseFloat(e.target.value) })}
                              min="0"
                              step="0.01"
                              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio Anual
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              value={editingPlan.price_yearly || 0}
                              onChange={(e) => updateEditingPlan({ price_yearly: parseFloat(e.target.value) })}
                              min="0"
                              step="0.01"
                              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stripe Price ID (Mensual)
                        </label>
                        <input
                          type="text"
                          value={editingPlan.stripe_price_monthly || ''}
                          onChange={(e) => updateEditingPlan({ stripe_price_monthly: e.target.value })}
                          placeholder="price_..."
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stripe Price ID (Anual)
                        </label>
                        <input
                          type="text"
                          value={editingPlan.stripe_price_yearly || ''}
                          onChange={(e) => updateEditingPlan({ stripe_price_yearly: e.target.value })}
                          placeholder="price_..."
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                        />
                      </div>
                    </div>

                    {/* Right Column - Features */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Características
                      </label>
                      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                        {(editingPlan.features || []).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <span className="flex-1 text-sm">{feature}</span>
                            <button
                              onClick={() => removeFeature(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {(editingPlan.features || []).length === 0 && (
                          <p className="text-gray-500 text-sm italic">Sin características</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addFeature()}
                          placeholder="Nueva característica..."
                          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={addFeature}
                          disabled={!newFeature.trim()}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mt-6 pt-6 border-t">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingPlan.is_active}
                            onChange={(e) => updateEditingPlan({ is_active: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-medium">Plan activo</span>
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                          Los planes inactivos no se muestran a los usuarios
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                    <button
                      onClick={cancelEditing}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={savePlan}
                      disabled={saving || !editingPlan.plan_key || !editingPlan.name}
                      className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Guardar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Existing Plans */}
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              layout
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                !plan.is_active ? 'opacity-60 border-gray-200' : 'border-gray-100'
              } ${editingPlan?.id === plan.id ? 'hidden' : ''}`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      plan.plan_key === 'vip' 
                        ? 'bg-amber-100' 
                        : plan.plan_key === 'pro' 
                          ? 'bg-indigo-100' 
                          : 'bg-gray-100'
                    }`}>
                      <Package className={`w-6 h-6 ${
                        plan.plan_key === 'vip' 
                          ? 'text-amber-600' 
                          : plan.plan_key === 'pro' 
                            ? 'text-indigo-600' 
                            : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                        <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                          {plan.plan_key}
                        </span>
                        {!plan.is_active && (
                          <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{plan.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePlanActive(plan)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                      title={plan.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {plan.is_active ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => startEditing(plan)}
                      disabled={!!editingPlan}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 disabled:opacity-50"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      disabled={!!editingPlan}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mt-6">
                  {/* Pricing */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Precios</h4>
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-gray-900">
                        ${plan.price_monthly}<span className="text-sm font-normal text-gray-500">/mes</span>
                      </p>
                      <p className="text-gray-600">
                        ${plan.price_yearly}<span className="text-sm text-gray-500">/año</span>
                      </p>
                    </div>
                  </div>

                  {/* Stripe IDs */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Stripe</h4>
                    {plan.stripe_price_monthly || plan.stripe_price_yearly ? (
                      <div className="space-y-1 text-xs font-mono">
                        {plan.stripe_price_monthly && (
                          <p className="text-gray-600 truncate" title={plan.stripe_price_monthly}>
                            M: {plan.stripe_price_monthly}
                          </p>
                        )}
                        {plan.stripe_price_yearly && (
                          <p className="text-gray-600 truncate" title={plan.stripe_price_yearly}>
                            A: {plan.stripe_price_yearly}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-amber-600 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        No configurado
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      Características ({plan.features.length})
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600 max-h-32 overflow-y-auto">
                      {plan.features.slice(0, 4).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 4 && (
                        <li className="text-gray-500 text-xs">
                          +{plan.features.length - 4} más...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {plans.length === 0 && !loading && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No hay planes configurados</h3>
              <p className="text-gray-600 mt-1">Crea tu primer plan de suscripción</p>
              <button
                onClick={startNewPlan}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Crear Plan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

