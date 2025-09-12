-- 🚀 CELYSPETS SUPABASE DATABASE SETUP
-- Run this in Supabase Dashboard > SQL Editor

-- Create breeds table
CREATE TABLE IF NOT EXISTS breeds (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    species TEXT NOT NULL CHECK (species IN ('dog', 'cat')),
    size_category TEXT NOT NULL CHECK (size_category IN ('small', 'medium', 'large', 'extra-large')),
    bath_only_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    full_groom_price DECIMAL(10, 2) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create additional_services table
CREATE TABLE IF NOT EXISTS additional_services (
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
CREATE TABLE IF NOT EXISTS promo_codes (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
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

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    pets JSONB NOT NULL DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for now (we'll enable it later when everything works)
ALTER TABLE breeds DISABLE ROW LEVEL SECURITY;
ALTER TABLE additional_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT ALL ON breeds TO authenticated;
GRANT ALL ON additional_services TO authenticated;
GRANT ALL ON promo_codes TO authenticated;
GRANT ALL ON clients TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert sample breeds
INSERT INTO breeds (name, species, size_category, bath_only_price, full_groom_price) VALUES
('Chihuahua', 'dog', 'small', 25.00, 45.00),
('Yorkshire Terrier', 'dog', 'small', 30.00, 50.00),
('Beagle', 'dog', 'medium', 40.00, 65.00),
('Golden Retriever', 'dog', 'large', 55.00, 85.00),
('German Shepherd', 'dog', 'large', 60.00, 90.00),
('Great Dane', 'dog', 'extra-large', 70.00, 110.00),
('Persian', 'cat', 'medium', 40.00, 60.00),
('Maine Coon', 'cat', 'large', 45.00, 70.00),
('Siamese', 'cat', 'medium', 35.00, 55.00)
ON CONFLICT (id) DO NOTHING;

-- Insert additional services
INSERT INTO additional_services (code, name, price, description) VALUES
('NAIL_TRIM', 'Nail Trimming', 15.00, 'Professional nail trimming service'),
('EAR_CLEAN', 'Ear Cleaning', 10.00, 'Gentle ear cleaning and inspection'),
('TEETH_BRUSH', 'Teeth Brushing', 12.00, 'Dental hygiene service'),
('FLEA_TREATMENT', 'Flea Treatment', 25.00, 'Flea and tick treatment')
ON CONFLICT (code) DO NOTHING;

-- Insert sample promo codes
INSERT INTO promo_codes (code, name, discount_type, discount_value, minimum_amount, max_usage_total, max_usage_per_customer, valid_from, valid_until) VALUES
('FIRST20', 'First Time Customer 20% Off', 'percentage', 20.00, 50.00, 100, 1, NOW(), NOW() + INTERVAL '6 months'),
('SUMMER25', 'Summer Special 25% Off', 'percentage', 25.00, 60.00, 75, 1, NOW(), NOW() + INTERVAL '3 months')
ON CONFLICT (code) DO NOTHING;

-- Insert sample client
INSERT INTO clients (name, email, phone, address, pets) VALUES
('John Doe', 'john.doe@example.com', '(555) 123-4567', '123 Main St, Anytown, ST 12345', 
 '[{"name": "Buddy", "species": "dog", "breed": "Golden Retriever", "age": 3, "weight": 65}]')
ON CONFLICT (id) DO NOTHING;

SELECT 'Supabase database setup completed successfully!' as status;
