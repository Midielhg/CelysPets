// API configuration for Supabase direct endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

// Check if we're using direct Supabase endpoints
export const USE_DIRECT_ENDPOINTS = import.meta.env.VITE_USE_DIRECT_ENDPOINTS === 'true';

// Debug logging to see what URL is being used
console.log('🔧 Environment Variables Debug:');
console.log('🔧 USE_DIRECT_ENDPOINTS:', USE_DIRECT_ENDPOINTS);
console.log('🔧 import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('🔧 API_BASE_URL:', API_BASE_URL);
console.log('🔧 All environment variables:', import.meta.env);

export const apiUrl = (path: string) => {
  // If using direct endpoints (Supabase), we'll handle this in the services
  if (USE_DIRECT_ENDPOINTS) {
    console.log('🔗 Using direct Supabase endpoints for path:', path);
    return path; // Return just the path, services will handle Supabase calls
  }
  
  // Otherwise use the base URL pattern (for development with Node.js backend)
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  console.log('🔗 API URL (Node.js backend mode):', url);
  return url;
};

if (typeof window !== 'undefined') {
  console.log('🔗 API_BASE_URL set to:', API_BASE_URL);
  console.log('🔗 USE_DIRECT_ENDPOINTS:', USE_DIRECT_ENDPOINTS);
}
