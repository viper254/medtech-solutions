-- Fix RLS policies to allow anonymous access for control panel
-- The control panel is protected by secret key in URL, not by authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated access to site_control" ON site_control;
DROP POLICY IF EXISTS "Allow authenticated access to payment_history" ON payment_history;

-- Allow anonymous (anon) and authenticated users to access site_control
CREATE POLICY "Allow anon access to site_control" 
ON site_control 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Allow anonymous (anon) and authenticated users to access payment_history
CREATE POLICY "Allow anon access to payment_history" 
ON payment_history 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);
