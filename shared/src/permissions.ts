import { UserPermissions, UserRole } from './types';

export const HOST_PERMISSIONS: UserPermissions = {
  canKick: true,
  canBan: true,
  canMute: true,
  canShare: true,
  canEndRoom: true,
  canLock: true,
  canChat: true,
  canRaiseHand: false,
  canReact: true,
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
};

export function getDefaultPermissions(role: UserRole): UserPermissions {
  if (role === 'host') {
    return { ...HOST_PERMISSIONS };
  }
  return { ...AUDIENCE_PERMISSIONS };
}
