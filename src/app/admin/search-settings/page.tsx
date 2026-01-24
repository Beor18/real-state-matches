'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Loader2, 
  Save, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  Sliders
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'

interface SearchSettings {
  max_properties_total: number
  max_properties_per_provider: number | null
  max_properties_for_ai: number
  min_properties_per_provider: number
}

const DEFAULT_SETTINGS: SearchSettings = {
  max_properties_total: 60,
  max_properties_per_provider: null,
  max_properties_for_ai: 60,
  min_properties_per_provider: 5,
}

export default function SearchSettingsPage() {
  const [settings, setSettings] = useState<SearchSettings>(DEFAULT_SETTINGS)
  const [originalSettings, setOriginalSettings] = useState<SearchSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [useFixedPerProvider, setUseFixedPerProvider] = useState(false)
  const [activeProviders, setActiveProviders] = useState(2) // Simulated, could fetch from API

  useEffect(() => {
    fetchSettings()
    fetchActiveProviders()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/search-settings')
      const data = await response.json()
      
      if (data.success) {
        setSettings(data.settings)
        setOriginalSettings(data.settings)
        setUseFixedPerProvider(data.settings.max_properties_per_provider !== null)
      } else {
        throw new Error(data.error || 'Error al obtener configuración')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchActiveProviders = async () => {
    try {
      const response = await fetch('/api/admin/property-providers')
      const data = await response.json()
      if (data.success) {
        const active = data.providers.filter((p: any) => p.enabled && p.hasApiKey).length
        setActiveProviders(Math.max(1, active))
      }
    } catch (err) {
      console.error('Error fetching providers:', err)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)
      
      const response = await fetch('/api/admin/search-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_properties_total: settings.max_properties_total,
          max_properties_per_provider: useFixedPerProvider ? settings.max_properties_per_provider : null,
          max_properties_for_ai: settings.max_properties_for_ai,
          min_properties_per_provider: settings.min_properties_per_provider,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess('Configuración guardada correctamente')
        setOriginalSettings(settings)
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error(data.error || 'Error al guardar')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings) || 
    (useFixedPerProvider !== (originalSettings.max_properties_per_provider !== null))

  const calculatedPerProvider = Math.ceil(settings.max_properties_total / activeProviders)

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-10 w-80 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="grid gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Configuración de Búsqueda
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Ajusta cómo se distribuyen las propiedades entre los proveedores activos.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Info Card */}
      <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">¿Cómo funciona la distribución?</p>
              <p>
                El sistema divide automáticamente el límite total entre los proveedores activos.
                Por ejemplo, con <strong>{settings.max_properties_total} propiedades totales</strong> y <strong>{activeProviders} proveedores activos</strong>, 
                cada proveedor aportará aproximadamente <strong>{calculatedPerProvider} propiedades</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Total Properties */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-purple-600" />
              <CardTitle>Límite Total de Propiedades</CardTitle>
            </div>
            <CardDescription>
              Número máximo de propiedades a obtener de todos los proveedores combinados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <Label>Total de propiedades</Label>
                <span className="text-2xl font-bold text-purple-600">
                  {settings.max_properties_total}
                </span>
              </div>
              <Slider
                value={[settings.max_properties_total]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, max_properties_total: value }))}
                min={10}
                max={200}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>10</span>
                <span>100</span>
                <span>200</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Con <strong>{activeProviders} proveedores activos</strong>, cada uno aportará:
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ~{calculatedPerProvider} propiedades
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Matching */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-amber-600" />
              <CardTitle>Propiedades para IA</CardTitle>
            </div>
            <CardDescription>
              Cuántas propiedades analiza la IA para encontrar los mejores matches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <Label>Propiedades para análisis IA</Label>
                <span className="text-2xl font-bold text-amber-600">
                  {settings.max_properties_for_ai}
                </span>
              </div>
              <Slider
                value={[settings.max_properties_for_ai]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, max_properties_for_ai: value }))}
                min={10}
                max={200}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>10</span>
                <span>100</span>
                <span>200</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Nota:</strong> Más propiedades = mejor análisis pero mayor costo de IA y tiempo de respuesta.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Per Provider Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Configuración por Proveedor</CardTitle>
                <CardDescription>
                  Ajusta cómo se distribuyen las propiedades entre proveedores
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label className="text-base">Usar límite fijo por proveedor</Label>
                <p className="text-sm text-gray-500 mt-1">
                  En lugar de distribuir automáticamente, usa un número fijo para cada proveedor
                </p>
              </div>
              <Switch
                checked={useFixedPerProvider}
                onCheckedChange={(checked) => {
                  setUseFixedPerProvider(checked)
                  if (checked && settings.max_properties_per_provider === null) {
                    setSettings(prev => ({ ...prev, max_properties_per_provider: 30 }))
                  }
                }}
              />
            </div>

            {useFixedPerProvider && (
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex justify-between mb-2">
                  <Label>Propiedades por proveedor (fijo)</Label>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {settings.max_properties_per_provider}
                  </span>
                </div>
                <Slider
                  value={[settings.max_properties_per_provider || 30]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, max_properties_per_provider: value }))}
                  min={5}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between mb-2">
                  <Label>Mínimo por proveedor</Label>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {settings.min_properties_per_provider}
                  </span>
                </div>
                <Slider
                  value={[settings.min_properties_per_provider]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, min_properties_per_provider: value }))}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Asegura que cada proveedor contribuya al menos este número
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Label className="block mb-2">Proveedores activos</Label>
                <p className="text-3xl font-bold text-emerald-600">{activeProviders}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Configurados y habilitados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={fetchSettings}
          disabled={isSaving}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Restablecer
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

