export type PresenceStatus = 'Joined' | 'Speaking' | 'Muted' | 'Away' | 'Disconnected';

export type ScreenShareState = 'Idle' | 'Preparing' | 'Sharing' | 'Paused' | 'Stopped';

export type ConnectionQuality = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Disconnected';

export type UserRole =
  | 'owner'
  | 'host'
  | 'co-host'
  | 'moderator'
  | 'dj'
  | 'speaker'
  | 'participant'
  | 'audience';

export type RoomType =
  | 'studio'
  | 'couple'
  | 'listen'
  | 'watch'
  | 'radio'
  | 'hangout'
  | 'event';

export type RoomCategory =
  | 'music'
  | 'gaming'
  | 'education'
  | 'chill'
  | 'podcast'
  | 'entertainment'
  | 'general';

export type RoomVisibility = 'public' | 'private' | 'unlisted';

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
  canAddQueue: boolean;
  canSkipQueue: boolean;
  canManageDJ: boolean;
  canBroadcastAudio: boolean;
  canBroadcastVideo: boolean;
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

export interface Track {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  thumbnailUrl?: string;
  provider: 'youtube' | 'spotify' | 'custom';
  externalUrl?: string;
  streamId?: string; // YouTube video ID or stream key
}

export interface QueueItem {
  id: string;
  roomId: string;
  track: Track;
  addedBy: {
    id: string;
    name: string;
  };
  addedAt: string;
  votes: number;
  voterIds: string[];
  status: 'queued' | 'playing' | 'played' | 'skipped';
}

export interface DJSession {
  activeDjId: string | null;
  activeDjName: string | null;
  queue: QueueItem[];
  history: QueueItem[];
  currentTrack: QueueItem | null;
  allowAudienceRequests: boolean;
}

export interface PlaybackState {
  sessionId: string;
  videoId: string | null;
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  sequenceNumber: number;
  serverTimestamp: number;
  updatedBy: string;
}

export interface RoomSettings {
  allowChat: boolean;
  allowReactions: boolean;
  allowHandRaise: boolean;
  requireApprovalToJoin: boolean;
  coHostsCanAdmit: boolean;
  maxQueuePerUser?: number;
}

export interface YouTubeSyncPayload {
  videoId: string;
  currentTime: number;
  isPlaying: boolean;
  timestamp?: number;
}

export interface Room {
  roomId: string;
  roomName: string;
  description?: string;
  coverImageUrl?: string;
  category?: RoomCategory;
  visibility?: RoomVisibility;
  hostName: string;
  hostId?: string; // Current or most recent host socket ID
  hostAuthToken?: string; // Secure token for host reconnection authentication
  password?: string; // Legacy plaintext password (for backward compatibility)
  passwordHash?: string; // Secure salted Argon2/bcrypt hash
  locked: boolean;
  maxParticipants: number;
  createdAt: string;
  status: 'active' | 'recovering' | 'ended';
  screenShareState: ScreenShareState;
  roomType?: RoomType;
  settings?: RoomSettings;
  youtubeVideoId?: string | null;
  youtubeCurrentTime?: number;
  youtubeIsPlaying?: boolean;
  youtubeUpdatedAt?: number;
  djSession?: DJSession;
  playbackState?: PlaybackState;
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
