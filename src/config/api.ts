// Simple, direct API configuration
export const API_BASE_URL = 'http://localhost:5001/api';
export const apiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

if (typeof window !== 'undefined') {
  console.log('🔗 API_BASE_URL set to:', API_BASE_URL);
}
