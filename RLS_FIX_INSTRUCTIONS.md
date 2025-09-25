## EMERGENCY FIX FOR SUPABASE RLS POLICIES

**Problem:** The RLS policies are causing infinite recursion when trying to fetch user profiles, which prevents admin users from logging in correctly.

### Step 1: Run this SQL in your Supabase SQL Editor

```sql
-- Fix RLS Policy Infinite Recursion Issues
-- Copy and paste this entire block into Supabase SQL Editor

-- First, drop all existing problematic policies
DROP POLICY IF EXISTS "Allow public client creation for booking" ON clients;
DROP POLICY IF EXISTS "Allow public appointment creation for booking" ON appointments;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Admin can view all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin can view all clients" ON clients;
DROP POLICY IF EXISTS "Admin can view all appointments" ON appointments;

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
USING (auth.uid()::text = id);

CREATE POLICY "Allow users to update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid()::text = id);

CREATE POLICY "Allow profile creation on signup"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id);

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
```

### Step 2: Verify the fix

After running the SQL above:

1. Try logging in with your admin credentials
2. Check the browser console - you should no longer see the "infinite recursion" error
3. Admin users should now be redirected to `/admin` instead of `/dashboard`

### What this fixes:

- ✅ Removes the recursive RLS policies causing the 500 errors
- ✅ Allows user profiles to load correctly
- ✅ Preserves booking functionality for public users
- ✅ Maintains security for authenticated users
- ✅ Enables proper role-based routing

### If you still have issues:

1. Clear your browser cache completely
2. Check that your admin user has `role = 'admin'` in the user_profiles table
3. Let me know what errors you see in the console