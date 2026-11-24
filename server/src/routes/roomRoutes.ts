import { Router, Request, Response } from 'express';
import { roomService } from '../services/RoomService';
import { statisticsService } from '../services/StatisticsService';
import { loggerService } from '../services/LoggerService';
import { liveKitService } from '../services/LiveKitService';
import { liveKitWebhookService } from '../services/LiveKitWebhookService';
import { supabaseService } from '../services/SupabaseService';
import { optionalAuth, requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AppError, UserRole } from '@musica/shared';

export const roomRouter = Router();

/**
 * @route POST /api/rooms
 * @desc Create a new broadcasting room
 */
roomRouter.post('/rooms', async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostName, roomName, password, maxParticipants, roomType, category, visibility, description } = req.body;
    const result = await roomService.createRoom({
      hostName,
      roomName,
      password,
      maxParticipants,
      roomType,
      category,
      visibility,
      description,
    });
    res.status(201).json({
      success: true,
      roomId: result.roomId,
      room: result.room,
      hostAuthToken: result.hostAuthToken,
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ success: false, error: err.message || 'Internal server error', code: err.code });
  }
});

/**
 * @route POST /api/rooms/join
 * @desc Validate room credentials prior to connecting via Socket.IO
 */
roomRouter.post('/rooms/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId, name, password } = req.body;
    if (!name || name.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Participant name is required.' });
      return;
    }
    
    const room = await roomService.validateJoin({
      roomId: roomId ? roomId.trim().toUpperCase() : '',
      userName: name.trim(),
      password,
    });

    res.status(200).json({
      success: true,
      roomId: room.roomId,
      roomName: room.roomName,
      hostName: room.hostName,
      participantId: `temp-${Date.now()}`, // Socket ID assigned upon connection
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ success: false, error: err.message || 'Internal server error', code: err.code });
  }
});

/**
 * @route GET /api/rooms/:roomId
 * @desc Fetch public room details and active participant count
 */
roomRouter.get('/rooms/:roomId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const details = await roomService.getRoom(String(roomId || '').trim().toUpperCase());
    
    res.status(200).json({
      roomId: details.room.roomId,
      roomName: details.room.roomName,
      hostName: details.room.hostName,
      participants: details.activeParticipantsCount,
      maxParticipants: details.room.maxParticipants,
      locked: details.room.locked,
      status: details.room.status,
      screenShareState: details.room.screenShareState,
      isRecovering: details.isRecovering,
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 404;
    res.status(status).json({ success: false, error: err.message || 'Room not found', code: err.code });
  }
});

/**
 * @route DELETE /api/rooms/:roomId
 * @desc Terminate a broadcasting room by host
 */
roomRouter.delete('/rooms/:roomId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const normalizedRoomId = String(roomId || '').trim().toUpperCase();
    await roomService.endRoom(normalizedRoomId, 'API Termination');
    await liveKitService.deleteRoom(normalizedRoomId);
    res.status(200).json({ success: true, message: `Room ${String(roomId)} ended successfully.` });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ success: false, error: err.message || 'Internal server error', code: err.code });
  }
});

/**
 * @route POST /api/rooms/:roomId/token
 * @desc Generate secure LiveKit access token with role grants
 */
roomRouter.post('/rooms/:roomId/token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { userName, password, identity, role: requestedRole } = req.body;
    if (!userName || userName.trim().length === 0) {
      res.status(400).json({ success: false, error: 'User name is required.' });
      return;
    }

    const normalizedRoomId = String(roomId || '').trim().toUpperCase();
    const roomDetails = await roomService.getRoom(normalizedRoomId);

    const isPeerToPeerRoom =
      roomDetails.room.roomType === 'private' ||
      roomDetails.room.roomType === 'couple' ||
      roomDetails.room.roomType === 'remote-support';

    let role: UserRole = isPeerToPeerRoom ? 'speaker' : 'audience';
    if (roomDetails.room.hostName.toLowerCase() === userName.trim().toLowerCase()) {
      role = 'host';
    } else {
      await roomService.validateJoin({
        roomId: normalizedRoomId,
        userName: userName.trim(),
        password,
      });
      if (requestedRole && ['dj', 'speaker', 'co-host'].includes(requestedRole)) {
        role = requestedRole as UserRole;
      }
    }

    const participantIdentity = identity || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tokenResponse = await liveKitService.generateToken({
      roomId: normalizedRoomId,
      participantIdentity,
      participantName: userName.trim(),
      role,
      roomType: roomDetails.room.roomType,
    });

    res.status(200).json({
      success: true,
      ...tokenResponse,
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ success: false, error: err.message || 'Failed to generate token', code: err.code });
  }
});

/**
 * @route POST /api/livekit/token
 * @desc Alias for LiveKit token generation passing roomId in payload
 */
roomRouter.post('/livekit/token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId, userName, password, identity, role } = req.body;
    if (!roomId) {
      res.status(400).json({ success: false, error: 'roomId is required.' });
      return;
    }
    req.params.roomId = roomId;
    const normalizedRoomId = String(roomId).trim().toUpperCase();
    const roomDetails = await roomService.getRoom(normalizedRoomId);

    let resolvedRole: UserRole = 'audience';
    if (roomDetails.room.hostName.toLowerCase() === String(userName || '').trim().toLowerCase()) {
      resolvedRole = 'host';
    } else {
      await roomService.validateJoin({
        roomId: normalizedRoomId,
        userName: String(userName || '').trim(),
        password,
      });
      if (role && ['dj', 'speaker', 'co-host'].includes(role)) {
        resolvedRole = role as UserRole;
      }
    }

    const participantIdentity = identity || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tokenResponse = await liveKitService.generateToken({
      roomId: normalizedRoomId,
      participantIdentity,
      participantName: String(userName || '').trim(),
      role: resolvedRole,
    });

    res.status(200).json({
      success: true,
      ...tokenResponse,
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ success: false, error: err.message || 'Failed to generate LiveKit token', code: err.code });
  }
});

/**
 * @route POST /api/livekit/webhook
 * @desc Handle incoming server lifecycle events from LiveKit Cloud / SFU
 */
roomRouter.post('/livekit/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = (req.headers['authorization'] as string) || '';
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const event = await liveKitWebhookService.handleWebhook(rawBody, authHeader);
    res.status(200).json({ success: true, event: event.event });
  } catch (err: any) {
    console.warn('[LiveKitWebhook] Webhook processing note:', err.message);
    res.status(200).json({ success: false, message: err.message });
  }
});

/**
 * @route GET /api/auth/health
 * @desc Check Supabase authentication and database connectivity
 */
roomRouter.get('/auth/health', async (req: Request, res: Response): Promise<void> => {
  const health = await supabaseService.healthCheck();
  res.status(health.ok ? 200 : 503).json(health);
});

/**
 * @route GET /api/auth/me
 * @desc Get current authenticated user profile (or null if guest)
 */
roomRouter.get('/auth/me', optionalAuth as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(200).json({ success: true, authenticated: false, user: null });
    return;
  }

  const profile = await supabaseService.getProfile(req.user.id);
  res.status(200).json({
    success: true,
    authenticated: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      profile: profile || {
        id: req.user.id,
        email: req.user.email,
        username: `user_${req.user.id.slice(0, 6)}`,
        displayName: req.user.user_metadata?.full_name || 'Musica User',
      },
    },
  });
});

/**
 * @route POST /api/auth/profile
 * @desc Update user profile in Supabase
 */
roomRouter.post('/auth/profile', requireAuth as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { username, displayName, avatarUrl } = req.body;
    await supabaseService.upsertProfile({
      id: req.user!.id,
      username,
      displayName,
      avatarUrl,
    });
    res.status(200).json({ success: true, message: 'Profile updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to update profile' });
  }
});

/**
 * @route GET /api/stats
 * @desc Get global system statistics for Landing Page counter
 */
roomRouter.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await statisticsService.getStats();
    res.status(200).json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch platform statistics' });
  }
});

/**
 * @route GET /api/logs
 * @desc Get recent audit event logs (for inspection/admin debugging)
 */
roomRouter.get('/logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const logs = await loggerService.getRecentLogs(limit);
    res.status(200).json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
});
