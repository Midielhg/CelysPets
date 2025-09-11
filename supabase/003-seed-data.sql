-- Seed data for CelysPets
-- Run this after creating tables and RLS policies

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password, name, role) VALUES 
('admin@celyspets.com', '$2a$10$8K6qMJ2U2yF3jCxKGJLzh.x8wF4LzU9nG8sJ3kL2mP6qR9tW5yV8e', 'Admin User', 'admin');

-- Insert sample breeds
INSERT INTO breeds (name, species, size_category, bath_only_price, full_groom_price) VALUES 
-- Dogs
('Chihuahua', 'dog', 'small', 25.00, 45.00),
('Yorkshire Terrier', 'dog', 'small', 30.00, 50.00),
('Poodle (Toy)', 'dog', 'small', 35.00, 55.00),
('Beagle', 'dog', 'medium', 40.00, 65.00),
('Cocker Spaniel', 'dog', 'medium', 45.00, 70.00),
('Border Collie', 'dog', 'medium', 50.00, 75.00),
('Golden Retriever', 'dog', 'large', 55.00, 85.00),
('German Shepherd', 'dog', 'large', 60.00, 90.00),
('Labrador Retriever', 'dog', 'large', 55.00, 85.00),
('Great Dane', 'dog', 'extra-large', 70.00, 110.00),
('Saint Bernard', 'dog', 'extra-large', 75.00, 115.00),
-- Cats
('Persian', 'cat', 'medium', 40.00, 60.00),
('Maine Coon', 'cat', 'large', 45.00, 70.00),
('Siamese', 'cat', 'medium', 35.00, 55.00),
('British Shorthair', 'cat', 'medium', 40.00, 60.00),
('Ragdoll', 'cat', 'large', 45.00, 70.00);

-- Insert additional services
INSERT INTO additional_services (code, name, price, description) VALUES 
('NAIL_TRIM', 'Nail Trimming', 15.00, 'Professional nail trimming service'),
('EAR_CLEAN', 'Ear Cleaning', 10.00, 'Gentle ear cleaning and inspection'),
('TEETH_BRUSH', 'Teeth Brushing', 12.00, 'Dental hygiene service'),
('FLEA_TREATMENT', 'Flea Treatment', 25.00, 'Flea and tick treatment'),
('DEMAT', 'De-matting', 20.00, 'Removal of matted fur'),
('ANAL_GLANDS', 'Anal Gland Expression', 15.00, 'Anal gland cleaning service'),
('COLOGNE', 'Pet Cologne', 8.00, 'Light fragrance application'),
('BOW_TIE', 'Bow Tie/Bandana', 5.00, 'Cute bow tie or bandana accessory');

-- Insert sample promo codes
INSERT INTO promo_codes (code, name, discount_type, discount_value, minimum_amount, max_usage_total, max_usage_per_customer, valid_from, valid_until) VALUES 
('WELCOME20', 'Welcome 20% Off', 'percentage', 20.00, 50.00, 100, 1, NOW(), NOW() + INTERVAL '3 months'),
('FIRST10', 'First Time $10 Off', 'fixed', 10.00, 30.00, 50, 1, NOW(), NOW() + INTERVAL '6 months'),
('LOYALTY15', 'Loyalty 15% Off', 'percentage', 15.00, 40.00, 200, 3, NOW(), NOW() + INTERVAL '1 year'),
('SUMMER25', 'Summer Special 25% Off', 'percentage', 25.00, 60.00, 75, 1, NOW(), NOW() + INTERVAL '3 months'),
('HOLIDAY30', 'Holiday $30 Off', 'fixed', 30.00, 100.00, 25, 1, NOW(), NOW() + INTERVAL '2 months');

-- Insert sample client
INSERT INTO clients (name, email, phone, address, pets) VALUES 
('John Doe', 'john.doe@example.com', '(555) 123-4567', '123 Main St, Anytown, ST 12345', 
 '[{"name": "Buddy", "species": "dog", "breed": "Golden Retriever", "age": 3, "weight": 65}]');

-- Insert sample appointment
INSERT INTO appointments (client_id, services, date, time, status, total_amount) VALUES 
(1, '[{"service": "Full Groom", "price": 85.00}]', CURRENT_DATE + INTERVAL '7 days', '10:00 AM', 'pending', 85.00);
