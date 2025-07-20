-- Database setup for celyspets_celypets (Local Hosting)
-- Run this SQL script in phpMyAdmin or MySQL command line

-- Create database (if you haven't already)
-- CREATE DATABASE celyspets_celypets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE celyspets_celypets;

-- Create clients table
CREATE TABLE IF NOT EXISTS `clients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `pets` json NOT NULL,
  `notes` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create appointments table
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clientId` int(11) NOT NULL,
  `services` json NOT NULL,
  `date` datetime NOT NULL,
  `time` varchar(10) NOT NULL,
  `status` enum('pending','confirmed','in-progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  `notes` text,
  `totalAmount` decimal(10,2),
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `clientId` (`clientId`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('client','admin') NOT NULL DEFAULT 'client',
  `businessSettings` json,
  `googleTokens` json,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO `users` (`email`, `password`, `name`, `role`) VALUES
('admin@celyspets.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin');

-- Insert sample Miami clients
INSERT INTO `clients` (`name`, `email`, `phone`, `address`, `pets`) VALUES
('Maria Rodriguez', 'maria.rodriguez@gmail.com', '305-555-1234', '1250 Biscayne Blvd, Miami, FL 33132', '[{"age": 3, "name": "Luna", "breed": "Golden Retriever"}]'),
('Jennifer Smith', 'jennifer.smith@yahoo.com', '305-555-5678', '2100 Park Ave, Miami Beach, FL 33139', '[{"age": 2, "name": "Bella", "breed": "Poodle"}, {"age": 4, "name": "Max", "breed": "Yorkie"}]'),
('David Williams', 'david.williams@gmail.com', '786-555-4567', '3400 SW 27th Ave, Coconut Grove, FL 33133', '[{"age": 6, "name": "Charlie", "breed": "Beagle"}]'),
('Ana Gutierrez', 'ana.gutierrez@outlook.com', '305-555-5678', '1500 Bay Rd, Miami Beach, FL 33139', '[{"age": 3, "name": "Coco", "breed": "Shih Tzu"}]'),
('Roberto Silva', 'roberto.silva@gmail.com', '786-555-6789', '4000 Meridian Ave, Miami Beach, FL 33140', '[{"age": 4, "name": "Zeus", "breed": "Rottweiler"}]');

-- Insert sample appointments
INSERT INTO `appointments` (`clientId`, `services`, `date`, `time`, `status`, `notes`, `totalAmount`) VALUES
(1, '["full-groom"]', '2025-07-21', '9:00 AM', 'pending', 'First time client, Luna is very friendly', 65.00),
(2, '["full-groom", "nail-trim", "flea-treatment"]', '2025-07-21', '3:00 PM', 'confirmed', 'Regular clients - Bella and Max together', 130.00),
(3, '["bath-brush", "flea-treatment"]', '2025-07-22', '8:30 AM', 'pending', 'Charlie has been scratching a lot lately', 85.00),
(4, '["full-groom", "nail-trim"]', '2025-07-22', '10:45 AM', 'pending', 'Coco loves the blow dryer', 90.00),
(5, '["bath-brush", "nail-trim", "teeth-cleaning"]', '2025-07-22', '1:15 PM', 'pending', 'Zeus is a big boy but very gentle', 105.00);

-- Verify setup
SELECT 'Database setup completed!' as status;
SELECT COUNT(*) as total_clients FROM clients;
SELECT COUNT(*) as total_appointments FROM appointments;
SELECT COUNT(*) as total_users FROM users;
