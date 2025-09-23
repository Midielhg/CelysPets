-- URGENT FIX: RLS Policies for user_profiles table
-- Copy and run ALL of this in your Supabase SQL Editor

-- Step 1: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can create user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON user_profiles;

-- Step 2: Temporarily disable RLS to fix existing data issues
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Check if any users exist in auth.users but not in user_profiles
-- This will show users that need profile records created
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    up.id as profile_id,
    up.email as profile_email
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Step 4: Create missing profiles for existing auth users
INSERT INTO user_profiles (id, email, name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'User'),
    COALESCE(au.raw_user_meta_data->>'role', 'client'),
    NOW(),
    NOW()
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Step 5: Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'role', 'client')
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicates
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Re-enable RLS with proper policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 8: Create permissive policies that allow access
-- Allow users to read their own profile
CREATE POLICY "enable_read_own_profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "enable_update_own_profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (for signup)
CREATE POLICY "enable_insert_own_profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admin users to do everything (if admin exists)
CREATE POLICY "enable_admin_all_access" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Step 9: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO anon;

-- Step 10: Create an admin user (CHANGE EMAIL TO YOUR ACTUAL EMAIL)
-- First manually sign up with this email in your app, then run:
-- UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@celyspets.com';

-- Verification query - run this to check everything worked
SELECT 'Auth users count:' as info, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Profile count:', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'Admin count:', COUNT(*) FROM user_profiles WHERE role = 'admin';