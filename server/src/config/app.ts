import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const appConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  dataDirectory: process.env.DATA_DIR ? process.env.DATA_DIR : (process.env.VERCEL ? '/tmp/musica-data' : path.resolve(__dirname, '../../data')),
  logLevel: process.env.LOG_LEVEL || 'info',
  serverName: 'Musica Signaling & API Server',
  version: '1.0.0',
};

export const allowedOrigins: (string | RegExp)[] = [
  appConfig.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'https://musica-apvs.vercel.app',
  /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/, // Permit all local dev machine & WiFi LAN network connections
  /\.vercel\.app$/, // Allow all Vercel preview and production domain variations
];


