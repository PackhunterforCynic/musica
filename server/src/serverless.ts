import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { roomRouter } from './routes/roomRoutes';
import { storageService } from './services/StorageService';
import { socketService } from './socket/SocketService';
import { socketConfig } from './config/socket';

// Initialize storage automatically within warm Vercel containers
let isInitialized = false;
async function ensureInit() {
  if (!isInitialized) {
    await storageService.initialize();
    isInitialized = true;
  }
}

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.use(async (req, res, next) => {
  await ensureInit();
  next();
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', engine: 'Vercel Cloud Serverless Function', timestamp: new Date().toISOString() });
});

app.use('/api', roomRouter);

// Vercel Socket.IO signaling adapter
export async function socketHandler(req: any, res: any) {
  await ensureInit();

  if (!res.socket?.server?.io) {
    console.log('[Vercel Serverless] Initializing live Socket.IO signaling engine on warm instance...');
    if (res.socket?.server) {
      const io = new SocketIOServer(res.socket.server, {
        ...socketConfig,
        path: '/socket.io',
        addTrailingSlash: false,
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
          credentials: true,
        },
        transports: ['polling', 'websocket'],
      });

      socketService.initialize(io);
      res.socket.server.io = io;
    }
  } else {
    console.log('[Vercel Serverless] Reusing active Socket.IO signaling server on warm container.');
  }
  res.end();
}

export default app;
