-- EMERGENCY FIX: Disable RLS to stop infinite recursion
-- This will temporarily disable Row Level Security to fix the login issues

-- Completely disable RLS on all tables to stop the recursion
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure clean slate
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
DROP POLICY IF EXISTS "Allow users to view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage own client data" ON clients;
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;

-- For now, we'll rely on application-level security instead of database RLS
-- This fixes the immediate login and infinite recursion issues

-- Optional: Add back minimal RLS later (ONLY run this after confirming login works)
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all authenticated users" ON user_profiles FOR ALL TO authenticated USING (true);

-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;  
-- CREATE POLICY "Allow all for clients" ON clients FOR ALL USING (true);

-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for appointments" ON appointments FOR ALL USING (true);