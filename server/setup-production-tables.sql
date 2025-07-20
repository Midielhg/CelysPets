-- Production Database Setup Script
-- This script creates the database tables with enhanced security and proper indexing

-- Set SQL mode for better compatibility
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- Use the database (replace with your actual database name)
-- USE celyspets_celypets;

-- Drop existing tables (use with caution in production)
-- Uncomment only if you want to recreate all tables
-- DROP TABLE IF EXISTS `Appointments`;
-- DROP TABLE IF EXISTS `Clients`;
-- DROP TABLE IF EXISTS `Users`;

-- Create Users table with enhanced security
CREATE TABLE IF NOT EXISTS `Users` (
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
  `lastLogin` datetime DEFAULT NULL,
  `loginAttempts` int(11) NOT NULL DEFAULT 0,
  `lockedUntil` datetime DEFAULT NULL,
  `passwordResetToken` varchar(255) DEFAULT NULL,
  `passwordResetExpires` datetime DEFAULT NULL,
  `emailVerificationToken` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Users_email_unique` (`email`),
  UNIQUE KEY `Users_passwordResetToken_unique` (`passwordResetToken`),
  UNIQUE KEY `Users_emailVerificationToken_unique` (`emailVerificationToken`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_active` (`isActive`),
  INDEX `idx_users_email_verified` (`emailVerified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Clients table with geographical indexing
CREATE TABLE IF NOT EXISTS `Clients` (
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
  `serviceHistory` json DEFAULT NULL,
  `emergencyContact` json DEFAULT NULL,
  `specialInstructions` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `Clients_userId_fkey` (`userId`),
  INDEX `idx_clients_email` (`email`),
  INDEX `idx_clients_phone` (`phone`),
  INDEX `idx_clients_location` (`latitude`, `longitude`),
  INDEX `idx_clients_city_state` (`city`, `state`),
  INDEX `idx_clients_zipcode` (`zipCode`),
  INDEX `idx_clients_active` (`isActive`),
  INDEX `idx_clients_name` (`lastName`, `firstName`),
  CONSTRAINT `Clients_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Appointments table with comprehensive tracking
CREATE TABLE IF NOT EXISTS `Appointments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clientId` int(11) NOT NULL,
  `groomerId` int(11) DEFAULT NULL,
  `date` date NOT NULL,
  `timeSlot` varchar(20) NOT NULL,
  `duration` int(11) NOT NULL DEFAULT 60,
  `services` json NOT NULL,
  `status` enum('pending','confirmed','in_progress','completed','cancelled','rescheduled','no_show') NOT NULL DEFAULT 'pending',
  `totalAmount` decimal(10,2) NOT NULL,
  `paidAmount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `paymentStatus` enum('pending','partial','paid','refunded','failed') NOT NULL DEFAULT 'pending',
  `paymentMethod` varchar(50) DEFAULT NULL,
  `paymentTransactionId` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `internalNotes` text DEFAULT NULL,
  `reminderSent` tinyint(1) NOT NULL DEFAULT 0,
  `confirmationSent` tinyint(1) NOT NULL DEFAULT 0,
  `estimatedArrival` datetime DEFAULT NULL,
  `actualArrival` datetime DEFAULT NULL,
  `serviceStarted` datetime DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `cancelledAt` datetime DEFAULT NULL,
  `cancellationReason` varchar(500) DEFAULT NULL,
  `rescheduledFrom` int(11) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `beforePhotos` json DEFAULT NULL,
  `afterPhotos` json DEFAULT NULL,
  `weatherConditions` varchar(100) DEFAULT NULL,
  `travelTime` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `Appointments_clientId_fkey` (`clientId`),
  KEY `Appointments_groomerId_fkey` (`groomerId`),
  KEY `Appointments_rescheduledFrom_fkey` (`rescheduledFrom`),
  INDEX `idx_appointments_date` (`date`),
  INDEX `idx_appointments_status` (`status`),
  INDEX `idx_appointments_payment_status` (`paymentStatus`),
  INDEX `idx_appointments_date_status` (`date`, `status`),
  INDEX `idx_appointments_groomer_date` (`groomerId`, `date`),
  INDEX `idx_appointments_client_date` (`clientId`, `date`),
  INDEX `idx_appointments_timeslot` (`timeSlot`),
  INDEX `idx_appointments_created` (`createdAt`),
  CONSTRAINT `Appointments_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Appointments_groomerId_fkey` FOREIGN KEY (`groomerId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Appointments_rescheduledFrom_fkey` FOREIGN KEY (`rescheduledFrom`) REFERENCES `Appointments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_rating` CHECK (`rating` >= 1 AND `rating` <= 5),
  CONSTRAINT `chk_duration` CHECK (`duration` > 0),
  CONSTRAINT `chk_amounts` CHECK (`totalAmount` >= 0 AND `paidAmount` >= 0 AND `paidAmount` <= `totalAmount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Service Types table for standardized services
CREATE TABLE IF NOT EXISTS `ServiceTypes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `basePrice` decimal(10,2) NOT NULL,
  `estimatedDuration` int(11) NOT NULL DEFAULT 60,
  `category` varchar(50) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `requirements` json DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ServiceTypes_name_unique` (`name`),
  INDEX `idx_service_types_active` (`isActive`),
  INDEX `idx_service_types_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default service types
INSERT INTO `ServiceTypes` (`name`, `description`, `basePrice`, `estimatedDuration`, `category`) VALUES
('Full Grooming', 'Complete wash, cut, dry, and styling service', 75.00, 120, 'grooming'),
('Bath & Brush', 'Thorough bath and brushing service', 45.00, 60, 'grooming'),
('Nail Trim', 'Professional nail clipping and filing', 15.00, 15, 'basic'),
('Ear Cleaning', 'Safe and gentle ear cleaning', 10.00, 10, 'basic'),
('Teeth Cleaning', 'Dental hygiene service for pets', 25.00, 30, 'health'),
('Flea Treatment', 'Specialized flea removal and prevention', 35.00, 45, 'health'),
('De-shedding', 'Intensive brushing to reduce shedding', 30.00, 45, 'grooming'),
('Anal Gland Expression', 'Health maintenance service', 20.00, 15, 'health');

COMMIT;

-- Show success message
SELECT 'Production database setup completed successfully!' as Status;
SELECT 'Tables created:' as Info, 'Users, Clients, Appointments, ServiceTypes' as Tables;
