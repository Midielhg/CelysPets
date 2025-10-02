-- Debug script to investigate the 1000 appointments issue
-- Run this in Supabase SQL Editor to see appointment data breakdown

-- 1. Count total appointments by month
SELECT 
  DATE_TRUNC('month', created_at::date) as month,
  COUNT(*) as appointment_count,
  COUNT(DISTINCT client_id) as unique_clients
FROM appointments 
GROUP BY DATE_TRUNC('month', created_at::date)
ORDER BY month DESC;

-- 2. Check for exactly 1000 appointments this month
SELECT 
  COUNT(*) as total_appointments_this_month,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count,
  SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_revenue
FROM appointments 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);

-- 3. Look for suspicious patterns (like recurring appointments)
SELECT 
  client_id,
  time,
  COUNT(*) as occurrence_count,
  MIN(date) as first_occurrence,
  MAX(date) as last_occurrence
FROM appointments 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY client_id, time
HAVING COUNT(*) > 10
ORDER BY occurrence_count DESC;

-- 4. Check appointment creation patterns
SELECT 
  DATE(created_at) as creation_date,
  COUNT(*) as appointments_created,
  COUNT(DISTINCT client_id) as unique_clients_created
FROM appointments 
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY DATE(created_at)
ORDER BY creation_date DESC;

-- 5. Sample of recent appointments to check data quality
SELECT 
  id,
  client_id,
  date,
  time,
  status,
  payment_status,
  total_amount,
  created_at
FROM appointments 
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY created_at DESC 
LIMIT 20;