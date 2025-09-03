// API configuration that uses environment variables
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

// Debug logging to see what URL is being used
console.log('🔧 Environment Variables Debug:');
console.log('🔧 import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('🔧 API_BASE_URL:', API_BASE_URL);
console.log('🔧 All environment variables:', import.meta.env);

export const apiUrl = (path: string) => {
  // If VITE_API_URL already includes the full path (like for PHP), use it directly
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.includes('.php')) {
    const url = `${import.meta.env.VITE_API_URL}${path.startsWith('/') ? path : `/${path}`}`;
    console.log('🔗 API URL (PHP mode):', url);
    return url;
  }
  // Otherwise use the base URL pattern
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  console.log('🔗 API URL (standard mode):', url);
  console.log('🔗 VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('🔗 API_BASE_URL:', API_BASE_URL);
  return url;
};

if (typeof window !== 'undefined') {
  console.log('🔗 API_BASE_URL set to:', API_BASE_URL);
  console.log('🔗 VITE_API_URL from env:', import.meta.env.VITE_API_URL);
}
