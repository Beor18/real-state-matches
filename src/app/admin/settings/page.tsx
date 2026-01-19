'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<StripeConfig | null>(null)
  const [account, setAccount] = useState<StripeAccount | null>(null)
  const [products, setProducts] = useState<StripeProduct[]>([])
  const [prices, setPrices] = useState<StripePrice[]>([])
  const [loading, setLoading] = useState(true)
  const [testingConnection, setTestingConnection] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null)
  const [webhookResult, setWebhookResult] = useState<{ success: boolean; message: string; event?: any } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/stripe')
      const data = await res.json()
      if (data.success) {
        setConfig(data.config)
      }
    } catch (error) {
      console.error('Error fetching Stripe config:', error)
    } finally {
      setLoading(false)
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

  const testCards = [
    { number: '4242 4242 4242 4242', description: 'Pago exitoso', type: 'success' },
    { number: '4000 0000 0000 3220', description: '3D Secure requerido', type: 'warning' },
    { number: '4000 0000 0000 9995', description: 'Fondos insuficientes', type: 'error' },
    { number: '4000 0000 0000 0002', description: 'Tarjeta rechazada', type: 'error' },
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Administra la configuración de Stripe y realiza pruebas de pago
        </p>
      </div>

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

        {/* Test Cards */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              <CardTitle>Tarjetas de Prueba</CardTitle>
            </div>
            <CardDescription>Usa estas tarjetas para probar diferentes escenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testCards.map((card) => (
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
      </div>
    </div>
  )
}

