'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface LocationSuggestion {
  id: string
  name: string
  fullName: string
  city?: string
  state?: string
  type?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
}

interface UseLocationAutocompleteOptions {
  debounceMs?: number
  limit?: number
  minQueryLength?: number
}

export function useLocationAutocomplete(
  query: string,
  options: UseLocationAutocompleteOptions = {}
) {
  const {
    debounceMs = 400,
    limit = 5,
    minQueryLength = 2,
  } = options

  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Track the latest request to avoid race conditions
  const latestRequestRef = useRef<number>(0)

  const fetchSuggestions = useCallback(async (searchQuery: string, requestId: number) => {
    if (searchQuery.length < minQueryLength) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Use our server-side API route to avoid CORS issues
      const params = new URLSearchParams({
        q: searchQuery,
        limit: String(limit),
      })

      const response = await fetch(`/api/geocode?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Error al buscar ubicaciones')
      }

      const data = await response.json()

      // Only update if this is still the latest request
      if (requestId !== latestRequestRef.current) {
        return
      }

      setSuggestions(data.suggestions || [])
    } catch (err) {
      if (requestId === latestRequestRef.current) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setSuggestions([])
      }
    } finally {
      if (requestId === latestRequestRef.current) {
        setIsLoading(false)
      }
    }
  }, [limit, minQueryLength])

  useEffect(() => {
    // Clear suggestions if query is too short
    if (query.length < minQueryLength) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    // Increment request ID
    const requestId = ++latestRequestRef.current

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchSuggestions(query, requestId)
    }, debounceMs)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [query, debounceMs, minQueryLength, fetchSuggestions])

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
  }, [])

  return {
    suggestions,
    isLoading,
    error,
    clearSuggestions,
  }
}
