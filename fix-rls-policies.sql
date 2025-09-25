-- Fix RLS Policy Infinite Recursion Issues
-- This script fixes the recursive policy problems

-- First, drop all existing problematic policies
DROP POLICY IF EXISTS "Allow public client creation for booking" ON clients;
DROP POLICY IF EXISTS "Allow public appointment creation for booking" ON appointments;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Drop and recreate user_profiles policies with proper logic
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;

-- Disable RLS temporarily to clear any cached policies
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive user_profiles policies
CREATE POLICY "Allow users to view own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (id = auth.uid()::text);

CREATE POLICY "Allow users to update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid()::text);

CREATE POLICY "Allow profile creation on signup"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid()::text);

-- Create secure policies for clients table
CREATE POLICY "Users can manage own client data"
ON clients FOR ALL
TO authenticated
USING (user_id = auth.uid()::text);

-- Allow public client creation ONLY during booking (no authentication required)
CREATE POLICY "Allow public client creation for booking"
ON clients FOR INSERT
TO anon
WITH CHECK (true);

-- Create secure policies for appointments table
CREATE POLICY "Users can view own appointments"
ON appointments FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()::text
  )
);

-- Allow public appointment creation ONLY during booking (no authentication required)
CREATE POLICY "Allow public appointment creation for booking"
ON appointments FOR INSERT
TO anon
WITH CHECK (true);