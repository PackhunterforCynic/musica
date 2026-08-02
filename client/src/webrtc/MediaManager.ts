import { MediaError } from '@musica/shared';

export interface ShareStreamOptions {
  audio: boolean;
  video: boolean;
  systemAudio: boolean;
  micAudio: boolean;
}

export class MediaManager {
  private currentStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;

  /**
   * Captures screen display media and optionally mixes with microphone input.
   */
  public async startScreenShare(opts: { includeSystemAudio?: boolean; includeMic?: boolean }): Promise<MediaStream> {
    this.stopStream();

    try {
      // 1. Capture screen display with optional system audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { max: 30 },
          width: { max: 1920 },
          height: { max: 1080 },
        },
        audio: opts.includeSystemAudio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
            }
          : false,
      });

      this.currentStream = new MediaStream(displayStream.getVideoTracks());

      // 2. Combine Audio tracks if mic or system audio is requested
      const audioTracks: MediaStreamTrack[] = [];

      if (displayStream.getAudioTracks().length > 0) {
        audioTracks.push(displayStream.getAudioTracks()[0]);
      }

      if (opts.includeMic) {
        try {
          this.micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          });
          if (this.micStream.getAudioTracks().length > 0) {
            audioTracks.push(this.micStream.getAudioTracks()[0]);
          }
        } catch (micErr) {
          console.warn('[MediaManager] Could not access microphone during screen share:', micErr);
        }
      }

      // If we have multiple audio sources (System audio + Microphone), mix them via Web Audio API!
      if (audioTracks.length > 1) {
        const mixedAudioTrack = this.mixAudioTracks(audioTracks);
        this.currentStream.addTrack(mixedAudioTrack);
      } else if (audioTracks.length === 1) {
        this.currentStream.addTrack(audioTracks[0]);
      }

      return this.currentStream;
    } catch (error: any) {
      console.error('[MediaManager] Error capturing display media:', error);
      throw new MediaError(error.message || 'Permission denied or screen capture failed.', error);
    }
  }

  /**
   * Mixes multiple audio tracks (system sound + microphone) into a single master output MediaStreamTrack.
   */
  private mixAudioTracks(tracks: MediaStreamTrack[]): MediaStreamTrack {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioCtx();
    const destination = this.audioContext.createMediaStreamDestination();

    tracks.forEach((track) => {
      const tempStream = new MediaStream([track]);
      const source = this.audioContext!.createMediaStreamSource(tempStream);
      source.connect(destination);
    });

    return destination.stream.getAudioTracks()[0];
  }

  public async toggleMicOnly(enabled: boolean): Promise<MediaStream | null> {
    if (!enabled) {
      if (this.micStream) {
        this.micStream.getTracks().forEach((t) => t.stop());
        this.micStream = null;
      }
      return null;
    }
    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return this.micStream;
  }

  public getStream(): MediaStream | null {
    return this.currentStream;
  }

  public stopStream(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
      this.currentStream = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}

export const mediaManager = new MediaManager();
