# REAI - Real Estate Intelligence Platform

Una plataforma de inteligencia inmobiliaria con IA para Puerto Rico y Latinoamérica. Predice tendencias, encuentra tu hogar ideal por estilo de vida, y proyecta plusvalía.

## Stack Tecnológico

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion
- **Backend**: Next.js API Routes
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth (Magic Link)
- **Pagos**: Stripe / Mercado Pago
- **IA**: OpenAI GPT-4o
- **Propiedades**: Showcase IDX Integration

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env.local` con las siguientes variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (crear en Stripe Dashboard)
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_VIP=price_...

# Mercado Pago (alternativa a Stripe para Argentina/LATAM)
MP_ACCESS_TOKEN=APP_USR-xxx
MP_PUBLIC_KEY=APP_USR-xxx
MP_WEBHOOK_SECRET=opcional_secret

# Showcase IDX (opcional - usa mock data si no está configurado)
SHOWCASE_IDX_API_KEY=tu-api-key
SHOWCASE_IDX_API_URL=https://api.showcaseidx.com/v2

# OpenAI
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ve al SQL Editor y ejecuta el contenido de `supabase/migrations/001_initial_schema.sql`
3. (Opcional) Ejecuta `supabase/seed.sql` para datos de ejemplo
4. Habilita la autenticación por email en Authentication > Providers > Email

### 3. Configuración de Stripe

1. Crea una cuenta en [Stripe](https://stripe.com)
2. En el Dashboard de Stripe (modo test):
   - Crea 3 productos con precios recurrentes:
     - Starter: $29/mes
     - Pro: $49/mes
     - VIP: $99/mes
3. Copia los Price IDs a las variables de entorno
4. Configura un webhook endpoint: `https://tu-dominio.com/api/stripe/webhook`
   - Eventos a escuchar:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

### 3b. Configuración de Mercado Pago (Alternativa)

1. Crea una cuenta en [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
2. Crea una aplicación en el Panel de Desarrolladores
3. Obtén tu Access Token y Public Key (credenciales de producción o sandbox)
4. Configura un webhook endpoint: `https://tu-dominio.com/api/mercadopago/webhook`
   - Eventos a escuchar:
     - `subscription_preapproval`
     - `subscription_authorized_payment`
     - `payment`
5. Desde el Admin Panel (`/admin/settings`):
   - Verifica la conexión con el botón "Probar Conexión"
   - Crea los planes de suscripción con "Crear Planes en MP"
   - Selecciona Mercado Pago como gateway activo

### 4. Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Para escuchar webhooks de Stripe localmente
npm run stripe:listen
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── ai/                    # Endpoints de IA
│   │   │   ├── content/           # Generación de contenido viral
│   │   │   ├── demand/            # Análisis de demanda
│   │   │   ├── equity/            # Proyección de plusvalía
│   │   │   └── lifestyle/         # Matching de estilo de vida
│   │   ├── properties/            # CRUD de propiedades
│   │   └── stripe/                # Pagos (checkout, webhook, portal)
│   ├── auth/
│   │   ├── callback/              # Magic link callback
│   │   ├── login/                 # Página de login
│   │   └── logout/                # Logout route
│   ├── dashboard/                 # Dashboard del usuario
│   └── subscription/              # Páginas de éxito/cancelación
├── components/
│   ├── auth/                      # AuthProvider y LoginForm
│   ├── reai/                      # Componentes principales
│   │   ├── REAIPlatform.tsx       # Plataforma principal
│   │   ├── DemandPredictionEngine.tsx
│   │   ├── LifestyleMatch.tsx
│   │   ├── EquityForecast.tsx
│   │   ├── EngagementHub.tsx
│   │   └── MonetizationSection.tsx
│   └── ui/                        # shadcn/ui components
├── lib/
│   ├── supabase/                  # Clientes Supabase
│   ├── stripe.ts                  # Cliente Stripe
│   └── openai.ts                  # Cliente OpenAI
├── services/
│   ├── ai/                        # Servicios de IA
│   │   └── openai-services.ts
│   └── showcase-idx/              # Integración IDX
│       └── client.ts
├── types/
│   └── database.ts                # Tipos de la base de datos
└── middleware.ts                  # Protección de rutas
```

## Características Principales

### 1. Autenticación con Magic Link
- Sin contraseñas
- Email con enlace mágico de Supabase
- Sesiones persistentes

### 2. Predicción de Demanda
- Análisis de zonas con IA
- Tendencias migratorias
- Sentimiento del mercado

### 3. Lifestyle Match
- Describe tu vida ideal
- IA encuentra propiedades compatibles
- Score de compatibilidad detallado

### 4. Equity Forecast
- Proyecciones de plusvalía (1-10 años)
- Recomendaciones de remodelación con ROI
- Análisis de zonificación

### 5. Engagement Hub
- Generación de contenido viral con IA
- Posts, stories, scripts de video
- Optimizado para múltiples plataformas

### 6. Suscripciones con Stripe / Mercado Pago
- 3 planes: Starter, Pro, VIP
- Checkout integrado (Stripe o MP según configuración)
- Selector de gateway en Panel Admin
- Portal de cliente para gestión
- Soporte para Argentina/LATAM con Mercado Pago

## Flujos Principales

### Autenticación
1. Usuario ingresa email
2. Recibe magic link por email
3. Click en link → redirect a /auth/callback
4. Sesión creada → redirect a dashboard

### Suscripción
1. Usuario selecciona plan
2. Redirect a Stripe Checkout
3. Pago completado → webhook recibido
4. Suscripción creada en Supabase
5. Redirect a página de éxito

### Matching de Propiedades
1. Usuario describe su vida ideal
2. API analiza perfil con OpenAI
3. Búsqueda semántica de propiedades
4. Retorna matches ordenados por compatibilidad

## Desarrollo Local

```bash
# Terminal 1: Servidor Next.js
npm run dev

# Terminal 2: Stripe webhooks (opcional)
npm run stripe:listen

# Abrir navegador
open http://localhost:3000
```

## Producción

1. Deploy en Vercel:
   ```bash
   vercel deploy
   ```

2. Configurar variables de entorno en Vercel Dashboard

3. Actualizar webhook URL en Stripe Dashboard

4. Configurar dominio personalizado

## Licencia

© 2025 REAI. Todos los derechos reservados.


