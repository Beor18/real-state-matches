'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Copy,
  Zap,
  Package,
  TestTube,
  Shield,
  Settings,
} from 'lucide-react'

interface StripeConfig {
  secretKey: { configured: boolean; masked: string }
  publishableKey: { configured: boolean; masked: string }
  webhookSecret: { configured: boolean; masked: string }
  mode: 'test' | 'live' | 'unknown'
  webhookUrl: string
}

interface StripeAccount {
  id: string
  businessName: string
  country: string
  defaultCurrency: string
  chargesEnabled: boolean
  payoutsEnabled: boolean
}

interface StripeProduct {
  id: string
  name: string
  active: boolean
}

interface StripePrice {
  id: string
  productId: string
  unitAmount: number
  currency: string
  recurring: { interval: string; intervalCount: number } | null
}

interface MPConfig {
  configured: boolean
  credentials: {
    accessToken: boolean
    publicKey: boolean
    webhookSecret: boolean
  }
  plans: Array<{
    plan_key: string
    name: string
    mp_preapproval_plan_id_monthly: string | null
    mp_preapproval_plan_id_yearly: string | null
  }>
  webhookUrl: string
}

type ActiveGateway = 'stripe' | 'mercadopago'

export default function AdminSettingsPage() {
  const [activeGateway, setActiveGateway] = useState<ActiveGateway>('stripe')
  const [savingGateway, setSavingGateway] = useState(false)
  const [config, setConfig] = useState<StripeConfig | null>(null)
  const [mpConfig, setMpConfig] = useState<MPConfig | null>(null)
  const [account, setAccount] = useState<StripeAccount | null>(null)
  const [products, setProducts] = useState<StripeProduct[]>([])
  const [prices, setPrices] = useState<StripePrice[]>([])
  const [loading, setLoading] = useState(true)
  const [testingConnection, setTestingConnection] = useState(false)
  const [testingMPConnection, setTestingMPConnection] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [creatingMPPlans, setCreatingMPPlans] = useState(false)
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null)
  const [mpConnectionResult, setMpConnectionResult] = useState<{ success: boolean; error?: string } | null>(null)
  const [webhookResult, setWebhookResult] = useState<{ success: boolean; message: string; event?: any } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchAllConfig()
  }, [])

  const fetchAllConfig = async () => {
    try {
      // Fetch payment settings (active gateway)
      const settingsRes = await fetch('/api/admin/payment-settings')
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        setActiveGateway(settingsData.active_gateway || 'stripe')
      }

      // Fetch Stripe config
      const stripeRes = await fetch('/api/admin/stripe')
      const stripeData = await stripeRes.json()
      if (stripeData.success) {
        setConfig(stripeData.config)
      }

      // Fetch MP config
      const mpRes = await fetch('/api/admin/mercadopago')
      if (mpRes.ok) {
        const mpData = await mpRes.json()
        setMpConfig(mpData)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveActiveGateway = async (gateway: ActiveGateway) => {
    setSavingGateway(true)
    try {
      const res = await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active_gateway: gateway }),
      })
      if (res.ok) {
        setActiveGateway(gateway)
      }
    } catch (error) {
      console.error('Error saving gateway:', error)
    } finally {
      setSavingGateway(false)
    }
  }

  const testMPConnection = async () => {
    setTestingMPConnection(true)
    setMpConnectionResult(null)
    try {
      const res = await fetch('/api/admin/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      })
      const data = await res.json()
      setMpConnectionResult(data)
    } catch (error) {
      setMpConnectionResult({ success: false, error: 'Error de conexión' })
    } finally {
      setTestingMPConnection(false)
    }
  }

  const createMPPlans = async () => {
    setCreatingMPPlans(true)
    try {
      const res = await fetch('/api/admin/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_plans' }),
      })
      const data = await res.json()
      if (data.success) {
        // Refresh config to show new plan IDs
        const mpRes = await fetch('/api/admin/mercadopago')
        if (mpRes.ok) {
          const mpData = await mpRes.json()
          setMpConfig(mpData)
        }
      }
    } catch (error) {
      console.error('Error creating MP plans:', error)
    } finally {
      setCreatingMPPlans(false)
    }
  }

  const testConnection = async () => {
    setTestingConnection(true)
    setConnectionResult(null)
    try {
      const res = await fetch('/api/admin/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-connection' }),
      })
      const data = await res.json()
      setConnectionResult({
        success: data.success,
        message: data.message,
      })
      if (data.success && data.account) {
        setAccount(data.account)
      }
    } catch (error) {
      setConnectionResult({
        success: false,
        message: 'Error de conexión',
      })
    } finally {
      setTestingConnection(false)
    }
  }

  const testWebhook = async () => {
    setTestingWebhook(true)
    setWebhookResult(null)
    try {
      const res = await fetch('/api/admin/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-webhook' }),
      })
      const data = await res.json()
      setWebhookResult({
        success: data.success,
        message: data.message,
        event: data.event,
      })
    } catch (error) {
      setWebhookResult({
        success: false,
        message: 'Error al generar evento de prueba',
      })
    } finally {
      setTestingWebhook(false)
    }
  }

  const loadProducts = async () => {
    setLoadingProducts(true)
    try {
      const res = await fetch('/api/admin/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list-products' }),
      })
      const data = await res.json()
      if (data.success) {
        setProducts(data.products || [])
        setPrices(data.prices || [])
      }
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const stripeTestCards = [
    { number: '4242 4242 4242 4242', description: 'Pago exitoso', type: 'success' },
    { number: '4000 0000 0000 3220', description: '3D Secure requerido', type: 'warning' },
    { number: '4000 0000 0000 9995', description: 'Fondos insuficientes', type: 'error' },
    { number: '4000 0000 0000 0002', description: 'Tarjeta rechazada', type: 'error' },
  ]

  // Tarjetas de prueba de Mercado Pago para Argentina
  const mpTestCards = [
    { number: '5031 7557 3453 0604', description: 'Mastercard - Aprobado', type: 'success', cvv: '123' },
    { number: '4509 9535 6623 3704', description: 'Visa - Aprobado', type: 'success', cvv: '123' },
    { number: '3711 803032 57522', description: 'Amex - Aprobado', type: 'success', cvv: '1234' },
    { number: '5031 7557 3453 0604', description: 'Mastercard - Rechazado (usar CVV 456)', type: 'error', cvv: '456' },
  ]

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración de Pagos</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Administra la configuración de pasarelas de pago y realiza pruebas
        </p>
      </div>

      {/* Gateway Selector */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <CardTitle>Gateway de Pago Activo</CardTitle>
          </div>
          <CardDescription>Selecciona qué pasarela de pago utilizar para las suscripciones</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={activeGateway}
            onValueChange={(value) => saveActiveGateway(value as ActiveGateway)}
            className="flex gap-6"
            disabled={savingGateway}
          >
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <RadioGroupItem value="stripe" id="stripe" />
              <Label htmlFor="stripe" className="cursor-pointer flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Stripe</p>
                  <p className="text-xs text-gray-500">Pagos internacionales</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <RadioGroupItem value="mercadopago" id="mercadopago" />
              <Label htmlFor="mercadopago" className="cursor-pointer flex items-center gap-2">
                <div className="h-5 w-5 bg-[#009EE3] rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">MP</span>
                </div>
                <div>
                  <p className="font-medium">Mercado Pago</p>
                  <p className="text-xs text-gray-500">Pagos Argentina/LATAM</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
          {savingGateway && (
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </p>
          )}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>Gateway activo:</strong> {activeGateway === 'stripe' ? 'Stripe' : 'Mercado Pago'}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              Los nuevos pagos se procesarán con este gateway. Los pagos existentes mantienen su gateway original.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Estado de Configuración */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <CardTitle>Estado de Stripe</CardTitle>
              </div>
              {config && (
                <Badge
                  variant={config.mode === 'test' ? 'secondary' : config.mode === 'live' ? 'default' : 'outline'}
                  className={
                    config.mode === 'test'
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      : config.mode === 'live'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : ''
                  }
                >
                  {config.mode === 'test' ? '🧪 Modo Test' : config.mode === 'live' ? '🔴 Modo Live' : 'Desconocido'}
                </Badge>
              )}
            </div>
            <CardDescription>Variables de entorno y estado de la conexión</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config && (
              <>
                {/* Secret Key */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {config.secretKey.configured ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">STRIPE_SECRET_KEY</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {config.secretKey.masked || 'No configurada'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Publishable Key */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {config.publishableKey.configured ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {config.publishableKey.masked || 'No configurada'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Webhook Secret */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {config.webhookSecret.configured ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">STRIPE_WEBHOOK_SECRET</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {config.webhookSecret.masked || 'No configurada'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Test Connection Button */}
                <Button
                  onClick={testConnection}
                  disabled={testingConnection}
                  className="w-full"
                  variant="outline"
                >
                  {testingConnection ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Probando conexión...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Probar Conexión
                    </>
                  )}
                </Button>

                {connectionResult && (
                  <div
                    className={`p-3 rounded-lg ${
                      connectionResult.success
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}
                  >
                    <p className="font-medium text-sm">{connectionResult.message}</p>
                    {account && (
                      <div className="mt-2 text-xs space-y-1">
                        <p>ID: {account.id}</p>
                        <p>Negocio: {account.businessName}</p>
                        <p>País: {account.country?.toUpperCase()}</p>
                        <p>Moneda: {account.defaultCurrency?.toUpperCase()}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Webhook Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <CardTitle>Webhooks</CardTitle>
            </div>
            <CardDescription>Configuración y prueba de webhooks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    URL del Webhook
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                      {config.webhookUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(config.webhookUrl)}
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <strong>Para desarrollo local:</strong>
                  </p>
                  <code className="text-xs mt-1 block text-blue-600 dark:text-blue-300">
                    stripe listen --forward-to localhost:3000/api/stripe/webhook
                  </code>
                </div>

                <Separator />

                <Button
                  onClick={testWebhook}
                  disabled={testingWebhook}
                  className="w-full"
                  variant="outline"
                >
                  {testingWebhook ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando evento...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Generar Evento de Prueba
                    </>
                  )}
                </Button>

                {webhookResult && (
                  <div
                    className={`p-3 rounded-lg ${
                      webhookResult.success
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}
                  >
                    <p className="font-medium text-sm">{webhookResult.message}</p>
                    {webhookResult.event && (
                      <pre className="mt-2 text-xs overflow-x-auto bg-white/50 dark:bg-black/20 p-2 rounded">
                        {JSON.stringify(webhookResult.event, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Products & Prices from Stripe */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <CardTitle>Productos en Stripe</CardTitle>
              </div>
              <Button size="sm" variant="outline" onClick={loadProducts} disabled={loadingProducts}>
                {loadingProducts ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            <CardDescription>Productos y precios configurados en tu cuenta de Stripe</CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 && prices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Haz clic en el botón para cargar productos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{product.name}</p>
                      <Badge variant={product.active ? 'default' : 'secondary'}>
                        {product.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-1">{product.id}</p>
                    <div className="mt-2 space-y-1">
                      {prices
                        .filter((p) => p.productId === product.id)
                        .map((price) => (
                          <div key={price.id} className="flex items-center justify-between text-xs">
                            <span className="font-mono text-gray-500">{price.id}</span>
                            <span>
                              ${(price.unitAmount / 100).toFixed(2)} {price.currency.toUpperCase()}
                              {price.recurring && ` / ${price.recurring.interval}`}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stripe Test Cards */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              <CardTitle>Tarjetas de Prueba - Stripe</CardTitle>
            </div>
            <CardDescription>Usa estas tarjetas para probar diferentes escenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stripeTestCards.map((card) => (
                <div
                  key={card.number}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        card.type === 'success'
                          ? 'bg-green-500'
                          : card.type === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <div>
                      <p className="font-mono text-sm">{card.number}</p>
                      <p className="text-xs text-gray-500">{card.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(card.number.replace(/\s/g, ''))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong>Fecha de expiración:</strong> Cualquier fecha futura (ej: 12/34)
              </p>
              <p>
                <strong>CVC:</strong> Cualquier 3 dígitos (ej: 123)
              </p>
              <p>
                <strong>ZIP:</strong> Cualquier código postal válido
              </p>
            </div>

            <Separator className="my-4" />

            <Button variant="outline" className="w-full" asChild>
              <a
                href="https://dashboard.stripe.com/test/payments"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Dashboard de Stripe
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Mercado Pago Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-[#009EE3] rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">MP</span>
                </div>
                <CardTitle>Estado de Mercado Pago</CardTitle>
              </div>
              {mpConfig?.configured && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Configurado
                </Badge>
              )}
            </div>
            <CardDescription>Variables de entorno y estado de la conexión</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mpConfig && (
              <>
                {/* Access Token */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {mpConfig.credentials.accessToken ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">MP_ACCESS_TOKEN</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {mpConfig.credentials.accessToken ? '***configurado***' : 'No configurada'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Public Key */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {mpConfig.credentials.publicKey ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">MP_PUBLIC_KEY</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {mpConfig.credentials.publicKey ? '***configurado***' : 'No configurada'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Webhook Secret */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {mpConfig.credentials.webhookSecret ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">MP_WEBHOOK_SECRET</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {mpConfig.credentials.webhookSecret ? '***configurado***' : 'Opcional'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Test Connection Button */}
                <Button
                  onClick={testMPConnection}
                  disabled={testingMPConnection}
                  className="w-full"
                  variant="outline"
                >
                  {testingMPConnection ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Probando conexión...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Probar Conexión
                    </>
                  )}
                </Button>

                {mpConnectionResult && (
                  <div
                    className={`p-3 rounded-lg ${
                      mpConnectionResult.success
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}
                  >
                    <p className="font-medium text-sm">
                      {mpConnectionResult.success ? 'Conexión exitosa' : mpConnectionResult.error}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Mercado Pago Webhook */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#009EE3]" />
              <CardTitle>Webhooks - Mercado Pago</CardTitle>
            </div>
            <CardDescription>Configuración de webhooks para notificaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mpConfig && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    URL del Webhook
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                      {mpConfig.webhookUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(mpConfig.webhookUrl)}
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <strong>Configura este webhook en:</strong>
                  </p>
                  <a 
                    href="https://www.mercadopago.com.ar/developers/panel/app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-300 underline"
                  >
                    Panel de Desarrolladores → Tu Aplicación → Webhooks
                  </a>
                </div>

                <Separator />

                {/* Plans in MP */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Planes de Suscripción en MP
                  </label>
                  <div className="mt-2 space-y-2">
                    {mpConfig.plans.length === 0 ? (
                      <p className="text-xs text-gray-500">No hay planes configurados</p>
                    ) : (
                      mpConfig.plans.map((plan) => (
                        <div key={plan.plan_key} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-gray-500">
                            Mensual: {plan.mp_preapproval_plan_id_monthly || 'No creado'}
                          </p>
                          <p className="text-gray-500">
                            Anual: {plan.mp_preapproval_plan_id_yearly || 'No creado'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <Button
                    onClick={createMPPlans}
                    disabled={creatingMPPlans || !mpConfig.configured}
                    className="w-full mt-3"
                    variant="outline"
                  >
                    {creatingMPPlans ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creando planes...
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4 mr-2" />
                        Crear Planes en MP
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* MP Test Cards */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#009EE3]" />
              <CardTitle>Tarjetas de Prueba - Mercado Pago</CardTitle>
            </div>
            <CardDescription>Tarjetas para probar en Argentina</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mpTestCards.map((card, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        card.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <div>
                      <p className="font-mono text-sm">{card.number}</p>
                      <p className="text-xs text-gray-500">{card.description}</p>
                      <p className="text-xs text-gray-400">CVV: {card.cvv}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(card.number.replace(/\s/g, ''))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong>Fecha de expiración:</strong> 11/25
              </p>
              <p>
                <strong>Nombre:</strong> APRO (aprobado) o OTHE (rechazado)
              </p>
              <p>
                <strong>DNI:</strong> 12345678
              </p>
            </div>

            <Separator className="my-4" />

            <Button variant="outline" className="w-full" asChild>
              <a
                href="https://www.mercadopago.com.ar/developers/panel/app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Panel de Desarrolladores
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

