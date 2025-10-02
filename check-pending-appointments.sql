-- Check for pending appointments in the database
-- Run this in Supabase SQL Editor to see current appointment statuses

-- 1. Count appointments by status
SELECT 
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN date >= CURRENT_DATE THEN 1 END) as future_appointments,
  COUNT(CASE WHEN date < CURRENT_DATE THEN 1 END) as past_appointments
FROM appointments 
GROUP BY status
ORDER BY count DESC;

-- 2. Show recent appointments with all details
SELECT 
  id,
  status,
  date,
  time,
  client_id,
  created_at,
  updated_at
FROM appointments 
ORDER BY created_at DESC 
LIMIT 20;

-- 3. Look specifically for pending appointments
SELECT 
  id,
  status,
  date,
  time,
  client_id,
  total_amount,
  created_at
FROM appointments 
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if there are any appointments that might need status update
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM appointments 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY status;