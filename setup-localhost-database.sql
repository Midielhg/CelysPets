-- Database Schema for Cely's Pets Mobile Grooming
-- Run this SQL on your hosting server's MySQL database

-- Create the database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS celyspets_celypets;
USE celyspets_celypets;

-- Create clients table
CREATE TABLE `clients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `pets` json NOT NULL,
  `notes` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create appointments table
CREATE TABLE `appointments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clientId` int(11) NOT NULL,
  `services` json NOT NULL,
  `date` datetime NOT NULL,
  `time` varchar(10) NOT NULL,
  `status` enum('pending','confirmed','in-progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  `notes` text,
  `totalAmount` decimal(10,2),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `clientId` (`clientId`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create users table
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('client','admin') NOT NULL DEFAULT 'client',
  `businessSettings` json,
  `googleTokens` json,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert admin user (password: admin123)
INSERT INTO `users` (`email`, `password`, `name`, `role`, `createdAt`, `updatedAt`) VALUES
('admin@celyspets.com', '$2b$10$3TyzvzKTkGjTobeaVT.jfeTQwGO7Wiwoc6mmCAoq98Gu4ielIxDb2', 'Admin User', 'admin', NOW(), NOW());

-- Insert sample Miami clients
INSERT INTO `clients` (`name`, `email`, `phone`, `address`, `pets`, `createdAt`, `updatedAt`) VALUES
('Maria Rodriguez', 'maria.rodriguez@gmail.com', '305-555-1234', '1250 Biscayne Blvd, Miami, FL 33132', '[{"age":3,"name":"Luna","breed":"Golden Retriever"}]', NOW(), NOW()),
('Jennifer Smith', 'jennifer.smith@yahoo.com', '305-555-5678', '2100 Park Ave, Miami Beach, FL 33139', '[{"age":2,"name":"Bella","breed":"Poodle"},{"age":4,"name":"Max","breed":"Yorkie"}]', NOW(), NOW()),
('David Williams', 'david.williams@gmail.com', '786-555-4567', '3400 SW 27th Ave, Coconut Grove, FL 33133', '[{"age":6,"name":"Charlie","breed":"Beagle"}]', NOW(), NOW());

-- Insert sample appointments
INSERT INTO `appointments` (`clientId`, `services`, `date`, `time`, `status`, `notes`, `totalAmount`, `createdAt`, `updatedAt`) VALUES
(1, '["full-groom"]', '2025-07-21 00:00:00', '9:00 AM', 'pending', 'First time client, Luna is very friendly', 65.00, NOW(), NOW()),
(2, '["full-groom","nail-trim","flea-treatment"]', '2025-07-21 00:00:00', '3:00 PM', 'confirmed', 'Two dogs - Bella and Max', 130.00, NOW(), NOW()),
(3, '["bath-brush","flea-treatment"]', '2025-07-22 00:00:00', '8:30 AM', 'pending', 'Charlie has been scratching a lot lately', 85.00, NOW(), NOW());

COMMIT;
