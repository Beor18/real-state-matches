'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sparkles,
  TrendingUp,
  Bell,
  Copy,
  Share2,
  Calendar,
  Video,
  FileText,
  AlertCircle,
  CheckCircle,
  Flame,
  Users,
  Clock,
  Download,
  RefreshCw,
  Eye
} from 'lucide-react'

interface ViralPost {
  id: string
  title: string
  content: string
  hook: string
  hashtags: string[]
  contentType: 'post' | 'story' | 'video_script' | 'live_script'
  targetAudience: string
  viralScore: number
  predictedReach: number
  platform: 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin'
  createdAt: Date
}

interface Alert {
  id: string
  type: 'price_drop' | 'new_listing' | 'hot_zone' | 'viral_content' | 'custom'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isRead: boolean
  createdAt: Date
  actionUrl?: string
  actionLabel?: string
}

export default function EngagementHub() {
  const [selectedTab, setSelectedTab] = useState<'viral' | 'alerts'>('viral')
  const [contentType, setContentType] = useState<'post' | 'story' | 'video_script' | 'live_script'>('post')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [viralPosts, setViralPosts] = useState<ViralPost[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    // Mock data
    setViralPosts(mockViralPosts)
    setAlerts(mockAlerts)
  }, [])

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)

    try {
      const response = await fetch('/api/ai/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          prompt,
          targetAudience: 'Inversionistas inmobiliarios en Puerto Rico y Latam',
          platform: 'instagram',
        }),
      })

      const data = await response.json()

      if (data.success && data.content) {
        const newPost: ViralPost = {
          id: data.content.id || Date.now().toString(),
          title: data.content.hook?.slice(0, 50) || 'Contenido IA Generado',
          content: data.content.content,
          hook: data.content.hook || '',
          hashtags: data.content.hashtags || ['#BienesRaicesPR', '#Inversion'],
          contentType,
          targetAudience: 'Inversionistas inmobiliarios en Puerto Rico y Latam',
          viralScore: data.content.viralScore || 80,
          predictedReach: Math.floor((data.content.viralScore || 80) * 1500),
          platform: 'instagram',
          createdAt: new Date()
        }

        setViralPosts([newPost, ...viralPosts])
      } else {
        // Fallback to mock
        const newPost: ViralPost = {
          id: Date.now().toString(),
          title: 'Contenido IA Generado',
          content: generateMockContent(contentType, prompt),
          hook: '🔥 DESCUBRE el SECRETO que los agentes NO quieren que sepas...',
          hashtags: ['#BienesRaicesPR', '#Inversion', '#PuertoRico', '#RealEstate'],
          contentType,
          targetAudience: 'Inversionistas inmobiliarios en Puerto Rico y Latam',
          viralScore: 85 + Math.floor(Math.random() * 15),
          predictedReach: 50000 + Math.floor(Math.random() * 150000),
          platform: 'instagram',
          createdAt: new Date()
        }
        setViralPosts([newPost, ...viralPosts])
      }
    } catch (error) {
      console.error('Error generating content:', error)
      // Fallback to mock on error
      const newPost: ViralPost = {
        id: Date.now().toString(),
        title: 'Contenido IA Generado',
        content: generateMockContent(contentType, prompt),
        hook: '🔥 DESCUBRE el SECRETO que los agentes NO quieren que sepas...',
        hashtags: ['#BienesRaicesPR', '#Inversion', '#PuertoRico', '#RealEstate'],
        contentType,
        targetAudience: 'Inversionistas inmobiliarios en Puerto Rico y Latam',
        viralScore: 85 + Math.floor(Math.random() * 15),
        predictedReach: 50000 + Math.floor(Math.random() * 150000),
        platform: 'instagram',
        createdAt: new Date()
      }
      setViralPosts([newPost, ...viralPosts])
    } finally {
      setIsGenerating(false)
      setPrompt('')
    }
  }

  const generateMockContent = (type: string, prompt: string) => {
    const prompts: Record<string, string> = {
      post: `📢 ${prompt.toUpperCase()} 📢\n\n¿Sabías que esta zona en Puerto Rico ha tenido un crecimiento del 28% en los últimos 3 años? 📈\n\n✅ Oportunidades de inversión únicas\n✅ Zonas infravaloradas con alto potencial\n✅ Migración creciente de profesionales\n\n💡 NO esperes más. El momento es AHORA.\n\n👇 ¿Quieres saber qué propiedades están disponibles? ¡Escríbeme!`,
      story: `🎬 Story Frame 1:\n"¿Listo para descubrir el próximo HOT SPOT?"\n\n🎬 Story Frame 2:\n"Esta zona creció 28% en 3 años 📈"\n\n🎬 Story Frame 3:\n"Oportunidades que no puedes perder"\n\n🎬 Story Frame 4:\n"Responde con 🔥 para más info"`,
      video_script: `🎬 INTRO (0-3s):\n"¿SABÍAS que esta zona de Puerto Rico está BOOMING?"\n\n🎬 CUERPO (3-30s):\n- Mostrar gráfica de crecimiento 28%\n- "Oportunidades de inversión únicas"\n- "Migración creciente de profesionales"\n- "Propiedades desde $185k"\n\n🎬 CTA (30-35s):\n"¡Sígueme para más!"`,
      live_script: `🎬 LIVE SCRIPT\n\n📍 INTRO (0-5min):\n"Bienvenidos! Hoy vamos a descubrir oportunidades de inversión que están explotando en Puerto Rico"\n\n📍 CONTENIDO (5-25min):\n- Análisis de zona en tiempo real\n- Datos de crecimiento\n- Propiedades disponibles\n- Preguntas y respuestas\n\n📍 CTA (25-30min):\n"Si quieres ver estas propiedades, comenta 'ME INTERESA'"`
    }

    return prompts[type] || prompts.post
  }

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleMarkAlertAsRead = (alertId: string) => {
    setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)))
  }

  const mockViralPosts: ViralPost[] = [
    {
      id: '1',
      title: 'Zonas Hot para Inversión 2025',
      content: `🔥 DESCUBRE el SECRETO que los agentes NO quieren que sepas...

¿Sabías que Dorado y Río Piedras están EXPLOTANDO en valor?

📊 DATOS:
• Dorado: +28% en 3 años
• Río Piedras: +35% en 3 años
• Mayagüez: +18% en 3 años

💡 ¿POR QUÉ?
• Nuevos desarrollos turísticos
• Gentrificación en proceso
• Migración de profesionales
• Infraestructura en mejora

🚨 OPORTUNIDAD:
Propiedades desde $185k con alto potencial de apreciación

💬 ¿Quieres saber qué zonas mirar? Escribe "ANÁLISIS" y te envío el reporte completo 📈

#BienesRaicesPR #Inversion #PuertoRico #RealEstate #Propiedades #Inmobiliaria #Tendencias`,
      hook: '🔥 DESCUBRE el SECRETO que los agentes NO quieren que sepas...',
      hashtags: ['#BienesRaicesPR', '#Inversion', '#PuertoRico', '#RealEstate', '#Propiedades'],
      contentType: 'post',
      targetAudience: 'Inversionistas inmobiliarios',
      viralScore: 94,
      predictedReach: 245000,
      platform: 'instagram',
      createdAt: new Date()
    },
    {
      id: '2',
      title: 'Propiedad Infravalorada - Dorado',
      content: `🏠 VILLA MODERNA EN DORADO

📍 Calle del Sol, Dorado Beach

✨ CARACTERÍSTICAS:
• 3 habitaciones, 2.5 baños
• 2,400 sq ft de construcción
• Piscina infinita con vista al mar
• Oficina en casa (perfecta para remoto)
• Paralelo para 3 autos

💰 VALOR:
• Precio actual: $485,000
• Predicción 3 años: $620,800
• Predicción 5 años: $783,500
• ROI proyectado: +61%

🔥 POR QUÉ ESTA PROPIEDAD:
✓ Zona en expansión turística
✓ Proyectos de infraestructura cercanos
✓ Escasez de inventario similar
✓ Demanda de inversores internacionales

⏰ ¡NO ESPERES! Propiedades como esta duran menos de 2 semanas en el mercado.

📩 Escribe "DORADO" para más información y fotos 📸

#VillaDorado #PropiedadPR #Inmobiliaria #RealEstatePuertoRico #DoradoPR #BeachHouse #LuxuryHome`,
      hook: '🏠 VILLA MODERNA EN DORADO',
      hashtags: ['#VillaDorado', '#PropiedadPR', '#Inmobiliaria', '#RealEstatePuertoRico', '#DoradoPR'],
      contentType: 'post',
      targetAudience: 'Compradores de lujo y inversores',
      viralScore: 91,
      predictedReach: 178000,
      platform: 'instagram',
      createdAt: new Date()
    },
    {
      id: '3',
      title: 'Script Live: Oportunidades de Inversión',
      content: `🎬 LIVE SCRIPT: Oportunidades de Inversión 2025

📍 INTRO (0-5min):
"Bienvenidos! Hoy vamos a descubrir las MEJORES oportunidades de inversión inmobiliaria que están EXPLOTANDO en Puerto Rico y Latam. Tenemos datos exclusivos de nuestra comunidad de 315k+ usuarios..."

📍 CONTENIDO (5-25min):
• Zona 1: Dorado (+28% en 3 años)
  - Por qué está en auge
  - Propiedades disponibles desde $450k
  - Proyectos de infraestructura

• Zona 2: Río Piedras (+35% en 3 años)
  - Gentrificación en proceso
  - Cercanía a universidades
  - Potencial de renta

• Zona 3: Mayagüez (+18% en 3 años)
  - Inversión portuaria
  - Costo de vida accesible
  - Crecimiento tecnológico

📍 CTA (25-30min):
"Si quieres ver las propiedades que estoy analizando, comenta 'ME INTERESA' y te envío el reporte completo con precios y fotos. No te pierdas esta oportunidad!"`,
      hook: '🎬 LIVE: Descubre las MEJORES oportunidades de inversión',
      hashtags: ['#Live', '#Investment', '#RealEstate', '#PuertoRico', '#Latam'],
      contentType: 'live_script',
      targetAudience: 'Inversionistas serios y agentes',
      viralScore: 89,
      predictedReach: 125000,
      platform: 'youtube',
      createdAt: new Date()
    }
  ]

  const mockAlerts: Alert[] = [
    {
      id: '1',
      type: 'hot_zone',
      title: '🔥 Nueva Zona Hot Detectada',
      message: 'Río Piedras ha sido identificada como zona infravalorada con alto potencial de crecimiento (+35% en 3 años). Hay 12 propiedades disponibles con precios desde $185k.',
      priority: 'high',
      isRead: false,
      createdAt: new Date(Date.now() - 300000),
      actionUrl: '#demand',
      actionLabel: 'Ver Análisis'
    },
    {
      id: '2',
      type: 'price_drop',
      title: '📉 Precio Reducido - Villa Dorado',
      message: 'La Villa Costera Moderna en Dorado ha reducido su precio de $525k a $485k. Excelente oportunidad para inversión.',
      priority: 'urgent',
      isRead: false,
      createdAt: new Date(Date.now() - 900000),
      actionUrl: '#lifestyle',
      actionLabel: 'Ver Propiedad'
    },
    {
      id: '3',
      type: 'new_listing',
      title: '🏠 Nuevo Listado Premium',
      message: 'Penthouse en Condado con vistas panorámicas al mar disponible. Precio: $625k. Predicción de valor a 5 años: $937k.',
      priority: 'medium',
      isRead: true,
      createdAt: new Date(Date.now() - 1800000)
    },
    {
      id: '4',
      type: 'viral_content',
      title: '✨ Contenido Viral Generado',
      message: 'Hemos generado nuevo contenido viral sobre inversiones en Puerto Rico. Score viral: 94%. Alcance estimado: 245k.',
      priority: 'low',
      isRead: true,
      createdAt: new Date(Date.now() - 3600000)
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
          <Sparkles className="h-3 w-3 text-amber-500" />
          Engagement Hub
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          Contenido Viral y Alertas en Tiempo Real
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Genera posts virales con IA, scripts para lives y videos, y recibe alertas exclusivas sobre
          oportunidades de inversión y tendencias del mercado
        </p>
      </motion.div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'viral' | 'alerts')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="viral" className="gap-2">
            <FileText className="h-4 w-4" />
            Generador de Contenido
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            Alertas ({alerts.filter((a) => !a.isRead).length})
          </TabsTrigger>
        </TabsList>

        {/* Viral Content Tab */}
        <TabsContent value="viral" className="space-y-6 mt-6">
          {/* Generator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-2 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Generador de Contenido Viral IA</CardTitle>
                    <CardDescription>
                      Crea posts, historias, scripts de video y lives optimizados para máximo engagement
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-4 gap-2">
                  {[
                    { id: 'post' as const, label: 'Post', icon: FileText },
                    { id: 'story' as const, label: 'Story', icon: Eye },
                    { id: 'video_script' as const, label: 'Video', icon: Video },
                    { id: 'live_script' as const, label: 'Live', icon: Calendar }
                  ].map((item) => (
                    <Button
                      key={item.id}
                      variant={contentType === item.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setContentType(item.id)}
                      className={contentType === item.id ? 'bg-amber-600' : ''}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  ))}
                </div>

                <Textarea
                  placeholder="Describe qué tipo de contenido quieres generar. Ej: 'Post sobre oportunidades de inversión en Dorado con enfoque en crecimiento de 28%'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-24"
                />

                <Button
                  className="w-full gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generando...
                </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generar Contenido Viral
                </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Generated Posts */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Contenido Generado</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {viralPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="gap-1 bg-amber-500">
                              <Flame className="h-3 w-3" />
                              Score: {post.viralScore}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Users className="h-3 w-3" />
                              {(post.predictedReach / 1000).toFixed(0)}K alcance
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{post.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {post.createdAt.toLocaleTimeString()} • {post.platform}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-amber-600">{post.hook}</p>
                        <div className="bg-muted p-3 rounded-lg">
                          <pre className="text-sm whitespace-pre-wrap font-sans">{post.content}</pre>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {post.hashtags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => handleCopyContent(post.content)}>
                          <Copy className="h-4 w-4" />
                          Copiar
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 gap-2">
                          <Share2 className="h-4 w-4" />
                          Compartir
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          Guardar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Alertas y Notificaciones</CardTitle>
                    <CardDescription>
                      Recibe alertas en tiempo real sobre oportunidades de inversión y tendencias del mercado
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Actualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleMarkAlertAsRead(alert.id)}
                      className={`cursor-pointer transition-all ${
                        !alert.isRead ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <Card className={`hover:shadow-md transition-all ${
                        !alert.isRead ? 'border-amber-300' : ''
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className={
                                alert.priority === 'urgent' ? 'bg-red-500' :
                                alert.priority === 'high' ? 'bg-orange-500' :
                                alert.priority === 'medium' ? 'bg-yellow-500' :
                                'bg-emerald-500'
                              }>
                                <Bell className="h-5 w-5 text-white" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-semibold text-sm">{alert.title}</h4>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {alert.createdAt.toLocaleTimeString()}
                                  </p>
                                </div>
                                {!alert.isRead && (
                                  <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0 mt-2" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{alert.message}</p>
                              {alert.actionLabel && (
                                <Button variant="outline" size="sm" className="text-xs">
                                  {alert.actionLabel}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
