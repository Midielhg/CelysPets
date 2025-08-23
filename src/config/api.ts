// API configuration that uses environment variables
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
export const apiUrl = (path: string) => {
  // If VITE_API_URL already includes the full path (like for PHP), use it directly
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.includes('.php')) {
    return `${import.meta.env.VITE_API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  }
  // Otherwise use the base URL pattern
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

if (typeof window !== 'undefined') {
  console.log('🔗 API_BASE_URL set to:', API_BASE_URL);
  console.log('🔗 VITE_API_URL from env:', import.meta.env.VITE_API_URL);
}
