import { Router, Request, Response } from 'express';
import { roomService } from '../services/RoomService';
import { statisticsService } from '../services/StatisticsService';
import { loggerService } from '../services/LoggerService';
import { AppError } from '@musica/shared';

export const roomRouter = Router();

/**
 * @route POST /api/rooms
 * @desc Create a new broadcasting room
 */
roomRouter.post('/rooms', async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostName, roomName, password, maxParticipants, roomType } = req.body;
    const result = await roomService.createRoom({ hostName, roomName, password, maxParticipants, roomType });
    res.status(201).json({
      success: true,
      roomId: result.roomId,
      room: result.room,
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
    await roomService.endRoom(String(roomId || '').trim().toUpperCase(), 'API Termination');
    res.status(200).json({ success: true, message: `Room ${String(roomId)} ended successfully.` });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ success: false, error: err.message || 'Internal server error', code: err.code });
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
