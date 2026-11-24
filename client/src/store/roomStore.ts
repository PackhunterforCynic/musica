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
  QueueItem,
  Track,
} from '@musica/shared';

export type SidebarTab = 'chat' | 'participants' | 'files' | 'notes' | 'queue';

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
  youtubeCurrentTime: number;
  youtubeIsPlaying: boolean;
  youtubeUpdatedAt: number;
  queue: QueueItem[];
  currentTrack: QueueItem | null;
  isWaitingForHost: boolean;
  waitingRoomInfo: { roomName?: string; hostName?: string } | null;
  pendingJoinRequests: JoinRequest[];
  streamTelemetry: StreamTelemetry;
  liveKitConnected: boolean;
  liveKitToken: string | null;
  isMicMuted: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  localCameraStream: MediaStream | null;
  remoteCameraStreams: Record<string, MediaStream>;
  activeSpeakerIds: string[];
  remoteScreenTrack: any | null;

  // Actions
  setStreamTelemetry: (updates: Partial<StreamTelemetry>) => void;
  setLiveKitConnected: (connected: boolean) => void;
  setLiveKitToken: (token: string | null) => void;
  setIsMicMuted: (muted: boolean) => void;
  setIsCameraEnabled: (enabled: boolean) => void;
  setLocalCameraStream: (stream: MediaStream | null) => void;
  setRemoteCameraStream: (participantId: string, stream: MediaStream | null) => void;
  setIsScreenSharing: (sharing: boolean) => void;
  setActiveSpeakerIds: (ids: string[]) => void;
  setRemoteScreenTrack: (track: any | null) => void;
  setLocalParticipantRole: (role: UserRole) => void;
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
  setYoutubeSync: (sync: { videoId?: string | null; currentTime?: number; isPlaying?: boolean; updatedAt?: number }) => void;
  setQueue: (queue: QueueItem[]) => void;
  setCurrentTrack: (track: QueueItem | null) => void;
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
  youtubeCurrentTime: 0,
  youtubeIsPlaying: false,
  youtubeUpdatedAt: 0,
  queue: [],
  currentTrack: null,
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
  liveKitConnected: false,
  liveKitToken: null,
  isMicMuted: true,
  isCameraEnabled: false,
  isScreenSharing: false,
  localCameraStream: null,
  remoteCameraStreams: {},
  activeSpeakerIds: [],
  remoteScreenTrack: null,

  setStreamTelemetry: (updates) =>
    set((state) => ({ streamTelemetry: { ...state.streamTelemetry, ...updates } })),

  setLiveKitConnected: (liveKitConnected) => set({ liveKitConnected }),
  setLiveKitToken: (liveKitToken) => set({ liveKitToken }),
  setIsMicMuted: (isMicMuted) => set({ isMicMuted }),
  setIsCameraEnabled: (isCameraEnabled) => set({ isCameraEnabled }),
  setLocalCameraStream: (localCameraStream) => set({ localCameraStream }),
  setRemoteCameraStream: (participantId, stream) =>
    set((state) => ({
      remoteCameraStreams: {
        ...state.remoteCameraStreams,
        [participantId]: stream ? stream : (undefined as any),
      },
    })),
  setIsScreenSharing: (isScreenSharing) => set({ isScreenSharing }),
  setActiveSpeakerIds: (activeSpeakerIds) => set({ activeSpeakerIds }),
  setRemoteScreenTrack: (remoteScreenTrack) => set({ remoteScreenTrack }),

  setLocalParticipantRole: (role) =>
    set((state) => ({
      localParticipant: state.localParticipant
        ? {
            ...state.localParticipant,
            role,
            permissions: getDefaultPermissions(role),
          }
        : null,
    })),

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
      youtubeVideoId: room?.youtubeVideoId !== undefined ? room.youtubeVideoId : state.youtubeVideoId,
      youtubeCurrentTime: room?.youtubeCurrentTime !== undefined ? room.youtubeCurrentTime : state.youtubeCurrentTime,
      youtubeIsPlaying: room?.youtubeIsPlaying !== undefined ? room.youtubeIsPlaying : state.youtubeIsPlaying,
      youtubeUpdatedAt: room?.youtubeUpdatedAt !== undefined ? room.youtubeUpdatedAt : state.youtubeUpdatedAt,
      isWaitingForHost: false,
    })),

  updateRoomStatus: (updates) =>
    set((state) => ({
      room: state.room ? { ...state.room, ...updates } : null,
      screenShareState: updates.screenShareState !== undefined ? updates.screenShareState : state.screenShareState,
    })),

  setParticipants: (participants) =>
    set((state) => ({
      participants,
      // Keep room.participants in sync
      room: state.room ? { ...state.room, participants } : null,
    })),

  addParticipant: (participant) =>
    set((state) => {
      const exists = state.participants.some((p) => p.id === participant.id);
      const newParticipants = exists
        ? state.participants.map((p) => (p.id === participant.id ? participant : p))
        : [...state.participants, participant];
      return {
        participants: newParticipants,
        // Keep room.participants in sync so all stage components see remote peers
        room: state.room ? { ...state.room, participants: newParticipants } : null,
      };
    }),

  removeParticipant: (socketId) =>
    set((state) => {
      const newParticipants = state.participants.filter((p) => p.id !== socketId);
      return {
        participants: newParticipants,
        room: state.room ? { ...state.room, participants: newParticipants } : null,
      };
    }),

  updateParticipant: (socketId, updates) =>
    set((state) => {
      const newParticipants = state.participants.map((p) => (p.id === socketId ? { ...p, ...updates } : p));
      return {
        participants: newParticipants,
        localParticipant:
          state.localParticipant && state.localParticipant.id === socketId
            ? { ...state.localParticipant, ...updates }
            : state.localParticipant,
        room: state.room ? { ...state.room, participants: newParticipants } : null,
      };
    }),

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
  
  setYoutubeVideoId: (youtubeVideoId) =>
    set({
      youtubeVideoId,
      youtubeCurrentTime: 0,
      youtubeIsPlaying: !!youtubeVideoId,
      youtubeUpdatedAt: Date.now(),
    }),

  setYoutubeSync: (sync) =>
    set((state) => ({
      youtubeVideoId: sync.videoId !== undefined ? sync.videoId : state.youtubeVideoId,
      youtubeCurrentTime: sync.currentTime !== undefined ? sync.currentTime : state.youtubeCurrentTime,
      youtubeIsPlaying: sync.isPlaying !== undefined ? sync.isPlaying : state.youtubeIsPlaying,
      youtubeUpdatedAt: sync.updatedAt !== undefined ? sync.updatedAt : Date.now(),
    })),

  setQueue: (queue) => set({ queue }),
  setCurrentTrack: (currentTrack) => set({ currentTrack }),

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
      liveKitConnected: false,
      liveKitToken: null,
      isMicMuted: true,
      isScreenSharing: false,
      activeSpeakerIds: [],
      remoteScreenTrack: null,
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
