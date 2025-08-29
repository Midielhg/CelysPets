-- Add duration field to breeds table for full grooming duration
ALTER TABLE breeds ADD COLUMN fullGroomDuration INT COMMENT 'Duration in minutes for full grooming service';

-- Add duration field to additionalservices table 
ALTER TABLE additionalservices ADD COLUMN duration INT COMMENT 'Duration in minutes for this additional service';
