import { UserPermissions, UserRole } from './types';

export const OWNER_PERMISSIONS: UserPermissions = {
  canKick: true,
  canBan: true,
  canMute: true,
  canShare: true,
  canEndRoom: true,
  canLock: true,
  canChat: true,
  canRaiseHand: false,
  canReact: true,
  canAddQueue: true,
  canSkipQueue: true,
  canManageDJ: true,
  canBroadcastAudio: true,
  canBroadcastVideo: true,
};

export const HOST_PERMISSIONS: UserPermissions = {
  ...OWNER_PERMISSIONS,
};

export const CO_HOST_PERMISSIONS: UserPermissions = {
  canKick: true,
  canBan: true,
  canMute: true,
  canShare: true,
  canEndRoom: false,
  canLock: true,
  canChat: true,
  canRaiseHand: false,
  canReact: true,
  canAddQueue: true,
  canSkipQueue: true,
  canManageDJ: true,
  canBroadcastAudio: true,
  canBroadcastVideo: true,
};

export const MODERATOR_PERMISSIONS: UserPermissions = {
  canKick: true,
  canBan: true,
  canMute: true,
  canShare: false,
  canEndRoom: false,
  canLock: true,
  canChat: true,
  canRaiseHand: false,
  canReact: true,
  canAddQueue: true,
  canSkipQueue: true,
  canManageDJ: false,
  canBroadcastAudio: false,
  canBroadcastVideo: false,
};

export const DJ_PERMISSIONS: UserPermissions = {
  canKick: false,
  canBan: false,
  canMute: false,
  canShare: true,
  canEndRoom: false,
  canLock: false,
  canChat: true,
  canRaiseHand: false,
  canReact: true,
  canAddQueue: true,
  canSkipQueue: true,
  canManageDJ: true,
  canBroadcastAudio: true,
  canBroadcastVideo: false,
};

export const SPEAKER_PERMISSIONS: UserPermissions = {
  canKick: false,
  canBan: false,
  canMute: false,
  canShare: false,
  canEndRoom: false,
  canLock: false,
  canChat: true,
  canRaiseHand: false,
  canReact: true,
  canAddQueue: true,
  canSkipQueue: false,
  canManageDJ: false,
  canBroadcastAudio: true,
  canBroadcastVideo: true,
};

export const PARTICIPANT_PERMISSIONS: UserPermissions = {
  canKick: false,
  canBan: false,
  canMute: false,
  canShare: false,
  canEndRoom: false,
  canLock: false,
  canChat: true,
  canRaiseHand: true,
  canReact: true,
  canAddQueue: true,
  canSkipQueue: false,
  canManageDJ: false,
  canBroadcastAudio: false,
  canBroadcastVideo: false,
};

export const AUDIENCE_PERMISSIONS: UserPermissions = {
  canKick: false,
  canBan: false,
  canMute: false,
  canShare: false,
  canEndRoom: false,
  canLock: false,
  canChat: true,
  canRaiseHand: true,
  canReact: true,
  canAddQueue: false,
  canSkipQueue: false,
  canManageDJ: false,
  canBroadcastAudio: false,
  canBroadcastVideo: false,
};

export function getDefaultPermissions(role: UserRole): UserPermissions {
  switch (role) {
    case 'owner':
      return { ...OWNER_PERMISSIONS };
    case 'host':
      return { ...HOST_PERMISSIONS };
    case 'co-host':
      return { ...CO_HOST_PERMISSIONS };
    case 'moderator':
      return { ...MODERATOR_PERMISSIONS };
    case 'dj':
      return { ...DJ_PERMISSIONS };
    case 'speaker':
      return { ...SPEAKER_PERMISSIONS };
    case 'participant':
      return { ...PARTICIPANT_PERMISSIONS };
    case 'audience':
    default:
      return { ...AUDIENCE_PERMISSIONS };
  }
}
