import { appConfig, allowedOrigins } from './app';

export const socketConfig = {
  cors: {
    origin: allowedOrigins as any,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  maxHttpBufferSize: 1e6, // 1 MB buffer for real-time messages
};

