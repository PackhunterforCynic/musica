import { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@musica/shared';
import { iceManager } from './ICEManager';
import { connectionManager } from './ConnectionManager';
import { offerManager, answerManager } from './OfferAnswerManagers';
import { useRoomStore } from '../store/roomStore';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export class PeerManager {
  private peers: Map<string, RTCPeerConnection> = new Map(); // Keyed by socketId
  private socket: Socket | null = null;
  private localStream: MediaStream | null = null;

  public initialize(socket: Socket): void {
    this.socket = socket;
    iceManager.setOnIceCandidate((targetSocketId, candidate) => {
      this.socket?.emit(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, {
        targetSocketId,
        candidate,
      });
    });
    console.log('[PeerManager] Initialized with signaling socket.');
  }

  public setLocalMediaStream(stream: MediaStream | null): void {
    this.localStream = stream;
    // When stream changes on host, attach tracks to all existing peer connections and renegotiate
    this.peers.forEach((pc, peerSocketId) => {
      this.attachStreamToPeer(pc, stream);
      this.renegotiatePeer(peerSocketId, pc);
    });
  }

  private attachStreamToPeer(pc: RTCPeerConnection, stream: MediaStream | null): void {
    // Remove existing senders
    const senders = pc.getSenders();
    senders.forEach((s) => pc.removeTrack(s));

    // Add new tracks if stream is available
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }
  }

  /**
   * HOST ACTION: Initiate connection and send SDP offer to an audience participant.
   */
  public async connectToAudienceMember(audienceSocketId: string): Promise<void> {
    if (!this.socket) return;
    this.closePeer(audienceSocketId);

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peers.set(audienceSocketId, pc);
    iceManager.attachToConnection(audienceSocketId, pc);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => pc.addTrack(track, this.localStream!));
    }

    try {
      const offer = await offerManager.createOffer(pc);
      this.socket.emit(SOCKET_EVENTS.WEBRTC_OFFER, {
        targetSocketId: audienceSocketId,
        sdp: offer,
      });
      connectionManager.monitorConnection(audienceSocketId, pc);
    } catch (err) {
      console.error(`[PeerManager] Failed to create offer for ${audienceSocketId}:`, err);
    }
  }

  private async renegotiatePeer(audienceSocketId: string, pc: RTCPeerConnection): Promise<void> {
    if (!this.socket || pc.signalingState === 'closed') return;
    try {
      const offer = await offerManager.createOffer(pc);
      this.socket.emit(SOCKET_EVENTS.WEBRTC_OFFER, {
        targetSocketId: audienceSocketId,
        sdp: offer,
      });
    } catch (e) {
      console.warn(`[PeerManager] Renegotiated offer error for ${audienceSocketId}:`, e);
    }
  }

  /**
   * HOST ACTION: Handle incoming SDP Answer from audience member.
   */
  public async handleAnswer(senderSocketId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peers.get(senderSocketId);
    if (pc && pc.signalingState !== 'closed') {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await iceManager.flushQueuedCandidates(senderSocketId, pc);
      } catch (err) {
        console.error(`[PeerManager] Failed setting remote answer from ${senderSocketId}:`, err);
      }
    }
  }

  /**
   * AUDIENCE ACTION: Handle incoming SDP Offer from host, return Answer, and capture incoming media stream.
   */
  public async handleOffer(hostSocketId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.socket) return;
    this.closePeer(hostSocketId);

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peers.set(hostSocketId, pc);
    iceManager.attachToConnection(hostSocketId, pc);

    pc.ontrack = (event) => {
      console.log('[PeerManager] Received remote broadcast stream track:', event.streams);
      if (event.streams && event.streams[0]) {
        useRoomStore.getState().setRemoteMediaStream(event.streams[0]);
      }
    };

    try {
      const answer = await answerManager.createAnswer(pc, sdp);
      await iceManager.flushQueuedCandidates(hostSocketId, pc);

      this.socket.emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
        targetSocketId: hostSocketId,
        sdp: answer,
      });
      connectionManager.monitorConnection(hostSocketId, pc);
    } catch (err) {
      console.error(`[PeerManager] Failed processing host offer:`, err);
    }
  }

  public async handleIceCandidate(senderSocketId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peers.get(senderSocketId);
    if (pc) {
      await iceManager.addRemoteCandidate(senderSocketId, pc, candidate);
    }
  }

  public closePeer(socketId: string): void {
    const pc = this.peers.get(socketId);
    if (pc) {
      pc.close();
      this.peers.delete(socketId);
    }
    iceManager.clearQueue(socketId);
    connectionManager.stopMonitoring(socketId);
  }

  public closeAll(): void {
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    iceManager.clearAll();
    connectionManager.stopAll();
    useRoomStore.getState().setRemoteMediaStream(null);
  }
}

export const peerManager = new PeerManager();
