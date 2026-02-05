'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { useLocationAutocomplete, LocationSuggestion } from '@/hooks/useLocationAutocomplete'
import { MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string, suggestion?: LocationSuggestion) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Buscar ciudad o barrio en Puerto Rico...',
  className,
  disabled = false,
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { suggestions, isLoading, clearSuggestions } = useLocationAutocomplete(inputValue)

  // Sync external value changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Open dropdown when suggestions arrive
  useEffect(() => {
    if (suggestions.length > 0 && inputValue.length >= 2) {
      setIsOpen(true)
      setHighlightedIndex(-1)
    }
  }, [suggestions, inputValue])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Also update parent with raw input (for free-form typing)
    onChange(newValue)
    
    if (newValue.length < 2) {
      setIsOpen(false)
      clearSuggestions()
    }
  }

  const handleSelectSuggestion = useCallback((suggestion: LocationSuggestion) => {
    setInputValue(suggestion.fullName)
    onChange(suggestion.fullName, suggestion)
    setIsOpen(false)
    clearSuggestions()
    inputRef.current?.blur()
  }, [onChange, clearSuggestions])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
      case 'Tab':
        setIsOpen(false)
        break
    }
  }

  const handleFocus = () => {
    if (suggestions.length > 0 && inputValue.length >= 2) {
      setIsOpen(true)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)} style={{ overflow: 'visible' }}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-8"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-auto"
          style={{ position: 'absolute', top: '100%' }}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                'w-full px-3 py-2.5 text-left flex items-start gap-2.5 transition-colors',
                'hover:bg-slate-50 focus:bg-slate-50 focus:outline-none',
                highlightedIndex === index && 'bg-slate-50'
              )}
            >
              <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {suggestion.name}
                </p>
                {suggestion.fullName !== suggestion.name && (
                  <p className="text-xs text-slate-500 truncate">
                    {suggestion.fullName}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && !isLoading && inputValue.length >= 2 && suggestions.length === 0 && (
        <div 
          className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl p-3"
          style={{ position: 'absolute', top: '100%' }}
        >
          <p className="text-sm text-slate-500 text-center">
            No se encontraron ubicaciones en Puerto Rico
          </p>
        </div>
      )}
    </div>
  )
}

export default LocationAutocomplete
