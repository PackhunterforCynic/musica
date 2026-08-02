import { Room, Participant, LogEvent, BannedUser, SystemStatistics, AppSettings } from './types';

export interface RoomsFileSchema {
  rooms: Record<string, Room>; // Keyed by Room ID e.g., "ABX9-72KD"
}

export interface ParticipantsFileSchema {
  participants: Record<string, Participant>; // Keyed by socket ID or session identifier
  roomParticipants: Record<string, string[]>; // Map roomId -> array of participant IDs
}

export interface SessionsFileSchema {
  activeRooms: string[]; // List of active Room IDs
  recoveringRooms: Record<string, { timerExpiresAt: string; previousHostName: string }>; // For host 60s recovery
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
