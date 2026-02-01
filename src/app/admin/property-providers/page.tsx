'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Database, 
  ExternalLink, 
  RefreshCw, 
  Check, 
  X, 
  Eye, 
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Home,
  Building
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PROPERTY_PROVIDERS, type PropertyProvider } from '@/config/property-providers'

interface ProviderData {
  key: PropertyProvider
  name: string
  description: string
  website: string
  docsUrl: string
  fields: Array<{
    key: string
    label: string
    type: 'text' | 'password' | 'select'
    required: boolean
    placeholder?: string
    description?: string
  }>
  features: string[]
  supportedRegions: string[]
  enabled: boolean
  hasApiKey: boolean
  hasApiSecret: boolean
  additionalConfig: Record<string, string>
  priority: number
}

interface ProviderFormState {
  apiKey: string
  apiSecret: string
  additionalConfig: Record<string, string>
  showApiKey: boolean
  showApiSecret: boolean
}

export default function PropertyProvidersPage() {
  const [providers, setProviders] = useState<ProviderData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingProvider, setSavingProvider] = useState<PropertyProvider | null>(null)
  const [testingProvider, setTestingProvider] = useState<PropertyProvider | null>(null)
  const [testResult, setTestResult] = useState<{ provider: PropertyProvider; success: boolean; message: string } | null>(null)
  
  // Form state per provider
  const [formStates, setFormStates] = useState<Record<PropertyProvider, ProviderFormState>>({
    showcase_idx: { apiKey: '', apiSecret: '', additionalConfig: {}, showApiKey: false, showApiSecret: false },
    zillow_bridge: { apiKey: '', apiSecret: '', additionalConfig: {}, showApiKey: false, showApiSecret: false },
    realtor_rapidapi: { apiKey: '', apiSecret: '', additionalConfig: {}, showApiKey: false, showApiSecret: false },
  })

  const fetchProviders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/property-providers')
      const data = await response.json()
      
      if (data.success) {
        setProviders(data.providers)
      } else {
        throw new Error(data.error || 'Error al obtener proveedores')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  // Sync form states with loaded provider data
  useEffect(() => {
    if (providers.length > 0) {
      setFormStates(prev => {
        const newStates = { ...prev }
        providers.forEach(provider => {
          if (provider.additionalConfig && Object.keys(provider.additionalConfig).length > 0) {
            newStates[provider.key] = {
              ...prev[provider.key],
              additionalConfig: { ...provider.additionalConfig },
            }
          }
        })
        return newStates
      })
    }
  }, [providers])

  const handleToggle = async (providerKey: PropertyProvider) => {
    setSavingProvider(providerKey)
    
    try {
      const response = await fetch('/api/admin/property-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          providerKey,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setProviders(prev => prev.map(p => 
          p.key === providerKey ? { ...p, enabled: data.enabled } : p
        ))
      }
    } catch (err) {
      console.error('Error toggling provider:', err)
    } finally {
      setSavingProvider(null)
    }
  }

  const handleSaveCredentials = async (providerKey: PropertyProvider) => {
    const formState = formStates[providerKey]
    setSavingProvider(providerKey)
    
    try {
      const response = await fetch('/api/admin/property-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          providerKey,
          apiKey: formState.apiKey || undefined,
          apiSecret: formState.apiSecret || undefined,
          additionalConfig: Object.keys(formState.additionalConfig).length > 0 
            ? formState.additionalConfig 
            : undefined,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refetch to update hasApiKey status
        await fetchProviders()
        // Clear form
        setFormStates(prev => ({
          ...prev,
          [providerKey]: {
            ...prev[providerKey],
            apiKey: '',
            apiSecret: '',
            additionalConfig: {},
          },
        }))
      }
    } catch (err) {
      console.error('Error saving credentials:', err)
    } finally {
      setSavingProvider(null)
    }
  }

  const handleTestConnection = async (providerKey: PropertyProvider) => {
    const formState = formStates[providerKey]
    const provider = providers.find(p => p.key === providerKey)
    
    // Use existing credentials if form is empty
    const apiKey = formState.apiKey || (provider?.hasApiKey ? '***existing***' : '')
    
    if (!apiKey || apiKey === '***existing***') {
      setTestResult({
        provider: providerKey,
        success: false,
        message: 'Ingresa una API key para probar la conexión',
      })
      return
    }
    
    setTestingProvider(providerKey)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/admin/property-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          providerKey,
          apiKey: formState.apiKey,
          apiSecret: formState.apiSecret,
          additionalConfig: formState.additionalConfig,
        }),
      })
      
      const data = await response.json()
      
      setTestResult({
        provider: providerKey,
        success: data.success,
        message: data.message,
      })
    } catch (err) {
      setTestResult({
        provider: providerKey,
        success: false,
        message: err instanceof Error ? err.message : 'Error de conexión',
      })
    } finally {
      setTestingProvider(null)
    }
  }

  const updateFormState = (providerKey: PropertyProvider, updates: Partial<ProviderFormState>) => {
    setFormStates(prev => ({
      ...prev,
      [providerKey]: { ...prev[providerKey], ...updates },
    }))
  }

  const updateAdditionalConfig = (providerKey: PropertyProvider, key: string, value: string) => {
    setFormStates(prev => ({
      ...prev,
      [providerKey]: {
        ...prev[providerKey],
        additionalConfig: {
          ...prev[providerKey].additionalConfig,
          [key]: value,
        },
      },
    }))
  }

  const getProviderIcon = (key: PropertyProvider) => {
    switch (key) {
      case 'showcase_idx':
        return Home
      case 'zillow_bridge':
        return Building
      default:
        return Database
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-10 w-80 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="grid gap-6">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Proveedores de Datos de Propiedades
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configura las fuentes de datos para obtener propiedades inmobiliarias en tiempo real.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Proveedores</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{providers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Activos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {providers.filter(p => p.enabled && p.hasApiKey).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {providers.filter(p => !p.hasApiKey).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Cards */}
      <div className="space-y-6">
        {providers.map(provider => {
          const formState = formStates[provider.key]
          const Icon = getProviderIcon(provider.key)
          const providerConfig = PROPERTY_PROVIDERS[provider.key]
          
          return (
            <Card key={provider.key} className={`${
              provider.enabled && provider.hasApiKey 
                ? 'border-emerald-200 dark:border-emerald-800' 
                : ''
            }`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      provider.enabled && provider.hasApiKey
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        provider.enabled && provider.hasApiKey
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {provider.name}
                        {provider.enabled && provider.hasApiKey && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                            Activo
                          </Badge>
                        )}
                        {!provider.hasApiKey && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                            Sin Configurar
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{provider.description}</CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                    <Switch
                      checked={provider.enabled}
                      onCheckedChange={() => handleToggle(provider.key)}
                      disabled={savingProvider === provider.key || !provider.hasApiKey}
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Features */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Características:</p>
                  <div className="flex flex-wrap gap-2">
                    {provider.features.slice(0, 5).map((feature, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Credentials Form */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                    Credenciales de API
                  </h4>
                  
                  <div className="grid gap-4">
                    {providerConfig.fields.map(field => (
                      <div key={field.key}>
                        <Label htmlFor={`${provider.key}-${field.key}`} className="mb-1.5 block">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        <div className="relative">
                          <Input
                            id={`${provider.key}-${field.key}`}
                            type={
                              field.type === 'password' && 
                              !((field.key === 'api_key' || field.key === 'rapidapi_key') ? formState.showApiKey : 
                                (field.key === 'api_secret' || field.key === 'server_token') ? formState.showApiSecret : false)
                                ? 'password'
                                : 'text'
                            }
                            placeholder={
                              ((field.key === 'api_key' || field.key === 'rapidapi_key') && provider.hasApiKey) ||
                              ((field.key === 'api_secret' || field.key === 'server_token') && provider.hasApiSecret)
                                ? '••••••••••••••••'
                                : field.placeholder
                            }
                            value={
                              (field.key === 'api_key' || field.key === 'rapidapi_key')
                                ? formState.apiKey 
                                : (field.key === 'api_secret' || field.key === 'server_token')
                                ? formState.apiSecret
                                : (formState.additionalConfig?.[field.key] || '')
                            }
                            onChange={(e) => {
                              if (field.key === 'api_key' || field.key === 'rapidapi_key') {
                                updateFormState(provider.key, { apiKey: e.target.value })
                              } else if (field.key === 'api_secret' || field.key === 'server_token') {
                                updateFormState(provider.key, { apiSecret: e.target.value })
                              } else {
                                updateAdditionalConfig(provider.key, field.key, e.target.value)
                              }
                            }}
                            className="pr-10"
                          />
                          {field.type === 'password' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (field.key === 'api_key' || field.key === 'rapidapi_key') {
                                  updateFormState(provider.key, { showApiKey: !formState.showApiKey })
                                } else if (field.key === 'api_secret' || field.key === 'server_token') {
                                  updateFormState(provider.key, { showApiSecret: !formState.showApiSecret })
                                }
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {((field.key === 'api_key' || field.key === 'rapidapi_key') ? formState.showApiKey : 
                                (field.key === 'api_secret' || field.key === 'server_token') ? formState.showApiSecret : false) 
                                ? <EyeOff className="h-4 w-4" /> 
                                : <Eye className="h-4 w-4" />
                              }
                            </button>
                          )}
                        </div>
                        {field.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {field.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Test Result */}
                  {testResult?.provider === provider.key && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                      testResult.success 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}>
                      {testResult.success ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                      <span className="text-sm">{testResult.message}</span>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleTestConnection(provider.key)}
                      disabled={testingProvider === provider.key || (!formState?.apiKey && providerConfig?.fields?.length > 0)}
                    >
                      {testingProvider === provider.key ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Probando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Probar Conexión
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => handleSaveCredentials(provider.key)}
                      disabled={savingProvider === provider.key || (!formState?.apiKey && providerConfig?.fields?.length > 0)}
                    >
                      {savingProvider === provider.key ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Guardar Credenciales
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
          <p>
            <strong>1. Obtén tus credenciales:</strong> Regístrate en el proveedor de tu elección 
            y obtén tu API key desde su panel de desarrolladores.
          </p>
          <p>
            <strong>2. Configura las credenciales:</strong> Ingresa tu API key y cualquier configuración 
            adicional requerida por el proveedor.
          </p>
          <p>
            <strong>3. Prueba la conexión:</strong> Verifica que las credenciales sean válidas antes 
            de activar el proveedor.
          </p>
          <p>
            <strong>4. Activa el proveedor:</strong> Una vez configurado, activa el proveedor para 
            comenzar a recibir propiedades en las búsquedas.
          </p>
          <p className="text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            Si no hay proveedores activos, el sistema de búsqueda mostrará un mensaje indicando 
            que no hay fuentes de datos configuradas.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

