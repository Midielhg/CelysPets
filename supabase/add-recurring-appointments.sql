-- Add recurring appointment columns to appointments table
-- This SQL should be run in your Supabase SQL editor

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS parent_appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- Add index for better performance on recurring queries
CREATE INDEX IF NOT EXISTS idx_appointments_recurring ON appointments(is_recurring) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_appointments_parent ON appointments(parent_appointment_id) WHERE parent_appointment_id IS NOT NULL;

-- Example recurrence_pattern JSONB structure:
/*
{
  "frequency": "weekly|monthly|daily",
  "interval": 2,  // Every 2 weeks, 2 months, etc.
  "byWeekday": ["MO", "WE", "FR"],  // For weekly patterns
  "byMonthDay": [15, 30],  // For monthly patterns on specific days
  "count": 10,  // Generate 10 occurrences
  "until": "2025-12-31"  // Or until this date
}
*/

COMMENT ON COLUMN appointments.is_recurring IS 'True if this appointment is part of a recurring series';
COMMENT ON COLUMN appointments.parent_appointment_id IS 'Reference to the original appointment that created this recurring series';
COMMENT ON COLUMN appointments.recurrence_pattern IS 'JSON object defining the recurrence rules (frequency, interval, etc.)';
COMMENT ON COLUMN appointments.recurrence_end_date IS 'Date when the recurrence should stop generating new appointments';