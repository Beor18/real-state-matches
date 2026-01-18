-- =============================================
-- ADMIN USER MANAGEMENT POLICIES
-- =============================================
-- This migration adds RLS policies for admin user management
-- Uses SECURITY DEFINER function to avoid RLS recursion

-- =============================================
-- HELPER FUNCTION - Check if current user is admin
-- =============================================
-- This function bypasses RLS to check admin status
-- preventing circular dependency issues

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =============================================
-- USERS TABLE - Admin Policies
-- =============================================

-- Drop existing admin policies if exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Allow admins to view all users (uses is_admin() to avoid RLS recursion)
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (is_admin());

-- Allow admins to update any user
CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (is_admin());

-- Allow admins to delete users (except themselves)
CREATE POLICY "Admins can delete users" ON public.users
    FOR DELETE USING (is_admin() AND id != auth.uid());

-- =============================================
-- SUBSCRIPTIONS TABLE - Admin Policies
-- =============================================

-- Drop existing admin policies if exist
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;

-- Allow admins to view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
    FOR SELECT USING (is_admin());

-- Allow admins to update subscriptions
CREATE POLICY "Admins can update all subscriptions" ON public.subscriptions
    FOR UPDATE USING (is_admin());

-- =============================================
-- LIFESTYLE PROFILES TABLE - Admin Policies
-- =============================================

-- Drop existing admin policy if exists
DROP POLICY IF EXISTS "Admins can view all lifestyle profiles" ON public.lifestyle_profiles;

-- Allow admins to view all lifestyle profiles
CREATE POLICY "Admins can view all lifestyle profiles" ON public.lifestyle_profiles
    FOR SELECT USING (is_admin());

-- =============================================
-- PROPERTY MATCHES TABLE - Admin Policies
-- =============================================

-- Drop existing admin policy if exists
DROP POLICY IF EXISTS "Admins can view all property matches" ON public.property_matches;

-- Allow admins to view all property matches (for user activity tracking)
CREATE POLICY "Admins can view all property matches" ON public.property_matches
    FOR SELECT USING (is_admin());

-- =============================================
-- ALERTS TABLE - Admin Policies
-- =============================================

-- Drop existing admin policy if exists
DROP POLICY IF EXISTS "Admins can view all alerts" ON public.alerts;

-- Allow admins to view all alerts
CREATE POLICY "Admins can view all alerts" ON public.alerts
    FOR SELECT USING (is_admin());
