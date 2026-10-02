import { create } from 'zustand';
import {
  Room,
  Participant,
  ChatMessage,
  EmojiReaction,
  JoinRequest,
  ScreenShareState,
  ConnectionQuality,
  UserRole,
  UserPermissions,
  getDefaultPermissions,
} from '@musica/shared';

export type SidebarTab = 'participants' | 'chat';

export interface StreamTelemetry {
  fps: number;
  bitrateMbps: string;
  resolution: string;
  latencyMs: number;
  cpuUsage: number;
}

export interface RoomState {
  room: Room | null;
  localParticipant: Participant | null;
  participants: Participant[];
  chatMessages: ChatMessage[];
  activeReactions: EmojiReaction[];
  screenShareState: ScreenShareState;
  connectionQuality: ConnectionQuality;
  isHostRecovering: boolean;
  recoveryGraceRemaining: number;
  activeSidebarTab: SidebarTab;
  unreadChatCount: number;
  remoteMediaStream: MediaStream | null;
  localShareStream: MediaStream | null;
  youtubeVideoId: string | null;
  isWaitingForHost: boolean;
  waitingRoomInfo: { roomName?: string; hostName?: string } | null;
  pendingJoinRequests: JoinRequest[];
  streamTelemetry: StreamTelemetry;

  // Actions
  setStreamTelemetry: (updates: Partial<StreamTelemetry>) => void;
  setWaitingForHost: (isWaiting: boolean, info?: { roomName?: string; hostName?: string } | null) => void;
  addPendingJoinRequest: (request: JoinRequest) => void;
  removePendingJoinRequest: (socketId: string) => void;
  setRoomData: (room: Room | null, localParticipant?: Participant | null) => void;
  updateRoomStatus: (updates: Partial<Room>) => void;
  setParticipants: (participants: Participant[]) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (socketId: string) => void;
  updateParticipant: (socketId: string, updates: Partial<Participant>) => void;
  addChatMessage: (message: ChatMessage) => void;
  addReaction: (reaction: EmojiReaction) => void;
  removeReaction: (id: string) => void;
  setScreenShareState: (state: ScreenShareState) => void;
  setConnectionQuality: (quality: ConnectionQuality) => void;
  setHostRecovering: (isRecovering: boolean, secondsRemaining?: number) => void;
  setActiveSidebarTab: (tab: SidebarTab) => void;
  clearUnreadCount: () => void;
  setRemoteMediaStream: (stream: MediaStream | null) => void;
  setLocalShareStream: (stream: MediaStream | null) => void;
  setYoutubeVideoId: (id: string | null) => void;
  resetRoomState: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  localParticipant: null,
  participants: [],
  chatMessages: [],
  activeReactions: [],
  screenShareState: 'Idle',
  connectionQuality: 'Good',
  isHostRecovering: false,
  recoveryGraceRemaining: 0,
  activeSidebarTab: 'participants',
  unreadChatCount: 0,
  remoteMediaStream: null,
  localShareStream: null,
  youtubeVideoId: null,
  isWaitingForHost: false,
  waitingRoomInfo: null,
  pendingJoinRequests: [],
  streamTelemetry: {
    fps: 30,
    bitrateMbps: '2.4',
    resolution: '1920 x 1080',
    latencyMs: 28,
    cpuUsage: 23,
  },

  setStreamTelemetry: (updates) =>
    set((state) => ({ streamTelemetry: { ...state.streamTelemetry, ...updates } })),

  setWaitingForHost: (isWaitingForHost, waitingRoomInfo = null) => set({ isWaitingForHost, waitingRoomInfo }),

  addPendingJoinRequest: (request) =>
    set((state) => ({
      pendingJoinRequests: state.pendingJoinRequests.some((r) => r.socketId === request.socketId)
        ? state.pendingJoinRequests
        : [...state.pendingJoinRequests, request],
    })),

  removePendingJoinRequest: (socketId) =>
    set((state) => ({
      pendingJoinRequests: state.pendingJoinRequests.filter((r) => r.socketId !== socketId),
    })),

  setRoomData: (room, localParticipant = undefined) =>
    set((state) => ({
      room,
      localParticipant: localParticipant !== undefined ? localParticipant : state.localParticipant,
      screenShareState: room ? room.screenShareState : 'Idle',
      isWaitingForHost: false,
    })),

  updateRoomStatus: (updates) =>
    set((state) => ({
      room: state.room ? { ...state.room, ...updates } : null,
      screenShareState: updates.screenShareState !== undefined ? updates.screenShareState : state.screenShareState,
    })),

  setParticipants: (participants) => set({ participants }),

  addParticipant: (participant) =>
    set((state) => {
      const exists = state.participants.some((p) => p.id === participant.id);
      if (exists) {
        return {
          participants: state.participants.map((p) => (p.id === participant.id ? participant : p)),
        };
      }
      return { participants: [...state.participants, participant] };
    }),

  removeParticipant: (socketId) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.id !== socketId),
    })),

  updateParticipant: (socketId, updates) =>
    set((state) => ({
      participants: state.participants.map((p) => (p.id === socketId ? { ...p, ...updates } : p)),
      localParticipant:
        state.localParticipant && state.localParticipant.id === socketId
          ? { ...state.localParticipant, ...updates }
          : state.localParticipant,
    })),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
      unreadChatCount: state.activeSidebarTab !== 'chat' ? state.unreadChatCount + 1 : state.unreadChatCount,
    })),

  addReaction: (reaction) =>
    set((state) => ({
      activeReactions: [...state.activeReactions, reaction],
    })),

  removeReaction: (id) =>
    set((state) => ({
      activeReactions: state.activeReactions.filter((r) => r.id !== id),
    })),

  setScreenShareState: (screenShareState) => set({ screenShareState }),

  setConnectionQuality: (connectionQuality) => set({ connectionQuality }),

  setHostRecovering: (isHostRecovering, recoveryGraceRemaining = 0) =>
    set({ isHostRecovering, recoveryGraceRemaining }),

  setActiveSidebarTab: (activeSidebarTab) =>
    set((state) => ({
      activeSidebarTab,
      unreadChatCount: activeSidebarTab === 'chat' ? 0 : state.unreadChatCount,
    })),

  clearUnreadCount: () => set({ unreadChatCount: 0 }),

  setRemoteMediaStream: (remoteMediaStream) => set({ remoteMediaStream }),

  setLocalShareStream: (localShareStream) => set({ localShareStream }),
  
  setYoutubeVideoId: (youtubeVideoId) => set({ youtubeVideoId }),

  resetRoomState: () =>
    set({
      room: null,
      localParticipant: null,
      participants: [],
      chatMessages: [],
      activeReactions: [],
      screenShareState: 'Idle',
      connectionQuality: 'Disconnected',
      isHostRecovering: false,
      recoveryGraceRemaining: 0,
      activeSidebarTab: 'participants',
      unreadChatCount: 0,
      remoteMediaStream: null,
      localShareStream: null,
      youtubeVideoId: null,
      isWaitingForHost: false,
      waitingRoomInfo: null,
      pendingJoinRequests: [],
      streamTelemetry: {
        fps: 30,
        bitrateMbps: '2.4',
        resolution: '1920 x 1080',
        latencyMs: 28,
        cpuUsage: 23,
      },
    }),
}));

export function useIsHost(): boolean {
  const localParticipant = useRoomStore((s) => s.localParticipant);
  return localParticipant?.role === 'host';
}

export function usePermissions(): UserPermissions {
  const localParticipant = useRoomStore((s) => s.localParticipant);
  return localParticipant?.permissions || getDefaultPermissions('audience');
}
