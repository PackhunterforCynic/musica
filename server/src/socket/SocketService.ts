import { Server, Socket } from 'socket.io';
import {
  SOCKET_EVENTS,
  SessionsFileSchema,
  ChatMessage,
  EmojiReaction,
  UserRole,
  RoomsFileSchema,
  ParticipantsFileSchema,
} from '@musica/shared';
import { roomService } from '../services/RoomService';
import { participantService } from '../services/ParticipantService';
import { storageService } from '../services/StorageService';
import { loggerService } from '../services/LoggerService';
import { limitsConfig } from '../config/limits';

interface SocketData {
  roomId: string;
  userName: string;
  role: UserRole;
}

export class SocketService {
  private io?: Server;
  // Track recovery timeouts in memory by roomId -> Timer
  private recoveryTimers: Map<string, NodeJS.Timeout> = new Map();
  // Track pending audience join requests by roomId -> Map<socketId, requestInfo>
  private pendingJoinRequests: Map<string, Map<string, { socket: Socket; userName: string; password?: string; timestamp: string }>> = new Map();

  public initialize(io: Server): void {
    this.io = io;
    io.on('connection', (socket: Socket) => this.handleConnection(socket));
    console.log('[SocketService] Real-time signaling server attached.');
  }

  private handleConnection(socket: Socket): void {
    console.log(`[Socket] New connection established: ${socket.id}`);

    // JOIN ROOM
    socket.on(SOCKET_EVENTS.JOIN_ROOM, async (payload: { roomId: string; name: string; password?: string }) => {
      try {
        const roomId = payload.roomId.trim().toUpperCase();
        const userName = payload.name.trim();

        // 1. Check if room is recovering from host disconnect
        const sessions = await storageService.readJson<SessionsFileSchema>('sessions.json');
        const recoveringInfo = sessions.recoveringRooms[roomId];
        let role: UserRole = 'audience';

        if (recoveringInfo) {
          // If the returning user is the host reconnecting within 60s
          if (recoveringInfo.previousHostName.toLowerCase() === userName.toLowerCase()) {
            role = 'host';
            await this.cancelHostRecovery(roomId);
            socket.emit(SOCKET_EVENTS.HOST_RECOVERED_SUCCESS, { roomId });
            this.io?.to(roomId).emit(SOCKET_EVENTS.HOST_RECOVERED_SUCCESS, { roomId });
            await loggerService.logEvent('HOST_RECOVERED', { roomId, userId: socket.id, userName });
          }
        } else {
          // Normal join: check if this is host (first to join or matches hostName in room creation)
          const roomDetails = await roomService.getRoom(roomId);
          if (roomDetails.room.hostName.toLowerCase() === userName.toLowerCase() && (!roomDetails.room.hostId || roomDetails.activeParticipantsCount === 0)) {
            role = 'host';
          }
        }

        // Validate credentials & ban state
        const roomData = await roomService.validateJoin({ roomId, userName, password: payload.password });

        if (role !== 'host') {
          // AUDIENCE WAITING ROOM APPROVAL
          if (!this.pendingJoinRequests.has(roomId)) {
            this.pendingJoinRequests.set(roomId, new Map());
          }
          const timestamp = new Date().toISOString();
          this.pendingJoinRequests.get(roomId)!.set(socket.id, {
            socket,
            userName,
            password: payload.password,
            timestamp,
          });

          socket.emit(SOCKET_EVENTS.JOIN_REQUEST_SUBMITTED, {
            roomName: roomData.roomName,
            hostName: roomData.hostName,
          });

          const hostSocketId = roomData.hostId;
          if (hostSocketId && this.io) {
            this.io.to(hostSocketId).emit(SOCKET_EVENTS.JOIN_REQUEST_RECEIVED, {
              socketId: socket.id,
              name: userName,
              timestamp,
            });
          } else {
            this.io?.to(roomId).emit(SOCKET_EVENTS.JOIN_REQUEST_RECEIVED, {
              socketId: socket.id,
              name: userName,
              timestamp,
            });
          }
          console.log(`[SocketService] User ${userName} (${socket.id}) placed in waiting room for room ${roomId}`);
          return;
        }

        // Register participant
        const participant = await participantService.addParticipant({
          socketId: socket.id,
          roomId,
          name: userName,
          role,
        });

        // Store session info on socket object
        (socket.data as SocketData) = { roomId, userName, role };

        socket.join(roomId);

        // Fetch current roster
        const roster = await participantService.getParticipantsInRoom(roomId);

        // Notify connecting client of successful join
        socket.emit(SOCKET_EVENTS.ROOM_JOINED_SUCCESS, {
          room: roomData,
          localParticipant: participant,
          participants: roster,
          isRecovering: !!recoveringInfo && role !== 'host',
        });

        // Broadcast new arrival to everyone else in room
        socket.to(roomId).emit(SOCKET_EVENTS.PARTICIPANT_JOINED, { participant });

        // If host joined while audience was waiting, notify them
        if (role === 'host' && roomData.screenShareState !== 'Idle') {
          socket.to(roomId).emit(SOCKET_EVENTS.SCREEN_SHARE_STATE_UPDATED, { state: roomData.screenShareState });
        }
      } catch (err: any) {
        console.error(`[Socket] Join error for ${socket.id}:`, err);
        socket.emit(SOCKET_EVENTS.ERROR_NOTIFICATION, { message: err.message || 'Failed to join room' });
      }
    });

    // PRESENCE UPDATE (Speaking, Muted, Away)
    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, async (payload: { status: any }) => {
      const { roomId } = socket.data as SocketData;
      if (!roomId) return;
      const updated = await participantService.updatePresence(socket.id, payload.status);
      if (updated) {
        this.io?.to(roomId).emit(SOCKET_EVENTS.PARTICIPANT_UPDATED, { participant: updated });
      }
    });

    // CHAT MESSAGE
    socket.on(SOCKET_EVENTS.CHAT_SEND, async (payload: { text: string }) => {
      const { roomId, userName, role } = socket.data as SocketData;
      if (!roomId || !payload.text?.trim()) return;

      const chatMsg: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        roomId,
        senderId: socket.id,
        senderName: userName || 'Anonymous',
        senderRole: role || 'audience',
        text: payload.text.trim().slice(0, 500), // Sanitize length
        timestamp: new Date().toISOString(),
      };

      this.io?.to(roomId).emit(SOCKET_EVENTS.CHAT_RECEIVE, { message: chatMsg });
      await loggerService.logEvent('CHAT', { roomId, userId: socket.id, userName, details: { textLength: chatMsg.text.length } });
    });

    // EMOJI REACTION
    socket.on(SOCKET_EVENTS.REACTION_SEND, async (payload: { emoji: string }) => {
      const { roomId, userName } = socket.data as SocketData;
      if (!roomId || !payload.emoji) return;

      const reaction: EmojiReaction = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        roomId,
        senderId: socket.id,
        senderName: userName || 'User',
        emoji: payload.emoji,
        timestamp: new Date().toISOString(),
      };

      this.io?.to(roomId).emit(SOCKET_EVENTS.REACTION_RECEIVE, { reaction });
      await loggerService.logEvent('REACTION', { roomId, userId: socket.id, userName, details: { emoji: payload.emoji } });
    });

    // RAISE / LOWER HAND
    socket.on(SOCKET_EVENTS.RAISE_HAND, async () => {
      const { roomId } = socket.data as SocketData;
      if (!roomId) return;
      const updated = await participantService.setHandRaised(socket.id, roomId, true);
      if (updated) {
        this.io?.to(roomId).emit(SOCKET_EVENTS.HAND_STATE_CHANGED, { participant: updated, raised: true });
      }
    });

    socket.on(SOCKET_EVENTS.LOWER_HAND, async () => {
      const { roomId } = socket.data as SocketData;
      if (!roomId) return;
      const updated = await participantService.setHandRaised(socket.id, roomId, false);
      if (updated) {
        this.io?.to(roomId).emit(SOCKET_EVENTS.HAND_STATE_CHANGED, { participant: updated, raised: false });
      }
    });

    // HOST CONTROLS: LOCK / UNLOCK
    socket.on(SOCKET_EVENTS.LOCK_ROOM, async () => {
      const { roomId, role } = socket.data as SocketData;
      if (role !== 'host' || !roomId) {
        socket.emit(SOCKET_EVENTS.ERROR_NOTIFICATION, { message: 'Only the host can lock the room.' });
        return;
      }
      await roomService.toggleLock(roomId, true);
      this.io?.to(roomId).emit(SOCKET_EVENTS.ROOM_LOCK_CHANGED, { locked: true });
    });

    socket.on(SOCKET_EVENTS.UNLOCK_ROOM, async () => {
      const { roomId, role } = socket.data as SocketData;
      if (role !== 'host' || !roomId) return;
      await roomService.toggleLock(roomId, false);
      this.io?.to(roomId).emit(SOCKET_EVENTS.ROOM_LOCK_CHANGED, { locked: false });
    });

    // HOST CONTROLS: KICK & BAN
    socket.on(SOCKET_EVENTS.KICK_USER, async (payload: { targetSocketId: string }) => {
      const { roomId, role } = socket.data as SocketData;
      if (role !== 'host' || !roomId || !payload.targetSocketId) return;

      const removed = await participantService.removeParticipant(payload.targetSocketId, roomId);
      if (removed) {
        this.io?.to(payload.targetSocketId).emit(SOCKET_EVENTS.USER_KICKED, { reason: 'Removed by room host.' });
        const targetSocket = this.io?.sockets.sockets.get(payload.targetSocketId);
        if (targetSocket) {
          targetSocket.leave(roomId);
        }
        this.io?.to(roomId).emit(SOCKET_EVENTS.PARTICIPANT_LEFT, { socketId: payload.targetSocketId, name: removed.name });
      }
    });

    socket.on(SOCKET_EVENTS.BAN_USER, async (payload: { targetSocketId: string; reason?: string }) => {
      const { roomId, role } = socket.data as SocketData;
      if (role !== 'host' || !roomId || !payload.targetSocketId) return;

      await participantService.banUser(roomId, payload.targetSocketId, payload.reason || 'Banned by host');
      const removed = await participantService.removeParticipant(payload.targetSocketId, roomId);
      if (removed) {
        this.io?.to(payload.targetSocketId).emit(SOCKET_EVENTS.USER_BANNED, { reason: payload.reason || 'Banned by room host.' });
        const targetSocket = this.io?.sockets.sockets.get(payload.targetSocketId);
        if (targetSocket) {
          targetSocket.leave(roomId);
        }
        this.io?.to(roomId).emit(SOCKET_EVENTS.PARTICIPANT_LEFT, { socketId: payload.targetSocketId, name: removed.name });
      }
    });

    // SCREEN SHARE STATE CHANGE
    socket.on(SOCKET_EVENTS.SCREEN_SHARE_STATE_CHANGE, async (payload: { state: any }) => {
      const { roomId, role } = socket.data as SocketData;
      if (role !== 'host' || !roomId) return;
      await roomService.setScreenShareState(roomId, payload.state);
      socket.to(roomId).emit(SOCKET_EVENTS.SCREEN_SHARE_STATE_UPDATED, { state: payload.state });
    });

    // WEBRTC SIGNALING ROUTING (P2P Mesh / Offer-Answer Exchanging)
    socket.on(SOCKET_EVENTS.WEBRTC_OFFER, (payload: { targetSocketId: string; sdp: any; tracks?: any[] }) => {
      const { roomId } = socket.data as SocketData;
      if (!roomId || !payload.targetSocketId) return;
      this.io?.to(payload.targetSocketId).emit(SOCKET_EVENTS.WEBRTC_OFFER, {
        senderSocketId: socket.id,
        sdp: payload.sdp,
        tracks: payload.tracks,
      });
    });

    socket.on(SOCKET_EVENTS.WEBRTC_ANSWER, (payload: { targetSocketId: string; sdp: any }) => {
      const { roomId } = socket.data as SocketData;
      if (!roomId || !payload.targetSocketId) return;
      this.io?.to(payload.targetSocketId).emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
        senderSocketId: socket.id,
        sdp: payload.sdp,
      });
    });

    socket.on(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, (payload: { targetSocketId: string; candidate: any }) => {
      const { roomId } = socket.data as SocketData;
      if (!roomId || !payload.targetSocketId) return;
      this.io?.to(payload.targetSocketId).emit(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, {
        senderSocketId: socket.id,
        candidate: payload.candidate,
      });
    });

    socket.on(SOCKET_EVENTS.REQUEST_MEDIA_STREAM, async (payload: { hostSocketId?: string }) => {
      const { roomId } = socket.data as SocketData;
      if (!roomId) return;
      // If audience asks host to send an offer
      const roomsData = await storageService.readJson<RoomsFileSchema>('rooms.json');
      const hostId = payload.hostSocketId || roomsData.rooms[roomId]?.hostId;
      if (hostId && hostId !== socket.id) {
        this.io?.to(hostId).emit(SOCKET_EVENTS.REQUEST_MEDIA_STREAM, { requesterSocketId: socket.id });
      }
    });

    // END ROOM
    socket.on(SOCKET_EVENTS.END_ROOM, async () => {
      const { roomId, role } = socket.data as SocketData;
      if (role !== 'host' || !roomId) return;
      await roomService.endRoom(roomId, 'Host terminated broadcast via studio');
      this.io?.to(roomId).emit(SOCKET_EVENTS.ROOM_ENDED_BY_HOST, { reason: 'Broadcast has ended.' });
      this.io?.socketsLeave(roomId);
    });

    // ADMIT USER (Waiting Room Approval)
    socket.on(SOCKET_EVENTS.ADMIT_USER, async (payload: { requesterSocketId: string }) => {
      const { roomId, role } = (socket.data as SocketData) || {};
      if (role !== 'host' || !roomId || !payload.requesterSocketId) return;

      const roomRequests = this.pendingJoinRequests.get(roomId);
      const pending = roomRequests?.get(payload.requesterSocketId);
      if (!pending) return;

      roomRequests!.delete(payload.requesterSocketId);
      try {
        const roomData = await roomService.validateJoin({ roomId, userName: pending.userName, password: pending.password });
        const participant = await participantService.addParticipant({
          socketId: pending.socket.id,
          roomId,
          name: pending.userName,
          role: 'audience',
        });

        (pending.socket.data as SocketData) = { roomId, userName: pending.userName, role: 'audience' };
        pending.socket.join(roomId);

        const roster = await participantService.getParticipantsInRoom(roomId);

        pending.socket.emit(SOCKET_EVENTS.ROOM_JOINED_SUCCESS, {
          room: roomData,
          localParticipant: participant,
          participants: roster,
          isRecovering: false,
        });

        pending.socket.to(roomId).emit(SOCKET_EVENTS.PARTICIPANT_JOINED, { participant });

        if (roomData.screenShareState !== 'Idle') {
          pending.socket.emit(SOCKET_EVENTS.SCREEN_SHARE_STATE_UPDATED, { state: roomData.screenShareState });
        }
        console.log(`[SocketService] Host admitted ${pending.userName} (${pending.socket.id}) into room ${roomId}`);
      } catch (err: any) {
        pending.socket.emit(SOCKET_EVENTS.ERROR_NOTIFICATION, { message: err.message || 'Failed to enter studio.' });
      }
    });

    // DENY USER (Waiting Room Rejection)
    socket.on(SOCKET_EVENTS.DENY_USER, (payload: { requesterSocketId: string }) => {
      const { roomId, role } = (socket.data as SocketData) || {};
      if (role !== 'host' || !roomId || !payload.requesterSocketId) return;

      const roomRequests = this.pendingJoinRequests.get(roomId);
      const pending = roomRequests?.get(payload.requesterSocketId);
      if (pending) {
        roomRequests!.delete(payload.requesterSocketId);
        pending.socket.emit(SOCKET_EVENTS.JOIN_REQUEST_DENIED, { reason: 'The host declined your request to join this broadcast.' });
        console.log(`[SocketService] Host denied entry to ${pending.userName} (${pending.socket.id}) for room ${roomId}`);
      }
    });

    // LEAVE ROOM
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, async () => {
      await this.handleUserDeparture(socket);
    });

    // DISCONNECT
    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      for (const reqs of this.pendingJoinRequests.values()) {
        if (reqs.has(socket.id)) reqs.delete(socket.id);
      }
      await this.handleUserDeparture(socket);
    });
  }

  private async handleUserDeparture(socket: Socket): Promise<void> {
    const { roomId, userName, role } = (socket.data as SocketData) || {};
    if (!roomId) return;

    socket.leave(roomId);

    if (role === 'host') {
      // HOST RECOVERY LOGIC: Start 60-second grace window instead of immediately killing room!
      console.log(`[SocketService] Host disconnected from room ${roomId}. Starting 60s host recovery timer.`);
      const expiresAt = new Date(Date.now() + limitsConfig.hostRecoveryGracePeriodSec * 1000).toISOString();
      
      await storageService.updateJson<SessionsFileSchema>('sessions.json', (data) => {
        data.recoveringRooms[roomId] = {
          timerExpiresAt: expiresAt,
          previousHostName: userName || 'Host',
        };
      });

      await storageService.updateJson<RoomsFileSchema>('rooms.json', (data) => {
        if (data.rooms[roomId]) {
          data.rooms[roomId].status = 'recovering';
        }
      });

      // Notify audience that host disconnected but recovery grace period started
      this.io?.to(roomId).emit(SOCKET_EVENTS.HOST_DISCONNECTED_RECOVERY, {
        graceSeconds: limitsConfig.hostRecoveryGracePeriodSec,
        expiresAt,
      });

      await loggerService.logEvent('HOST_DISCONNECTED', { roomId, userId: socket.id, userName });

      // Clear any existing timer for this room
      if (this.recoveryTimers.has(roomId)) {
        clearTimeout(this.recoveryTimers.get(roomId)!);
      }

      const timer = setTimeout(async () => {
        // If timer fires and room is still recovering, end room
        const sessions = await storageService.readJson<SessionsFileSchema>('sessions.json');
        if (sessions.recoveringRooms[roomId]) {
          console.log(`[SocketService] Host recovery grace time expired for room ${roomId}. Terminating room.`);
          await roomService.endRoom(roomId, 'Host recovery grace period expired.');
          this.io?.to(roomId).emit(SOCKET_EVENTS.ROOM_ENDED_BY_HOST, { reason: 'Host disconnected and did not reconnect within 60s.' });
          this.io?.socketsLeave(roomId);
        }
        this.recoveryTimers.delete(roomId);
      }, limitsConfig.hostRecoveryGracePeriodSec * 1000);

      this.recoveryTimers.set(roomId, timer);

    } else {
      // Audience left
      const removed = await participantService.removeParticipant(socket.id, roomId);
      if (removed) {
        this.io?.to(roomId).emit(SOCKET_EVENTS.PARTICIPANT_LEFT, { socketId: socket.id, name: removed.name });
      }
    }
  }

  private async cancelHostRecovery(roomId: string): Promise<void> {
    if (this.recoveryTimers.has(roomId)) {
      clearTimeout(this.recoveryTimers.get(roomId)!);
      this.recoveryTimers.delete(roomId);
    }
    await storageService.updateJson<SessionsFileSchema>('sessions.json', (data) => {
      delete data.recoveringRooms[roomId];
    });
    await storageService.updateJson<RoomsFileSchema>('rooms.json', (data) => {
      if (data.rooms[roomId]) {
        data.rooms[roomId].status = 'active';
      }
    });
    console.log(`[SocketService] Host recovery cancelled for room ${roomId} - Host successfully reconnected.`);
  }

  public notifyRoomEnded(roomId: string): void {
    this.io?.to(roomId).emit(SOCKET_EVENTS.ROOM_ENDED_BY_HOST, { reason: 'Room expired or closed by background cleanup.' });
    this.io?.socketsLeave(roomId);
  }
}

export const socketService = new SocketService();
