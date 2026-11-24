import { AccessToken, RoomServiceClient, TrackSource } from 'livekit-server-sdk';
import { appConfig } from '../config/app';
import { UserRole, LiveKitTokenResponse, AppError } from '@musica/shared';
import { loggerService } from './LoggerService';

export class LiveKitService {
  private apiKey: string;
  private apiSecret: string;
  private serverUrl: string;
  private roomServiceClient?: RoomServiceClient;

  constructor() {
    this.apiKey = appConfig.livekit.apiKey;
    this.apiSecret = appConfig.livekit.apiSecret;
    this.serverUrl = appConfig.livekit.apiUrl;
  }

  /**
   * Return LiveKit Server URL configured on backend
   */
  public getServerUrl(): string {
    return this.serverUrl;
  }

  /**
   * Generates a signed LiveKit JWT AccessToken with role-based room grants.
   */
  public async generateToken(params: {
    roomId: string;
    participantIdentity: string;
    participantName: string;
    role: UserRole;
    metadata?: Record<string, any>;
  }): Promise<LiveKitTokenResponse> {
    const { roomId, participantIdentity, participantName, role, metadata } = params;

    if (!roomId) {
      throw new AppError('roomId is required for LiveKit token generation', 400, 'INVALID_ROOM_ID');
    }
    if (!participantIdentity || !participantName) {
      throw new AppError('Participant identity and name are required', 400, 'INVALID_PARTICIPANT');
    }

    const normalizedRoomId = roomId.trim().toUpperCase();

    // Determine permissions according to role
    const isHostOrOwner = role === 'host' || role === 'owner';
    const isCoHost = role === 'co-host';
    const isDj = role === 'dj';
    const isSpeaker = role === 'speaker';

    const canPublish = isHostOrOwner || isCoHost || isDj || isSpeaker;
    const roomAdmin = isHostOrOwner;

    // Track sources that can be published
    const canPublishSources: TrackSource[] = [];
    if (canPublish) {
      canPublishSources.push(TrackSource.MICROPHONE);
    }
    if (isHostOrOwner || isCoHost || isDj) {
      canPublishSources.push(TrackSource.SCREEN_SHARE);
      canPublishSources.push(TrackSource.SCREEN_SHARE_AUDIO);
    }
    if (isHostOrOwner || isCoHost || isSpeaker) {
      canPublishSources.push(TrackSource.CAMERA);
    }

    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl: '6h',
      metadata: JSON.stringify({
        role,
        name: participantName,
        joinedAt: new Date().toISOString(),
        ...(metadata || {}),
      }),
    });

    token.addGrant({
      room: normalizedRoomId,
      roomJoin: true,
      canPublish,
      canPublishData: true,
      canSubscribe: true,
      roomAdmin,
      canPublishSources,
    });

    const jwt = await token.toJwt();

    await loggerService.logEvent('CHAT' as any, {
      roomId: normalizedRoomId,
      userId: participantIdentity,
      userName: participantName,
      details: { action: 'LIVEKIT_TOKEN_ISSUED', role, canPublish },
    });

    return {
      token: jwt,
      serverUrl: this.serverUrl,
      roomName: normalizedRoomId,
      participantIdentity,
      participantName,
      role,
    };
  }

  /**
   * Lazily instantiate RoomServiceClient for admin room orchestration
   */
  public getClient(): RoomServiceClient {
    if (!this.roomServiceClient) {
      // Convert ws/wss to http/https for LiveKit Twirp RPC client
      let rpcUrl = this.serverUrl;
      if (rpcUrl.startsWith('ws://')) {
        rpcUrl = rpcUrl.replace('ws://', 'http://');
      } else if (rpcUrl.startsWith('wss://')) {
        rpcUrl = rpcUrl.replace('wss://', 'https://');
      }
      this.roomServiceClient = new RoomServiceClient(rpcUrl, this.apiKey, this.apiSecret);
    }
    return this.roomServiceClient;
  }

  /**
   * Terminate a LiveKit room when the host closes the session
   */
  public async deleteRoom(roomId: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.deleteRoom(roomId.trim().toUpperCase());
      console.log(`[LiveKitService] Room ${roomId} deleted on LiveKit server.`);
    } catch (err: any) {
      // If room not found on LiveKit or server not running, log warning without crashing
      console.warn(`[LiveKitService] deleteRoom non-fatal error: ${err.message}`);
    }
  }

  /**
   * Disconnect a participant from the LiveKit room (moderator action)
   */
  public async removeParticipant(roomId: string, identity: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.removeParticipant(roomId.trim().toUpperCase(), identity);
      console.log(`[LiveKitService] Participant ${identity} removed from ${roomId}.`);
    } catch (err: any) {
      console.warn(`[LiveKitService] removeParticipant non-fatal error: ${err.message}`);
    }
  }

  /**
   * Remote-mute a published track on LiveKit (e.g. host mutes participant mic)
   */
  public async mutePublishedTrack(roomId: string, identity: string, trackSid: string, muted: boolean): Promise<void> {
    try {
      const client = this.getClient();
      await client.mutePublishedTrack(roomId.trim().toUpperCase(), identity, trackSid, muted);
      console.log(`[LiveKitService] Muted track ${trackSid} for participant ${identity}.`);
    } catch (err: any) {
      console.warn(`[LiveKitService] mutePublishedTrack non-fatal error: ${err.message}`);
    }
  }
}

export const liveKitService = new LiveKitService();
