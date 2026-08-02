import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  SOCKET_EVENTS,
  ScreenShareState,
  ChatMessage,
  EmojiReaction,
  Participant,
  ConnectionQuality,
} from '@musica/shared';
import { useRoomStore } from '../store/roomStore';
import { peerManager } from './PeerManager';
import { mediaManager } from './MediaManager';
import { connectionManager } from './ConnectionManager';
import { notificationService } from '../services/NotificationService';
import { SERVER_URL } from '../config/api';

export function useWebRTCStudio(roomId?: string, userName?: string, password?: string) {
  const socketRef = useRef<Socket | null>(null);
  const store = useRoomStore();

  useEffect(() => {
    if (!roomId || !userName) return;

    console.log(`[Studio] Connecting Socket.IO to ${SERVER_URL} for room ${roomId}...`);
    const socket = io(SERVER_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      withCredentials: true,
    });
    socketRef.current = socket;

    // Initialize WebRTC signaling managers
    peerManager.initialize(socket);

    // Bind connection quality monitor updates to Zustand store
    connectionManager.setOnQualityUpdate((quality: ConnectionQuality) => {
      useRoomStore.getState().setConnectionQuality(quality);
    });

    socket.on('connect', () => {
      console.log('[Studio] Socket connected:', socket.id);
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, name: userName, password });
    });

    socket.on(SOCKET_EVENTS.ROOM_JOINED_SUCCESS, (data: { room: any; localParticipant: any; participants: any[]; isRecovering: boolean }) => {
      console.log('[Studio] Successfully joined studio room:', data);
      useRoomStore.getState().setRoomData(data.room, data.localParticipant);
      useRoomStore.getState().setParticipants(data.participants || []);
      useRoomStore.getState().setConnectionQuality('Good');
      if (data.isRecovering) {
        useRoomStore.getState().setHostRecovering(true, 60);
      }

      // If this user is an audience member joining an active screen share, ask host for stream!
      if (data.localParticipant.role === 'audience' && data.room.screenShareState === 'Sharing') {
        socket.emit(SOCKET_EVENTS.REQUEST_MEDIA_STREAM, {});
      }
    });

    socket.on(SOCKET_EVENTS.JOIN_REQUEST_SUBMITTED, (data: { roomName?: string; hostName?: string }) => {
      console.log('[Studio] Placed in waiting room:', data);
      useRoomStore.getState().setWaitingForHost(true, data);
    });

    socket.on(SOCKET_EVENTS.JOIN_REQUEST_RECEIVED, (data: { socketId: string; name: string; timestamp: string }) => {
      useRoomStore.getState().addPendingJoinRequest(data);
      notificationService.playSound('hand');
      notificationService.showToast(`🔔 ${data.name} is waiting in the lobby to join!`, 'warning', 'Waiting Room', 5000);
    });

    socket.on(SOCKET_EVENTS.JOIN_REQUEST_DENIED, (data: { reason: string }) => {
      useRoomStore.getState().setWaitingForHost(false, null);
      notificationService.showToast(data.reason || 'Host declined your request.', 'error', 'Entry Denied', 5000);
      disconnectStudio();
    });

    socket.on(SOCKET_EVENTS.PARTICIPANT_JOINED, (data: { participant: Participant }) => {
      useRoomStore.getState().addParticipant(data.participant);
      notificationService.playSound('join');
      notificationService.showToast(`${data.participant.name} joined the studio.`, 'info', 'User Joined', 2500);

      // If local user is HOST and actively sharing screen, initiate WebRTC offer to new participant!
      const localRole = useRoomStore.getState().localParticipant?.role;
      const shareState = useRoomStore.getState().screenShareState;
      if (localRole === 'host' && shareState === 'Sharing') {
        console.log(`[Studio Host] Initiating WebRTC offer to new audience member ${data.participant.id}...`);
        peerManager.connectToAudienceMember(data.participant.id);
      }
    });

    socket.on(SOCKET_EVENTS.PARTICIPANT_LEFT, (data: { socketId: string; name: string }) => {
      useRoomStore.getState().removeParticipant(data.socketId);
      peerManager.closePeer(data.socketId);
      notificationService.playSound('leave');
      if (data.name) {
        notificationService.showToast(`${data.name} left the room.`, 'info', undefined, 2000);
      }
    });

    socket.on(SOCKET_EVENTS.PARTICIPANT_UPDATED, (data: { participant: Participant }) => {
      useRoomStore.getState().updateParticipant(data.participant.id, data.participant);
    });

    socket.on(SOCKET_EVENTS.CHAT_RECEIVE, (data: { message: ChatMessage }) => {
      useRoomStore.getState().addChatMessage(data.message);
      if (data.message.senderId !== socket.id) {
        notificationService.playSound('reaction');
      }
    });

    socket.on(SOCKET_EVENTS.REACTION_RECEIVE, (data: { reaction: EmojiReaction }) => {
      useRoomStore.getState().addReaction(data.reaction);
      if (data.reaction.senderId !== socket.id) {
        notificationService.playSound('reaction');
      }
    });

    socket.on(SOCKET_EVENTS.HAND_STATE_CHANGED, (data: { participant: Participant; raised: boolean }) => {
      useRoomStore.getState().updateParticipant(data.participant.id, { handRaised: data.raised });
      if (data.raised) {
        notificationService.playSound('hand');
        notificationService.showToast(`✋ ${data.participant.name} raised their hand!`, 'warning', 'Raised Hand', 4000);
      }
    });

    socket.on(SOCKET_EVENTS.ROOM_LOCK_CHANGED, (data: { locked: boolean }) => {
      useRoomStore.getState().updateRoomStatus({ locked: data.locked });
      notificationService.showToast(data.locked ? '🔒 Room is now locked.' : '🔓 Room unlocked.', 'info');
    });

    socket.on(SOCKET_EVENTS.SCREEN_SHARE_STATE_UPDATED, (data: { state: ScreenShareState }) => {
      useRoomStore.getState().setScreenShareState(data.state);
      if (data.state === 'Stopped' || data.state === 'Idle') {
        useRoomStore.getState().setRemoteMediaStream(null);
      }
    });

    // WebRTC Signaling Replay via PeerManager
    socket.on(SOCKET_EVENTS.WEBRTC_OFFER, (payload: { senderSocketId: string; sdp: any }) => {
      peerManager.handleOffer(payload.senderSocketId, payload.sdp);
    });

    socket.on(SOCKET_EVENTS.WEBRTC_ANSWER, (payload: { senderSocketId: string; sdp: any }) => {
      peerManager.handleAnswer(payload.senderSocketId, payload.sdp);
    });

    socket.on(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, (payload: { senderSocketId: string; candidate: any }) => {
      peerManager.handleIceCandidate(payload.senderSocketId, payload.candidate);
    });

    socket.on(SOCKET_EVENTS.REQUEST_MEDIA_STREAM, (payload: { requesterSocketId: string }) => {
      const localRole = useRoomStore.getState().localParticipant?.role;
      if (localRole === 'host' && useRoomStore.getState().screenShareState === 'Sharing') {
        peerManager.connectToAudienceMember(payload.requesterSocketId);
      }
    });

    // Host Disconnection Recovery handling
    socket.on(SOCKET_EVENTS.HOST_DISCONNECTED_RECOVERY, (data: { graceSeconds: number }) => {
      useRoomStore.getState().setHostRecovering(true, data.graceSeconds);
      notificationService.playSound('alert');
      notificationService.showToast('⚠️ Host disconnected. Waiting up to 60s for reconnection...', 'warning', 'Host Disconnected', 6000);
    });

    socket.on(SOCKET_EVENTS.HOST_RECOVERED_SUCCESS, () => {
      useRoomStore.getState().setHostRecovering(false);
      notificationService.playSound('join');
      notificationService.showToast('✅ Host reconnected! Broadcast resumed.', 'success', 'Host Reconnected', 3500);
    });

    socket.on(SOCKET_EVENTS.USER_KICKED, (data: { reason: string }) => {
      notificationService.playSound('alert');
      notificationService.showToast('You have been kicked from the room by the host.', 'error', 'Kicked', 6000);
      disconnectStudio();
    });

    socket.on(SOCKET_EVENTS.USER_BANNED, (data: { reason: string }) => {
      notificationService.playSound('alert');
      notificationService.showToast('You have been banned from this studio room.', 'error', 'Banned', 6000);
      disconnectStudio();
    });

    socket.on(SOCKET_EVENTS.ROOM_ENDED_BY_HOST, (data: { reason: string }) => {
      notificationService.playSound('alert');
      notificationService.showToast(data.reason || 'Host ended the broadcast.', 'info', 'Broadcast Ended', 5000);
      disconnectStudio();
    });

    socket.on(SOCKET_EVENTS.ERROR_NOTIFICATION, (data: { message: string }) => {
      notificationService.showToast(data.message || 'An unexpected socket error occurred.', 'error', 'Error');
    });

    return () => {
      disconnectStudio();
    };
  }, [roomId, userName, password]);

  const disconnectStudio = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    peerManager.closeAll();
    mediaManager.stopStream();
    useRoomStore.getState().resetRoomState();
  };

  // Host Studio Actions
  const startScreenShare = async (includeSystemAudio = true, includeMic = false) => {
    const socket = socketRef.current;
    if (!socket) return;

    try {
      useRoomStore.getState().setScreenShareState('Preparing');
      socket.emit(SOCKET_EVENTS.SCREEN_SHARE_STATE_CHANGE, { state: 'Preparing' });

      const stream = await mediaManager.startScreenShare({ includeSystemAudio, includeMic });
      useRoomStore.getState().setLocalShareStream(stream);
      useRoomStore.getState().setScreenShareState('Sharing');
      socket.emit(SOCKET_EVENTS.SCREEN_SHARE_STATE_CHANGE, { state: 'Sharing' });

      peerManager.setLocalMediaStream(stream);

      // Connect to all current audience members
      const roster = useRoomStore.getState().participants;
      roster.forEach((p) => {
        if (p.id !== socket.id && p.role === 'audience') {
          peerManager.connectToAudienceMember(p.id);
        }
      });

      // When host presses browser STOP SHARE button on the chrome banner
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err: any) {
      console.error('[Studio] Start screen share error:', err);
      useRoomStore.getState().setScreenShareState('Idle');
      socket.emit(SOCKET_EVENTS.SCREEN_SHARE_STATE_CHANGE, { state: 'Idle' });
      notificationService.showToast(err.message || 'Failed to start screen share', 'error', 'Media Error');
    }
  };

  const stopScreenShare = () => {
    const socket = socketRef.current;
    mediaManager.stopStream();
    peerManager.setLocalMediaStream(null);
    useRoomStore.getState().setLocalShareStream(null);
    useRoomStore.getState().setScreenShareState('Stopped');
    if (socket) {
      socket.emit(SOCKET_EVENTS.SCREEN_SHARE_STATE_CHANGE, { state: 'Stopped' });
    }
  };

  const startAudioOnlyShare = async (includeSystemAudio = false, includeMic = true) => {
    const socket = socketRef.current;
    if (!socket || useRoomStore.getState().localParticipant?.role !== 'host') return;

    try {
      useRoomStore.getState().setScreenShareState('Preparing');
      socket.emit(SOCKET_EVENTS.SCREEN_SHARE_STATE_CHANGE, { state: 'Preparing' });

      const stream = await mediaManager.startAudioOnlyShare({ includeSystemAudio, includeMic });
      useRoomStore.getState().setLocalShareStream(stream);
      useRoomStore.getState().setScreenShareState('Sharing');
      socket.emit(SOCKET_EVENTS.SCREEN_SHARE_STATE_CHANGE, { state: 'Sharing' });

      peerManager.setLocalMediaStream(stream);
      const roster = useRoomStore.getState().participants;
      roster.forEach((p) => {
        if (p.id !== socket.id && p.role === 'audience') {
          peerManager.connectToAudienceMember(p.id);
        }
      });
    } catch (err: any) {
      console.error('[Studio] Start audio only share error:', err);
      useRoomStore.getState().setScreenShareState('Idle');
      socket.emit(SOCKET_EVENTS.SCREEN_SHARE_STATE_CHANGE, { state: 'Idle' });
      notificationService.showToast(err.message || 'Failed to start audio broadcast', 'error', 'Media Error');
    }
  };

  const sendChatMessage = (text: string) => {
    if (socketRef.current && text.trim()) {
      socketRef.current.emit(SOCKET_EVENTS.CHAT_SEND, { text });
    }
  };

  const sendReaction = (emoji: string) => {
    if (socketRef.current && emoji) {
      socketRef.current.emit(SOCKET_EVENTS.REACTION_SEND, { emoji });
    }
  };

  const toggleRaiseHand = (currentlyRaised: boolean) => {
    if (!socketRef.current) return;
    if (currentlyRaised) {
      socketRef.current.emit(SOCKET_EVENTS.LOWER_HAND, {});
    } else {
      socketRef.current.emit(SOCKET_EVENTS.RAISE_HAND, {});
    }
  };

  const toggleRoomLock = (currentlyLocked: boolean) => {
    if (!socketRef.current) return;
    if (currentlyLocked) {
      socketRef.current.emit(SOCKET_EVENTS.UNLOCK_ROOM, {});
    } else {
      socketRef.current.emit(SOCKET_EVENTS.LOCK_ROOM, {});
    }
  };

  const kickUser = (targetSocketId: string) => {
    if (socketRef.current && targetSocketId) {
      socketRef.current.emit(SOCKET_EVENTS.KICK_USER, { targetSocketId });
    }
  };

  const banUser = (targetSocketId: string, reason = 'Banned by host') => {
    if (socketRef.current && targetSocketId) {
      socketRef.current.emit(SOCKET_EVENTS.BAN_USER, { targetSocketId, reason });
    }
  };

  const endRoomBroadcast = () => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.END_ROOM, {});
    }
  };

  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.LEAVE_ROOM, {});
    }
    disconnectStudio();
  };

  const admitUser = (requesterSocketId: string) => {
    if (socketRef.current && requesterSocketId) {
      socketRef.current.emit(SOCKET_EVENTS.ADMIT_USER, { requesterSocketId });
      useRoomStore.getState().removePendingJoinRequest(requesterSocketId);
    }
  };

  const denyUser = (requesterSocketId: string) => {
    if (socketRef.current && requesterSocketId) {
      socketRef.current.emit(SOCKET_EVENTS.DENY_USER, { requesterSocketId });
      useRoomStore.getState().removePendingJoinRequest(requesterSocketId);
    }
  };

  return {
    startScreenShare,
    stopScreenShare,
    startAudioOnlyShare,
    sendChatMessage,
    sendReaction,
    toggleRaiseHand,
    toggleRoomLock,
    kickUser,
    banUser,
    endRoomBroadcast,
    leaveRoom,
    admitUser,
    denyUser,
  };
}

