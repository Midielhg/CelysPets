-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 10.123.0.165:3306
-- Generation Time: Jul 21, 2025 at 05:34 PM
-- Server version: 8.4.5
-- PHP Version: 8.2.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `celyspets_celypets`
--
CREATE DATABASE IF NOT EXISTS `celyspets_celypets` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `celyspets_celypets`;

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int NOT NULL,
  `clientId` int NOT NULL,
  `services` json NOT NULL,
  `date` datetime NOT NULL,
  `time` varchar(10) NOT NULL,
  `status` enum('pending','confirmed','in-progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  `notes` text,
  `totalAmount` decimal(10,2) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `clientId`, `services`, `date`, `time`, `status`, `notes`, `totalAmount`, `createdAt`, `updatedAt`) VALUES
(3, 3, '[\"full-groom\", \"bath-brush\"]', '2025-07-22 00:00:00', '8:00 AM', 'pending', 'First time client, Luna is very friendly', 0.00, '2025-07-20 01:12:28', '2025-07-21 02:02:52'),
(5, 5, '[\"full-groom\", \"nail-trim\", \"flea-treatment\"]', '2025-07-21 00:00:00', '2:30 PM', 'confirmed', 'Updated appointment - now includes flea treatment', 130.00, '2025-07-20 01:12:51', '2025-07-20 21:09:34'),
(6, 6, '[\"bath-brush\", \"flea-treatment\"]', '2025-07-23 00:00:00', '9:00 AM', 'confirmed', 'Charlie has been scratching a lot lately', 85.00, '2025-07-20 01:12:59', '2025-07-20 21:12:47'),
(7, 7, '[\"full-groom\", \"nail-trim\"]', '2025-07-21 00:00:00', '11:00 AM', 'confirmed', 'Coco loves the blow dryer', 90.00, '2025-07-20 01:13:12', '2025-07-20 22:12:46'),
(8, 8, '[\"bath-brush\", \"nail-trim\", \"teeth-cleaning\"]', '2025-07-22 00:00:00', '1:15 PM', 'in-progress', 'Zeus is a big boy but very gentle', 105.00, '2025-07-20 01:13:31', '2025-07-20 02:33:16'),
(9, 9, '[\"full-groom\"]', '2025-07-22 00:00:00', '9:30 AM', 'confirmed', 'Mimi gets car sick, please have everything ready', 65.00, '2025-07-20 01:14:09', '2025-07-20 22:21:24'),
(10, 10, '[\"bath-brush\", \"nail-trim\"]', '2025-07-23 00:00:00', '12:00 PM', 'confirmed', 'Two active dogs, Buddy has arthritis so gentle handling', 70.00, '2025-07-20 01:14:44', '2025-07-20 22:21:20'),
(11, 11, '[\"bath-brush\", \"teeth-cleaning\"]', '2025-07-23 00:00:00', '3:30 PM', 'pending', 'Princess is very small and delicate', 80.00, '2025-07-20 01:15:27', '2025-07-20 01:15:27'),
(13, 13, '[\"bath-brush\", \"nail-trim\", \"teeth-cleaning\"]', '2025-07-24 00:00:00', '11:00 AM', 'pending', 'Duke is very muscular and strong but loves people', 0.00, '2025-07-20 01:16:06', '2025-07-21 02:34:35'),
(14, 14, '[\"full-groom\", \"nail-trim\"]', '2025-07-24 00:00:00', '2:15 PM', 'pending', 'Lola is very fluffy and requires special brushing', 90.00, '2025-07-20 01:16:14', '2025-07-20 01:16:14'),
(15, 15, '[\"full-groom\", \"teeth-cleaning\"]', '2025-07-25 00:00:00', '9:00 AM', 'pending', 'Simba sheds a lot and needs thorough brushing', 100.00, '2025-07-20 01:16:22', '2025-07-20 01:16:22'),
(16, 16, '[\"bath-brush\", \"nail-trim\"]', '2025-07-25 00:00:00', '11:30 AM', 'pending', 'Two sweet dogs, Gigi and Pepe are best friends', 70.00, '2025-07-20 01:16:30', '2025-07-20 01:16:30'),
(17, 17, '[\"bath-brush\", \"nail-trim\", \"flea-treatment\"]', '2025-07-25 00:00:00', '1:45 PM', 'pending', 'Thor is a gentle giant, will need extra large equipment', 110.00, '2025-07-20 01:16:37', '2025-07-20 01:16:37'),
(18, 18, '[\"full-groom\", \"teeth-cleaning\"]', '2025-07-26 00:00:00', '10:00 AM', 'pending', 'Nala has beautiful long coat that needs special attention', 100.00, '2025-07-20 01:16:52', '2025-07-20 01:16:52'),
(19, 19, '[\"bath-brush\", \"nail-trim\"]', '2025-07-26 00:00:00', '12:30 PM', 'pending', 'Rex and Maya are rescue dogs, very loving but can be nervous', 70.00, '2025-07-20 01:17:01', '2025-07-20 01:17:01'),
(20, 20, '[\"full-groom\", \"nail-trim\"]', '2025-07-26 00:00:00', '3:00 PM', 'pending', 'Cookie has a long back, please be careful when lifting', 90.00, '2025-07-20 01:17:09', '2025-07-20 01:17:09'),
(21, 21, '[\"full-groom\"]', '2025-07-23 00:00:00', '8:00 AM', 'pending', '', 0.00, '2025-07-20 21:11:25', '2025-07-20 23:30:43'),
(22, 24, '[\"bath-brush\", \"full-groom\"]', '2025-07-22 00:00:00', '07:00', 'pending', '', 0.00, '2025-07-21 02:14:32', '2025-07-21 02:37:31');

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `pets` json NOT NULL,
  `notes` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `name`, `email`, `phone`, `address`, `pets`, `notes`, `createdAt`, `updatedAt`) VALUES
(1, 'Test Client', 'test@example.com', '555-0123', '123 Test St, Miami, FL', '[{\"age\": 3, \"name\": \"Buddy\", \"breed\": \"Golden Retriever\"}]', NULL, '2025-07-20 01:00:28', '2025-07-20 01:00:28'),
(2, 'John Doe', 'john@example.com', '555-1234', '456 Oak Ave, Miami, FL', '[{\"age\": 2, \"name\": \"Max\", \"breed\": \"Labrador\"}]', NULL, '2025-07-20 01:09:12', '2025-07-20 01:09:12'),
(3, 'Maria Rodriguez', 'maria.rodriguez@gmail.com', '305-555-1234', '1250 Biscayne Blvd, Miami, FL 33132', '[{\"age\": 3, \"name\": \"Luna\", \"breed\": \"Golden Retriever\"}]', NULL, '2025-07-20 01:12:28', '2025-07-20 01:12:28'),
(4, 'Carlos Mendez Updated', 'carlos.mendez@hotmail.com', '786-555-9999', '900 Brickell Key Dr, Updated Address, Miami, FL 33131', '[{\"age\": 5, \"name\": \"Rocky\", \"breed\": \"German Shepherd\"}]', NULL, '2025-07-20 01:12:44', '2025-07-20 01:22:37'),
(5, 'Jennifer Smith - Updated', 'jennifer.smith.updated@yahoo.com', '305-555-9999', '2100 Park Ave, Updated Suite 123, Miami Beach, FL 33139', '[{\"age\": 2, \"name\": \"Bella\", \"breed\": \"Poodle\"}, {\"age\": 4, \"name\": \"Max\", \"breed\": \"Yorkie\"}]', NULL, '2025-07-20 01:12:51', '2025-07-20 01:25:22'),
(6, 'David Williams', 'david.williams@gmail.com', '786-555-4567', '3400 SW 27th Ave, Coconut Grove, FL 33133', '[{\"age\": 6, \"name\": \"Charlie\", \"breed\": \"Beagle\"}]', NULL, '2025-07-20 01:12:59', '2025-07-20 01:12:59'),
(7, 'Ana Gutierrez', 'ana.gutierrez@outlook.com', '305-555-5678', '1500 Bay Rd, Miami Beach, FL 33139', '[{\"age\": 3, \"name\": \"Coco\", \"breed\": \"Shih Tzu\"}]', NULL, '2025-07-20 01:13:12', '2025-07-20 01:13:12'),
(8, 'Roberto Silva', 'roberto.silva@gmail.com', '786-555-6789', '4000 Meridian Ave, Miami Beach, FL 33140', '[{\"age\": 4, \"name\": \"Zeus\", \"breed\": \"Rottweiler\"}]', NULL, '2025-07-20 01:13:31', '2025-07-20 01:13:31'),
(9, 'Isabella Martinez', 'isabella.martinez@icloud.com', '305-555-7890', '1040 10th St, Miami Beach, FL 33139', '[{\"age\": 5, \"name\": \"Mimi\", \"breed\": \"Maltese\"}]', NULL, '2025-07-20 01:14:09', '2025-07-20 01:14:09'),
(10, 'Michael Johnson', 'michael.johnson@gmail.com', '786-555-8901', '501 NE 31st St, Miami, FL 33137', '[{\"age\": 7, \"name\": \"Buddy\", \"breed\": \"Labrador Mix\"}, {\"age\": 3, \"name\": \"Sadie\", \"breed\": \"Border Collie\"}]', NULL, '2025-07-20 01:14:44', '2025-07-20 01:14:44'),
(11, 'Sofia Ramirez', 'sofia.ramirez@hotmail.com', '305-555-9012', '800 West Ave, Miami Beach, FL 33139', '[{\"age\": 2, \"name\": \"Princess\", \"breed\": \"Chihuahua\"}]', NULL, '2025-07-20 01:15:27', '2025-07-20 01:15:27'),
(12, 'Patricia Lopez', 'patricia.lopez@gmail.com', '786-555-0123', '1717 N Bayshore Dr, Miami, FL 33132', '[{\"age\": 4, \"name\": \"Oscar\", \"breed\": \"French Bulldog\"}]', NULL, '2025-07-20 01:15:56', '2025-07-20 01:15:56'),
(13, 'Alexander Torres alexandre', 'alex.torres@yahoo.com', '305-555-1357', '2020 Prairie Ave, Miami Beach, FL 33139', '[{\"age\": 5, \"name\": \"Duke\", \"breed\": \"Pitbull\"}]', '', '2025-07-20 01:16:06', '2025-07-20 23:29:34'),
(14, 'Carmen Fernandez', 'carmen.fernandez@outlook.com', '786-555-2468', '3900 Biscayne Blvd, Miami, FL 33137', '[{\"age\": 3, \"name\": \"Lola\", \"breed\": \"Pomeranian\"}]', NULL, '2025-07-20 01:16:14', '2025-07-20 01:16:14'),
(15, 'Eduardo Morales', 'eduardo.morales@gmail.com', '305-555-3691', '1200 West Ave, Miami Beach, FL 33139', '[{\"age\": 6, \"name\": \"Simba\", \"breed\": \"Husky\"}]', NULL, '2025-07-20 01:16:22', '2025-07-20 01:16:22'),
(16, 'Valentina Castro', 'valentina.castro@hotmail.com', '786-555-4815', '1500 Lincoln Rd, Miami Beach, FL 33139', '[{\"age\": 4, \"name\": \"Gigi\", \"breed\": \"Cavalier King Charles\"}, {\"age\": 2, \"name\": \"Pepe\", \"breed\": \"Boston Terrier\"}]', NULL, '2025-07-20 01:16:30', '2025-07-20 01:16:30'),
(17, 'Ricardo Perez', 'ricardo.perez@icloud.com', '305-555-5926', '2600 Douglas Rd, Coral Gables, FL 33134', '[{\"age\": 3, \"name\": \"Thor\", \"breed\": \"Great Dane\"}]', NULL, '2025-07-20 01:16:37', '2025-07-20 01:16:37'),
(18, 'Gabriela Vega', 'gabriela.vega@gmail.com', '786-555-6037', '888 Brickell Key Dr, Miami, FL 33131', '[{\"age\": 5, \"name\": \"Nala\", \"breed\": \"Australian Shepherd\"}]', NULL, '2025-07-20 01:16:52', '2025-07-20 01:16:52'),
(19, 'Fernando Diaz', 'fernando.diaz@outlook.com', '305-555-7148', '1901 Brickell Ave, Miami, FL 33129', '[{\"age\": 4, \"name\": \"Rex\", \"breed\": \"Boxer\"}, {\"age\": 6, \"name\": \"Maya\", \"breed\": \"Cocker Spaniel\"}]', NULL, '2025-07-20 01:17:01', '2025-07-20 01:17:01'),
(20, 'Lucia Herrera', 'lucia.herrera@yahoo.com', '786-555-8259', '755 Crandon Blvd, Key Biscayne, FL 33149', '[{\"age\": 7, \"name\": \"Cookie\", \"breed\": \"Dachshund\"}]', NULL, '2025-07-20 01:17:09', '2025-07-20 01:17:09'),
(21, 'test', 'test@test.com', 'test', 'test', 'null', NULL, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(22, 'test', 'test@gmail.com', '30459359404', '13413413', '[]', '', '2025-07-21 00:16:31', '2025-07-21 00:16:31'),
(23, 'test', 'test', '(305) 549-0653', '14511 Jefferson St ', '[]', '', '2025-07-21 00:25:59', '2025-07-21 00:25:59'),
(24, 'new client', 'newclietn@gmail.com', '3045490653', 'tweet', 'null', NULL, '0000-00-00 00:00:00', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('client','admin') NOT NULL DEFAULT 'client',
  `businessSettings` json DEFAULT NULL,
  `googleTokens` json DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `name`, `role`, `businessSettings`, `googleTokens`, `createdAt`, `updatedAt`) VALUES
(1, 'admin@celyspets.com', '$2b$10$Hgfackqu5dKnuADxeUxpB.qSHYZK5yaLMzVTDUlsoGkeak1OoKMBW', 'Cely Admin', 'admin', NULL, NULL, '2025-07-20 00:38:18', '2025-07-20 00:38:18'),
(2, 'michelz0165@gmail.com', '$2a$12$VD2DrlmHlXCjkI1WsFcZm.MSacCyav1.G/nqbumkYIBTXZnGIo1O6', 'Michel Heniquez', 'client', NULL, NULL, '2025-07-20 02:11:23', '2025-07-20 02:11:23'),
(3, 'midielhg@icloud.com', '$2y$10$hNU2Gdk0q0n588pvpSrUTuSiSSi73jS8ehX9ut7jLHzOU00SiBkGO', 'Midiel Henriquez', 'client', NULL, NULL, '0000-00-00 00:00:00', '0000-00-00 00:00:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `clientId` (`clientId`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `email_2` (`email`),
  ADD UNIQUE KEY `email_3` (`email`),
  ADD UNIQUE KEY `email_4` (`email`),
  ADD UNIQUE KEY `email_5` (`email`),
  ADD UNIQUE KEY `email_6` (`email`),
  ADD UNIQUE KEY `email_7` (`email`),
  ADD UNIQUE KEY `email_8` (`email`),
  ADD UNIQUE KEY `email_9` (`email`),
  ADD UNIQUE KEY `email_10` (`email`),
  ADD UNIQUE KEY `email_11` (`email`),
  ADD UNIQUE KEY `email_12` (`email`),
  ADD UNIQUE KEY `email_13` (`email`),
  ADD UNIQUE KEY `email_14` (`email`),
  ADD UNIQUE KEY `email_15` (`email`),
  ADD UNIQUE KEY `email_16` (`email`),
  ADD UNIQUE KEY `email_17` (`email`),
  ADD UNIQUE KEY `email_18` (`email`),
  ADD UNIQUE KEY `email_19` (`email`),
  ADD UNIQUE KEY `email_20` (`email`),
  ADD UNIQUE KEY `email_21` (`email`),
  ADD UNIQUE KEY `email_22` (`email`),
  ADD UNIQUE KEY `email_23` (`email`),
  ADD UNIQUE KEY `email_24` (`email`),
  ADD UNIQUE KEY `email_25` (`email`),
  ADD UNIQUE KEY `email_26` (`email`),
  ADD UNIQUE KEY `email_27` (`email`),
  ADD UNIQUE KEY `email_28` (`email`),
  ADD UNIQUE KEY `email_29` (`email`),
  ADD UNIQUE KEY `email_30` (`email`),
  ADD UNIQUE KEY `email_31` (`email`),
  ADD UNIQUE KEY `email_32` (`email`),
  ADD UNIQUE KEY `email_33` (`email`),
  ADD UNIQUE KEY `email_34` (`email`),
  ADD UNIQUE KEY `email_35` (`email`),
  ADD UNIQUE KEY `email_36` (`email`),
  ADD UNIQUE KEY `email_37` (`email`),
  ADD UNIQUE KEY `email_38` (`email`),
  ADD UNIQUE KEY `email_39` (`email`),
  ADD UNIQUE KEY `email_40` (`email`),
  ADD UNIQUE KEY `email_41` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
