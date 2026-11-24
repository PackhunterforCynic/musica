import { UserRole } from './participant.types';

export interface Track {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  thumbnailUrl?: string;
  provider: 'youtube' | 'spotify' | 'custom';
  externalUrl?: string;
  streamId?: string;
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

export interface YouTubeSyncPayload {
  videoId: string;
  currentTime: number;
  isPlaying: boolean;
  timestamp?: number;
}

export interface SupportAnnotation {
  id: string;
  xRatio: number; // 0.0 - 1.0 relative to display width
  yRatio: number; // 0.0 - 1.0 relative to display height
  type?: 'laser' | 'pin' | 'arrow';
  label?: string;
  technicianName: string;
  timestamp: number;
}

export interface SupportSessionState {
  technicianId: string | null;
  technicianName: string | null;
  customerId: string;
  customerName: string;
  isScreenSharing: boolean;
  annotations: SupportAnnotation[];
  sessionStartedAt: string;
  expiresAt: string;
}

export interface ClassroomPoll {
  id: string;
  question: string;
  options: string[];
  votes: Record<number, number>;
  active: boolean;
  createdAt: string;
}

export interface ClassroomState {
  teacherId: string;
  teacherName: string;
  raisedHands: { studentId: string; studentName: string; timestamp: number }[];
  activePoll?: ClassroomPoll;
  whiteboardEnabled: boolean;
  lectureNotes?: string;
}

export interface PodcastState {
  hostId: string;
  hostName: string;
  approvedSpeakers: string[];
  raisedHands: { participantId: string; participantName: string; timestamp: number }[];
  isRecording: boolean;
  recordingStartedAt?: string;
}

export interface LiveKitTokenResponse {
  token: string;
  serverUrl: string;
  roomName: string;
  participantIdentity: string;
  participantName: string;
  role: UserRole;
}

export interface LiveKitTokenRequest {
  roomId: string;
  userName: string;
  password?: string;
  role?: UserRole;
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

