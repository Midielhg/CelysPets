-- Row Level Security Policies for CelysPets
-- Run this after creating the tables

-- Enable RLS on all tables
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

-- Users policies
CREATE POLICY "Users can read their own data" ON users
    FOR SELECT USING (auth.email() = email);

CREATE POLICY "Admins can read all users" ON users
    FOR SELECT USING (get_user_role(auth.email()) = 'admin');

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.email() = email);

CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (get_user_role(auth.email()) = 'admin');

CREATE POLICY "Anyone can create user accounts" ON users
    FOR INSERT WITH CHECK (true);

-- Clients policies
CREATE POLICY "Admins and groomers can read all clients" ON clients
    FOR SELECT USING (get_user_role(auth.email()) IN ('admin', 'groomer'));

CREATE POLICY "Clients can read their own data" ON clients
    FOR SELECT USING (auth.email() = email);

CREATE POLICY "Admins and groomers can manage clients" ON clients
    FOR ALL USING (get_user_role(auth.email()) IN ('admin', 'groomer'));

-- Appointments policies
CREATE POLICY "Admins and groomers can read all appointments" ON appointments
    FOR SELECT USING (get_user_role(auth.email()) IN ('admin', 'groomer'));

CREATE POLICY "Clients can read their own appointments" ON appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = appointments.client_id 
            AND clients.email = auth.email()
        )
    );

CREATE POLICY "Admins and groomers can manage appointments" ON appointments
    FOR ALL USING (get_user_role(auth.email()) IN ('admin', 'groomer'));

CREATE POLICY "Clients can create appointments" ON appointments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = appointments.client_id 
            AND clients.email = auth.email()
        )
    );

-- Pets policies
CREATE POLICY "Users can read their own pets" ON pets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = pets.owner_id 
            AND users.email = auth.email()
        )
    );

CREATE POLICY "Admins can read all pets" ON pets
    FOR SELECT USING (get_user_role(auth.email()) = 'admin');

CREATE POLICY "Users can manage their own pets" ON pets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = pets.owner_id 
            AND users.email = auth.email()
        )
    );

CREATE POLICY "Admins can manage all pets" ON pets
    FOR ALL USING (get_user_role(auth.email()) = 'admin');

-- Breeds policies (read-only for clients, full access for admins)
CREATE POLICY "Everyone can read active breeds" ON breeds
    FOR SELECT USING (active = true);

CREATE POLICY "Admins can read all breeds" ON breeds
    FOR SELECT USING (get_user_role(auth.email()) = 'admin');

CREATE POLICY "Admins can manage breeds" ON breeds
    FOR ALL USING (get_user_role(auth.email()) = 'admin');

-- Additional services policies
CREATE POLICY "Everyone can read active services" ON additional_services
    FOR SELECT USING (active = true);

CREATE POLICY "Admins can read all services" ON additional_services
    FOR SELECT USING (get_user_role(auth.email()) = 'admin');

CREATE POLICY "Admins can manage services" ON additional_services
    FOR ALL USING (get_user_role(auth.email()) = 'admin');

-- Promo codes policies
CREATE POLICY "Everyone can read active promo codes" ON promo_codes
    FOR SELECT USING (active = true);

CREATE POLICY "Admins can read all promo codes" ON promo_codes
    FOR SELECT USING (get_user_role(auth.email()) = 'admin');

CREATE POLICY "Admins can manage promo codes" ON promo_codes
    FOR ALL USING (get_user_role(auth.email()) = 'admin');

-- Promo code usage policies
CREATE POLICY "Users can read their own promo usage" ON promo_code_usage
    FOR SELECT USING (customer_email = auth.email());

CREATE POLICY "Admins can read all promo usage" ON promo_code_usage
    FOR SELECT USING (get_user_role(auth.email()) = 'admin');

CREATE POLICY "Users can create promo usage records" ON promo_code_usage
    FOR INSERT WITH CHECK (customer_email = auth.email());

CREATE POLICY "Admins can manage all promo usage" ON promo_code_usage
    FOR ALL USING (get_user_role(auth.email()) = 'admin');
