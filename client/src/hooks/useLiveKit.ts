import { useCallback } from 'react';
import { useRoomStore } from '../store/roomStore';
import { liveKitManager } from '../livekit/LiveKitManager';

export function useLiveKit() {
  const room = liveKitManager.getRoom();
  const liveKitConnected = useRoomStore((s) => s.liveKitConnected);
  const liveKitToken = useRoomStore((s) => s.liveKitToken);
  const isMicMuted = useRoomStore((s) => s.isMicMuted);
  const isScreenSharing = useRoomStore((s) => s.isScreenSharing);
  const activeSpeakerIds = useRoomStore((s) => s.activeSpeakerIds);
  const remoteMediaStream = useRoomStore((s) => s.remoteMediaStream);
  const remoteScreenTrack = useRoomStore((s) => s.remoteScreenTrack);

  const toggleMicrophone = useCallback(async () => {
    return await liveKitManager.toggleMicrophone();
  }, []);

  const setMicrophoneEnabled = useCallback(async (enabled: boolean) => {
    return await liveKitManager.setMicrophoneEnabled(enabled);
  }, []);

  const startScreenShare = useCallback(async (includeAudio = true) => {
    return await liveKitManager.startScreenShare(includeAudio);
  }, []);

  const stopScreenShare = useCallback(async () => {
    await liveKitManager.stopScreenShare();
  }, []);

  const startAudioOnlyBroadcast = useCallback(async () => {
    return await liveKitManager.startAudioOnlyBroadcast();
  }, []);

  const connect = useCallback(async (serverUrl: string, token: string) => {
    return await liveKitManager.connect(serverUrl, token);
  }, []);

  const disconnect = useCallback(async () => {
    await liveKitManager.disconnect();
  }, []);

  return {
    room,
    isConnected: liveKitConnected,
    token: liveKitToken,
    isMicMuted,
    isScreenSharing,
    activeSpeakerIds,
    remoteMediaStream,
    remoteScreenTrack,
    toggleMicrophone,
    setMicrophoneEnabled,
    startScreenShare,
    stopScreenShare,
    startAudioOnlyBroadcast,
    connect,
    disconnect,
  };
}
