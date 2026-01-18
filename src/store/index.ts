import { create } from 'zustand'
import type { Property, PropertyPrediction, ViralContent, Alert } from '@/types/database'

// Types for our state
export interface PropertyWithPrediction extends Property {
  prediction?: PropertyPrediction | null
}

export interface PropertyMatch {
  property: PropertyWithPrediction
  matchScore: number
  matchReasons: string[]
}

export interface LifestyleProfile {
  id?: string
  idealLifeDescription: string
  preferences: {
    propertyTypes: string[]
    cities: string[]
    budgetMin?: number
    budgetMax?: number
    bedrooms?: number
    bathrooms?: number
    squareFeetMin?: number
    squareFeetMax?: number
  }
  amenities: string[]
  priorities: string[]
}

// Main App Store
interface AppState {
  // Navigation
  currentView: 'dashboard' | 'demand' | 'lifestyle' | 'equity' | 'engagement' | 'monetization'
  setCurrentView: (view: AppState['currentView']) => void

  // User State
  user: {
    id: string
    email: string
    name: string
    isVip: boolean
  } | null
  setUser: (user: AppState['user']) => void

  // Properties
  properties: PropertyWithPrediction[]
  setProperties: (properties: PropertyWithPrediction[]) => void
  addProperty: (property: PropertyWithPrediction) => void

  // Property Matches
  propertyMatches: PropertyMatch[]
  setPropertyMatches: (matches: PropertyMatch[]) => void
  addPropertyMatch: (match: PropertyMatch) => void

  // Lifestyle Profile
  lifestyleProfile: LifestyleProfile | null
  setLifestyleProfile: (profile: LifestyleProfile) => void

  // Viral Content
  viralContent: ViralContent[]
  setViralContent: (content: ViralContent[]) => void

  // Alerts
  alerts: Alert[]
  setAlerts: (alerts: Alert[]) => void
  addAlert: (alert: Alert) => void
  markAlertAsRead: (alertId: string) => void

  // Loading States
  isLoading: boolean
  setLoading: (loading: boolean) => void

  // UI States
  selectedProperty: PropertyWithPrediction | null
  setSelectedProperty: (property: PropertyWithPrediction | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),

  // User State
  user: null,
  setUser: (user) => set({ user }),

  // Properties
  properties: [],
  setProperties: (properties) => set({ properties }),
  addProperty: (property) => set((state) => ({ properties: [...state.properties, property] })),

  // Property Matches
  propertyMatches: [],
  setPropertyMatches: (matches) => set({ propertyMatches: matches }),
  addPropertyMatch: (match) => set((state) => ({ propertyMatches: [...state.propertyMatches, match] })),

  // Lifestyle Profile
  lifestyleProfile: null,
  setLifestyleProfile: (profile) => set({ lifestyleProfile: profile }),

  // Viral Content
  viralContent: [],
  setViralContent: (content) => set({ viralContent: content }),

  // Alerts
  alerts: [],
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
  markAlertAsRead: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, isRead: true, readAt: new Date() } : a)),
    })),

  // Loading States
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),

  // UI States
  selectedProperty: null,
  setSelectedProperty: (property) => set({ selectedProperty: property }),
}))
