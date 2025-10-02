-- Add missing columns to appointments table for calendar integration
-- Run this in your Supabase SQL Editor

-- First, remove the duplicate foreign key constraint that's causing issues
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS fk_appointments_client_id;

-- Add missing columns (duration and payment_status already exist per your schema)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'apple_calendar', 'google_calendar', 'outlook_calendar')),
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_external_id ON appointments(external_id);
CREATE INDEX IF NOT EXISTS idx_appointments_source ON appointments(source);

-- Make external_id unique AFTER adding the column
ALTER TABLE appointments ADD CONSTRAINT unique_external_id UNIQUE (external_id);