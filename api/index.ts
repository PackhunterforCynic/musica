import express from 'express';
import cors from 'cors';
import { roomRouter } from '../server/src/routes/roomRoutes';
import { storageService } from '../server/src/services/StorageService';
import { allowedOrigins } from '../server/src/config/app';

const app = express();

app.use(cors({
  origin: allowedOrigins as any,
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy (vercel)', timestamp: new Date().toISOString() });
});

// API router mount
app.use('/api', roomRouter);

let initialized = false;

export default async function (req: any, res: any) {
  if (!initialized) {
    try {
      await storageService.initialize();
      initialized = true;
      console.log('[Vercel] Storage Service Initialized');
    } catch (e) {
      console.error('[Vercel] Storage Init Error:', e);
    }
  }
  return app(req, res);
}
