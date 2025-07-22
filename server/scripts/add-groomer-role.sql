-- Update the user role ENUM to include 'groomer'
ALTER TABLE users MODIFY COLUMN role ENUM('client', 'admin', 'groomer') NOT NULL DEFAULT 'client';

-- Update any existing users that should be groomers
UPDATE users SET role = 'groomer' WHERE id = 2;
