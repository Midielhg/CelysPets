// Central API base URL resolver to avoid scattered env issues
const fromEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_API_URL : undefined;

// Prefer env, else use relative /api (works with Vite proxy), finally fallback to 5001
const resolved =
  (typeof fromEnv === 'string' && fromEnv.trim()) ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:5001/api');

export const API_BASE_URL = resolved.replace(/\/$/, '');
export const apiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('🔗 API_BASE_URL resolved to:', API_BASE_URL);
}
