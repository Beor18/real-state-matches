'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  MapPin,
  Home,
  DollarSign,
  Zap,
  Flame,
  Building,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Users
} from 'lucide-react'

interface PredictionZone {
  id: string
  name: string
  city: string
  demandScore: number
  demandTrend: 'increasing' | 'stable' | 'decreasing'
  avgPrice: number
  predictedGrowth1Y: number
  predictedGrowth3Y: number
  isHotZone: boolean
  isUndervalued: boolean
  migrationTrend: 'influx' | 'stable' | 'outflow'
  fanbaseSentiment: number
  keyFactors: string[]
}

interface PropertyPrediction {
  id: string
  title: string
  address: string
  price: number
  propertyType: string
  demandScore: number
  predictedValue1Y: number
  predictedValue3Y: number
  predictedValue5Y: number
  confidence: number
  matchReasons: string[]
}

export default function DemandPredictionEngine() {
  const [selectedTab, setSelectedTab] = useState('zones')
  const [zones, setZones] = useState<PredictionZone[]>([])
  const [properties, setProperties] = useState<PropertyPrediction[]>([])

  // Mock data - will be replaced with API
  useEffect(() => {
    setZones([
      {
        id: '1',
        name: 'Dorado',
        city: 'Dorado',
        demandScore: 92,
        demandTrend: 'increasing',
        avgPrice: 450000,
        predictedGrowth1Y: 12,
        predictedGrowth3Y: 28,
        isHotZone: true,
        isUndervalued: true,
        migrationTrend: 'influx',
        fanbaseSentiment: 0.85,
        keyFactors: [
          'Expansión del corredor turístico',
          'Nuevo centro comercial en desarrollo',
          'Interés creciente de inversores internacionales',
          'Proyectos de infraestructura municipal'
        ]
      },
      {
        id: '2',
        name: 'Condado',
        city: 'San Juan',
        demandScore: 88,
        demandTrend: 'increasing',
        avgPrice: 680000,
        predictedGrowth1Y: 9,
        predictedGrowth3Y: 22,
        isHotZone: true,
        isUndervalued: false,
        migrationTrend: 'stable',
        fanbaseSentiment: 0.72,
        keyFactors: [
          'Vibrante vida nocturna',
          'Cerca de playas de prestigio',
          'Alta demanda de alquileres turísticos',
          'Desarrollo de residenciales de lujo'
        ]
      },
      {
        id: '3',
        name: 'Río Piedras',
        city: 'San Juan',
        demandScore: 75,
        demandTrend: 'increasing',
        avgPrice: 220000,
        predictedGrowth1Y: 15,
        predictedGrowth3Y: 35,
        isHotZone: true,
        isUndervalued: true,
        migrationTrend: 'influx',
        fanbaseSentiment: 0.65,
        keyFactors: [
          'Cerca de la UPR',
          'Gentrificación en proceso',
          'Proyectos de renovación urbana',
          'Alto potencial de valorización'
        ]
      },
      {
        id: '4',
        name: 'Mayagüez',
        city: 'Mayagüez',
        demandScore: 68,
        demandTrend: 'stable',
        avgPrice: 185000,
        predictedGrowth1Y: 7,
        predictedGrowth3Y: 18,
        isHotZone: false,
        isUndervalued: true,
        migrationTrend: 'stable',
        fanbaseSentiment: 0.58,
        keyFactors: [
          'Inversión en infraestructura portuaria',
          'Desarrollo de proyectos educativos',
          'Costo de vida accesible',
          'Crecimiento del sector tecnológico'
        ]
      }
    ])

    setProperties([
      {
        id: '1',
        title: 'Villa Mar Moderna',
        address: 'Calle Principal, Dorado',
        price: 485000,
        propertyType: 'house',
        demandScore: 94,
        predictedValue1Y: 543200,
        predictedValue3Y: 620800,
        predictedValue5Y: 783500,
        confidence: 87,
        matchReasons: [
          'Zona en expansión turística',
          'Proyectos de infraestructura cercanos',
          'Demanda de inversores internacionales creciendo',
          'Escasez de inventario similar en el área'
        ]
      },
      {
        id: '2',
        title: 'Penthouse Urbano',
        address: 'Avenida Ashford, Condado',
        price: 725000,
        propertyType: 'condo',
        demandScore: 91,
        predictedValue1Y: 790250,
        predictedValue3Y: 884500,
        predictedValue5Y: 1012000,
        confidence: 82,
        matchReasons: [
          'Ubicación premium en Condado',
          'Vista al mar',
          'Alta demanda de alquileres turísticos',
          'Crecimiento sostenido del mercado de lujo'
        ]
      },
      {
        id: '3',
        title: 'Residencial Estudiantil',
        address: 'Calle Universidad, Río Piedras',
        price: 195000,
        propertyType: 'apartment',
        demandScore: 86,
        predictedValue1Y: 224250,
        predictedValue3Y: 263250,
        predictedValue5Y: 292500,
        confidence: 91,
        matchReasons: [
          'Altísima demanda de estudiantes',
          'Potencial de renta mensual estable',
          'Gentrificación del área',
          'Proyectos de renovación urbana próximos'
        ]
      }
    ])
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <Badge variant="outline" className="gap-2 mb-4">
          <Flame className="h-3 w-3 text-orange-500" />
          Demand Prediction Engine
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Predicción de Demanda en Tiempo Real
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Analiza zonas infravaloradas, patrones migratorios y el sentimiento de nuestra comunidad de 315k+
          fans para predecir tendencias del mercado inmobiliario en Puerto Rico y Latam
        </p>
      </motion.div>

      {/* AI Insights Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-lg">AI Insights Activos</h3>
                <p className="text-sm text-muted-foreground">
                  Analizando 1,247 propiedades, 23 zonas, y patrones migratorios de 315k+ usuarios en tiempo real
                </p>
              </div>
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Ver Reporte Completo
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="zones" className="gap-2">
            <MapPin className="h-4 w-4" />
            Zonas Predichas
          </TabsTrigger>
          <TabsTrigger value="properties" className="gap-2">
            <Home className="h-4 w-4" />
            Propiedades Top
          </TabsTrigger>
        </TabsList>

        {/* Zones Tab */}
        <TabsContent value="zones" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {zones.map((zone, index) => (
              <motion.div
                key={zone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border-2 hover:shadow-lg transition-all ${
                  zone.isHotZone ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20' : ''
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{zone.name}</CardTitle>
                          {zone.isHotZone && (
                            <Badge className="gap-1 bg-orange-500 hover:bg-orange-600">
                              <Flame className="h-3 w-3" />
                              Hot Zone
                            </Badge>
                          )}
                          {zone.isUndervalued && (
                            <Badge variant="outline" className="gap-1 border-emerald-500 text-emerald-700">
                              <TrendingUp className="h-3 w-3" />
                              Infravalorada
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {zone.city}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-purple-600">
                          {zone.demandScore}
                        </div>
                        <div className="text-xs text-muted-foreground">Score Demanda</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Precio Promedio</p>
                        <p className="text-lg font-semibold">
                          ${zone.avgPrice.toLocaleString('en-US')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Crecimiento 3A</p>
                        <p className={`text-lg font-semibold ${
                          zone.predictedGrowth3Y > 20 ? 'text-emerald-600' : 'text-purple-600'
                        }`}>
                          +{zone.predictedGrowth3Y}%
                        </p>
                      </div>
                    </div>

                    {/* Migration Trend */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                      <Users className="h-5 w-5 text-purple-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Tendencia Migratoria</p>
                        <p className="text-xs text-muted-foreground">
                          {zone.migrationTrend === 'influx' && 'Afluencia de residentes nueva'}
                          {zone.migrationTrend === 'stable' && 'Estable'}
                          {zone.migrationTrend === 'outflow' && 'Salida de residentes'}
                        </p>
                      </div>
                      {zone.migrationTrend === 'influx' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>

                    {/* Fanbase Sentiment */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Sentimiento Fanbase</span>
                        <span className="font-medium">{(zone.fanbaseSentiment * 100).toFixed(0)}% Positivo</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${zone.fanbaseSentiment * 100}%` }}
                          transition={{ delay: 0.5, duration: 1 }}
                          className={`h-full ${
                            zone.fanbaseSentiment > 0.7 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                            zone.fanbaseSentiment > 0.4 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                            'bg-gradient-to-r from-red-500 to-red-400'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Key Factors */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Factores Clave</p>
                      <ul className="space-y-1">
                        {zone.keyFactors.slice(0, 2).map((factor, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <ArrowRight className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button className="w-full gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Ver Análisis Detallado
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{property.title}</CardTitle>
                      <Badge className="gap-1 bg-gradient-to-r from-purple-600 to-pink-600">
                        Score: {property.demandScore}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {property.address}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Precio Actual</span>
                        <span className="font-bold text-lg">${property.price.toLocaleString('en-US')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Predicción 3A</span>
                        <span className="font-bold text-lg text-emerald-600">
                          +${(property.predictedValue3Y - property.price).toLocaleString('en-US')}
                        </span>
                      </div>
                    </div>

                    {/* Prediction Bars */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Año 1</span>
                          <span className="text-emerald-600">+{Math.round((property.predictedValue1Y - property.price) / property.price * 100)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((property.predictedValue1Y - property.price) / property.price) * 100}%` }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Año 3</span>
                          <span className="text-purple-600">+{Math.round((property.predictedValue3Y - property.price) / property.price * 100)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((property.predictedValue3Y - property.price) / property.price) * 100}%` }}
                            transition={{ delay: 0.7, duration: 1 }}
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Por Qué Esta Propiedad</p>
                      <ul className="space-y-1">
                        {property.matchReasons.slice(0, 2).map((reason, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                            <ArrowRight className="h-3 w-3 text-purple-600 mt-0.5 shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button className="w-full gap-2">
                      <Building className="h-4 w-4" />
                      Ver Detalles
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
