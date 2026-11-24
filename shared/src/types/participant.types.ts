export type ParticipantRole =
  | 'owner'
  | 'host'
  | 'co_host'
  | 'co-host'
  | 'teacher'
  | 'moderator'
  | 'speaker'
  | 'student'
  | 'listener'
  | 'technician'
  | 'customer'
  | 'dj'
  | 'participant'
  | 'audience';

export type UserRole = ParticipantRole;

export type PresenceStatus = 'Joined' | 'Speaking' | 'Muted' | 'Away' | 'Disconnected';

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
  id: string; // Socket or LiveKit participant identity
  name: string;
  role: UserRole;
  avatar?: string;
  presence: PresenceStatus;
  permissions: UserPermissions;
  handRaised: boolean;
  hasCamera: boolean;
  hasMic: boolean;
  joinedAt: string;
}

export interface JoinRequest {
  socketId: string;
  name: string;
  timestamp: string;
}

export interface BannedUser {
  id: string;
  roomId: string;
  ipOrIdentifier: string;
  userName: string;
  reason: string;
  bannedAt: string;
}
