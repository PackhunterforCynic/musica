import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, RotateCw, XCircle, RefreshCw, Radio } from 'lucide-react';
import { useRoomStore } from '../../store/roomStore';
import { formatDuration } from '../../utils/formatters';

interface SyncedYouTubePlayerProps {
  videoId: string;
  isHost: boolean;
  onSyncState?: (videoId: string, currentTime: number, isPlaying: boolean) => void;
  onStop?: () => void;
}

export const SyncedYouTubePlayer: React.FC<SyncedYouTubePlayerProps> = ({
  videoId,
  isHost,
  onSyncState,
  onStop,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [localPlaying, setLocalPlaying] = useState<boolean>(true);
  const [localTime, setLocalTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [iframeReady, setIframeReady] = useState<boolean>(false);

  // Audience reads sync state from Zustand
  const remoteTime = useRoomStore((s) => s.youtubeCurrentTime);
  const remotePlaying = useRoomStore((s) => s.youtubeIsPlaying);
  const remoteUpdatedAt = useRoomStore((s) => s.youtubeUpdatedAt);

  // Helper to post command to YouTube iframe
  const sendCommand = useCallback((func: string, args: any = '') => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  }, []);

  // Listen to postMessage from YouTube IFrame
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!data) return;

        // IFrame is ready
        if (data.event === 'onReady' || data.event === 'initialDelivery') {
          setIframeReady(true);
          // Ask iframe to send periodic time info
          sendCommand('addEventListener', 'onStateChange');
        }

        // State changes: 1 = Playing, 2 = Paused, 0 = Ended
        if (data.event === 'onStateChange') {
          const stateCode = data.info;
          if (stateCode === 1) {
            setLocalPlaying(true);
            if (isHost && onSyncState) {
              onSyncState(videoId, localTime, true);
            }
          } else if (stateCode === 2 || stateCode === 0) {
            setLocalPlaying(false);
            if (isHost && onSyncState) {
              onSyncState(videoId, localTime, false);
            }
          }
        }

        // Time updates from player
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            setLocalTime(data.info.currentTime);
          }
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            setDuration(data.info.duration);
          }
        }
      } catch (err) {
        // Not a JSON message or unrelated origin
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isHost, onSyncState, videoId, localTime, sendCommand]);

  // Host: Heartbeat sync every 3 seconds to keep audience tightly aligned
  useEffect(() => {
    if (!isHost || !onSyncState || !videoId) return;

    const timer = setInterval(() => {
      if (localPlaying) {
        onSyncState(videoId, localTime, true);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [isHost, onSyncState, videoId, localTime, localPlaying]);

  // Audience: React to host's sync state updates
  useEffect(() => {
    if (isHost || !iframeReady) return;

    // Calculate adjusted target time based on elapsed network latency
    const elapsedSec = remotePlaying && remoteUpdatedAt ? Math.max(0, (Date.now() - remoteUpdatedAt) / 1000) : 0;
    const targetTime = remoteTime + elapsedSec;

    // Check drift: if audience is off by > 2.5 seconds, resync
    if (Math.abs(localTime - targetTime) > 2.5) {
      sendCommand('seekTo', [targetTime, true]);
    }

    // Check play/pause state
    if (remotePlaying) {
      sendCommand('playVideo');
      setLocalPlaying(true);
    } else {
      sendCommand('pauseVideo');
      setLocalPlaying(false);
    }
  }, [isHost, iframeReady, remoteTime, remotePlaying, remoteUpdatedAt, localTime, sendCommand]);

  // Host Actions
  const handleTogglePlayPause = () => {
    const nextState = !localPlaying;
    setLocalPlaying(nextState);
    if (nextState) {
      sendCommand('playVideo');
    } else {
      sendCommand('pauseVideo');
    }
    if (isHost && onSyncState) {
      onSyncState(videoId, localTime, nextState);
    }
  };

  const handleSeekRelative = (secondsDelta: number) => {
    const newTime = Math.max(0, localTime + secondsDelta);
    setLocalTime(newTime);
    sendCommand('seekTo', [newTime, true]);
    if (isHost && onSyncState) {
      onSyncState(videoId, newTime, localPlaying);
    }
  };

  const handleForceSyncAudience = () => {
    if (isHost && onSyncState) {
      onSyncState(videoId, localTime, localPlaying);
    }
  };

  const handleAudienceResync = () => {
    const elapsedSec = remotePlaying && remoteUpdatedAt ? Math.max(0, (Date.now() - remoteUpdatedAt) / 1000) : 0;
    const targetTime = remoteTime + elapsedSec;
    sendCommand('seekTo', [targetTime, true]);
    if (remotePlaying) {
      sendCommand('playVideo');
    } else {
      sendCommand('pauseVideo');
    }
  };

  // Embed URL with JS API enabled and autoplay
  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&playsinline=1&rel=0&modestbranding=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`;

  return (
    <div className="w-full h-full flex flex-col relative select-none">
      {/* Video IFrame Deck */}
      <div className="relative flex-1 w-full min-h-[220px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title="YouTube Watch Party"
          className="absolute inset-0 w-full h-full border-0 rounded-3xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

        {/* Top-Right: Stop Party (Host) or Sync Status (Audience) */}
        {isHost && onStop && (
          <button
            onClick={onStop}
            className="absolute top-3 right-3 px-3 py-1.5 bg-red-600/90 hover:bg-red-500 rounded-xl text-white shadow-xl z-20 flex items-center space-x-1.5 text-xs font-bold transition-all backdrop-blur-sm"
          >
            <XCircle className="w-4 h-4" />
            <span>Stop Party</span>
          </button>
        )}

        {!isHost && (
          <div className="absolute top-3 right-3 z-20 flex items-center space-x-2">
            <button
              onClick={handleAudienceResync}
              title="Click to re-align with host"
              className="px-2.5 py-1 bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-xl text-slate-300 border border-slate-700/60 text-[11px] font-semibold flex items-center space-x-1 transition-all"
            >
              <RefreshCw className="w-3 h-3 text-indigo-400" />
              <span>Resync</span>
            </button>
            <div className="px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-xl text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Synced</span>
            </div>
          </div>
        )}
      </div>

      {/* Synchronized Host Control Deck */}
      {isHost && (
        <div className="mt-3 px-4 py-3 bg-[#101423]/95 backdrop-blur-xl border border-slate-800 rounded-2xl flex items-center justify-between shadow-lg">
          {/* Play / Pause & Seek Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTogglePlayPause}
              className={`p-2.5 rounded-xl font-bold text-white transition-all ${localPlaying ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
              title={localPlaying ? 'Pause for everyone' : 'Play for everyone'}
            >
              {localPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => handleSeekRelative(-10)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all text-xs flex items-center space-x-1"
              title="Seek back 10 seconds"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px]">10s</span>
            </button>

            <button
              onClick={() => handleSeekRelative(10)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all text-xs flex items-center space-x-1"
              title="Seek forward 10 seconds"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="text-[10px]">10s</span>
            </button>

            <span className="text-xs text-slate-400 font-mono ml-1">
              {formatDuration(Math.floor(localTime))} {duration > 0 ? `/ ${formatDuration(Math.floor(duration))}` : ''}
            </span>
          </div>

          {/* Sync Status Badge & Force Sync Button */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleForceSyncAudience}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-indigo-300 flex items-center space-x-1 transition-all"
              title="Force resync all viewers to your current time"
            >
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sync All</span>
            </button>
            <div className="hidden sm:flex items-center space-x-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Syncing</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
