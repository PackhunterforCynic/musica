/**
 * Centralized API & Signaling Server Configuration
 * Defaults to localhost:3001 during local development.
 * When deployed to Vercel, define VITE_SERVER_URL in the Vercel Project Environment Settings.
 */
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
export const API_BASE_URL = `${SERVER_URL}/api`;
