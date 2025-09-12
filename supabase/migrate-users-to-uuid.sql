-- Alternative: Modify existing users table to use UUID
-- This preserves existing data but may require manual data migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Option 1: If the table is empty or you can afford to lose data
-- Uncomment the following lines:
/*
ALTER TABLE users DROP CONSTRAINT users_pkey;
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS users_id_seq;
ALTER TABLE users ALTER COLUMN id TYPE UUID USING gen_random_uuid();
ALTER TABLE users ADD PRIMARY KEY (id);
*/

-- Option 2: Create a new table and migrate data
-- This is safer if you have existing data

-- Create a temporary new users table with UUID
CREATE TABLE users_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role user_role DEFAULT 'client',
    business_settings JSONB,
    google_tokens JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrate existing data (if any) - assigns new UUIDs
-- INSERT INTO users_new (email, password, name, role, business_settings, google_tokens, created_at, updated_at)
-- SELECT email, password, name, role, business_settings, google_tokens, created_at, updated_at FROM users;

-- Drop old table and rename new one
-- DROP TABLE users;
-- ALTER TABLE users_new RENAME TO users;

-- Create indexes
CREATE INDEX idx_users_new_email ON users_new(email);
CREATE INDEX idx_users_new_role ON users_new(role);

-- Enable RLS
ALTER TABLE users_new ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own record" 
ON users_new FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Service role can manage users" 
ON users_new FOR ALL 
USING (auth.role() = 'service_role');
