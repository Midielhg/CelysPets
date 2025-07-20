-- MySQL Database Setup for Cely's Pets Mobile Grooming
-- Run this SQL script on your hosting provider's MySQL database

-- Use your hosting provider's database
USE celyspets_celypets;

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('client', 'admin') DEFAULT 'client',
  businessSettings JSON,
  googleTokens JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Create Clients table
CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  pets JSON NOT NULL,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_name (name)
);

-- Create Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientId INT NOT NULL,
  services JSON NOT NULL,
  date DATE NOT NULL,
  time VARCHAR(10) NOT NULL,
  status ENUM('pending', 'confirmed', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  totalAmount DECIMAL(10, 2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_client (clientId),
  INDEX idx_date (date),
  INDEX idx_status (status),
  INDEX idx_date_time (date, time)
);

-- Insert default admin user (password: admin123 - CHANGE THIS!)
INSERT IGNORE INTO users (email, password, name, role) VALUES 
('admin@celypets.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9.2BL4.k7e', 'Admin User', 'admin');

-- Sample data for testing (optional)
INSERT IGNORE INTO clients (name, email, phone, address, pets) VALUES 
('John Doe', 'john@example.com', '555-0123', '123 Main St, Miami, FL 33101', '[{"name": "Buddy", "type": "dog", "breed": "Golden Retriever", "weight": "65 lbs"}]'),
('Jane Smith', 'jane@example.com', '555-0456', '456 Oak Ave, Miami, FL 33102', '[{"name": "Whiskers", "type": "cat", "breed": "Persian", "weight": "8 lbs"}]');

-- Show table structure
SHOW TABLES;
DESCRIBE users;
DESCRIBE clients;
DESCRIBE appointments;
