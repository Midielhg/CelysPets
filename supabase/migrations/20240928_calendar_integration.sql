-- Create calendar_connections table for storing user's connected calendars
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_type TEXT NOT NULL CHECK (calendar_type IN ('apple', 'google', 'outlook')),
  calendar_name TEXT NOT NULL,
  calendar_url TEXT NOT NULL,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_calendar_connections_user_id ON calendar_connections(user_id);
CREATE INDEX idx_calendar_connections_sync_enabled ON calendar_connections(sync_enabled);

-- Add columns to appointments table for calendar integration
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'apple_calendar', 'google_calendar', 'outlook_calendar')),
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT;

-- Create indexes for external calendar lookups
CREATE INDEX IF NOT EXISTS idx_appointments_external_id ON appointments(external_id);
CREATE INDEX IF NOT EXISTS idx_appointments_source ON appointments(source);

-- Add trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calendar_connections_updated_at 
    BEFORE UPDATE ON calendar_connections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own calendar connections
CREATE POLICY "Users can view own calendar connections" ON calendar_connections
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own calendar connections
CREATE POLICY "Users can insert own calendar connections" ON calendar_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own calendar connections
CREATE POLICY "Users can update own calendar connections" ON calendar_connections
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own calendar connections
CREATE POLICY "Users can delete own calendar connections" ON calendar_connections
    FOR DELETE USING (auth.uid() = user_id);