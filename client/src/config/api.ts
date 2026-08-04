/**
 * Centralized API & Signaling Server Configuration
 * Automatically adjusts endpoint addresses to match active localhost, 127.0.0.1, or cloud domains.
 */
const getServerUrl = (): string => {
  // 1. Explicitly configured custom cloud environment variable
  if (import.meta.env.VITE_SERVER_URL && import.meta.env.VITE_SERVER_URL !== '') {
    return import.meta.env.VITE_SERVER_URL;
  }
  
  // 2. If loaded in browser and hosted on Vercel or port 3001, route directly to identical origin!
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('vercel.app') || window.location.port === '3001' || (!window.location.port && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1'))) {
      return window.location.origin;
    }
    // 3. If running on Vite dev or preview ports using 127.0.0.1, preserve 127.0.0.1 host to avoid CORS blocks!
    if (window.location.hostname === '127.0.0.1') {
      return 'http://127.0.0.1:3001';
    }
  }

  // 4. Default localhost development fallback
  return 'http://localhost:3001';
};


export const SERVER_URL = getServerUrl();
export const API_BASE_URL = `${SERVER_URL}/api`;

