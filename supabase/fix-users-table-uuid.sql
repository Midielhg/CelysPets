-- Fix users table to use UUID for Supabase Auth compatibility
-- This script should be run in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, drop existing users table if it has data issues
-- WARNING: This will delete all existing user data
DROP TABLE IF EXISTS users CASCADE;

-- Recreate users table with UUID primary key to match Supabase Auth
CREATE TABLE users (
    id UUID PRIMARY KEY, -- Changed from BIGSERIAL to UUID for Supabase Auth compatibility
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role user_role DEFAULT 'client',
    business_settings JSONB,
    google_tokens JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own records
CREATE POLICY "Users can view own record" 
ON users FOR SELECT 
USING (auth.uid() = id);

-- Create policy to allow service role to manage users
CREATE POLICY "Service role can manage users" 
ON users FOR ALL 
USING (auth.role() = 'service_role');

-- Insert a test admin user (optional)
-- You can uncomment this if you want to create a default admin
/*
INSERT INTO users (id, email, password, name, role)
VALUES (
    gen_random_uuid(),
    'admin@celyspets.com',
    'temp123456',
    'Admin User',
    'admin'
);
*/
