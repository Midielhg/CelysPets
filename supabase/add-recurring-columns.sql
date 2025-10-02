-- SQL to run in Supabase Dashboard SQL Editor
-- Navigate to your Supabase project > SQL Editor > New Query
-- Copy and paste this SQL and run it:

-- Add recurring appointment columns to the appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_recurring 
ON appointments(is_recurring) WHERE is_recurring = true;

CREATE INDEX IF NOT EXISTS idx_appointments_parent 
ON appointments(parent_appointment_id) WHERE parent_appointment_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN appointments.is_recurring IS 'True if this appointment is part of a recurring series';
COMMENT ON COLUMN appointments.parent_appointment_id IS 'Reference to the original appointment that created this recurring series';
COMMENT ON COLUMN appointments.recurrence_pattern IS 'JSON object defining the recurrence rules (frequency, interval, etc.)';
COMMENT ON COLUMN appointments.recurrence_end_date IS 'Date when the recurrence should stop generating new appointments';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name IN ('is_recurring', 'parent_appointment_id', 'recurrence_pattern', 'recurrence_end_date')
ORDER BY ordinal_position;