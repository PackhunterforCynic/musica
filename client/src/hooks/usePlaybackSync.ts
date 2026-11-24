import { useEffect, useRef, useState, useCallback } from 'react';
import { useRoomStore } from '../store/roomStore';

export interface PlaybackSyncOptions {
  driftToleranceSeconds?: number;
  syncIntervalMs?: number;
  playbackRate?: number;
}

/**
 * Watch Party 2.0 Authoritative Playback Synchronization Hook
 *
 * Implements mathematical drift estimation:
 *   P(t) = P_0 + (t - T_0) * r
 * Where:
 *   P_0 = position at last synchronization
 *   T_0 = server timestamp of last update
 *   r   = playback rate
 *
 * Automatically performs drift compensation when divergence exceeds driftToleranceSeconds.
 */
export function usePlaybackSync(
  localCurrentTime: number,
  isHost: boolean,
  onSeekRequest: (targetSeconds: number) => void,
  onStateChangeRequest: (isPlaying: boolean) => void,
  options: PlaybackSyncOptions = {}
) {
  const {
    driftToleranceSeconds = 1.8,
    syncIntervalMs = 2500,
    playbackRate = 1.0,
  } = options;

  const remoteVideoId = useRoomStore((s) => s.youtubeVideoId);
  const remoteTime = useRoomStore((s) => s.youtubeCurrentTime);
  const remotePlaying = useRoomStore((s) => s.youtubeIsPlaying);
  const remoteUpdatedAt = useRoomStore((s) => s.youtubeUpdatedAt);

  const [isDrifting, setIsDrifting] = useState(false);
  const [estimatedPosition, setEstimatedPosition] = useState(0);
  const lastSyncTimeRef = useRef(0);

  // Computes expected position P(t) = P_0 + (t - T_0) * r
  const computeTargetPosition = useCallback((): number => {
    if (!remotePlaying || !remoteUpdatedAt) {
      return remoteTime;
    }
    const elapsedSeconds = Math.max(0, (Date.now() - remoteUpdatedAt) / 1000);
    return remoteTime + elapsedSeconds * playbackRate;
  }, [remoteTime, remotePlaying, remoteUpdatedAt, playbackRate]);

  // Audience drift evaluation loop
  useEffect(() => {
    if (isHost || !remoteVideoId) return;

    const interval = setInterval(() => {
      const targetTime = computeTargetPosition();
      setEstimatedPosition(targetTime);

      const drift = Math.abs(localCurrentTime - targetTime);

      if (drift > driftToleranceSeconds) {
        // Prevent rapid repeated seeks
        if (Date.now() - lastSyncTimeRef.current > syncIntervalMs) {
          setIsDrifting(true);
          onSeekRequest(targetTime);
          lastSyncTimeRef.current = Date.now();
          setTimeout(() => setIsDrifting(false), 500);
        }
      } else {
        setIsDrifting(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isHost, remoteVideoId, localCurrentTime, computeTargetPosition, driftToleranceSeconds, syncIntervalMs, onSeekRequest]);

  // Synchronize play/pause state changes from host
  useEffect(() => {
    if (isHost || !remoteVideoId) return;
    onStateChangeRequest(remotePlaying);
  }, [isHost, remoteVideoId, remotePlaying, onStateChangeRequest]);

  // Manual Force Resync function for listeners
  const forceResync = useCallback(() => {
    const target = computeTargetPosition();
    onSeekRequest(target);
    onStateChangeRequest(remotePlaying);
  }, [computeTargetPosition, onSeekRequest, onStateChangeRequest, remotePlaying]);

  return {
    remoteVideoId,
    remotePlaying,
    estimatedPosition,
    isDrifting,
    forceResync,
    computeTargetPosition,
  };
}
