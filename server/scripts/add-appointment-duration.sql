-- Add duration and endTime fields to appointments table for appointment scheduling
ALTER TABLE appointments ADD COLUMN endTime VARCHAR(10) COMMENT 'Calculated end time based on service duration';
ALTER TABLE appointments ADD COLUMN duration INT COMMENT 'Total appointment duration in minutes';
