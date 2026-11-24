import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  Participant as LKParticipant,
  ConnectionQuality as LKConnectionQuality,
} from 'livekit-client';
import { useRoomStore } from '../store/roomStore';
import { notificationService } from '../services/NotificationService';
import { ConnectionQuality } from '@musica/shared';

export class LiveKitManager {
  private room: Room | null = null;
  private audioElements: Map<string, HTMLMediaElement> = new Map();
  private isConnecting: boolean = false;

  public getRoom(): Room | null {
    return this.room;
  }

  public isConnected(): boolean {
    return !!this.room && this.room.state === 'connected';
  }

  /**
   * Connect to LiveKit SFU Room using access token
   */
  public async connect(serverUrl: string, token: string): Promise<Room | null> {
    if (this.isConnected()) {
      console.log('[LiveKitManager] Already connected to LiveKit room.');
      return this.room;
    }

    if (this.isConnecting) {
      console.log('[LiveKitManager] Connection already in progress...');
      return this.room;
    }

    this.isConnecting = true;

    try {
      // Clean up any stale audio elements
      this.cleanupAudioElements();

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
        publishDefaults: {
          screenShareEncoding: {
            maxBitrate: 3_000_000,
            maxFramerate: 30,
          },
        },
      });

      this.room = room;
      this.bindRoomEvents(room);

      console.log(`[LiveKitManager] Connecting to LiveKit SFU: ${serverUrl}...`);
      await room.connect(serverUrl, token);

      useRoomStore.getState().setLiveKitConnected(true);
      useRoomStore.getState().setLiveKitToken(token);
      notificationService.showToast('🚀 LiveKit SFU Real-Time Media Connected', 'success', 'LiveKit 2.0');

      return room;
    } catch (err: any) {
      console.warn('[LiveKitManager] Failed to connect to LiveKit SFU:', err);
      useRoomStore.getState().setLiveKitConnected(false);
      // Non-fatal warning if LiveKit server is offline during dev/test
      notificationService.showToast('LiveKit media server currently offline or connecting in fallback mode.', 'warning', 'LiveKit SFU');
      return null;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Bind LiveKit Room life-cycle and track subscription events
   */
  private bindRoomEvents(room: Room): void {
    // 1. Connection events
    room.on(RoomEvent.Connected, () => {
      console.log(`[LiveKitManager] Room Connected: ${room.name}`);
      useRoomStore.getState().setLiveKitConnected(true);
    });

    room.on(RoomEvent.Disconnected, (reason) => {
      console.log(`[LiveKitManager] Disconnected from room: ${reason}`);
      useRoomStore.getState().setLiveKitConnected(false);
      this.cleanupAudioElements();
    });

    room.on(RoomEvent.Reconnecting, () => {
      console.log('[LiveKitManager] Reconnecting to LiveKit SFU...');
      notificationService.showToast('Reconnecting media streams...', 'warning', 'LiveKit SFU');
    });

    room.on(RoomEvent.Reconnected, () => {
      console.log('[LiveKitManager] Reconnected to LiveKit SFU!');
      notificationService.showToast('Media streams reconnected!', 'success', 'LiveKit SFU');
    });

    // 2. Track Subscription handling (Audio & Screen Share video)
    room.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        console.log(`[LiveKitManager] Track subscribed: ${track.kind} (${track.source}) from ${participant.identity}`);

        // A. REMOTE AUDIO (Microphone or Screen Share Audio)
        if (track.kind === Track.Kind.Audio) {
          const trackId = track.sid || track.mediaStreamTrack.id;
          const audioElement = track.attach();
          audioElement.id = `lk-audio-${trackId}`;
          audioElement.style.display = 'none';
          document.body.appendChild(audioElement);
          this.audioElements.set(trackId, audioElement);

          audioElement.play().catch((playErr) => {
            console.warn('[LiveKitManager] Audio auto-play restricted by browser:', playErr);
          });
        }

        // B. REMOTE SCREEN SHARE VIDEO
        if (track.kind === Track.Kind.Video && (track.source === Track.Source.ScreenShare || publication.source === Track.Source.ScreenShare)) {
          console.log('[LiveKitManager] Received Screen Share video track!');
          const mediaStream = new MediaStream([track.mediaStreamTrack]);
          useRoomStore.getState().setRemoteMediaStream(mediaStream);
          useRoomStore.getState().setRemoteScreenTrack(track);
          useRoomStore.getState().setScreenShareState('Sharing');
          notificationService.showToast(`📺 Receiving screen share from ${participant.name || 'host'}`, 'info');
        }

        // C. REMOTE CAMERA VIDEO
        if (track.kind === Track.Kind.Video && (track.source === Track.Source.Camera || publication.source === Track.Source.Camera)) {
          console.log(`[LiveKitManager] Received Camera video track from ${participant.identity}`);
          const mediaStream = new MediaStream([track.mediaStreamTrack]);
          useRoomStore.getState().setRemoteCameraStream(participant.identity, mediaStream);
          useRoomStore.getState().updateParticipant(participant.identity, { hasCamera: true });
        }
      }
    );

    // 3. Track Unsubscribed handling
    room.on(
      RoomEvent.TrackUnsubscribed,
      (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        console.log(`[LiveKitManager] Track unsubscribed: ${track.kind} (${track.source}) from ${participant.identity}`);

        // Remove audio element
        const trackId = track.sid || track.mediaStreamTrack.id;
        if (this.audioElements.has(trackId)) {
          const el = this.audioElements.get(trackId);
          el?.remove();
          this.audioElements.delete(trackId);
        }
        track.detach().forEach((el) => el.remove());

        // Clear screen share if screen track ended
        if (track.kind === Track.Kind.Video && (track.source === Track.Source.ScreenShare || publication.source === Track.Source.ScreenShare)) {
          useRoomStore.getState().setRemoteScreenTrack(null);
          useRoomStore.getState().setRemoteMediaStream(null);
          useRoomStore.getState().setScreenShareState('Idle');
          notificationService.showToast('Host screen share ended.', 'info');
        }

        // Clear camera video if camera track ended
        if (track.kind === Track.Kind.Video && (track.source === Track.Source.Camera || publication.source === Track.Source.Camera)) {
          useRoomStore.getState().setRemoteCameraStream(participant.identity, null);
          useRoomStore.getState().updateParticipant(participant.identity, { hasCamera: false });
        }
      }
    );

    // 4. Active speakers detection for voice activity indicators
    room.on(RoomEvent.ActiveSpeakersChanged, (speakers: LKParticipant[]) => {
      const activeIds = speakers.map((s) => s.identity);
      useRoomStore.getState().setActiveSpeakerIds(activeIds);

      // Update presence in participant list
      const currentParticipants = useRoomStore.getState().participants;
      currentParticipants.forEach((p) => {
        const isSpeaking = activeIds.includes(p.id);
        if (isSpeaking && p.presence !== 'Speaking') {
          useRoomStore.getState().updateParticipant(p.id, { presence: 'Speaking' });
        } else if (!isSpeaking && p.presence === 'Speaking') {
          useRoomStore.getState().updateParticipant(p.id, { presence: 'Joined' });
        }
      });
    });

    // 5. Connection quality adaptation
    room.on(RoomEvent.ConnectionQualityChanged, (quality: LKConnectionQuality, participant: LKParticipant) => {
      if (participant === room.localParticipant) {
        let mappedQuality: ConnectionQuality = 'Good';
        if (quality === LKConnectionQuality.Excellent) mappedQuality = 'Excellent';
        else if (quality === LKConnectionQuality.Good) mappedQuality = 'Good';
        else if (quality === LKConnectionQuality.Poor) mappedQuality = 'Poor';
        else if (quality === LKConnectionQuality.Lost) mappedQuality = 'Disconnected';

        useRoomStore.getState().setConnectionQuality(mappedQuality);
      }
    });

    // 6. Local track publications
    room.on(RoomEvent.LocalTrackPublished, (publication) => {
      if (publication.track?.source === Track.Source.Microphone) {
        useRoomStore.getState().setIsMicMuted(false);
      }
      if (publication.track?.source === Track.Source.ScreenShare) {
        useRoomStore.getState().setIsScreenSharing(true);
        useRoomStore.getState().setScreenShareState('Sharing');
        if (publication.track.mediaStreamTrack) {
          const stream = new MediaStream([publication.track.mediaStreamTrack]);
          useRoomStore.getState().setLocalShareStream(stream);
        }
      }
    });

    room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
      if (publication.track?.source === Track.Source.Microphone) {
        useRoomStore.getState().setIsMicMuted(true);
      }
      if (publication.track?.source === Track.Source.ScreenShare) {
        useRoomStore.getState().setIsScreenSharing(false);
        useRoomStore.getState().setScreenShareState('Idle');
        useRoomStore.getState().setLocalShareStream(null);
      }
    });
  }

  /**
   * Toggle local participant microphone
   */
  public async toggleMicrophone(): Promise<boolean> {
    if (!this.room || this.room.state !== 'connected') {
      console.warn('[LiveKitManager] Cannot toggle microphone: not connected to LiveKit room.');
      return false;
    }

    try {
      const current = this.room.localParticipant.isMicrophoneEnabled;
      const target = !current;
      await this.room.localParticipant.setMicrophoneEnabled(target);
      useRoomStore.getState().setIsMicMuted(!target);
      notificationService.showToast(target ? '🎙️ Microphone Unmuted' : '🔇 Microphone Muted', 'info');
      return target;
    } catch (err: any) {
      console.error('[LiveKitManager] Failed to toggle microphone:', err);
      notificationService.showToast('Microphone access error: ' + err.message, 'error');
      return false;
    }
  }

  /**
   * Set microphone state explicitly
   */
  public async setMicrophoneEnabled(enabled: boolean): Promise<boolean> {
    if (!this.room || this.room.state !== 'connected') return false;
    try {
      await this.room.localParticipant.setMicrophoneEnabled(enabled);
      useRoomStore.getState().setIsMicMuted(!enabled);
      return enabled;
    } catch (err: any) {
      console.error('[LiveKitManager] setMicrophoneEnabled error:', err);
      return false;
    }
  }

  /**
   * Toggle local participant camera
   */
  public async toggleCamera(): Promise<boolean> {
    if (!this.room || this.room.state !== 'connected') {
      // Fallback for local preview if not yet connected to LiveKit SFU
      try {
        const isEnabled = useRoomStore.getState().isCameraEnabled;
        if (!isEnabled) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
          useRoomStore.getState().setLocalCameraStream(stream);
          useRoomStore.getState().setIsCameraEnabled(true);
          notificationService.showToast('📹 Camera Started', 'info');
          return true;
        } else {
          const stream = useRoomStore.getState().localCameraStream;
          stream?.getTracks().forEach((t) => t.stop());
          useRoomStore.getState().setLocalCameraStream(null);
          useRoomStore.getState().setIsCameraEnabled(false);
          notificationService.showToast('📷 Camera Stopped', 'info');
          return false;
        }
      } catch (err: any) {
        notificationService.showToast('Camera access denied or unavailable', 'warning');
        return false;
      }
    }

    try {
      const current = this.room.localParticipant.isCameraEnabled;
      const target = !current;
      await this.room.localParticipant.setCameraEnabled(target);
      useRoomStore.getState().setIsCameraEnabled(target);
      const pub = this.room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (pub && pub.track?.mediaStreamTrack) {
        useRoomStore.getState().setLocalCameraStream(new MediaStream([pub.track.mediaStreamTrack]));
      } else {
        useRoomStore.getState().setLocalCameraStream(null);
      }
      notificationService.showToast(target ? '📹 Camera Started' : '📷 Camera Stopped', 'info');
      return target;
    } catch (err: any) {
      console.error('[LiveKitManager] Failed to toggle camera:', err);
      notificationService.showToast('Camera access error: ' + err.message, 'error');
      return false;
    }
  }

  /**
   * Set camera state explicitly
   */
  public async setCameraEnabled(enabled: boolean): Promise<boolean> {
    if (!this.room || this.room.state !== 'connected') return false;
    try {
      await this.room.localParticipant.setCameraEnabled(enabled);
      useRoomStore.getState().setIsCameraEnabled(enabled);
      return enabled;
    } catch (err: any) {
      console.error('[LiveKitManager] setCameraEnabled error:', err);
      return false;
    }
  }

  /**
   * Start LiveKit screen sharing with high definition 1080p and system audio capture
   */
  public async startScreenShare(includeAudio: boolean = true): Promise<boolean> {
    if (!this.room || this.room.state !== 'connected') {
      console.warn('[LiveKitManager] Cannot share screen: not connected to LiveKit room.');
      return false;
    }

    try {
      useRoomStore.getState().setScreenShareState('Preparing');
      await this.room.localParticipant.setScreenShareEnabled(true, {
        audio: includeAudio,
        resolution: { width: 1920, height: 1080, frameRate: 30 },
      });

      const pub = this.room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
      if (pub && pub.track?.mediaStreamTrack) {
        const stream = new MediaStream([pub.track.mediaStreamTrack]);
        useRoomStore.getState().setLocalShareStream(stream);
      }

      useRoomStore.getState().setIsScreenSharing(true);
      useRoomStore.getState().setScreenShareState('Sharing');
      notificationService.showToast('🖥️ Screen broadcast started via LiveKit SFU', 'success');
      return true;
    } catch (err: any) {
      useRoomStore.getState().setScreenShareState('Idle');
      console.error('[LiveKitManager] Screen share error:', err);
      notificationService.showToast('Screen sharing cancelled or failed: ' + err.message, 'warning');
      return false;
    }
  }

  /**
   * Stop LiveKit screen sharing
   */
  public async stopScreenShare(): Promise<void> {
    if (!this.room) return;
    try {
      await this.room.localParticipant.setScreenShareEnabled(false);
      useRoomStore.getState().setIsScreenSharing(false);
      useRoomStore.getState().setScreenShareState('Idle');
      useRoomStore.getState().setLocalShareStream(null);
      notificationService.showToast('Screen broadcast stopped', 'info');
    } catch (err: any) {
      console.error('[LiveKitManager] Stop screen share error:', err);
    }
  }

  /**
   * Start high-fidelity audio-only broadcast (Microphone)
   */
  public async startAudioOnlyBroadcast(): Promise<boolean> {
    if (!this.room || this.room.state !== 'connected') {
      return false;
    }

    try {
      await this.room.localParticipant.setMicrophoneEnabled(true);
      useRoomStore.getState().setIsMicMuted(false);
      useRoomStore.getState().setScreenShareState('Sharing');

      // Create a dummy audio stream representation for stage visualization
      const pub = this.room.localParticipant.getTrackPublication(Track.Source.Microphone);
      if (pub && pub.track?.mediaStreamTrack) {
        const stream = new MediaStream([pub.track.mediaStreamTrack]);
        useRoomStore.getState().setLocalShareStream(stream);
      }

      notificationService.showToast('🎙️ Live Radio Audio broadcast started via LiveKit SFU', 'success');
      return true;
    } catch (err: any) {
      console.error('[LiveKitManager] startAudioOnlyBroadcast error:', err);
      notificationService.showToast('Audio broadcast failed: ' + err.message, 'error');
      return false;
    }
  }

  /**
   * Clean up all attached DOM audio elements
   */
  private cleanupAudioElements(): void {
    this.audioElements.forEach((el) => {
      try {
        el.pause();
        el.srcObject = null;
        el.remove();
      } catch (e) {
        // ignore cleanup error
      }
    });
    this.audioElements.clear();
  }

  /**
   * Disconnect cleanly from LiveKit room
   */
  public async disconnect(): Promise<void> {
    if (this.room) {
      try {
        console.log('[LiveKitManager] Disconnecting from LiveKit room...');
        this.cleanupAudioElements();
        await this.room.disconnect(true);
      } catch (err: any) {
        console.warn('[LiveKitManager] Disconnect warning:', err);
      } finally {
        this.room = null;
        useRoomStore.getState().setLiveKitConnected(false);
        useRoomStore.getState().setLiveKitToken(null);
        useRoomStore.getState().setIsMicMuted(true);
        useRoomStore.getState().setIsScreenSharing(false);
        useRoomStore.getState().setRemoteScreenTrack(null);
      }
    }
  }
}

export const liveKitManager = new LiveKitManager();
