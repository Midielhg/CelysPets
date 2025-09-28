-- Add payment_status field to appointments table
-- This migration adds the missing payment_status column to the appointments table

-- Create enum type for payment status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE payment_status_type AS ENUM ('unpaid', 'partial', 'paid', 'refunded', 'disputed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add payment_status column to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_status payment_status_type DEFAULT 'unpaid';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);

-- Update existing appointments to have default payment status
UPDATE appointments 
SET payment_status = 'unpaid' 
WHERE payment_status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN appointments.payment_status IS 'Payment status tracking for grooming appointments';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'appointments' AND column_name = 'payment_status';