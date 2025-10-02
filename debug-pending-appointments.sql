-- Debug pending appointments query
-- This will show us if pending appointments exist and their data structure

-- First, let's see the appointment statuses we have
SELECT status, COUNT(*) as count
FROM appointments 
GROUP BY status
ORDER BY count DESC;

-- Show a sample of pending appointments with client info
SELECT 
    a.id,
    a.appointment_date,
    a.total_amount,
    a.status,
    a.payment_status,
    a.created_at,
    c.name as client_name,
    c.phone,
    c.email
FROM appointments a
LEFT JOIN clients c ON a.client_id = c.id
WHERE a.status = 'pending'
ORDER BY a.appointment_date ASC
LIMIT 10;

-- Count appointments by status for today and future
SELECT 
    status,
    COUNT(*) as count,
    MIN(appointment_date) as earliest_date,
    MAX(appointment_date) as latest_date
FROM appointments 
WHERE appointment_date >= CURRENT_DATE
GROUP BY status
ORDER BY count DESC;

-- Check if we have any appointments with NULL client_id
SELECT COUNT(*) as appointments_without_client
FROM appointments 
WHERE client_id IS NULL AND status = 'pending';