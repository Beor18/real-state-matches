# Real Estate Intelligence Ecosystem (REAI)

Una plataforma de IA completa para bienes raíces en Puerto Rico y Latinoamérica que predice tendencias, matchea propiedades por estilo de vida, y proyecta plusvalía.

## 🚀 Características Principales

### 1. **Demand Prediction Engine**
- Análisis de zonas infravaloradas
- Predicción de patrones migratorios
- Análisis de sentimiento de fanbase (315k+ usuarios)
- Detección de zonas hot en tiempo real
- Proyecciones de crecimiento 1-10 años

### 2. **Lifestyle Match**
- Sistema de matching basado en embeddings semánticos
- Formulario intuitivo "Describe tu vida ideal"
- Score de compatibilidad detallado
- Recomendaciones personalizadas
- Razones por las que cada propiedad es perfecta para ti

### 3. **Equity Forecast**
- Proyecciones de valor a 3, 5 y 10 años
- Recomendaciones de remodelación con ROI calculado
- Análisis de zonificación
- Oportunidades de desarrollo
- Gráficos interactivos de crecimiento

### 4. **Engagement Hub**
- Generador de contenido viral con IA
- Posts, stories, scripts de video y lives
- Alertas en tiempo real de oportunidades
- Análisis de potencial viral
- Optimización para múltiples plataformas (Instagram, Facebook, TikTok, YouTube, LinkedIn)

### 5. **Monetización**
- Planes de suscripción ($29-$99/mes)
- Consultorías 1:1 ($200-$350)
- Sistema de comisiones por referidos
- Integración con Stripe (ready para implementar)

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15** con App Router
- **TypeScript 5** (type-safe)
- **Tailwind CSS 4** (estilos)
- **shadcn/ui** (componentes UI)
- **Framer Motion** (animaciones)
- **Recharts** (gráficos)
- **Zustand** (estado cliente)
- **TanStack Query** (estado servidor)

### Backend
- **Next.js API Routes** (REST API)
- **Prisma ORM** con SQLite
- **z-ai-web-dev-sdk** (IA: LLM, VLM, Web Search)
- **TypeScript** (type-safe)

### Base de Datos
- **SQLite** con Prisma
- Modelos: User, Property, PropertyPrediction, LifestyleProfile, PropertyMatch, Subscription, ViralContent, Alert

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/                 # API Routes
│   │   ├── demand/         # Demand Prediction
│   │   ├── lifestyle/      # Lifestyle Match
│   │   ├── equity/         # Equity Forecast
│   │   ├── engagement/     # Viral Content & Alerts
│   │   └── monetization/   # Subscriptions
│   ├── layout.tsx
│   ├── page.tsx            # Página principal
│   └── globals.css
├── components/
│   ├── reai/               # Componentes REAI
│   │   ├── REAIPlatform.tsx
│   │   ├── DemandPredictionEngine.tsx
│   │   ├── LifestyleMatch.tsx
│   │   ├── EquityForecast.tsx
│   │   ├── EngagementHub.tsx
│   │   └── MonetizationSection.tsx
│   └── ui/                 # shadcn/ui components
├── services/
│   └── ai/                 # AI Services (z-ai-web-dev-sdk)
│       └── aiServices.ts
├── store/
│   └── index.ts            # Zustand store
└── lib/
    ├── db.ts               # Prisma client
    └── utils.ts            # Utilities

prisma/
└── schema.prisma           # Database schema
```

## 🚀 Getting Started

### Prerequisites
- Bun (runtime de JavaScript)
- Node.js 18+ (opcional)

### Instalación

1. Clonar el repositorio
```bash
cd /home/z/my-project
```

2. Instalar dependencias
```bash
bun install
```

3. Configurar variables de entorno
```bash
# .env file
DATABASE_URL="file:./db/custom.db"
OPENAI_API_KEY="tu_key_aqui"
```

4. Inicializar base de datos
```bash
bun run db:push
```

5. Iniciar servidor de desarrollo
```bash
bun run dev
```

6. Abrir en navegador
```
http://localhost:3000
```

## 📊 API Endpoints

### Demand Prediction
- `GET /api/demand/predictions?city=Dorado&limit=10`
- Obtiene predicciones de demanda por zona

### Lifestyle Match
- `POST /api/lifestyle/match`
- Body: `{ idealLifeDescription, priorities, budget, location }`
- Retorna propiedades matcheadas por estilo de vida

### Equity Forecast
- `GET /api/equity/forecast?propertyId=123`
- Obtiene proyecciones de plusvalía y recomendaciones

### Engagement
- `POST /api/engagement/generate`
- Body: `{ contentType, prompt, targetAudience, platform }`
- Genera contenido viral con IA

- `GET /api/engagement/alerts?userId=123&unreadOnly=true`
- Obtiene alertas de oportunidades

### Monetization
- `POST /api/monetization/subscribe`
- Body: `{ planId, userId, paymentMethodId }`
- Crea suscripción (integración Stripe preparada)

## 🎨 Componentes UI

### REAIPlatform
Componente principal con navegación y layout completo.

### DemandPredictionEngine
Visualización de zonas predichas con mapas de calor, sentimiento de fanbase, y tendencias migratorias.

### LifestyleMatch
Formulario interactivo para crear perfil de estilo de vida y ver propiedades matcheadas.

### EquityForecast
Gráficos interactivos de proyección de valor, recomendaciones de remodelación con ROI, y análisis de zonificación.

### EngagementHub
Generador de contenido viral y sistema de alertas en tiempo real.

### MonetizationSection
Tarjetas de precios, planes de suscripción, y consultorías 1:1.

## 🤖 Servicios de IA

### LifestyleMatchService
Analiza perfiles de estilo de vida usando LLM de OpenAI/GPT-4o para extraer keywords, embeddings, y resúmenes.

### ViralContentService
Genera contenido viral optimizado para diferentes plataformas usando análisis de tendencias y engagement.

### DemandAnalysisService
Analiza demanda de mercado considerando factores como migración, infraestructura, precios, y sentimiento social.

### WebSearchService
Busca datos de mercado en tiempo real para complementar análisis.

## 💡 Casos de Uso

### Para Inversionistas
- Identificar zonas infravaloradas
- Proyectar ROI a 10 años
- Recibir alertas de oportunidades

### Para Compradores
- Encontrar propiedades que matcheen su estilo de vida
- Entender el potencial de valorización
- Recibir recomendaciones de remodelación

### Para Agentes
- Generar contenido viral automáticamente
- Crear scripts para lives y videos
- Analizar tendencias de mercado

## 🔒 Seguridad

- Validación de inputs en API routes
- Type-safe con TypeScript
- Sanitización de datos del usuario
- Preparado para autenticación con NextAuth.js

## 🚀 Próximos Pasos

1. **Integración con IDX/MLS Real**
   - Conectar con Showcase IDX o RESO Web API
   - Sincronización automática de propiedades
   - Actualización en tiempo real

2. **Autenticación Completa**
   - Implementar NextAuth.js
   - Perfiles de usuario
   - Gestión de sesiones

3. **Pagos con Stripe**
   - Implementar webhooks
   - Gestión de suscripciones
   - Portal de cliente

4. **Features Avanzadas**
   - Chatbot con IA para consultas
   - Generación de imágenes de propiedades con VLM
   - Análisis de documentos con PDF AI
   - Sistema de referidos completo

5. **Analytics y Dashboards**
   - Tracking de usuario con TanStack Query
   - Analíticas de engagement
   - Reportes automatizados

## 📝 Notas Técnicas

- El proyecto usa el puerto 3000 (configurado en Next.js)
- z-ai-web-dev-sdk solo se usa en backend (API routes)
- Todas las rutas son relativas (sin puertos en URLs)
- La base de datos usa SQLite (fácil para desarrollo)
- Preparado para migrar a PostgreSQL + Supabase en producción

## 🤝 Contribución

Este es un MVP funcional. Para contribuir:

1. Fork del proyecto
2. Crear feature branch
3. Commit con mensajes claros
4. Pull request con descripción detallada

## 📄 Licencia

© 2025 Real Estate Intelligence Ecosystem. Todos los derechos reservados.

---

**Desarrollado con ❤️ usando Next.js 15, TypeScript, y z-ai-web-dev-sdk**
