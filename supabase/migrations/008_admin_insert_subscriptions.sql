-- =============================================
-- ADMIN INSERT SUBSCRIPTIONS POLICY
-- =============================================
-- This migration adds the INSERT policy for admins on subscriptions
-- Required for the "Grant Plan" feature in admin panel

-- Drop existing policy if exists (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON public.subscriptions;

-- Allow admins to insert subscriptions (for manual grants)
CREATE POLICY "Admins can insert subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (is_admin());

-- Also add DELETE policy for admins (useful for cleanup)
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON public.subscriptions;

CREATE POLICY "Admins can delete subscriptions" ON public.subscriptions
    FOR DELETE USING (is_admin());

