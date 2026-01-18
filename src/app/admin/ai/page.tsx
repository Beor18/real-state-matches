'use client'

import { useState, useEffect } from 'react'
import { AI_PROVIDERS, AIProvider, AI_TASKS, AITaskType, maskApiKey } from '@/config/ai-providers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Brain,
  Key,
  Check,
  X,
  Loader2,
  ExternalLink,
  Zap,
  Eye,
  EyeOff,
  RefreshCw,
  MessageSquare,
  Layers,
  BarChart3,
  Sparkles,
} from 'lucide-react'

interface AISettingsData {
  id: string
  provider: string
  display_name: string
  api_key: string | null
  has_key: boolean
  is_active: boolean
  models: Record<string, string>
  config: Record<string, unknown>
}

const taskIcons: Record<AITaskType, React.ReactNode> = {
  chat: <MessageSquare className="h-4 w-4" />,
  embedding: <Layers className="h-4 w-4" />,
  analysis: <BarChart3 className="h-4 w-4" />,
  content: <Sparkles className="h-4 w-4" />,
}

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISettingsData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [savingProvider, setSavingProvider] = useState<string | null>(null)
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; latency?: number }>>({})
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({})
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})
  const [modelSelections, setModelSelections] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/ai-settings')
      const data = await response.json()
      
      if (data.success) {
        setSettings(data.settings)
        
        // Initialize model selections from DB
        const models: Record<string, Record<string, string>> = {}
        data.settings.forEach((s: AISettingsData) => {
          models[s.provider] = s.models as Record<string, string>
        })
        setModelSelections(models)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveApiKey = async (provider: string) => {
    setSavingProvider(provider)
    
    try {
      const response = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          api_key: apiKeyInputs[provider],
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setSettings(prev => 
          prev.map(s => s.provider === provider ? { ...s, ...data.settings } : s)
        )
        setApiKeyInputs(prev => ({ ...prev, [provider]: '' }))
      }
    } catch (error) {
      console.error('Error saving API key:', error)
    } finally {
      setSavingProvider(null)
    }
  }

  const handleToggleActive = async (provider: string, isActive: boolean) => {
    setSavingProvider(provider)
    
    try {
      const response = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          is_active: isActive,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // If activating, deactivate others in UI
        if (isActive) {
          setSettings(prev => 
            prev.map(s => ({
              ...s,
              is_active: s.provider === provider,
            }))
          )
        } else {
          setSettings(prev => 
            prev.map(s => s.provider === provider ? { ...s, is_active: false } : s)
          )
        }
      }
    } catch (error) {
      console.error('Error toggling provider:', error)
    } finally {
      setSavingProvider(null)
    }
  }

  const handleSaveModels = async (provider: string) => {
    setSavingProvider(provider)
    
    try {
      const response = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          models: modelSelections[provider],
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setSettings(prev => 
          prev.map(s => s.provider === provider ? { ...s, models: modelSelections[provider] } : s)
        )
      }
    } catch (error) {
      console.error('Error saving models:', error)
    } finally {
      setSavingProvider(null)
    }
  }

  const handleTestConnection = async (provider: string) => {
    setTestingProvider(provider)
    setTestResults(prev => ({ ...prev, [provider]: undefined as any }))
    
    try {
      const response = await fetch('/api/admin/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })

      const data = await response.json()
      setTestResults(prev => ({ ...prev, [provider]: data }))
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [provider]: { success: false, message: 'Error de conexión' } 
      }))
    } finally {
      setTestingProvider(null)
    }
  }

  const getProviderSetting = (providerId: string): AISettingsData | undefined => {
    return settings.find(s => s.provider === providerId)
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const activeProvider = settings.find(s => s.is_active)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Brain className="h-8 w-8 text-purple-600" />
          Configuración de IA
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configura los proveedores de inteligencia artificial y sus modelos
        </p>
      </div>

      {/* Active Provider Status */}
      <Card className="mb-8 border-2 border-purple-200 bg-purple-50/50 dark:bg-purple-900/10 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-600 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Proveedor Activo</p>
                {activeProvider ? (
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {AI_PROVIDERS[activeProvider.provider as AIProvider]?.name || activeProvider.provider}
                  </p>
                ) : (
                  <p className="text-xl font-bold text-amber-600">
                    Ninguno configurado
                  </p>
                )}
              </div>
            </div>
            {activeProvider && (
              <Badge className="bg-green-500 gap-1">
                <Check className="h-3 w-3" />
                Conectado
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Provider Cards */}
      <div className="space-y-6">
        {Object.entries(AI_PROVIDERS).map(([providerId, providerConfig]) => {
          const setting = getProviderSetting(providerId)
          const isSaving = savingProvider === providerId
          const isTesting = testingProvider === providerId
          const testResult = testResults[providerId]

          return (
            <Card 
              key={providerId}
              className={`border-2 transition-all ${
                setting?.is_active 
                  ? 'border-purple-300 bg-purple-50/30 dark:bg-purple-900/10' 
                  : 'border-gray-200 dark:border-gray-800'
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                      setting?.is_active ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      <Brain className={`h-6 w-6 ${setting?.is_active ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {providerConfig.name}
                        {setting?.has_key && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Key className="h-3 w-3" />
                            API Key
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{providerConfig.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <a 
                      href={providerConfig.docsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      Docs
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${providerId}`} className="text-sm">
                        {setting?.is_active ? 'Activo' : 'Inactivo'}
                      </Label>
                      <Switch
                        id={`active-${providerId}`}
                        checked={setting?.is_active || false}
                        onCheckedChange={(checked) => handleToggleActive(providerId, checked)}
                        disabled={isSaving || !setting?.has_key}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="apikey" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="apikey" className="gap-2">
                      <Key className="h-4 w-4" />
                      API Key
                    </TabsTrigger>
                    <TabsTrigger value="models" className="gap-2">
                      <Brain className="h-4 w-4" />
                      Modelos
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="apikey" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showApiKey[providerId] ? 'text' : 'password'}
                            placeholder={providerConfig.apiKeyPlaceholder}
                            value={apiKeyInputs[providerId] || ''}
                            onChange={(e) => setApiKeyInputs(prev => ({ 
                              ...prev, 
                              [providerId]: e.target.value 
                            }))}
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(prev => ({ 
                              ...prev, 
                              [providerId]: !prev[providerId] 
                            }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showApiKey[providerId] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <Button
                          onClick={() => handleSaveApiKey(providerId)}
                          disabled={!apiKeyInputs[providerId] || isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Guardar'
                          )}
                        </Button>
                      </div>
                      {setting?.has_key && (
                        <p className="text-sm text-gray-500">
                          Key actual: {setting.api_key}
                        </p>
                      )}
                    </div>

                    {/* Test Connection */}
                    <div className="flex items-center gap-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => handleTestConnection(providerId)}
                        disabled={!setting?.has_key || isTesting}
                        className="gap-2"
                      >
                        {isTesting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Probar Conexión
                      </Button>
                      {testResult && (
                        <div className={`flex items-center gap-2 text-sm ${
                          testResult.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {testResult.success ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          {testResult.message}
                          {testResult.latency && (
                            <span className="text-gray-500">({testResult.latency}ms)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="models" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(Object.keys(AI_TASKS) as AITaskType[]).map(taskType => {
                        const models = providerConfig.models[taskType]
                        if (!models || models.length === 0) return null

                        const taskInfo = AI_TASKS[taskType]
                        const currentModel = modelSelections[providerId]?.[taskType] || 
                                            providerConfig.defaultModels[taskType]

                        return (
                          <div key={taskType} className="space-y-2">
                            <Label className="flex items-center gap-2">
                              {taskIcons[taskType]}
                              {taskInfo.name}
                            </Label>
                            <Select
                              value={currentModel}
                              onValueChange={(value) => {
                                setModelSelections(prev => ({
                                  ...prev,
                                  [providerId]: {
                                    ...prev[providerId],
                                    [taskType]: value,
                                  },
                                }))
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {models.map(model => (
                                  <SelectItem key={model.id} value={model.id}>
                                    <div className="flex flex-col">
                                      <span>{model.name}</span>
                                      <span className="text-xs text-gray-500">
                                        {model.description}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )
                      })}
                    </div>
                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => handleSaveModels(providerId)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Guardar Configuración de Modelos
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

