-- Test data for Groomer Dashboard
-- This script creates sample appointments for testing the Supabase integration

-- First, let's make sure we have a groomer user
-- (This assumes you already have a groomer user created through the UI)

-- Create a test client
INSERT INTO clients (name, email, phone, address, pets) VALUES 
('John Smith', 'john@example.com', '555-1234', '123 Main St, Miami, FL', 
 '[{"name": "Buddy", "breed": "Golden Retriever", "species": "dog", "age": 3}]');

-- Create some test appointments for a groomer
-- You'll need to replace 'GROOMER_USER_ID' with the actual groomer user ID from your user_profiles table

-- Today's appointments
INSERT INTO appointments (clientId, groomerId, services, date, time, status, totalAmount, originalAmount, notes) VALUES 
(
  (SELECT id FROM clients WHERE email = 'john@example.com' LIMIT 1),
  'GROOMER_USER_ID', -- Replace with actual groomer user ID
  '[{"name": "Full Grooming", "service": "Full Grooming", "duration": 90, "price": 65}]',
  CURRENT_DATE,
  '10:00',
  'confirmed',
  65,
  65,
  'Regular customer, very friendly dog'
);

-- Tomorrow's appointment
INSERT INTO appointments (clientId, groomerId, services, date, time, status, totalAmount, originalAmount) VALUES 
(
  (SELECT id FROM clients WHERE email = 'john@example.com' LIMIT 1),
  'GROOMER_USER_ID', -- Replace with actual groomer user ID
  '[{"name": "Bath & Brush", "service": "Bath & Brush", "duration": 45, "price": 35}]',
  CURRENT_DATE + INTERVAL '1 day',
  '14:00',
  'pending',
  35,
  35
);

-- Create another test client
INSERT INTO clients (name, email, phone, address, pets) VALUES 
('Sarah Johnson', 'sarah@example.com', '555-5678', '456 Oak Ave, Miami, FL', 
 '[{"name": "Fluffy", "breed": "Persian", "species": "cat", "age": 2}]');

-- Next week appointment
INSERT INTO appointments (clientId, groomerId, services, date, time, status, totalAmount, originalAmount) VALUES 
(
  (SELECT id FROM clients WHERE email = 'sarah@example.com' LIMIT 1),
  'GROOMER_USER_ID', -- Replace with actual groomer user ID
  '[{"name": "Cat Grooming", "service": "Cat Grooming", "duration": 60, "price": 45}]',
  CURRENT_DATE + INTERVAL '3 days',
  '11:30',
  'pending',
  45,
  45
);

-- Completed appointment from yesterday for stats
INSERT INTO appointments (clientId, groomerId, services, date, time, status, totalAmount, originalAmount) VALUES 
(
  (SELECT id FROM clients WHERE email = 'john@example.com' LIMIT 1),
  'GROOMER_USER_ID', -- Replace with actual groomer user ID
  '[{"name": "Nail Trim", "service": "Nail Trim", "duration": 20, "price": 15}]',
  CURRENT_DATE - INTERVAL '1 day',
  '09:00',
  'completed',
  15,
  15
);