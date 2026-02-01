'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import {
  TrendingUp,
  DollarSign,
  Home,
  ArrowRight,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Calculator
} from 'lucide-react'

interface EquityData {
  year: string
  propertyValue: number
  equity: number
  loanBalance: number
}

interface PropertyEquity {
  id: string
  title: string
  address: string
  currentValue: number
  predictedValue1Y: number
  predictedValue3Y: number
  predictedValue5Y: number
  predictedValue10Y: number
  equityData: EquityData[]
  confidence: number
  remodelTips: RemodelTip[]
  zoningInfo: ZoningInfo
}

interface RemodelTip {
  name: string
  description: string
  estimatedCost: number
  estimatedRoi: number
  priority: 'high' | 'medium' | 'low'
  timeframe: string
}

interface ZoningInfo {
  currentZone: string
  allowedUses: string[]
  developmentOpportunities: string[]
  restrictions: string[]
}

export default function EquityForecast() {
  const [selectedProperty, setSelectedProperty] = useState<number>(0)
  const [projectionYear, setProjectionYear] = useState<'1y' | '3y' | '5y' | '10y'>('5y')
  const [properties, setProperties] = useState<PropertyEquity[]>([])

  useEffect(() => {
    setProperties(mockProperties)
  }, [])

  const mockProperties: PropertyEquity[] = [
    {
      id: '1',
      title: 'Villa Costera Moderna',
      address: 'Calle del Sol, Dorado',
      currentValue: 485000,
      predictedValue1Y: 543200,
      predictedValue3Y: 620800,
      predictedValue5Y: 783500,
      predictedValue10Y: 1242000,
      confidence: 87,
      equityData: generateEquityData(485000),
      remodelTips: [
        {
          name: 'Instalación de Piscina Infinita',
          description: 'Piscina infinita con vista al mar, aumentará significativamente el valor de la propiedad en zona turística',
          estimatedCost: 85000,
          estimatedRoi: 120,
          priority: 'high',
          timeframe: '6-8 meses'
        },
        {
          name: 'Renovación de Cocina Gourmet',
          description: 'Cocina de lujo con isleta central y electrodomésticos de alta gama',
          estimatedCost: 45000,
          estimatedRoi: 85,
          priority: 'medium',
          timeframe: '3-4 meses'
        },
        {
          name: 'Sistema de Energía Solar',
          description: 'Paneles solares completos con batería de respaldo, atractivo para compradores conscientes del ambiente',
          estimatedCost: 25000,
          estimatedRoi: 95,
          priority: 'medium',
          timeframe: '2-3 meses'
        },
        {
          name: 'Jardín Tropical Diseñado',
          description: 'Jardín con plantas nativas, iluminación exterior y área de entretenimiento',
          estimatedCost: 15000,
          estimatedRoi: 70,
          priority: 'low',
          timeframe: '4-6 semanas'
        }
      ],
      zoningInfo: {
        currentZone: 'Residencial R-2',
        allowedUses: ['Vivienda unifamiliar', 'Vivienda bifamiliar', 'Bed & Breakfast'],
        developmentOpportunities: [
          'Posibilidad de convertir a B&B con permisos',
          'Densificación permitida hasta 2 unidades',
          'Alojamiento turístico con licencia municipal'
        ],
        restrictions: [
          'Altura máxima de 2 pisos',
          'Distancia mínima de 3 metros del límite',
          'No permite uso comercial mayor'
        ]
      }
    },
    {
      id: '2',
      title: 'Penthouse Urbano',
      address: 'Avenida Ashford, Condado',
      currentValue: 625000,
      predictedValue1Y: 681250,
      predictedValue3Y: 762500,
      predictedValue5Y: 937500,
      predictedValue10Y: 1375000,
      confidence: 82,
      equityData: generateEquityData(625000),
      remodelTips: [
        {
          name: 'Sistema de Domótica Completo',
          description: 'Control inteligente de iluminación, climatización y seguridad',
          estimatedCost: 18000,
          estimatedRoi: 90,
          priority: 'medium',
          timeframe: '3-4 semanas'
        },
        {
          name: 'Terraza Transformada',
          description: 'Terraza con jacuzzi, cocina exterior y zona de estar premium',
          estimatedCost: 35000,
          estimatedRoi: 75,
          priority: 'high',
          timeframe: '2-3 meses'
        },
        {
          name: 'Renovación de Baños de Lujo',
          description: 'Baños con acabados de mármol, duchas rain y tecnología inteligente',
          estimatedCost: 28000,
          estimatedRoi: 68,
          priority: 'medium',
          timeframe: '2-3 meses'
        }
      ],
      zoningInfo: {
        currentZone: 'Mixto Urbano MU-1',
        allowedUses: ['Residencial', 'Comercio menor', 'Oficina', 'Turismo'],
        developmentOpportunities: [
          'Alquiler a corto plazo (Airbnb) permitido',
          'Uso profesional mixto',
          'Desarrollo de servicios asociados'
        ],
        restrictions: [
          'Cumplimiento de normativa turística',
          'Limitación de ruidos según horario',
          'Espacios de estacionamiento mínimos'
        ]
      }
    }
  ]

  function generateEquityData(baseValue: number): EquityData[] {
    const years = [
      { label: 'Ahora', multiplier: 1 },
      { label: 'Año 1', multiplier: 1.12 },
      { label: 'Año 3', multiplier: 1.28 },
      { label: 'Año 5', multiplier: 1.61 },
      { label: 'Año 10', multiplier: 2.56 }
    ]

    return years.map((year) => ({
      year: year.label,
      propertyValue: Math.round(baseValue * year.multiplier),
      equity: Math.round(baseValue * year.multiplier * 0.7),
      loanBalance: Math.round(baseValue * year.multiplier * 0.3)
    }))
  }

  const currentProperty = properties[selectedProperty]

  if (!currentProperty) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <Badge variant="outline" className="gap-2 mb-4">
          <BarChart3 className="h-3 w-3 text-emerald-500" />
          Equity Forecast Engine
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Proyección de Plusvalía y ROI
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Predice el crecimiento de valor de tu propiedad en 3-10 años, recibe recomendaciones de remodelación
          con ROI calculado, y entiende la zonificación para maximizar retornos
        </p>
      </motion.div>

      {/* Property Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-2 gap-4"
      >
        {properties.map((property, index) => (
          <Card
            key={property.id}
            className={`cursor-pointer transition-all border-2 ${
              selectedProperty === index
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'hover:border-emerald-300'
            }`}
            onClick={() => setSelectedProperty(index)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold">{property.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    {property.address}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {property.confidence}% confianza
                    </Badge>
                    <Badge className="text-xs bg-emerald-500">
                      +{Math.round((property.predictedValue5Y - property.currentValue) / property.currentValue * 100)}% en 5 años
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600">
                    ${(property.predictedValue5Y / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs text-muted-foreground">Valor 5A</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Projections Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Proyección de Valor</CardTitle>
                <CardDescription>
                  Predicciones de crecimiento basadas en análisis de mercado, tendencias históricas y datos de 315k+ usuarios
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {(['1y', '3y', '5y', '10y'] as const).map((year) => (
                  <Button
                    key={year}
                    variant={projectionYear === year ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProjectionYear(year)}
                    className={projectionYear === year ? 'bg-emerald-600' : ''}
                  >
                    {year.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="chart" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chart">Gráfico de Proyección</TabsTrigger>
                <TabsTrigger value="summary">Resumen de Valores</TabsTrigger>
              </TabsList>

              <TabsContent value="chart" className="space-y-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={currentProperty.equityData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="year" className="text-sm" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} className="text-sm" />
                      <Tooltip
                        formatter={(value: number) => `$${value.toLocaleString('en-US')}`}
                        labelStyle={{ color: '#000' }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="propertyValue"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.2}
                        name="Valor de Propiedad"
                        strokeWidth={3}
                      />
                      <Area
                        type="monotone"
                        dataKey="equity"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.2}
                        name="Equity (70% estimado)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2 p-4 rounded-lg bg-background border-2">
                    <p className="text-sm text-muted-foreground">Valor Actual</p>
                    <p className="text-3xl font-bold">${currentProperty.currentValue.toLocaleString('en-US')}</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-lg bg-background border-2">
                    <p className="text-sm text-muted-foreground">Predicción 1A</p>
                    <p className="text-3xl font-bold text-emerald-600">${currentProperty.predictedValue1Y.toLocaleString('en-US')}</p>
                    <Badge className="text-xs">+{Math.round((currentProperty.predictedValue1Y - currentProperty.currentValue) / currentProperty.currentValue * 100)}%</Badge>
                  </div>
                  <div className="space-y-2 p-4 rounded-lg bg-background border-2">
                    <p className="text-sm text-muted-foreground">Predicción 3A</p>
                    <p className="text-3xl font-bold text-emerald-600">${currentProperty.predictedValue3Y.toLocaleString('en-US')}</p>
                    <Badge className="text-xs">+{Math.round((currentProperty.predictedValue3Y - currentProperty.currentValue) / currentProperty.currentValue * 100)}%</Badge>
                  </div>
                  <div className="space-y-2 p-4 rounded-lg bg-background border-2">
                    <p className="text-sm text-muted-foreground">Predicción 10A</p>
                    <p className="text-3xl font-bold text-purple-600">${currentProperty.predictedValue10Y.toLocaleString('en-US')}</p>
                    <Badge className="text-xs">+{Math.round((currentProperty.predictedValue10Y - currentProperty.currentValue) / currentProperty.currentValue * 100)}%</Badge>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Remodel Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Recomendaciones de Remodelación</CardTitle>
                <CardDescription>
                  Mejoras calculadas con ROI estimado para maximizar el valor de tu propiedad
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {currentProperty.remodelTips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Card className="border-2 hover:shadow-lg transition-all">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-amber-500" />
                            {tip.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">{tip.description}</p>
                        </div>
                        <Badge
                          className={`gap-1 ${
                            tip.priority === 'high' ? 'bg-red-500' :
                            tip.priority === 'medium' ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`}
                        >
                          {tip.priority === 'high' ? 'Alta' : tip.priority === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Costo</p>
                          <p className="font-semibold text-sm">${tip.estimatedCost.toLocaleString('en-US')}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">ROI</p>
                          <p className={`font-semibold text-sm ${tip.estimatedRoi > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {tip.estimatedRoi}%
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Tiempo</p>
                          <p className="font-semibold text-sm">{tip.timeframe}</p>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full gap-2 text-sm">
                        <Calculator className="h-4 w-4" />
                        Ver Calculadora Detallada
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Zoning Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Información de Zonificación</CardTitle>
                <CardDescription>
                  Comprende el potencial de desarrollo y restricciones de tu propiedad
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Usos Permitidos
                </h4>
                <ul className="space-y-1">
                  {currentProperty.zoningInfo.allowedUses.map((use, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">✓</span>
                      <span>{use}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Oportunidades
                </h4>
                <ul className="space-y-1">
                  {currentProperty.zoningInfo.developmentOpportunities.map((opp, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-blue-500 mt-1">→</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Restricciones
                </h4>
                <ul className="space-y-1">
                  {currentProperty.zoningInfo.restrictions.map((rest, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-amber-500 mt-1">!</span>
                      <span>{rest}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Zona Actual</p>
                  <p className="font-bold text-lg">{currentProperty.zoningInfo.currentZone}</p>
                </div>
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Ver Análisis de Zonificación Completo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
