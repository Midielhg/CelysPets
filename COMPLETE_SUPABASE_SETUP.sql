-- CelysPets Complete Database Setup for Supabase
-- Copy and paste this entire script into your Supabase SQL Editor

-- Create custom types
CREATE TYPE user_role AS ENUM ('client', 'admin', 'groomer');
CREATE TYPE pet_species AS ENUM ('dog', 'cat');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'in-progress', 'completed', 'cancelled');
CREATE TYPE size_category AS ENUM ('small', 'medium', 'large', 'extra-large');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- Create users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role user_role DEFAULT 'client',
    business_settings JSONB,
    google_tokens JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE clients (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    pets JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create breeds table
CREATE TABLE breeds (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    species pet_species NOT NULL,
    size_category size_category NOT NULL,
    bath_only_price DECIMAL(10, 2) NOT NULL,
    full_groom_price DECIMAL(10, 2) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create additional_services table
CREATE TABLE additional_services (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promo_codes table
CREATE TABLE promo_codes (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    discount_type discount_type NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    minimum_amount DECIMAL(10, 2),
    max_usage_total INTEGER NOT NULL DEFAULT 1000,
    max_usage_per_customer INTEGER NOT NULL DEFAULT 1,
    current_usage_total INTEGER NOT NULL DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    groomer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    services JSONB NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    status appointment_status DEFAULT 'pending',
    notes TEXT,
    total_amount DECIMAL(10, 2),
    promo_code_id BIGINT REFERENCES promo_codes(id) ON DELETE SET NULL,
    promo_code_discount DECIMAL(10, 2),
    original_amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pets table
CREATE TABLE pets (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    species pet_species NOT NULL,
    breed TEXT NOT NULL,
    age INTEGER NOT NULL,
    weight INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promo_code_usage table
CREATE TABLE promo_code_usage (
    id BIGSERIAL PRIMARY KEY,
    promo_code_id BIGINT NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    discount_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_groomer ON appointments(groomer_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_pets_owner ON pets(owner_id);
CREATE INDEX idx_pets_species ON pets(species);
CREATE INDEX idx_breeds_species ON breeds(species);
CREATE INDEX idx_breeds_name ON breeds(name);
CREATE INDEX idx_breeds_size ON breeds(size_category);
CREATE INDEX idx_additional_services_code ON additional_services(code);
CREATE INDEX idx_additional_services_active ON additional_services(active);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(active);
CREATE INDEX idx_promo_codes_validity ON promo_codes(valid_from, valid_until);
CREATE INDEX idx_promo_code_usage_promo ON promo_code_usage(promo_code_id);
CREATE INDEX idx_promo_code_usage_email ON promo_code_usage(customer_email);
CREATE INDEX idx_promo_code_usage_appointment ON promo_code_usage(appointment_id);
CREATE INDEX idx_promo_code_usage_composite ON promo_code_usage(promo_code_id, customer_email);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_breeds_updated_at BEFORE UPDATE ON breeds FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_additional_services_updated_at BEFORE UPDATE ON additional_services FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_promo_code_usage_updated_at BEFORE UPDATE ON promo_code_usage FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_email TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE email = user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Basic RLS policies (you can make these more restrictive later)
CREATE POLICY "Allow read for authenticated users" ON users FOR SELECT USING (auth.email() IS NOT NULL);
CREATE POLICY "Allow read for authenticated users" ON clients FOR SELECT USING (auth.email() IS NOT NULL);
CREATE POLICY "Allow read for authenticated users" ON appointments FOR SELECT USING (auth.email() IS NOT NULL);
CREATE POLICY "Allow read for authenticated users" ON pets FOR SELECT USING (auth.email() IS NOT NULL);
CREATE POLICY "Allow read for everyone" ON breeds FOR SELECT USING (true);
CREATE POLICY "Allow read for everyone" ON additional_services FOR SELECT USING (true);
CREATE POLICY "Allow read for everyone" ON promo_codes FOR SELECT USING (true);
CREATE POLICY "Allow read for authenticated users" ON promo_code_usage FOR SELECT USING (auth.email() IS NOT NULL);

-- Allow all operations for now (you can restrict later)
CREATE POLICY "Allow all for authenticated users" ON users FOR ALL USING (auth.email() IS NOT NULL);
CREATE POLICY "Allow all for authenticated users" ON clients FOR ALL USING (auth.email() IS NOT NULL);
CREATE POLICY "Allow all for authenticated users" ON appointments FOR ALL USING (auth.email() IS NOT NULL);
CREATE POLICY "Allow all for authenticated users" ON pets FOR ALL USING (auth.email() IS NOT NULL);
CREATE POLICY "Allow all for authenticated users" ON breeds FOR ALL USING (auth.email() IS NOT NULL);
CREATE POLICY "Allow all for authenticated users" ON additional_services FOR ALL USING (auth.email() IS NOT NULL);
CREATE POLICY "Allow all for authenticated users" ON promo_codes FOR ALL USING (auth.email() IS NOT NULL);
CREATE POLICY "Allow all for authenticated users" ON promo_code_usage FOR ALL USING (auth.email() IS NOT NULL);

-- Insert default admin user (password: admin123)
-- Note: In production, you should hash this password properly
INSERT INTO users (email, password, name, role) VALUES 
('admin@celyspets.com', 'admin123', 'Admin User', 'admin');

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

-- Helper function to increment promo code usage
CREATE OR REPLACE FUNCTION increment_promo_usage(promo_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE promo_codes 
    SET current_usage_total = current_usage_total + 1,
        updated_at = NOW()
    WHERE id = promo_id;
END;
$$ LANGUAGE plpgsql;
