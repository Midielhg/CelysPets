// Feature flags for progressive Supabase migration
export const FEATURES = {
  // Toggle between API and Supabase for different components
  USE_SUPABASE_PRICING: false, // Set to true to use Supabase for PricingManagement
  USE_SUPABASE_CLIENTS: false, // Set to true to use Supabase for ClientManagement  
  USE_SUPABASE_PROMO_CODES: false, // Set to true to use Supabase for PromoCodeManagement
  USE_SUPABASE_AUTH: false, // Set to true to use Supabase for authentication
  
  // Debug flags
  LOG_API_CALLS: false, // Set to true to log all API calls
  SHOW_FEATURE_INDICATORS: true, // Set to true to show which backend is being used
} as const;

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof typeof FEATURES): boolean => {
  return FEATURES[feature];
};

// Helper function to get feature status for debugging
export const getFeatureStatus = (): Record<string, boolean> => {
  return { ...FEATURES };
};
