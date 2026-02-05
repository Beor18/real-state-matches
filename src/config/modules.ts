// Module Configuration for Smarlin (Smart Real Estate Intelligence System)
// Defines all available modules that can be enabled/disabled by admin

export type ModuleCategory = 'sreis-engines' | 'marketing' | 'notifications' | 'general' | 'pages'

export interface ModuleConfig {
  key: string
  name: string
  shortName: string
  description: string
  category: ModuleCategory
  icon: string // Lucide icon name
  color: string // Tailwind color class
  features: string[]
  requiredPlan?: 'starter' | 'pro' | 'vip'
  dependencies?: string[] // Other module keys this depends on
  apiEndpoint?: string
  componentPath?: string
}

// All Smarlin Modules Definition
export const MODULES: Record<string, ModuleConfig> = {
  'demand-prediction': {
    key: 'demand-prediction',
    name: 'Motor de Predicción de Demanda',
    shortName: 'Predicción',
    description: 'Analiza tendencias del mercado, migración poblacional y sentimiento social para predecir zonas de alta demanda inmobiliaria.',
    category: 'sreis-engines',
    icon: 'TrendingUp',
    color: 'bg-blue-500',
    features: [
      'Análisis de tendencias de mercado',
      'Patrones de migración poblacional',
      'Sentimiento de redes sociales',
      'Identificación de zonas calientes',
      'Predicciones de demanda por área'
    ],
    requiredPlan: 'pro',
    apiEndpoint: '/api/ai/demand',
    componentPath: '@/components/reai/DemandPredictionEngine'
  },
  'lifestyle-matcher': {
    key: 'lifestyle-matcher',
    name: 'Motor Lifestyle & Purpose Matcher',
    shortName: 'Lifestyle Match',
    description: 'Conecta el estilo de vida ideal del usuario con propiedades que se alinean a su visión de vida mediante IA.',
    category: 'sreis-engines',
    icon: 'Heart',
    color: 'bg-pink-500',
    features: [
      'Análisis de estilo de vida',
      'Match semántico con propiedades',
      'Recomendaciones personalizadas',
      'Perfil de preferencias',
      'Score de compatibilidad'
    ],
    requiredPlan: 'starter',
    apiEndpoint: '/api/ai/lifestyle',
    componentPath: '@/components/reai/LifestyleEngine'
  },
  'purpose-engine': {
    key: 'purpose-engine',
    name: 'Motor Purpose & Structure',
    shortName: 'Propósito',
    description: 'Evalúa propiedades para determinar usos alternativos: Airbnb, oficina, desarrollo, análisis de zonificación.',
    category: 'sreis-engines',
    icon: 'Building2',
    color: 'bg-purple-500',
    features: [
      'Análisis de uso alternativo',
      'Potencial Airbnb/alquiler',
      'Evaluación para oficina/comercio',
      'Análisis de zonificación',
      'Oportunidades de desarrollo'
    ],
    requiredPlan: 'pro',
    dependencies: ['lifestyle-matcher'],
    componentPath: '@/components/reai/PurposeEngine'
  },
  'equity-forecast': {
    key: 'equity-forecast',
    name: 'Motor Equity & Value Forecast',
    shortName: 'Plusvalía',
    description: 'Proyecta plusvalía a 1, 3, 5 y 10 años con recomendaciones de remodelación para maximizar valor.',
    category: 'sreis-engines',
    icon: 'LineChart',
    color: 'bg-green-500',
    features: [
      'Proyección de valor a 1, 3, 5 y 10 años',
      'Análisis de propiedades subvaloradas',
      'Tips de remodelación ROI',
      'Comparables de mercado',
      'Tendencias de apreciación'
    ],
    requiredPlan: 'pro',
    apiEndpoint: '/api/ai/equity',
    componentPath: '@/components/reai/EquityForecast'
  },
  'viral-content': {
    key: 'viral-content',
    name: 'Generador de Contenido Viral',
    shortName: 'Contenido',
    description: 'Crea contenido optimizado para redes sociales: posts, stories, scripts para lives y videos.',
    category: 'marketing',
    icon: 'Sparkles',
    color: 'bg-orange-500',
    features: [
      'Posts para Instagram/Facebook',
      'Stories con hooks virales',
      'Scripts para TikTok/Reels',
      'Guiones para Lives',
      'Hashtags optimizados'
    ],
    requiredPlan: 'vip',
    apiEndpoint: '/api/ai/content',
    componentPath: '@/components/reai/ContentGenerator'
  },
  'property-alerts': {
    key: 'property-alerts',
    name: 'Sistema de Alertas Inteligentes',
    shortName: 'Alertas',
    description: 'Notificaciones automáticas sobre bajadas de precio, nuevos listados y zonas calientes.',
    category: 'notifications',
    icon: 'Bell',
    color: 'bg-yellow-500',
    features: [
      'Alertas de bajada de precio',
      'Nuevos listados que hacen match',
      'Zonas calientes detectadas',
      'Propiedades subvaloradas',
      'Notificaciones personalizables'
    ],
    requiredPlan: 'starter',
    componentPath: '@/components/reai/AlertsManager'
  }
}

// Get modules by category
export const getModulesByCategory = (category: ModuleCategory): ModuleConfig[] => {
  return Object.values(MODULES).filter(m => m.category === category)
}

// Get all module keys
export const getAllModuleKeys = (): string[] => {
  return Object.keys(MODULES)
}

// Get Smarlin engine modules only
export const getSmarlinEngines = (): ModuleConfig[] => {
  return getModulesByCategory('sreis-engines')
}

// Category metadata for display
export const MODULE_CATEGORIES: Record<ModuleCategory, { name: string; description: string; icon: string }> = {
  'sreis-engines': {
    name: 'Motores Smarlin',
    description: 'Los 4 motores principales de inteligencia inmobiliaria',
    icon: 'Brain'
  },
  'marketing': {
    name: 'Marketing',
    description: 'Herramientas para promoción y contenido',
    icon: 'Megaphone'
  },
  'notifications': {
    name: 'Notificaciones',
    description: 'Alertas y comunicaciones automatizadas',
    icon: 'BellRing'
  },
  'general': {
    name: 'General',
    description: 'Funcionalidades generales del sistema',
    icon: 'Settings'
  },
  'pages': {
    name: 'Páginas Públicas',
    description: 'Control de visibilidad de páginas de la aplicación',
    icon: 'FileText'
  }
}


