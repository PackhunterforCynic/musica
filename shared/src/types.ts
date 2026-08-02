export type PresenceStatus = 'Joined' | 'Speaking' | 'Muted' | 'Away' | 'Disconnected';

export type ScreenShareState = 'Idle' | 'Preparing' | 'Sharing' | 'Paused' | 'Stopped';

export type ConnectionQuality = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Disconnected';

export type UserRole = 'host' | 'audience';

export interface UserPermissions {
  canKick: boolean;
  canBan: boolean;
  canMute: boolean;
  canShare: boolean;
  canEndRoom: boolean;
  canLock: boolean;
  canChat: boolean;
  canRaiseHand: boolean;
  canReact: boolean;
}

export interface Participant {
  id: string; // Socket ID
  name: string;
  role: UserRole;
  presence: PresenceStatus;
  permissions: UserPermissions;
  handRaised: boolean;
  hasCamera: boolean;
  hasMic: boolean;
  joinedAt: string;
}

export interface Room {
  roomId: string;
  roomName: string;
  hostName: string;
  hostId?: string; // Current or most recent host socket ID
  password?: string; // Optional plaintext for MVP
  locked: boolean;
  maxParticipants: number;
  createdAt: string;
  status: 'active' | 'recovering' | 'ended';
  screenShareState: ScreenShareState;
  participants: Participant[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
}

export interface JoinRequest {
  socketId: string;
  name: string;
  timestamp: string;
}

export interface EmojiReaction {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  emoji: string; // e.g., '❤️' | '🔥' | '👏' | '🥳' | '👍'
  timestamp: string;
}

export interface LogEvent {
  id: string;
  type: 
    | 'ROOM_CREATED'
    | 'USER_JOINED'
    | 'USER_LEFT'
    | 'ROOM_LOCKED'
    | 'ROOM_UNLOCKED'
    | 'SCREEN_STARTED'
    | 'SCREEN_STOPPED'
    | 'REACTION'
    | 'CHAT'
    | 'RAISE_HAND'
    | 'LOWER_HAND'
    | 'MIC_ON'
    | 'MIC_OFF'
    | 'USER_KICKED'
    | 'USER_BANNED'
    | 'HOST_DISCONNECTED'
    | 'HOST_RECOVERED'
    | 'ROOM_ENDED';
  roomId?: string;
  userId?: string;
  userName?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface BannedUser {
  id: string;
  roomId: string;
  ipOrIdentifier: string; // Simplified for MVP (could be username or IP)
  userName: string;
  reason: string;
  bannedAt: string;
}

export interface SystemStatistics {
  totalRoomsCreated: number;
  activeRoomsCount: number;
  peakActiveRooms: number;
  totalParticipantsJoined: number;
  totalBroadcastMinutes: number;
  lastUpdated: string;
}

export interface AppSettings {
  serverVersion: string;
  defaultMaxRoomSize: number;
  maxAllowableRoomSize: number;
  hostRecoveryGracePeriodSeconds: number;
  cleanupIntervalSeconds: number;
}
