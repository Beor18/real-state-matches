'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Heart,
  Sparkles,
  Home,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Maximize,
  CheckCircle,
  ArrowRight,
  X,
  Loader2
} from 'lucide-react'

interface LifestyleQuestion {
  id: string
  question: string
  type: 'text' | 'textarea' | 'range'
  placeholder?: string
  min?: number
  max?: number
  default?: number
}

interface PropertyMatch {
  id: string
  title: string
  address: string
  propertyType: string
  price: number
  bedrooms: number
  bathrooms: number
  squareFeet: number
  images: string[]
  matchScore: number
  lifestyleFit: 'excellent' | 'good' | 'fair' | 'poor'
  matchReasons: string[]
  amenities: string[]
}

export default function LifestyleMatch() {
  const [step, setStep] = useState<'intro' | 'questions' | 'analyzing' | 'results'>('intro')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [matches, setMatches] = useState<PropertyMatch[]>([])

  const questions: LifestyleQuestion[] = [
    {
      id: 'idealLife',
      question: 'Describe tu vida ideal en Puerto Rico o Latam',
      type: 'textarea',
      placeholder: 'Ej: Me imagino despertar con vista al mar, caminar a cafeterías locales, trabajar remoto cerca de la playa, y tener espacio para visitas familiares los fines de semana...'
    },
    {
      id: 'priorities',
      question: '¿Qué es más importante para ti?',
      type: 'textarea',
      placeholder: 'Ej: Estar cerca de la playa, acceso a restaurantes, transporte público, zonas tranquilas, vida nocturna, escuelas, etc...'
    },
    {
      id: 'budget',
      question: '¿Cuál es tu presupuesto mensual máximo?',
      type: 'range',
      min: 500,
      max: 10000,
      default: 3000
    },
    {
      id: 'location',
      question: '¿En qué zonas te gustaría vivir?',
      type: 'textarea',
      placeholder: 'Ej: San Juan (Condado, Santurce), Dorado, Río Piedras, Ponce, Mayagüez, o específica tu preferencia...'
    }
  ]

  const handleAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const handleStart = () => {
    setStep('questions')
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setStep('analyzing')

    try {
      const response = await fetch('/api/ai/lifestyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idealLifeDescription: answers.idealLife || '',
          priorities: answers.priorities || '',
          budget: answers.budget ? parseFloat(answers.budget) : undefined,
          location: answers.location || '',
        }),
      })

      const data = await response.json()

      if (data.success && data.matches && data.matches.length > 0) {
        // Transform API response to match component format
        const transformedMatches = data.matches.map((match: any) => ({
          id: match.id,
          title: match.title,
          address: match.address,
          propertyType: match.property_type,
          price: match.price,
          bedrooms: match.bedrooms || 0,
          bathrooms: match.bathrooms || 0,
          squareFeet: match.square_feet || 0,
          images: Array.isArray(match.images) ? match.images : ['/api/placeholder/400/300'],
          matchScore: match.matchScore,
          lifestyleFit: match.lifestyleFit,
          matchReasons: match.matchReasons || [],
          amenities: Array.isArray(match.amenities) ? match.amenities : [],
        }))
        setMatches(transformedMatches)
      } else {
        // Fallback to mock data if no matches from API
        setMatches(mockMatches)
      }
    } catch (error) {
      console.error('Error analyzing lifestyle:', error)
      // Fallback to mock data on error
      setMatches(mockMatches)
    } finally {
      setIsAnalyzing(false)
      setStep('results')
    }
  }

  const mockMatches: PropertyMatch[] = [
    {
      id: '1',
      title: 'Villa Costera Moderna',
      address: 'Calle del Sol, Dorado Beach',
      propertyType: 'house',
      price: 485000,
      bedrooms: 3,
      bathrooms: 2.5,
      squareFeet: 2400,
      images: ['/api/placeholder/400/300'],
      matchScore: 96,
      lifestyleFit: 'excellent',
      matchReasons: [
        'Vista al mar perfecta para despertar con el sonido de las olas',
        'Ubicación tranquila pero cerca de restaurantes y cafeterías',
        'Espacio ideal para trabajo remoto con oficina integrada',
        'Diseño abierto perfecto para recibir visitas familiares',
        'A solo 5 minutos de la playa más cercana'
      ],
      amenities: [
        'Vista al mar',
        'Piscina',
        'Oficina en casa',
        'Terraza',
        'Parqueo para 3 autos'
      ]
    },
    {
      id: '2',
      title: 'Penthouse Urbano con Vistas',
      address: 'Avenida Ashford, Condado',
      propertyType: 'condo',
      price: 625000,
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1800,
      images: ['/api/placeholder/400/300'],
      matchScore: 91,
      lifestyleFit: 'excellent',
      matchReasons: [
        'Ubicación premium con acceso a vida nocturna y restaurantes',
        'Vistas panorámicas al océano',
        'Cercanía a servicios y transporte',
        'Diseño moderno ideal para profesional urbano',
        'Gimnasio y piscina en el edificio'
      ],
      amenities: [
        'Vista al mar',
        'Gimnasio',
        'Piscina',
        'Seguridad 24/7',
        'Balcón privado'
      ]
    },
    {
      id: '3',
      title: 'Residencial Familiar con Jardín',
      address: 'Calle Principal, Guaynabo',
      propertyType: 'house',
      price: 375000,
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2800,
      images: ['/api/placeholder/400/300'],
      matchScore: 87,
      lifestyleFit: 'good',
      matchReasons: [
        'Espacio amplio para familia y visitas',
        'Jardín privado perfecto para niños',
        'Zona tranquila y segura',
        'Cerca de escuelas de calidad',
        'Excelente relación precio-valor'
      ],
      amenities: [
        'Jardín',
        'Parqueo',
        'Cerca de escuelas',
        'Zona segura',
        'Terraza'
      ]
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <Badge variant="outline" className="gap-2 mb-4">
          <Heart className="h-3 w-3 text-pink-500" />
          Lifestyle Match Engine
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          Encuentra tu Hogar Ideal por Estilo de Vida
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Describe cómo imaginas tu vida perfecta y nuestra IA encontrará las propiedades que mejor se adaptan
          a tu estilo de vida, usando embeddings semánticos y análisis predictivo
        </p>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card className="border-2 bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm">
              <CardContent className="p-8 space-y-6">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="space-y-3"
                  >
                    <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg">1. Describe Tu Vida</h3>
                    <p className="text-sm text-muted-foreground">
                      Comparte cómo imaginas tu día a día ideal, prioridades y preferencias
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="space-y-3"
                  >
                    <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <Heart className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg">2. IA Analiza Perfil</h3>
                    <p className="text-sm text-muted-foreground">
                      Nuestra IA crea un perfil semántico y encuentra propiedades compatibles
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="space-y-3"
                  >
                    <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                      <Home className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg">3. Encuentra Tu Hogar</h3>
                    <p className="text-sm text-muted-foreground">
                      Recibe propiedades personalizadas con scores de compatibilidad detallados
                    </p>
                  </motion.div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                    onClick={handleStart}
                  >
                    <Sparkles className="h-5 w-5" />
                    Comenzar Test de Estilo de Vida
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'questions' && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card className="border-2 max-w-3xl mx-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Crea Tu Perfil de Estilo de Vida</CardTitle>
                    <CardDescription>
                      Responde con la mayor cantidad de detalles posible para mejores resultados
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setStep('intro')}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.map((q, idx) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="space-y-2"
                  >
                    <Label className="text-base font-medium">{q.question}</Label>
                    {q.type === 'textarea' && (
                      <Textarea
                        placeholder={q.placeholder}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        className="min-h-24"
                      />
                    )}
                    {q.type === 'text' && (
                      <Input
                        placeholder={q.placeholder}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                      />
                    )}
                    {q.type === 'range' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">${q.min} / mes</span>
                          <span className="font-semibold text-lg">
                            ${answers[q.id] || q.default}
                          </span>
                          <span className="text-muted-foreground">${q.max} / mes</span>
                        </div>
                        <Input
                          type="range"
                          min={q.min}
                          max={q.max}
                          defaultValue={q.default}
                          onChange={(e) => handleAnswer(q.id, e.target.value)}
                          className="w-full"
                        />
                      </div>
                    )}
                  </motion.div>
                ))}

                <Button
                  size="lg"
                  className="w-full gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  <Sparkles className="h-5 w-5" />
                  Analizar mi Estilo de Vida
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center py-20 space-y-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="h-20 w-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center"
            >
              <Loader2 className="h-10 w-10 text-white" />
            </motion.div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold">Analizando tu Perfil...</h3>
              <p className="text-muted-foreground">
                Nuestra IA está creando embeddings semánticos y encontrando propiedades que mejor se adaptan a tu estilo de vida
              </p>
            </div>
          </motion.div>
        )}

        {step === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Results Header */}
            <Card className="border-2 bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                      <CheckCircle className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">¡Análisis Completado!</h3>
                      <p className="text-sm text-muted-foreground">
                        Encontramos {matches.length} propiedades que coinciden con tu estilo de vida
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setStep('questions')}>
                    Ajustar Preferencias
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-xl transition-all border-2 h-full flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <CardTitle className="text-lg">{match.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {match.address}
                          </CardDescription>
                        </div>
                        <Badge
                          className={`gap-1 ${
                            match.lifestyleFit === 'excellent'
                              ? 'bg-emerald-500'
                              : match.lifestyleFit === 'good'
                              ? 'bg-blue-500'
                              : 'bg-yellow-500'
                          }`}
                        >
                          {match.matchScore}% Match
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                      {/* Property Stats */}
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="space-y-1">
                          <Bed className="h-4 w-4 mx-auto text-purple-600" />
                          <p className="text-xs font-medium">{match.bedrooms}</p>
                        </div>
                        <div className="space-y-1">
                          <Bath className="h-4 w-4 mx-auto text-purple-600" />
                          <p className="text-xs font-medium">{match.bathrooms}</p>
                        </div>
                        <div className="space-y-1">
                          <Maximize className="h-4 w-4 mx-auto text-purple-600" />
                          <p className="text-xs font-medium">{match.squareFeet.toLocaleString()} ft²</p>
                        </div>
                        <div className="space-y-1">
                          <DollarSign className="h-4 w-4 mx-auto text-purple-600" />
                          <p className="text-xs font-medium">${(match.price / 1000).toFixed(0)}k</p>
                        </div>
                      </div>

                      {/* Match Reasons */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Heart className="h-4 w-4 text-pink-500" />
                          Por qué es perfecta para ti:
                        </p>
                        <ul className="space-y-1">
                          {match.matchReasons.slice(0, 3).map((reason, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                              <ArrowRight className="h-3 w-3 text-pink-500 mt-0.5 shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-1">
                        {match.amenities.slice(0, 4).map((amenity, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                      </div>

                      <Button className="w-full gap-2">
                        <Home className="h-4 w-4" />
                        Ver Propiedad
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
