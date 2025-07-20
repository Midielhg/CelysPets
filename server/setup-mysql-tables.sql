-- Cely's Pets Mobile Grooming Database Setup
-- Run this script in your hosting provider's phpMyAdmin or MySQL console
-- Database: celyspets_celypets

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS `Appointments`;
DROP TABLE IF EXISTS `Clients`;
DROP TABLE IF EXISTS `Users`;

-- Create Users table
CREATE TABLE `Users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `role` enum('admin','groomer','customer') NOT NULL DEFAULT 'customer',
  `phone` varchar(20) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `emailVerified` tinyint(1) NOT NULL DEFAULT 0,
  `profilePicture` varchar(500) DEFAULT NULL,
  `preferences` json DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Users_email_unique` (`email`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Clients table
CREATE TABLE `Clients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` varchar(500) NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(50) NOT NULL,
  `zipCode` varchar(10) NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `petInfo` json DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `preferredGroomer` varchar(100) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `Clients_userId_fkey` (`userId`),
  INDEX `idx_clients_email` (`email`),
  INDEX `idx_clients_phone` (`phone`),
  INDEX `idx_clients_location` (`latitude`, `longitude`),
  CONSTRAINT `Clients_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Appointments table
CREATE TABLE `Appointments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clientId` int(11) NOT NULL,
  `groomerId` int(11) DEFAULT NULL,
  `date` date NOT NULL,
  `timeSlot` varchar(20) NOT NULL,
  `duration` int(11) NOT NULL DEFAULT 60,
  `services` json NOT NULL,
  `status` enum('pending','confirmed','in_progress','completed','cancelled','rescheduled') NOT NULL DEFAULT 'pending',
  `totalAmount` decimal(10,2) NOT NULL,
  `paidAmount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `paymentStatus` enum('pending','partial','paid','refunded') NOT NULL DEFAULT 'pending',
  `paymentMethod` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `reminderSent` tinyint(1) NOT NULL DEFAULT 0,
  `estimatedArrival` datetime DEFAULT NULL,
  `actualArrival` datetime DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `cancelledAt` datetime DEFAULT NULL,
  `cancellationReason` varchar(500) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `Appointments_clientId_fkey` (`clientId`),
  KEY `Appointments_groomerId_fkey` (`groomerId`),
  INDEX `idx_appointments_date` (`date`),
  INDEX `idx_appointments_status` (`status`),
  INDEX `idx_appointments_payment_status` (`paymentStatus`),
  INDEX `idx_appointments_date_status` (`date`, `status`),
  CONSTRAINT `Appointments_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Appointments_groomerId_fkey` FOREIGN KEY (`groomerId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_rating` CHECK (`rating` >= 1 AND `rating` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample admin user
INSERT INTO `Users` (`email`, `password`, `firstName`, `lastName`, `role`, `phone`, `isActive`, `emailVerified`) 
VALUES (
  'admin@celyspets.com', 
  '$2b$10$YourHashedPasswordHere', -- You'll need to hash this password
  'Cely', 
  'Admin', 
  'admin', 
  '+1-555-0123', 
  1, 
  1
);

-- Insert sample groomer user
INSERT INTO `Users` (`email`, `password`, `firstName`, `lastName`, `role`, `phone`, `isActive`, `emailVerified`) 
VALUES (
  'groomer@celyspets.com', 
  '$2b$10$YourHashedPasswordHere', -- You'll need to hash this password
  'Professional', 
  'Groomer', 
  'groomer', 
  '+1-555-0124', 
  1, 
  1
);

-- Insert sample client
INSERT INTO `Clients` (`firstName`, `lastName`, `email`, `phone`, `address`, `city`, `state`, `zipCode`, `latitude`, `longitude`, `petInfo`, `notes`) 
VALUES (
  'John', 
  'Doe', 
  'john.doe@example.com', 
  '+1-555-0125', 
  '123 Main Street', 
  'Miami', 
  'FL', 
  '33101', 
  25.7617, 
  -80.1918,
  '{"pets": [{"name": "Buddy", "breed": "Golden Retriever", "age": 3, "weight": "65 lbs", "specialNeeds": "Sensitive skin"}]}',
  'Regular customer, prefers morning appointments'
);

-- Insert sample appointment
INSERT INTO `Appointments` (`clientId`, `groomerId`, `date`, `timeSlot`, `duration`, `services`, `status`, `totalAmount`, `notes`) 
VALUES (
  1, -- clientId (John Doe)
  2, -- groomerId (Professional Groomer)
  '2025-07-25', 
  '10:00 AM', 
  90, 
  '{"services": [{"name": "Full Grooming", "price": 75.00}, {"name": "Nail Trim", "price": 15.00}]}',
  'confirmed',
  90.00,
  'First appointment - Golden Retriever full service'
);

-- Show table creation results
SELECT 'Database tables created successfully!' as Status;

-- Show table structure
SHOW TABLES;

-- Show sample data
SELECT COUNT(*) as UserCount FROM Users;
SELECT COUNT(*) as ClientCount FROM Clients;
SELECT COUNT(*) as AppointmentCount FROM Appointments;
