'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { SubscriptionGate } from '@/components/paywall/SubscriptionGate'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModuleWrapper } from '@/components/modules/ModuleWrapper'
import EquityForecast from '@/components/reai/EquityForecast'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import Header from '@/components/layout/Header'
import {
  Home,
  Search,
  Heart,
  Sparkles,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Maximize,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  LineChart,
  AlertCircle,
  Database,
  Briefcase,
  Clock,
  Target,
  Palmtree,
  TrendingUp,
  Users,
  Shield,
  Shuffle,
  HelpCircle,
} from 'lucide-react'

interface PropertyMatch {
  id: string
  title: string
  address: string
  city?: string
  price: number
  bedrooms: number
  bathrooms: number
  squareFeet: number
  matchScore: number
  matchReasons: string[]
  amenities: string[]
  images?: string[]
  sourceProvider?: string
}

interface SearchError {
  code?: string
  message: string
}

// Form options
const PURPOSE_OPTIONS = [
  { value: 'vivir', label: 'Vivir', icon: Home },
  { value: 'retiro', label: 'Retiro', icon: Palmtree },
  { value: 'invertir', label: 'Invertir', icon: TrendingUp },
  { value: 'negocio', label: 'Establecer un negocio', icon: Briefcase },
  { value: 'no_seguro', label: 'Todavía no estoy seguro', icon: HelpCircle },
]

const TIMELINE_OPTIONS = [
  { value: 'inmediato', label: 'Inmediato', description: '0–3 meses' },
  { value: 'pronto', label: 'Pronto', description: '3–6 meses' },
  { value: 'explorando', label: 'Explorando opciones', description: '6+ meses' },
]

const PRIORITY_OPTIONS = [
  { value: 'tranquilidad', label: 'Tranquilidad', icon: Shield },
  { value: 'social', label: 'Cercanía y vida social', icon: Users },
  { value: 'crecimiento', label: 'Oportunidad de crecimiento', icon: TrendingUp },
  { value: 'estabilidad', label: 'Estabilidad a largo plazo', icon: Target },
  { value: 'flexibilidad', label: 'Flexibilidad', icon: Shuffle },
]

export default function BuscarPage() {
  const { user } = useAuth()
  const [step, setStep] = useState<'form' | 'analyzing' | 'results' | 'error'>('form')
  const [answers, setAnswers] = useState({
    lifestyle: '',
    budget: '3000',
    location: '',
    purpose: '',
    timeline: '',
    priority: '',
  })
  const [matches, setMatches] = useState<PropertyMatch[]>([])
  const [searchError, setSearchError] = useState<SearchError | null>(null)
  const [providersQueried, setProvidersQueried] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep('analyzing')
    setSearchError(null)

    try {
      const response = await fetch('/api/ai/lifestyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idealLifeDescription: answers.lifestyle,
          priorities: answers.location,
          budget: parseFloat(answers.budget),
          location: answers.location,
          // New fields for refined matching
          purpose: answers.purpose,
          timeline: answers.timeline,
          mainPriority: answers.priority,
        }),
      })

      const data = await response.json()

      if (data.success && data.matches && data.matches.length > 0) {
        const transformedMatches = data.matches.map((match: any) => ({
          id: match.id,
          title: match.title,
          address: match.address,
          city: match.city,
          price: match.price,
          bedrooms: match.bedrooms || 0,
          bathrooms: match.bathrooms || 0,
          squareFeet: match.squareFeet || match.square_feet || 0,
          matchScore: match.matchScore,
          matchReasons: match.matchReasons || [],
          amenities: Array.isArray(match.amenities) ? match.amenities : [],
          images: match.images || [],
          sourceProvider: match.sourceProvider,
        }))
        setMatches(transformedMatches)
        setProvidersQueried(data.providers?.providersQueried || [])
        setStep('results')
      } else if (data.code === 'NO_PROVIDERS') {
        setSearchError({
          code: 'NO_PROVIDERS',
          message: data.error || 'No hay proveedores de propiedades configurados.',
        })
        setStep('error')
      } else if (!data.success) {
        setSearchError({
          code: 'API_ERROR',
          message: data.error || 'Error al procesar la búsqueda.',
        })
        setStep('error')
      } else {
        // No matches found but search was successful
        setMatches([])
        setProvidersQueried(data.providers?.providersQueried || [])
        setStep('results')
      }
    } catch (error) {
      console.error('Error:', error)
      setSearchError({
        code: 'NETWORK_ERROR',
        message: 'Error de conexión. Por favor intenta de nuevo.',
      })
      setStep('error')
    }
  }

  const resetSearch = () => {
    setStep('form')
    setAnswers({ lifestyle: '', budget: '3000', location: '', purpose: '', timeline: '', priority: '' })
    setMatches([])
    setSearchError(null)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header activeItem="/buscar" />

      {/* Main Content */}
      <main className="pt-20">
        <AnimatePresence mode="wait">
          {/* Form Step */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Hero Section - Dark */}
              <section className="bg-slate-900 text-white py-16 md:py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Búsqueda inteligente
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                      Describe tu vida.
                      <br />
                      <span className="text-emerald-400">Encuentra tu lugar.</span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                      Cuéntanos cómo imaginas tu día a día y encontraremos propiedades 
                      que realmente se adaptan a tu estilo de vida.
                    </p>
                  </motion.div>
                </div>
              </section>

              {/* Form Section */}
              <section className="py-12 md:py-16 bg-slate-50">
                <div className="max-w-2xl mx-auto px-6">
                  {/* Subscription Gate - wraps form for access control */}
                  <SubscriptionGate
                    title="Activa un plan para buscar propiedades"
                    description="La búsqueda inteligente está disponible para usuarios con un plan activo. Los administradores tienen acceso automático."
                    showPreview={true}
                  >
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6 md:p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Lifestyle Description */}
                    <div className="space-y-2">
                      <Label htmlFor="lifestyle" className="text-base font-medium">
                        ¿Cómo imaginas tu vida ideal? *
                      </Label>
                      <Textarea
                        id="lifestyle"
                        placeholder="Ej: Me imagino despertar cerca del mar, caminar a cafeterías locales, trabajar remoto con buena conexión, y tener espacio para recibir familia los fines de semana..."
                        value={answers.lifestyle}
                        onChange={(e) => setAnswers({ ...answers, lifestyle: e.target.value })}
                        className="min-h-32 resize-none"
                        required
                      />
                      <p className="text-xs text-slate-500">
                        Mientras más detalles nos des, mejores serán los resultados
                      </p>
                    </div>

                    {/* Location Preferences */}
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-base font-medium">
                        ¿Tienes preferencia de zona? (opcional)
                      </Label>
                      <Input
                        id="location"
                        placeholder="Ej: San Juan, Condado, Dorado, Guaynabo..."
                        value={answers.location}
                        onChange={(e) => setAnswers({ ...answers, location: e.target.value })}
                      />
                    </div>

                    {/* Budget */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        Presupuesto mensual máximo
                      </Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">$500/mes</span>
                          <span className="font-semibold text-lg text-emerald-600">
                            ${parseInt(answers.budget).toLocaleString()}/mes
                          </span>
                          <span className="text-slate-500">$10,000/mes</span>
                        </div>
                        <Input
                          type="range"
                          min="500"
                          max="10000"
                          step="100"
                          value={answers.budget}
                          onChange={(e) => setAnswers({ ...answers, budget: e.target.value })}
                          className="w-full accent-emerald-600"
                        />
                      </div>
                    </div>

                    {/* Purpose */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        ¿Cuál es el objetivo principal de esta búsqueda? *
                      </Label>
                      <RadioGroup
                        value={answers.purpose}
                        onValueChange={(value) => setAnswers({ ...answers, purpose: value })}
                        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                      >
                        {PURPOSE_OPTIONS.map((option) => {
                          const Icon = option.icon
                          return (
                            <Label
                              key={option.value}
                              htmlFor={`purpose-${option.value}`}
                              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                answers.purpose === option.value
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <RadioGroupItem value={option.value} id={`purpose-${option.value}`} className="sr-only" />
                              <Icon className={`h-6 w-6 ${answers.purpose === option.value ? 'text-emerald-600' : 'text-slate-400'}`} />
                              <span className="text-sm font-medium text-center">{option.label}</span>
                            </Label>
                          )
                        })}
                      </RadioGroup>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        ¿Cuándo te gustaría tomar esta decisión?
                      </Label>
                      <RadioGroup
                        value={answers.timeline}
                        onValueChange={(value) => setAnswers({ ...answers, timeline: value })}
                        className="grid grid-cols-3 gap-3"
                      >
                        {TIMELINE_OPTIONS.map((option) => (
                          <Label
                            key={option.value}
                            htmlFor={`timeline-${option.value}`}
                            className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              answers.timeline === option.value
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <RadioGroupItem value={option.value} id={`timeline-${option.value}`} className="sr-only" />
                            <Clock className={`h-5 w-5 ${answers.timeline === option.value ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className="text-sm font-medium">{option.label}</span>
                            <span className="text-xs text-slate-500">{option.description}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Priority */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        ¿Qué es más importante para ti ahora mismo? *
                      </Label>
                      <RadioGroup
                        value={answers.priority}
                        onValueChange={(value) => setAnswers({ ...answers, priority: value })}
                        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                      >
                        {PRIORITY_OPTIONS.map((option) => {
                          const Icon = option.icon
                          return (
                            <Label
                              key={option.value}
                              htmlFor={`priority-${option.value}`}
                              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                answers.priority === option.value
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <RadioGroupItem value={option.value} id={`priority-${option.value}`} className="sr-only" />
                              <Icon className={`h-6 w-6 ${answers.priority === option.value ? 'text-emerald-600' : 'text-slate-400'}`} />
                              <span className="text-sm font-medium text-center">{option.label}</span>
                            </Label>
                          )
                        })}
                      </RadioGroup>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full gap-2 bg-slate-900 hover:bg-slate-800 h-14 text-base rounded-xl"
                      disabled={!answers.lifestyle.trim() || !answers.purpose || !answers.priority}
                    >
                      <Search className="h-5 w-5" />
                      Encontrar mi hogar ideal
                    </Button>
                  </form>
                </CardContent>
              </Card>
              </SubscriptionGate>
                </div>
              </section>
            </motion.div>
          )}

          {/* Analyzing Step */}
          {step === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[60vh] flex flex-col items-center justify-center py-20"
            >
              <div className="text-center space-y-8">
                <div className="relative">
                  <div className="h-24 w-24 mx-auto rounded-full bg-slate-900 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-emerald-400 animate-spin" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-slate-900">Analizando tu perfil...</h2>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Estamos procesando tus preferencias y buscando propiedades que encajen con tu estilo de vida
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Step */}
          {step === 'error' && searchError && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16"
            >
              <div className="max-w-2xl mx-auto px-6">
                <Card className="border-0 shadow-lg bg-white">
                  <CardContent className="p-8 md:p-12 text-center space-y-8">
                    <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                      {searchError.code === 'NO_PROVIDERS' ? (
                        <Database className="h-10 w-10 text-amber-600" />
                      ) : (
                        <AlertCircle className="h-10 w-10 text-amber-600" />
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                        {searchError.code === 'NO_PROVIDERS' 
                          ? 'Búsqueda No Disponible'
                          : 'Error en la Búsqueda'
                        }
                      </h2>
                      <p className="text-slate-500">
                        {searchError.message}
                      </p>
                    </div>

                    {searchError.code === 'NO_PROVIDERS' && (
                      <div className="bg-slate-50 rounded-xl p-6 text-left space-y-4">
                        <p className="text-sm text-slate-700 font-medium">
                          Para habilitar la búsqueda:
                        </p>
                        <ul className="text-sm text-slate-600 space-y-3">
                          <li className="flex items-start gap-3">
                            <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium shrink-0">1</span>
                            <span>Un administrador debe acceder al panel de administración</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium shrink-0">2</span>
                            <span>Configurar al menos un proveedor de datos</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium shrink-0">3</span>
                            <span>Ingresar las credenciales de API</span>
                          </li>
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-center gap-3 pt-2">
                      <Button variant="outline" onClick={resetSearch} className="gap-2 rounded-full px-6">
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                      </Button>
                      <Link href="/">
                        <Button className="gap-2 bg-slate-900 hover:bg-slate-800 rounded-full px-6">
                          <Home className="h-4 w-4" />
                          Ir al Inicio
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Results Step */}
          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Results Header - Dark */}
              <section className={`py-12 ${matches.length > 0 ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>
                <div className="max-w-6xl mx-auto px-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${
                        matches.length > 0 ? 'bg-emerald-500/20' : 'bg-white'
                      }`}>
                        {matches.length > 0 ? (
                          <CheckCircle className="h-7 w-7 text-emerald-400" />
                        ) : (
                          <Search className="h-7 w-7 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h1 className={`text-2xl md:text-3xl font-bold ${matches.length > 0 ? 'text-white' : 'text-slate-900'}`}>
                          {matches.length > 0 
                            ? `${matches.length} propiedades encontradas`
                            : 'Sin resultados'
                          }
                        </h1>
                        <p className={matches.length > 0 ? 'text-slate-400' : 'text-slate-500'}>
                          {matches.length > 0 
                            ? 'Propiedades que encajan con tu estilo de vida'
                            : 'Intenta ampliar tus criterios de búsqueda'
                          }
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant={matches.length > 0 ? 'secondary' : 'outline'} 
                      onClick={resetSearch} 
                      className={`gap-2 rounded-full px-6 ${matches.length > 0 ? 'bg-white text-slate-900 hover:bg-slate-100' : ''}`}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Nueva Búsqueda
                    </Button>
                  </div>
                  {providersQueried.length > 0 && matches.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-4">
                      <Database className="h-3 w-3" />
                      <span>Fuentes: {providersQueried.join(', ')}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Results Content */}
              <section className="py-12 bg-white">
                <div className="max-w-6xl mx-auto px-6 space-y-8">

              {/* No Results Message */}
              {matches.length === 0 && (
                <Card className="border-0 shadow-lg bg-slate-50">
                  <CardContent className="p-12 text-center space-y-6">
                    <div className="h-20 w-20 rounded-full bg-slate-200 flex items-center justify-center mx-auto">
                      <Search className="h-10 w-10 text-slate-400" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-slate-900">
                        No encontramos propiedades
                      </h3>
                      <p className="text-slate-500 max-w-md mx-auto">
                        Intenta con una descripción diferente, amplía tu presupuesto o cambia la ubicación preferida.
                      </p>
                    </div>
                    <Button onClick={resetSearch} className="gap-2 bg-slate-900 hover:bg-slate-800 rounded-full px-8">
                      <Search className="h-4 w-4" />
                      Nueva Búsqueda
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Results Grid */}
              {matches.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                        <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all bg-white">
                        {/* Property Image */}
                        {match.images && match.images.length > 0 && (
                          <div className="relative h-48 overflow-hidden rounded-t-lg">
                            <img 
                              src={match.images[0]} 
                              alt={match.title}
                              className="w-full h-full object-cover"
                            />
                            {match.sourceProvider && (
                              <Badge className="absolute top-2 right-2 bg-black/50 text-white text-xs">
                                {match.sourceProvider}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">{match.title}</CardTitle>
                              <CardDescription className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {match.city ? `${match.address}, ${match.city}` : match.address}
                              </CardDescription>
                            </div>
                            <Badge className="bg-slate-900 text-white shrink-0">
                              {match.matchScore}%
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Price & Stats */}
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="text-center">
                              <DollarSign className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                              <p className="font-semibold">${match.price.toLocaleString()}</p>
                              <p className="text-xs text-slate-500">/mes</p>
                            </div>
                            <div className="text-center">
                              <Bed className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                              <p className="font-semibold">{match.bedrooms}</p>
                              <p className="text-xs text-slate-500">Hab.</p>
                            </div>
                            <div className="text-center">
                              <Bath className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                              <p className="font-semibold">{match.bathrooms}</p>
                              <p className="text-xs text-slate-500">Baños</p>
                            </div>
                            <div className="text-center">
                              <Maximize className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                              <p className="font-semibold">{match.squareFeet.toLocaleString()}</p>
                              <p className="text-xs text-slate-500">ft²</p>
                            </div>
                          </div>

                          {/* Match Reasons */}
                          {match.matchReasons.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium flex items-center gap-2 text-emerald-700">
                                <Heart className="h-4 w-4" />
                                Por qué es ideal para ti:
                              </p>
                              <ul className="space-y-1.5">
                                {match.matchReasons.slice(0, 3).map((reason, idx) => (
                                  <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Amenities */}
                          {match.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {match.amenities.slice(0, 3).map((amenity, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <Button className="w-full gap-2 bg-slate-900 hover:bg-slate-800 rounded-lg">
                            Ver Detalles
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Upsell for non-logged users */}
              {!user && matches.length > 0 && (
                <Card className="border-0 bg-slate-900 text-white shadow-xl">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="h-16 w-16 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Sparkles className="h-8 w-8 text-emerald-400" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="font-bold text-xl">
                          ¿Te gustan estos resultados?
                        </h3>
                        <p className="text-slate-400 mt-1">
                          Crea una cuenta para guardar tus búsquedas, recibir alertas de nuevas propiedades y más.
                        </p>
                      </div>
                      <Link href="/auth/login">
                        <Button className="gap-2 bg-white text-slate-900 hover:bg-slate-100 rounded-full px-8">
                          Crear Cuenta
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Equity Forecast Module - Shown if enabled and has results */}
              {matches.length > 0 && (
                <ModuleWrapper moduleKey="equity-forecast">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                      <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="h-14 w-14 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <LineChart className="h-7 w-7 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">¿Cuánto valdrá en el futuro?</h3>
                            <p className="text-sm text-slate-400">Proyección de valorización para propiedades similares</p>
                          </div>
                        </div>
                        <EquityForecast />
                      </CardContent>
                    </Card>
                  </motion.div>
                </ModuleWrapper>
              )}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
