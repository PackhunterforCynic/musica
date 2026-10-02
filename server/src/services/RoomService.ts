import {
  Room,
  RoomsFileSchema,
  SessionsFileSchema,
  ParticipantsFileSchema,
  BansFileSchema,
  RoomError,
  ValidationError,
  PermissionError,
} from '@musica/shared';
import { storageService } from './StorageService';
import { loggerService } from './LoggerService';
import { statisticsService } from './StatisticsService';
import { generateUniqueRoomId, isValidRoomIdFormat } from '../utils/idGenerator';
import { limitsConfig } from '../config/limits';

export class RoomService {
  public async createRoom(params: {
    hostName: string;
    roomName: string;
    password?: string;
    maxParticipants?: number;
    roomType?: 'studio' | 'couple';
  }): Promise<{ roomId: string; room: Room }> {
    if (!params.hostName || params.hostName.trim().length === 0) {
      throw new ValidationError('Host display name is required.');
    }
    if (!params.roomName || params.roomName.trim().length === 0) {
      throw new ValidationError('Room name is required.');
    }
    if (params.roomName.length > limitsConfig.maxRoomNameLength) {
      throw new ValidationError(`Room name cannot exceed ${limitsConfig.maxRoomNameLength} characters.`);
    }

    const maxP = Math.min(
      Math.max(params.maxParticipants || limitsConfig.defaultRoomSize, 2),
      limitsConfig.maxRoomSize
    );

    const roomId = await generateUniqueRoomId();
    const newRoom: Room = {
      roomId,
      roomName: params.roomName.trim(),
      hostName: params.hostName.trim(),
      password: params.password && params.password.trim().length > 0 ? params.password.trim() : undefined,
      locked: false,
      maxParticipants: maxP,
      createdAt: new Date().toISOString(),
      status: 'active',
      screenShareState: 'Idle',
      roomType: params.roomType || 'studio',
      participants: [],
    };

    // Atomic insert into rooms.json and sessions.json
    await storageService.updateJson<RoomsFileSchema>('rooms.json', (data) => {
      data.rooms[roomId] = newRoom;
    });

    const sessions = await storageService.updateJson<SessionsFileSchema>('sessions.json', (data) => {
      if (!data.activeRooms.includes(roomId)) {
        data.activeRooms.push(roomId);
      }
      delete data.recoveringRooms[roomId];
    });

    await storageService.updateJson<ParticipantsFileSchema>('participants.json', (data) => {
      data.roomParticipants[roomId] = [];
    });

    await loggerService.logEvent('ROOM_CREATED', {
      roomId,
      userName: params.hostName,
      details: { roomName: newRoom.roomName, maxParticipants: newRoom.maxParticipants, hasPassword: !!newRoom.password },
    });

    await statisticsService.incrementRoomsCreated();
    await statisticsService.updateActiveRoomsCount(sessions.activeRooms.length);

    // Return without password in public response
    const { password, ...safeRoom } = newRoom;
    return { roomId, room: safeRoom as Room };
  }

  public async getRoom(roomId: string): Promise<{ room: Room; activeParticipantsCount: number; isRecovering: boolean }> {
    if (!isValidRoomIdFormat(roomId)) {
      throw new ValidationError('Invalid Room ID format. Expected XXXX-XXXX.');
    }

    const roomsFile = await storageService.readJson<RoomsFileSchema>('rooms.json');
    const room = roomsFile.rooms[roomId];
    if (!room) {
      throw new RoomError(`Room ${roomId} not found or has ended.`);
    }

    const sessions = await storageService.readJson<SessionsFileSchema>('sessions.json');
    const isRecovering = !!sessions.recoveringRooms[roomId];

    const participantsFile = await storageService.readJson<ParticipantsFileSchema>('participants.json');
    const pIds = participantsFile.roomParticipants[roomId] || [];
    const activeParticipantsCount = pIds.length;

    const { password, ...safeRoom } = room;
    return {
      room: { ...(safeRoom as Room), status: isRecovering ? 'recovering' : 'active' },
      activeParticipantsCount,
      isRecovering,
    };
  }

  public async validateJoin(params: {
    roomId: string;
    userName: string;
    password?: string;
    ipOrIdentifier?: string;
  }): Promise<Room> {
    const { room, isRecovering } = await this.getRoom(params.roomId);

    // 1. Check if user is banned
    const bansFile = await storageService.readJson<BansFileSchema>('bans.json');
    const isBanned = bansFile.bannedUsers.some(
      (b) => b.roomId === params.roomId && (b.userName.toLowerCase() === params.userName.toLowerCase() || (params.ipOrIdentifier && b.ipOrIdentifier === params.ipOrIdentifier))
    );
    if (isBanned) {
      throw new PermissionError('You have been removed and banned from joining this room.');
    }

    // 2. Check if locked (and not host recovery)
    if (room.locked && !isRecovering) {
      throw new PermissionError('This room is currently locked by the host.');
    }

    // 3. Check password if required
    const fullRooms = await storageService.readJson<RoomsFileSchema>('rooms.json');
    const storedPass = fullRooms.rooms[params.roomId]?.password;
    if (storedPass && storedPass !== params.password) {
      throw new PermissionError('Incorrect room password.');
    }

    // 4. Check capacity
    const participantsFile = await storageService.readJson<ParticipantsFileSchema>('participants.json');
    const currentCount = (participantsFile.roomParticipants[params.roomId] || []).length;
    if (currentCount >= room.maxParticipants) {
      throw new RoomError('This room has reached maximum participant capacity.', 'ROOM_FULL');
    }

    return room;
  }

  public async toggleLock(roomId: string, locked: boolean): Promise<boolean> {
    await storageService.updateJson<RoomsFileSchema>('rooms.json', (data) => {
      if (data.rooms[roomId]) {
        data.rooms[roomId].locked = locked;
      }
    });
    await loggerService.logEvent(locked ? 'ROOM_LOCKED' : 'ROOM_UNLOCKED', { roomId });
    return locked;
  }

  public async setScreenShareState(roomId: string, state: Room['screenShareState']): Promise<void> {
    await storageService.updateJson<RoomsFileSchema>('rooms.json', (data) => {
      if (data.rooms[roomId]) {
        data.rooms[roomId].screenShareState = state;
      }
    });
    if (state === 'Sharing') {
      await loggerService.logEvent('SCREEN_STARTED', { roomId });
    } else if (state === 'Stopped' || state === 'Idle') {
      await loggerService.logEvent('SCREEN_STOPPED', { roomId });
    }
  }

  public async endRoom(roomId: string, reason = 'Ended by host'): Promise<void> {
    await storageService.updateJson<RoomsFileSchema>('rooms.json', (data) => {
      if (data.rooms[roomId]) {
        data.rooms[roomId].status = 'ended';
        delete data.rooms[roomId];
      }
    });

    const sessions = await storageService.updateJson<SessionsFileSchema>('sessions.json', (data) => {
      data.activeRooms = data.activeRooms.filter((id) => id !== roomId);
      delete data.recoveringRooms[roomId];
    });

    await storageService.updateJson<ParticipantsFileSchema>('participants.json', (data) => {
      const pIds = data.roomParticipants[roomId] || [];
      for (const pid of pIds) {
        delete data.participants[pid];
      }
      delete data.roomParticipants[roomId];
    });

    await statisticsService.updateActiveRoomsCount(sessions.activeRooms.length);
    await loggerService.logEvent('ROOM_ENDED', { roomId, details: { reason } });
  }
}

export const roomService = new RoomService();
