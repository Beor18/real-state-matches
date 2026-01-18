export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          phone: string | null
          role: 'user' | 'admin' | 'agent'
          is_vip: boolean
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'user' | 'admin' | 'agent'
          is_vip?: boolean
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'user' | 'admin' | 'agent'
          is_vip?: boolean
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          mls_id: string
          idx_source: string | null
          title: string
          description: string
          address: string
          city: string
          state: string
          zip_code: string | null
          country: string
          property_type: string
          listing_type: 'sale' | 'rent'
          price: number
          bedrooms: number | null
          bathrooms: number | null
          square_feet: number | null
          lot_size: number | null
          year_built: number | null
          amenities: Json
          features: Json
          images: Json
          virtual_tour_url: string | null
          video_url: string | null
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          agent_name: string | null
          agent_email: string | null
          agent_phone: string | null
          agent_company: string | null
          status: 'active' | 'pending' | 'sold' | 'off_market'
          featured: boolean
          embedding: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mls_id: string
          idx_source?: string | null
          title: string
          description: string
          address: string
          city: string
          state: string
          zip_code?: string | null
          country?: string
          property_type: string
          listing_type?: 'sale' | 'rent'
          price: number
          bedrooms?: number | null
          bathrooms?: number | null
          square_feet?: number | null
          lot_size?: number | null
          year_built?: number | null
          amenities?: Json
          features?: Json
          images?: Json
          virtual_tour_url?: string | null
          video_url?: string | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          agent_name?: string | null
          agent_email?: string | null
          agent_phone?: string | null
          agent_company?: string | null
          status?: 'active' | 'pending' | 'sold' | 'off_market'
          featured?: boolean
          embedding?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          mls_id?: string
          idx_source?: string | null
          title?: string
          description?: string
          address?: string
          city?: string
          state?: string
          zip_code?: string | null
          country?: string
          property_type?: string
          listing_type?: 'sale' | 'rent'
          price?: number
          bedrooms?: number | null
          bathrooms?: number | null
          square_feet?: number | null
          lot_size?: number | null
          year_built?: number | null
          amenities?: Json
          features?: Json
          images?: Json
          virtual_tour_url?: string | null
          video_url?: string | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          agent_name?: string | null
          agent_email?: string | null
          agent_phone?: string | null
          agent_company?: string | null
          status?: 'active' | 'pending' | 'sold' | 'off_market'
          featured?: boolean
          embedding?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      property_predictions: {
        Row: {
          id: string
          property_id: string
          demand_score: number
          demand_trend: 'increasing' | 'stable' | 'decreasing'
          demand_reason: string | null
          migration_trend: 'influx' | 'stable' | 'outflow' | null
          fanbase_sentiment: number
          current_value: number
          predicted_value_1y: number
          predicted_value_3y: number
          predicted_value_5y: number
          predicted_value_10y: number
          confidence_level: number
          remodel_tips: Json
          zoning_info: string | null
          development_opportunities: string | null
          is_hot_zone: boolean
          is_undervalued: boolean
          undervaluation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          demand_score: number
          demand_trend: 'increasing' | 'stable' | 'decreasing'
          demand_reason?: string | null
          migration_trend?: 'influx' | 'stable' | 'outflow' | null
          fanbase_sentiment?: number
          current_value: number
          predicted_value_1y: number
          predicted_value_3y: number
          predicted_value_5y: number
          predicted_value_10y: number
          confidence_level?: number
          remodel_tips?: Json
          zoning_info?: string | null
          development_opportunities?: string | null
          is_hot_zone?: boolean
          is_undervalued?: boolean
          undervaluation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          demand_score?: number
          demand_trend?: 'increasing' | 'stable' | 'decreasing'
          demand_reason?: string | null
          migration_trend?: 'influx' | 'stable' | 'outflow' | null
          fanbase_sentiment?: number
          current_value?: number
          predicted_value_1y?: number
          predicted_value_3y?: number
          predicted_value_5y?: number
          predicted_value_10y?: number
          confidence_level?: number
          remodel_tips?: Json
          zoning_info?: string | null
          development_opportunities?: string | null
          is_hot_zone?: boolean
          is_undervalued?: boolean
          undervaluation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lifestyle_profiles: {
        Row: {
          id: string
          user_id: string
          ideal_life_description: string
          lifestyle_keywords: Json
          preferred_property_types: Json
          preferred_cities: Json
          budget_min: number | null
          budget_max: number | null
          bedrooms: number | null
          bathrooms: number | null
          square_feet_min: number | null
          square_feet_max: number | null
          must_have_amenities: Json
          lifestyle_priorities: Json
          embedding: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ideal_life_description: string
          lifestyle_keywords?: Json
          preferred_property_types?: Json
          preferred_cities?: Json
          budget_min?: number | null
          budget_max?: number | null
          bedrooms?: number | null
          bathrooms?: number | null
          square_feet_min?: number | null
          square_feet_max?: number | null
          must_have_amenities?: Json
          lifestyle_priorities?: Json
          embedding?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ideal_life_description?: string
          lifestyle_keywords?: Json
          preferred_property_types?: Json
          preferred_cities?: Json
          budget_min?: number | null
          budget_max?: number | null
          bedrooms?: number | null
          bathrooms?: number | null
          square_feet_min?: number | null
          square_feet_max?: number | null
          must_have_amenities?: Json
          lifestyle_priorities?: Json
          embedding?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      property_matches: {
        Row: {
          id: string
          user_id: string
          property_id: string
          match_score: number
          match_reasons: Json
          lifestyle_fit: 'excellent' | 'good' | 'fair' | 'poor'
          viewed: boolean
          favorited: boolean
          contacted_agent: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id: string
          match_score: number
          match_reasons?: Json
          lifestyle_fit: 'excellent' | 'good' | 'fair' | 'poor'
          viewed?: boolean
          favorited?: boolean
          contacted_agent?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string
          match_score?: number
          match_reasons?: Json
          lifestyle_fit?: 'excellent' | 'good' | 'fair' | 'poor'
          viewed?: boolean
          favorited?: boolean
          contacted_agent?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_type: 'starter' | 'pro' | 'vip'
          plan_name: string
          price: number
          interval: 'monthly' | 'yearly'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_type: 'starter' | 'pro' | 'vip'
          plan_name: string
          price: number
          interval?: 'monthly' | 'yearly'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: 'starter' | 'pro' | 'vip'
          plan_name?: string
          price?: number
          interval?: 'monthly' | 'yearly'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      viral_content: {
        Row: {
          id: string
          user_id: string | null
          content_type: 'post' | 'story' | 'live_script' | 'video_script'
          title: string
          content: string
          hook: string | null
          hashtags: Json
          target_audience: string
          platform: string | null
          property_type: string | null
          location: string | null
          viral_score: number
          predicted_reach: number | null
          status: 'draft' | 'scheduled' | 'published' | 'archived'
          published_at: string | null
          property_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          content_type: 'post' | 'story' | 'live_script' | 'video_script'
          title: string
          content: string
          hook?: string | null
          hashtags?: Json
          target_audience: string
          platform?: string | null
          property_type?: string | null
          location?: string | null
          viral_score?: number
          predicted_reach?: number | null
          status?: 'draft' | 'scheduled' | 'published' | 'archived'
          published_at?: string | null
          property_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          content_type?: 'post' | 'story' | 'live_script' | 'video_script'
          title?: string
          content?: string
          hook?: string | null
          hashtags?: Json
          target_audience?: string
          platform?: string | null
          property_type?: string | null
          location?: string | null
          viral_score?: number
          predicted_reach?: number | null
          status?: 'draft' | 'scheduled' | 'published' | 'archived'
          published_at?: string | null
          property_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          type: 'price_drop' | 'new_listing' | 'hot_zone' | 'viral_content' | 'custom'
          title: string
          message: string
          criteria: Json | null
          action_url: string | null
          action_label: string | null
          is_read: boolean
          read_at: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'price_drop' | 'new_listing' | 'hot_zone' | 'viral_content' | 'custom'
          title: string
          message: string
          criteria?: Json | null
          action_url?: string | null
          action_label?: string | null
          is_read?: boolean
          read_at?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'price_drop' | 'new_listing' | 'hot_zone' | 'viral_content' | 'custom'
          title?: string
          message?: string
          criteria?: Json | null
          action_url?: string | null
          action_label?: string | null
          is_read?: boolean
          read_at?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          created_at?: string
        }
      }
      feature_flags: {
        Row: {
          id: string
          module_key: string
          name: string
          description: string | null
          category: string
          enabled: boolean
          config: Json
          sort_order: number
          updated_at: string
          updated_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          module_key: string
          name: string
          description?: string | null
          category?: string
          enabled?: boolean
          config?: Json
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          module_key?: string
          name?: string
          description?: string | null
          category?: string
          enabled?: boolean
          config?: Json
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          created_at?: string
        }
      }
      ai_settings: {
        Row: {
          id: string
          provider: string
          display_name: string
          api_key: string | null
          is_active: boolean
          models: Json
          config: Json
          updated_at: string
          updated_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          provider: string
          display_name: string
          api_key?: string | null
          is_active?: boolean
          models?: Json
          config?: Json
          updated_at?: string
          updated_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          provider?: string
          display_name?: string
          api_key?: string | null
          is_active?: boolean
          models?: Json
          config?: Json
          updated_at?: string
          updated_by?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type User = Tables<'users'>
export type Property = Tables<'properties'>
export type PropertyPrediction = Tables<'property_predictions'>
export type LifestyleProfile = Tables<'lifestyle_profiles'>
export type PropertyMatch = Tables<'property_matches'>
export type Subscription = Tables<'subscriptions'>
export type ViralContent = Tables<'viral_content'>
export type Alert = Tables<'alerts'>
export type FeatureFlag = Tables<'feature_flags'>
export type AiSettings = Tables<'ai_settings'>


