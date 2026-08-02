import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const appConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  dataDirectory: path.resolve(__dirname, '../../data'),
  logLevel: process.env.LOG_LEVEL || 'info',
  serverName: 'Musica Signaling & API Server',
  version: '1.0.0',
};

export const allowedOrigins: (string | RegExp)[] = [
  appConfig.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'https://musica-apvs.vercel.app',
  /\.vercel\.app$/, // Allow all Vercel preview and production domain variations
];

