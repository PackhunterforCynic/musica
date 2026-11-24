import { Room, Participant, LogEvent, BannedUser, SystemStatistics, AppSettings, RoomType, RoomCategory, RoomVisibility } from '../types';

export interface RoomsFileSchema {
  rooms: Record<string, Room>;
}

export interface ParticipantsFileSchema {
  participants: Record<string, Participant>;
  roomParticipants: Record<string, string[]>;
}

export interface SessionsFileSchema {
  activeRooms: string[];
  recoveringRooms: Record<string, { timerExpiresAt: string; previousHostName: string }>;
}

export interface LogsFileSchema {
  events: LogEvent[];
}

export interface BansFileSchema {
  bannedUsers: BannedUser[];
}

export interface StatisticsFileSchema {
  statistics: SystemStatistics;
}

export interface SettingsFileSchema {
  settings: AppSettings;
}

export interface CreateRoomInput {
  roomName: string;
  hostName: string;
  roomType?: RoomType;
  type?: RoomType;
  password?: string;
  maxParticipants?: number;
  category?: RoomCategory;
  visibility?: RoomVisibility;
  description?: string;
  isPrivate?: boolean;
}

export interface JoinRoomInput {
  roomId: string;
  userName: string;
  password?: string;
}

export const DEFAULT_STATS: SystemStatistics = {
  totalRoomsCreated: 0,
  activeRoomsCount: 0,
  peakActiveRooms: 0,
  totalParticipantsJoined: 0,
  totalBroadcastMinutes: 0,
  lastUpdated: new Date().toISOString()
};

export const DEFAULT_SETTINGS: AppSettings = {
  serverVersion: "1.0.0",
  defaultMaxRoomSize: 50,
  maxAllowableRoomSize: 200,
  hostRecoveryGracePeriodSeconds: 60,
  cleanupIntervalSeconds: 60
};
