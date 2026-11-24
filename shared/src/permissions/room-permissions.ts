import { UserPermissions, UserRole, RoomType } from '../types';
import {
  OWNER_PERMISSIONS,
  HOST_PERMISSIONS,
  CO_HOST_PERMISSIONS,
  MODERATOR_PERMISSIONS,
  DJ_PERMISSIONS,
  SPEAKER_PERMISSIONS,
  PARTICIPANT_PERMISSIONS,
  AUDIENCE_PERMISSIONS,
  TEACHER_PERMISSIONS,
  STUDENT_PERMISSIONS,
  TECHNICIAN_PERMISSIONS,
  CUSTOMER_PERMISSIONS,
} from './roles';

export function getDefaultPermissions(role: UserRole, roomType?: RoomType): UserPermissions {
  // In 1:1 and remote support sessions, peers need symmetric communication permissions
  if (roomType === 'private' || roomType === 'couple' || roomType === 'remote-support' || roomType === 'remote_support') {
    return {
      canKick: role === 'host' || role === 'owner',
      canBan: role === 'host' || role === 'owner',
      canMute: false,
      canShare: true,
      canEndRoom: role === 'host' || role === 'owner',
      canLock: role === 'host' || role === 'owner',
      canChat: true,
      canRaiseHand: false,
      canReact: true,
      canAddQueue: true,
      canSkipQueue: true,
      canManageDJ: false,
      canBroadcastAudio: true,
      canBroadcastVideo: true,
    };
  }

  // Podcast audience: listen-only unless promoted to speaker
  if (roomType === 'podcast') {
    if (role === 'host' || role === 'owner') return { ...HOST_PERMISSIONS };
    if (role === 'co-host' || role === 'co_host') return { ...CO_HOST_PERMISSIONS };
    if (role === 'speaker') return { ...SPEAKER_PERMISSIONS };
    return { ...AUDIENCE_PERMISSIONS };
  }

  // Classroom: teacher has instructor broadcast controls; students have hand raise & interaction
  if (roomType === 'classroom') {
    if (role === 'host' || role === 'owner' || role === 'teacher') return { ...TEACHER_PERMISSIONS };
    return { ...STUDENT_PERMISSIONS };
  }

  switch (role) {
    case 'owner':
      return { ...OWNER_PERMISSIONS };
    case 'host':
      return { ...HOST_PERMISSIONS };
    case 'co-host':
    case 'co_host':
      return { ...CO_HOST_PERMISSIONS };
    case 'moderator':
      return { ...MODERATOR_PERMISSIONS };
    case 'dj':
      return { ...DJ_PERMISSIONS };
    case 'speaker':
      return { ...SPEAKER_PERMISSIONS };
    case 'teacher':
      return { ...TEACHER_PERMISSIONS };
    case 'student':
      return { ...STUDENT_PERMISSIONS };
    case 'technician':
      return { ...TECHNICIAN_PERMISSIONS };
    case 'customer':
      return { ...CUSTOMER_PERMISSIONS };
    case 'participant':
      return { ...PARTICIPANT_PERMISSIONS };
    case 'audience':
    case 'listener':
    default:
      return { ...AUDIENCE_PERMISSIONS };
  }
}
