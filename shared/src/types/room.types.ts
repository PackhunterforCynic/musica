import { ParticipantRole, UserRole, Participant } from './participant.types';
import { QueueItem, DJSession, PlaybackState } from './session.types';

export type RoomType =
  | 'private'
  | 'podcast'
  | 'classroom'
  | 'remote_support'
  | 'remote-support'
  | 'studio'
  | 'couple'
  | 'listen'
  | 'watch'
  | 'radio'
  | 'hangout'
  | 'event';

export type RoomStatus = 'waiting' | 'live' | 'active' | 'recovering' | 'ended';

export type ScreenShareState = 'Idle' | 'Preparing' | 'Sharing' | 'Paused' | 'Stopped';

export type ConnectionQuality = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Disconnected';

export type RoomCategory =
  | 'music'
  | 'gaming'
  | 'education'
  | 'chill'
  | 'podcast'
  | 'entertainment'
  | 'general';

export type RoomVisibility = 'public' | 'private' | 'unlisted';

export interface RoomConfig {
  type: RoomType;
  maxParticipants: number;
  allowAudio: boolean;
  allowVideo: boolean;
  allowScreenShare: boolean;
  allowChat: boolean;
  allowRecording: boolean;
  requireApproval: boolean;
  isPrivate: boolean;
}

export interface RoomSettings {
  allowChat: boolean;
  allowReactions: boolean;
  allowHandRaise: boolean;
  requireApprovalToJoin: boolean;
  coHostsCanAdmit: boolean;
  maxQueuePerUser?: number;
}

export interface Room {
  id?: string;
  roomId: string;
  code?: string;
  roomName: string;
  name?: string;
  description?: string;
  coverImageUrl?: string;
  category?: RoomCategory;
  visibility?: RoomVisibility;
  hostName: string;
  hostId?: string;
  ownerId?: string;
  hostAuthToken?: string;
  password?: string;
  passwordHash?: string;
  locked: boolean;
  maxParticipants: number;
  createdAt: string;
  updatedAt?: string;
  status: RoomStatus;
  screenShareState: ScreenShareState;
  roomType?: RoomType;
  type?: RoomType;
  settings?: RoomSettings;
  config?: RoomConfig;
  youtubeVideoId?: string | null;
  youtubeCurrentTime?: number;
  youtubeIsPlaying?: boolean;
  youtubeUpdatedAt?: number;
  djSession?: DJSession;
  playbackState?: PlaybackState;
  participants: Participant[];
}
