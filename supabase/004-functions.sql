-- Additional SQL functions for CelysPets
-- Run this after the main schema setup

-- Function to increment promo code usage
CREATE OR REPLACE FUNCTION increment_promo_usage(promo_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE promo_codes 
    SET current_usage_total = current_usage_total + 1,
        updated_at = NOW()
    WHERE id = promo_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get promo code statistics
CREATE OR REPLACE FUNCTION get_promo_stats()
RETURNS TABLE (
    active_codes INTEGER,
    total_usage INTEGER,
    expiring_soon INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM promo_codes WHERE active = true) as active_codes,
        (SELECT COALESCE(SUM(current_usage_total), 0)::INTEGER FROM promo_codes) as total_usage,
        (SELECT COUNT(*)::INTEGER FROM promo_codes 
         WHERE active = true 
         AND valid_until IS NOT NULL 
         AND valid_until BETWEEN NOW() AND NOW() + INTERVAL '7 days') as expiring_soon;
END;
$$ LANGUAGE plpgsql;
