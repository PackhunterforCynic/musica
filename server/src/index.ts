import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { appConfig } from './config/app';
import { socketConfig } from './config/socket';
import { roomRouter } from './routes/roomRoutes';
import { storageService } from './services/StorageService';
import { socketService } from './socket/SocketService';
import { cleanupService } from './services/CleanupService';

async function bootstrap(): Promise<void> {
  // 1. Initialize atomic JSON file system storage
  await storageService.initialize();

  // 2. Setup Express application
  const app = express();
  const server = http.createServer(app);

  app.use(cors({
    origin: [appConfig.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  }));
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // API router mount
  app.use('/api', roomRouter);

  // 3. Setup Socket.IO Signaling server
  const io = new Server(server, {
    ...socketConfig,
    cors: {
      origin: [appConfig.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    }
  });

  socketService.initialize(io);

  // 4. Connect background Cleanup Service callback to Socket termination events
  cleanupService.setOnRoomEndedCallback((roomId: string) => {
    socketService.notifyRoomEnded(roomId);
  });
  cleanupService.start();

  // 5. Start listening
  const port = appConfig.port || 3001;
  server.listen(port, () => {
    console.log(`====================================================`);
    console.log(`🎵 ${appConfig.serverName} running on http://localhost:${port}`);
    console.log(`🌐 Frontend client allowed from: ${appConfig.clientUrl}`);
    console.log(`📁 Persistent storage directory: ${appConfig.dataDirectory}`);
    console.log(`====================================================`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\n[Server] Shutting down gracefully...');
    cleanupService.stop();
    server.close(() => {
      console.log('[Server] HTTP and Socket servers closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
