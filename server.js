import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerRoomHandlers } from './socket/roomHandler.js';
import { registerChatHandlers } from './socket/chatHandler.js';
import { registerWebRTCHandlers } from './socket/webrtcHandler.js';
import { cleanupEmptyRooms } from './utils/roomManager.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  registerRoomHandlers(io, socket);
  registerChatHandlers(io, socket);
  registerWebRTCHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    cleanupEmptyRooms(io, socket.id);
  });
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3005;
httpServer.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
