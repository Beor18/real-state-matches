-- REAI MVP Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE (extends Supabase Auth)
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'agent')),
    is_vip BOOLEAN NOT NULL DEFAULT FALSE,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PROPERTIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mls_id TEXT NOT NULL UNIQUE,
    idx_source TEXT, -- 'showcase_idx', 'manual', etc.
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT,
    country TEXT NOT NULL DEFAULT 'PR',
    property_type TEXT NOT NULL, -- house, condo, apartment, land, commercial
    listing_type TEXT NOT NULL DEFAULT 'sale' CHECK (listing_type IN ('sale', 'rent')),
    price DECIMAL(12, 2) NOT NULL,
    bedrooms INTEGER,
    bathrooms DECIMAL(3, 1),
    square_feet DECIMAL(10, 2),
    lot_size DECIMAL(10, 2),
    year_built INTEGER,
    amenities JSONB NOT NULL DEFAULT '[]',
    features JSONB NOT NULL DEFAULT '[]',
    images JSONB NOT NULL DEFAULT '[]',
    virtual_tour_url TEXT,
    video_url TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    neighborhood TEXT,
    agent_name TEXT,
    agent_email TEXT,
    agent_phone TEXT,
    agent_company TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'off_market')),
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    embedding TEXT, -- For AI matching (vector stored as text)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PROPERTY PREDICTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.property_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    demand_score DECIMAL(5, 2) NOT NULL, -- 0-100
    demand_trend TEXT NOT NULL CHECK (demand_trend IN ('increasing', 'stable', 'decreasing')),
    demand_reason TEXT,
    migration_trend TEXT CHECK (migration_trend IN ('influx', 'stable', 'outflow')),
    fanbase_sentiment DECIMAL(4, 3) NOT NULL DEFAULT 0, -- -1 to 1
    current_value DECIMAL(12, 2) NOT NULL,
    predicted_value_1y DECIMAL(12, 2) NOT NULL,
    predicted_value_3y DECIMAL(12, 2) NOT NULL,
    predicted_value_5y DECIMAL(12, 2) NOT NULL,
    predicted_value_10y DECIMAL(12, 2) NOT NULL,
    confidence_level DECIMAL(5, 2) NOT NULL DEFAULT 80,
    remodel_tips JSONB NOT NULL DEFAULT '[]',
    zoning_info TEXT,
    development_opportunities TEXT,
    is_hot_zone BOOLEAN NOT NULL DEFAULT FALSE,
    is_undervalued BOOLEAN NOT NULL DEFAULT FALSE,
    undervaluation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- LIFESTYLE PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.lifestyle_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    ideal_life_description TEXT NOT NULL,
    lifestyle_keywords JSONB NOT NULL DEFAULT '[]',
    preferred_property_types JSONB NOT NULL DEFAULT '[]',
    preferred_cities JSONB NOT NULL DEFAULT '[]',
    budget_min DECIMAL(12, 2),
    budget_max DECIMAL(12, 2),
    bedrooms INTEGER,
    bathrooms DECIMAL(3, 1),
    square_feet_min DECIMAL(10, 2),
    square_feet_max DECIMAL(10, 2),
    must_have_amenities JSONB NOT NULL DEFAULT '[]',
    lifestyle_priorities JSONB NOT NULL DEFAULT '[]',
    embedding TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PROPERTY MATCHES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.property_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    match_score DECIMAL(5, 2) NOT NULL, -- 0-100
    match_reasons JSONB NOT NULL DEFAULT '[]',
    lifestyle_fit TEXT NOT NULL CHECK (lifestyle_fit IN ('excellent', 'good', 'fair', 'poor')),
    viewed BOOLEAN NOT NULL DEFAULT FALSE,
    favorited BOOLEAN NOT NULL DEFAULT FALSE,
    contacted_agent BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'pro', 'vip')),
    plan_name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    interval TEXT NOT NULL DEFAULT 'monthly' CHECK (interval IN ('monthly', 'yearly')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- VIRAL CONTENT TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.viral_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'story', 'live_script', 'video_script')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    hook TEXT,
    hashtags JSONB NOT NULL DEFAULT '[]',
    target_audience TEXT NOT NULL,
    platform TEXT,
    property_type TEXT,
    location TEXT,
    viral_score DECIMAL(5, 2) NOT NULL DEFAULT 50,
    predicted_reach INTEGER,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ALERTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('price_drop', 'new_listing', 'hot_zone', 'viral_content', 'custom')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    criteria JSONB,
    action_url TEXT,
    action_label TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON public.properties(featured);
CREATE INDEX IF NOT EXISTS idx_property_predictions_property ON public.property_predictions(property_id);
CREATE INDEX IF NOT EXISTS idx_property_matches_user ON public.property_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON public.alerts(user_id, is_read) WHERE is_read = FALSE;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lifestyle_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viral_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Properties policies (public read, admin write)
CREATE POLICY "Anyone can view active properties" ON public.properties
    FOR SELECT USING (status = 'active' OR status = 'pending');

CREATE POLICY "Admins can manage properties" ON public.properties
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Property predictions policies
CREATE POLICY "Anyone can view predictions" ON public.property_predictions
    FOR SELECT USING (TRUE);

-- Lifestyle profiles policies
CREATE POLICY "Users can view own lifestyle profile" ON public.lifestyle_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lifestyle profile" ON public.lifestyle_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lifestyle profile" ON public.lifestyle_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Property matches policies
CREATE POLICY "Users can view own matches" ON public.property_matches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own matches" ON public.property_matches
    FOR ALL USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Viral content policies
CREATE POLICY "Users can view own content" ON public.viral_content
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage own content" ON public.viral_content
    FOR ALL USING (auth.uid() = user_id);

-- Alerts policies
CREATE POLICY "Users can view own alerts" ON public.alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.alerts
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_property_predictions_updated_at
    BEFORE UPDATE ON public.property_predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_lifestyle_profiles_updated_at
    BEFORE UPDATE ON public.lifestyle_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_property_matches_updated_at
    BEFORE UPDATE ON public.property_matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_viral_content_updated_at
    BEFORE UPDATE ON public.viral_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();


