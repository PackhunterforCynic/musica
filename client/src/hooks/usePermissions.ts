import { useRoomStore, useIsHost } from '../store/roomStore';
import { UserRole, UserPermissions, getDefaultPermissions } from '@musica/shared';

export function usePermissions() {
  const localParticipant = useRoomStore((s) => s.localParticipant);
  const isHost = useIsHost();

  const role: UserRole = localParticipant?.role || (isHost ? 'host' : 'audience');
  const permissions: UserPermissions = localParticipant?.permissions || getDefaultPermissions(role);

  return {
    role,
    isHost,
    isCoHost: role === 'co-host',
    isDj: role === 'dj',
    isSpeaker: role === 'speaker',
    isAudience: role === 'audience',
    canShareScreen: permissions.canShare,
    canBroadcastAudio: permissions.canBroadcastAudio,
    canBroadcastVideo: permissions.canBroadcastVideo,
    canManageDJ: permissions.canManageDJ,
    canAddQueue: permissions.canAddQueue,
    canSkipQueue: permissions.canSkipQueue,
    canKick: permissions.canKick,
    canBan: permissions.canBan,
    canMute: permissions.canMute,
    canLock: permissions.canLock,
    canEndRoom: permissions.canEndRoom,
    canChat: permissions.canChat,
    canReact: permissions.canReact,
  };
}
