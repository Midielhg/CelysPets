-- User Migration SQL Script - Manual Execution Required
-- Copy and paste this into your Supabase SQL Editor

-- First, temporarily disable RLS to allow data insertion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Insert all migrated users
INSERT INTO users (email, password, name, role, business_settings, google_tokens, created_at, updated_at) VALUES
('admin@celyspets.com', '$2y$10$QZCIMe1qrTIlYJabh9VdJeYzatSW2OXXBcE2vXivVaOlg8bE09aaK', 'Administrator', 'admin', NULL, NULL, '2025-07-22T02:16:01.000Z', '2025-08-13T03:04:37.000Z'),
('michel@celyspets.com', '$2a$12$RRZYa72oumql4XLR4dHRXuX1z7blhCtpbDjsu4WUQ4cq4I37m3RxK', 'Michel Henriquez', 'groomer', NULL, NULL, '2025-07-22T05:36:10.000Z', '2025-09-04T02:48:48.000Z'),
('midielhg@icloud.com', '$2a$12$.CXDy1q8iIGjDIDhYi0o0OBeJb3aM.xjq5N1u9G7dK95aSwrh5Shu', 'Midiel Henriquez', 'admin', NULL, NULL, '2025-08-01T05:47:47.000Z', '2025-08-01T05:47:47.000Z'),
('cellismariagarcia@gmail.com', '$2a$12$7PZROpYU0KYCFus9CQ2cmuycOYPzT5BiR2ELPODAlF9XSqD4SjZg2', 'Cellis Garcia', 'groomer', NULL, NULL, '2025-09-04T02:48:09.000Z', '2025-09-04T02:48:09.000Z'),
('clarit1999@gmail.com', '$2a$12$nCFKTvTetRrv2Taaois7kuoeGjBpdZcXpXn6nK4yjyiDv.TbHRKfS', 'Claritza Bosque', 'client', NULL, NULL, '2025-09-04T02:49:10.000Z', '2025-09-04T02:49:10.000Z'),
('rolyblas@gmail.com', '$2y$10$NjSRx2lR82nedeIOhnHF8em26iqdIuWViG7vCGKv81kXOJcVh9fei', 'Rolando Henriquez', 'groomer', NULL, NULL, NOW(), NOW()),
('midiel@gmail.com', '$2y$10$knOwYmSBlwvYw656oeilUu2ot5jbKVG9gmGrNcVbzqKATMqB05bce', 'Midiel Clientq', 'client', NULL, NULL, NOW(), NOW());

-- Re-enable RLS after migration
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Verify the migration worked
SELECT id, email, name, role, created_at FROM users ORDER BY created_at;
