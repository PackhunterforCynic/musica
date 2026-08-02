import {
  RoomsFileSchema,
  SessionsFileSchema,
  ParticipantsFileSchema,
  LogsFileSchema
} from '@musica/shared';
import { storageService } from './StorageService';
import { statisticsService } from './StatisticsService';
import { loggerService } from './LoggerService';
import { limitsConfig } from '../config/limits';

export class CleanupService {
  private timer: NodeJS.Timeout | null = null;
  private onRoomEndedCallback?: (roomId: string) => void;

  public setOnRoomEndedCallback(cb: (roomId: string) => void): void {
    this.onRoomEndedCallback = cb;
  }

  public start(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    console.log(`[CleanupService] Background auto-cleanup job started (every ${limitsConfig.cleanupIntervalMs / 1000}s).`);
    this.timer = setInterval(() => this.runCleanup(), limitsConfig.cleanupIntervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async runCleanup(): Promise<void> {
    try {
      const now = new Date();
      const nowMs = now.getTime();

      // 1. Clean up expired recovering rooms (host recovery grace time expired)
      const sessions = await storageService.readJson<SessionsFileSchema>('sessions.json');
      const expiredRooms: string[] = [];

      for (const [roomId, recoveryInfo] of Object.entries(sessions.recoveringRooms)) {
        const expiresMs = new Date(recoveryInfo.timerExpiresAt).getTime();
        if (nowMs > expiresMs) {
          expiredRooms.push(roomId);
        }
      }

      if (expiredRooms.length > 0) {
        await storageService.updateJson<SessionsFileSchema>('sessions.json', (data) => {
          for (const rid of expiredRooms) {
            delete data.recoveringRooms[rid];
            data.activeRooms = data.activeRooms.filter((id) => id !== rid);
          }
        });

        await storageService.updateJson<RoomsFileSchema>('rooms.json', (data) => {
          for (const rid of expiredRooms) {
            if (data.rooms[rid]) {
              data.rooms[rid].status = 'ended';
              delete data.rooms[rid];
            }
          }
        });

        await storageService.updateJson<ParticipantsFileSchema>('participants.json', (data) => {
          for (const rid of expiredRooms) {
            const pIds = data.roomParticipants[rid] || [];
            for (const pid of pIds) {
              delete data.participants[pid];
            }
            delete data.roomParticipants[rid];
          }
        });

        for (const rid of expiredRooms) {
          await loggerService.logEvent('ROOM_ENDED', {
            roomId: rid,
            details: { reason: 'Host recovery grace period expired without reconnection.' },
          });
          if (this.onRoomEndedCallback) {
            this.onRoomEndedCallback(rid);
          }
        }
        console.log(`[CleanupService] Purged ${expiredRooms.length} expired recovering room(s): ${expiredRooms.join(', ')}`);
      }

      // 2. Clean up stale rooms (active rooms with 0 participants older than 15 mins)
      const roomsFile = await storageService.readJson<RoomsFileSchema>('rooms.json');
      const participantsFile = await storageService.readJson<ParticipantsFileSchema>('participants.json');
      const staleRooms: string[] = [];

      for (const [roomId, room] of Object.entries(roomsFile.rooms)) {
        const pList = participantsFile.roomParticipants[roomId] || [];
        const ageMs = nowMs - new Date(room.createdAt).getTime();
        if (pList.length === 0 && ageMs > 15 * 60 * 1000) {
          staleRooms.push(roomId);
        }
      }

      if (staleRooms.length > 0) {
        await storageService.updateJson<RoomsFileSchema>('rooms.json', (data) => {
          for (const rid of staleRooms) delete data.rooms[rid];
        });
        await storageService.updateJson<SessionsFileSchema>('sessions.json', (data) => {
          data.activeRooms = data.activeRooms.filter((id) => !staleRooms.includes(id));
        });
        await storageService.updateJson<ParticipantsFileSchema>('participants.json', (data) => {
          for (const rid of staleRooms) delete data.roomParticipants[rid];
        });
        console.log(`[CleanupService] Purged ${staleRooms.length} empty stale room(s).`);
      }

      // 3. Update Statistics active count
      const currentSessions = await storageService.readJson<SessionsFileSchema>('sessions.json');
      await statisticsService.updateActiveRoomsCount(currentSessions.activeRooms.length);

    } catch (error) {
      console.error('[CleanupService] Error during automated cleanup cycle:', error);
    }
  }
}

export const cleanupService = new CleanupService();
