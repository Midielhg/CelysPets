-- SQL Script to Remove Duplicate Breeds
-- Run this in the Supabase SQL Editor

-- Show current duplicates
SELECT name, COUNT(*) as count, ARRAY_AGG(id ORDER BY id) as ids
FROM breeds 
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY name;

-- Remove the higher ID duplicates (keeping the original/lower ID)
-- These are the exact duplicates we identified:

-- Remove Chihuahua duplicate (keep ID 1, remove ID 18)
DELETE FROM breeds WHERE id = 18;

-- Remove Golden Retriever duplicate (keep ID 7, remove ID 17) 
DELETE FROM breeds WHERE id = 17;

-- Remove Maine Coon duplicate (keep ID 13, remove ID 20)
DELETE FROM breeds WHERE id = 20;

-- Remove Persian duplicate (keep ID 12, remove ID 19)  
DELETE FROM breeds WHERE id = 19;

-- Verify cleanup
SELECT name, COUNT(*) as count, ARRAY_AGG(id ORDER BY id) as ids
FROM breeds 
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY name;

-- Show final breed count
SELECT COUNT(*) as total_breeds FROM breeds;

-- Show all remaining breeds
SELECT id, name, species, size_category, full_groom_price, active
FROM breeds 
ORDER BY name;