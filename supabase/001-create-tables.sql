-- CelysPets Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

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
