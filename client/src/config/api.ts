/**
 * Centralized API & Signaling Server Configuration
 * Automatically adjusts endpoint addresses to match active localhost, 127.0.0.1, or cloud domains.
 */
const getServerUrl = (): string => {
  // 1. Explicitly configured cloud environment variable
  if (import.meta.env.VITE_SERVER_URL && import.meta.env.VITE_SERVER_URL !== '') {
    return import.meta.env.VITE_SERVER_URL;
  }
  
  if (typeof window !== 'undefined') {
    // 2. If running on Vercel or cloud web frontend, route API & Socket.IO directly to Render backend!
    if (
      window.location.hostname.includes('vercel.app') ||
      (!window.location.port && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1'))
    ) {
      return 'https://musica-ek31.onrender.com';
    }

    // 3. If running unified stack directly on server port 3001
    if (window.location.port === '3001') {
      return window.location.origin;
    }

    // 4. If running on Vite dev or preview ports using 127.0.0.1
    if (window.location.hostname === '127.0.0.1') {
      return 'http://127.0.0.1:3001';
    }
  }

  // 5. Default localhost development fallback
  return 'http://localhost:3001';
};

export const SERVER_URL = getServerUrl();
export const API_BASE_URL = `${SERVER_URL}/api`;

