'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth, useHasSubscription } from '@/components/auth/AuthProvider'
import { usePageConfig } from '@/hooks/usePageConfig'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Header from '@/components/layout/Header'
import {
  Search,
  Crown,
  ArrowRight,
  Loader2,
  Heart,
  Sparkles,
  CreditCard,
  MapPin,
  Bed,
  Bath,
  Maximize,
  DollarSign,
  Trash2,
  ExternalLink,
  Info,
} from 'lucide-react'
import { MatchScoreModal } from '@/components/search/MatchScoreModal'

interface SavedProperty {
  id: string
  property_id: string
  source_provider: string
  property_data: {
    id: string
    title: string
    price: number
    address: string
    city?: string
    bedrooms: number
    bathrooms: number
    squareFeet: number
    images?: string[]
    matchScore?: number
    matchReasons?: string[]
  }
  saved_at: string
}

export default function DashboardPage() {
  const { user, dbUser, subscription, isLoading, signOut } = useAuth()
  const hasSubscription = useHasSubscription()
  const { isPageEnabled } = usePageConfig()
  const router = useRouter()
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([])
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [selectedPropertyForScore, setSelectedPropertyForScore] = useState<SavedProperty['property_data'] | null>(null)
  
  // Use ref to track if initial load is done - persists across re-renders without causing them
  const initialLoadDoneRef = useRef(false)

  // Check if pages are enabled
  const isPreciosEnabled = isPageEnabled('page-precios')
  const isBuscarEnabled = isPageEnabled('page-buscar')

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [isLoading, user, router])

  // Fetch saved properties - only on initial mount
  useEffect(() => {
    if (user && !initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true
      fetchSavedProperties()
    }
  }, [user])

  const fetchSavedProperties = async () => {
    try {
      setLoadingSaved(true)
      const response = await fetch('/api/saved-properties')
      const data = await response.json()
      if (data.success) {
        setSavedProperties(data.savedProperties || [])
      }
    } catch (error) {
      console.error('Error fetching saved properties:', error)
    } finally {
      setLoadingSaved(false)
    }
  }

  const removeProperty = async (propertyId: string) => {
    setRemovingId(propertyId)
    try {
      const response = await fetch(`/api/saved-properties?propertyId=${propertyId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        setSavedProperties(prev => prev.filter(p => p.property_id !== propertyId))
      }
    } catch (error) {
      console.error('Error removing property:', error)
    } finally {
      setRemovingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!user) {
    return null
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
      <Header variant="dashboard" activeItem="/dashboard" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                {dbUser?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  ¡Hola, {dbUser?.name || user.email?.split('@')[0]}!
                </h2>
                <p className="text-slate-600">{user.email}</p>
              </div>
            </div>
          </motion.div>

          {/* Subscription CTA (if no subscription and precios page is enabled) */}
          {!hasSubscription && isPreciosEnabled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-2 border-emerald-200 bg-emerald-50">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Crown className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900">Desbloquea más funciones</h3>
                        <p className="text-sm text-slate-600">
                          Suscríbete para búsquedas ilimitadas, alertas y más
                        </p>
                      </div>
                    </div>
                    <Link href="/precios">
                      <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                        Ver Planes
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Quick Actions Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-slate-900">Acceso Rápido</h3>
            <div className={`grid gap-4 ${
              isBuscarEnabled && isPreciosEnabled 
                ? 'md:grid-cols-3' 
                : isBuscarEnabled || isPreciosEnabled 
                  ? 'md:grid-cols-2' 
                  : 'md:grid-cols-1'
            }`}>
              {isBuscarEnabled && (
                <QuickActionCard
                  href="/buscar"
                  icon={Search}
                  title="Buscar Casa"
                  description="Encuentra tu hogar ideal"
                  color="from-emerald-500 to-teal-600"
                />
              )}
              {isPreciosEnabled && (
                <QuickActionCard
                  href="/precios"
                  icon={Crown}
                  title="Mi Plan"
                  description={subscription?.plan_name || 'Ver planes disponibles'}
                  color="from-amber-500 to-orange-600"
                />
              )}
              <QuickActionCard
                href="#saved"
                icon={Heart}
                title="Guardados"
                description={`${savedProperties.length} propiedades`}
                color="from-pink-500 to-rose-600"
              />
            </div>
          </motion.div>

          {/* Saved Properties */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                Propiedades Guardadas
              </h3>
              {savedProperties.length > 0 && (
                <Badge variant="secondary">{savedProperties.length}</Badge>
              )}
            </div>
            
            {loadingSaved ? (
              <Card className="border-2">
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-slate-400" />
                </CardContent>
              </Card>
            ) : savedProperties.length === 0 ? (
              <Card className="border-2">
                <CardContent className="p-8 text-center text-slate-500">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p>Aún no has guardado propiedades</p>
                  {isBuscarEnabled && (
                    <Link href="/buscar">
                      <Button variant="link" className="mt-2 text-emerald-600">
                        Buscar propiedades
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {savedProperties.slice(0, 4).map((saved) => {
                  const property = saved.property_data
                  return (
                    <motion.div
                      key={saved.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      layout
                    >
                      <Card className="border-2 hover:border-emerald-200 hover:shadow-lg transition-all overflow-hidden">
                        <div className="flex">
                          {/* Image */}
                          {property.images && property.images.length > 0 ? (
                            <div className="w-32 h-32 flex-shrink-0">
                              <img
                                src={property.images[0]}
                                alt={property.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-32 h-32 flex-shrink-0 bg-slate-100 flex items-center justify-center">
                              <MapPin className="h-8 w-8 text-slate-300" />
                            </div>
                          )}
                          
                          {/* Content */}
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-900 truncate">{property.title}</h4>
                                <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  {property.city ? `${property.address}, ${property.city}` : property.address}
                                </p>
                              </div>
                              {property.matchScore && (
                                <Badge 
                                  className="bg-slate-900 text-white shrink-0 cursor-pointer hover:bg-slate-700 transition-colors flex items-center gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedPropertyForScore(property)
                                  }}
                                >
                                  <Sparkles className="h-3 w-3" />
                                  {property.matchScore}%
                                  <Info className="h-3 w-3 ml-0.5" />
                                </Badge>
                              )}
                            </div>
                            
                            {/* Match Reasons Preview */}
                            {property.matchReasons && property.matchReasons.length > 0 && (
                              <div 
                                className="mt-2 p-2 bg-slate-50 rounded-md cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedPropertyForScore(property)
                                }}
                              >
                                <p className="text-xs text-slate-600 line-clamp-2">
                                  {property.matchReasons[0]}
                                </p>
                                {property.matchReasons.length > 1 && (
                                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    Ver {property.matchReasons.length - 1} razón(es) más
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* Stats */}
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-emerald-600" />
                                ${property.price.toLocaleString('en-US')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Bed className="h-3 w-3" />
                                {property.bedrooms}
                              </span>
                              <span className="flex items-center gap-1">
                                <Bath className="h-3 w-3" />
                                {property.bathrooms}
                              </span>
                              <span className="flex items-center gap-1">
                                <Maximize className="h-3 w-3" />
                                {property.squareFeet?.toLocaleString('en-US')} ft²
                              </span>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-3">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-xs gap-1"
                                onClick={() => {
                                  // Store property data in sessionStorage for the detail page
                                  sessionStorage.setItem(`property_${saved.property_id}`, JSON.stringify(property))
                                  router.push(`/propiedad/${saved.property_id}`)
                                }}
                              >
                                <ExternalLink className="h-3 w-3" />
                                Ver
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                onClick={() => removeProperty(saved.property_id)}
                                disabled={removingId === saved.property_id}
                              >
                                {removingId === saved.property_id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                                Quitar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
            
            {savedProperties.length > 4 && (
              <div className="text-center">
                <Button variant="outline" className="gap-2">
                  Ver todas ({savedProperties.length})
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>

          {/* Subscription Management */}
          {subscription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Mi Suscripción</CardTitle>
                  <CardDescription>Gestiona tu plan y facturación</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{subscription.plan_name}</p>
                        <p className="text-sm text-slate-600">
                          {subscription.status === 'active' ? 'Activo' : subscription.status}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleManageSubscription}>
                      Gestionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
      
      {/* Match Score Modal */}
      {selectedPropertyForScore && (
        <MatchScoreModal
          isOpen={!!selectedPropertyForScore}
          onClose={() => setSelectedPropertyForScore(null)}
          propertyTitle={selectedPropertyForScore.title}
          matchScore={selectedPropertyForScore.matchScore || 0}
          matchReasons={selectedPropertyForScore.matchReasons || []}
          price={selectedPropertyForScore.price}
          city={selectedPropertyForScore.city}
        />
      )}
    </div>
  )
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  color,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <Card className="cursor-pointer border-2 hover:border-emerald-200 hover:shadow-lg transition-all h-full">
          <CardContent className="p-6">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <h4 className="font-semibold text-slate-900">{title}</h4>
            <p className="text-sm text-slate-600">{description}</p>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}
