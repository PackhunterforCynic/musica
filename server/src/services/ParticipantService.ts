import {
  Participant,
  ParticipantsFileSchema,
  UserRole,
  PresenceStatus,
  getDefaultPermissions,
  BannedUser,
  BansFileSchema,
  RoomsFileSchema,
} from '@musica/shared';
import { storageService } from './StorageService';
import { loggerService } from './LoggerService';
import { statisticsService } from './StatisticsService';

export class ParticipantService {
  public async addParticipant(params: {
    socketId: string;
    roomId: string;
    name: string;
    role: UserRole;
    ipOrIdentifier?: string;
  }): Promise<Participant> {
    const newParticipant: Participant = {
      id: params.socketId,
      name: params.name.trim() || `User_${params.socketId.slice(-4)}`,
      role: params.role,
      presence: 'Joined',
      permissions: getDefaultPermissions(params.role),
      handRaised: false,
      hasCamera: false,
      hasMic: false,
      joinedAt: new Date().toISOString(),
    };

    await storageService.updateJson<ParticipantsFileSchema>('participants.json', (data) => {
      data.participants[params.socketId] = newParticipant;
      if (!data.roomParticipants[params.roomId]) {
        data.roomParticipants[params.roomId] = [];
      }
      if (!data.roomParticipants[params.roomId].includes(params.socketId)) {
        data.roomParticipants[params.roomId].push(params.socketId);
      }
    });

    if (params.role === 'host') {
      await storageService.updateJson<RoomsFileSchema>('rooms.json', (rData) => {
        if (rData.rooms[params.roomId]) {
          rData.rooms[params.roomId].hostId = params.socketId;
        }
      });
    }

    await loggerService.logEvent('USER_JOINED', {
      roomId: params.roomId,
      userId: params.socketId,
      userName: newParticipant.name,
      details: { role: params.role },
    });

    await statisticsService.incrementParticipantsJoined();

    return newParticipant;
  }

  public async removeParticipant(socketId: string, roomId: string): Promise<Participant | null> {
    let removed: Participant | null = null;

    await storageService.updateJson<ParticipantsFileSchema>('participants.json', (data) => {
      if (data.participants[socketId]) {
        removed = { ...data.participants[socketId] };
        delete data.participants[socketId];
      }
      if (data.roomParticipants[roomId]) {
        data.roomParticipants[roomId] = data.roomParticipants[roomId].filter((id) => id !== socketId);
      }
    });

    if (removed) {
      await loggerService.logEvent('USER_LEFT', {
        roomId,
        userId: socketId,
        userName: (removed as Participant).name,
      });
    }

    return removed;
  }

  public async getParticipantsInRoom(roomId: string): Promise<Participant[]> {
    const file = await storageService.readJson<ParticipantsFileSchema>('participants.json');
    const ids = file.roomParticipants[roomId] || [];
    return ids.map((id) => file.participants[id]).filter(Boolean);
  }

  public async updatePresence(socketId: string, status: PresenceStatus): Promise<Participant | undefined> {
    let updated: Participant | undefined;
    await storageService.updateJson<ParticipantsFileSchema>('participants.json', (data) => {
      if (data.participants[socketId]) {
        data.participants[socketId].presence = status;
        if (status === 'Speaking') {
          data.participants[socketId].hasMic = true;
        } else if (status === 'Muted') {
          data.participants[socketId].hasMic = false;
        }
        updated = data.participants[socketId];
      }
    });
    return updated;
  }

  public async setHandRaised(socketId: string, roomId: string, raised: boolean): Promise<Participant | undefined> {
    let updated: Participant | undefined;
    await storageService.updateJson<ParticipantsFileSchema>('participants.json', (data) => {
      if (data.participants[socketId]) {
        data.participants[socketId].handRaised = raised;
        updated = data.participants[socketId];
      }
    });
    if (updated) {
      await loggerService.logEvent(raised ? 'RAISE_HAND' : 'LOWER_HAND', {
        roomId,
        userId: socketId,
        userName: updated.name,
      });
    }
    return updated;
  }

  public async banUser(roomId: string, socketId: string, reason = 'Banned by host'): Promise<void> {
    const file = await storageService.readJson<ParticipantsFileSchema>('participants.json');
    const target = file.participants[socketId];
    if (target) {
      const banRecord: BannedUser = {
        id: `${Date.now()}-${target.name}`,
        roomId,
        ipOrIdentifier: target.name.toLowerCase(), // In MVP match by username
        userName: target.name,
        reason,
        bannedAt: new Date().toISOString(),
      };

      await storageService.updateJson<BansFileSchema>('bans.json', (data) => {
        data.bannedUsers.push(banRecord);
      });

      await loggerService.logEvent('USER_BANNED', {
        roomId,
        userId: socketId,
        userName: target.name,
        details: { reason },
      });
    }
  }
}

export const participantService = new ParticipantService();
