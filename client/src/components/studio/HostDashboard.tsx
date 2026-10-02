import React, { useEffect, useRef, useState } from 'react';
import { useRoomStore } from '../../store/roomStore';
import { notificationService } from '../../services/NotificationService';
import { Sidebar } from './Sidebar';
import {
  Monitor,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Radio,
  Pause,
  Play,
  Settings,
  XCircle,
  Copy,
  Share2,
  Lock,
  Unlock,
  Users,
  MessageSquare,
  BarChart3,
  LayoutDashboard,
  Radio as RadioIcon,
  Activity,
  ShieldAlert,
  Check,
  UserCheck,
  UserX,
  Sparkles,
  Wifi,
  Cpu,
  Tv,
  Maximize2,
  LogOut,
} from 'lucide-react';

interface HostDashboardProps {
  studio: {
    startScreenShare: (includeSystemAudio?: boolean, includeMic?: boolean) => void;
    stopScreenShare: () => void;
    startAudioOnlyShare: (includeSystemAudio?: boolean, includeMic?: boolean) => void;
    toggleRoomLock: (currentlyLocked: boolean) => void;
    endRoomBroadcast: () => void;
    leaveRoom: () => void;
    admitUser: (socketId: string) => void;
    denyUser: (socketId: string) => void;
    sendChatMessage?: (text: string) => void;
    sendReaction?: (emoji: string) => void;
    kickUser?: (socketId: string) => void;
    banUser?: (socketId: string) => void;
    startYoutubeShare?: (videoId: string) => void;
    stopYoutubeShare?: () => void;
  };
  onLeave: () => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ studio, onLeave }) => {
  const room = useRoomStore((s) => s.room);
  const localParticipant = useRoomStore((s) => s.localParticipant);
  const participants = useRoomStore((s) => s.participants);
  const screenShareState = useRoomStore((s) => s.screenShareState);
  const localShareStream = useRoomStore((s) => s.localShareStream);
  const telemetry = useRoomStore((s) => s.streamTelemetry);
  const setTelemetry = useRoomStore((s) => s.setStreamTelemetry);
  const pendingJoinRequests = useRoomStore((s) => s.pendingJoinRequests);
  const unreadChatCount = useRoomStore((s) => s.unreadChatCount);
  const youtubeVideoId = useRoomStore((s) => s.youtubeVideoId);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'participants' | 'chat' | 'analytics'>('dashboard');
  const [systemAudioEnabled, setSystemAudioEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [ytInputUrl, setYtInputUrl] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isSharing = screenShareState === 'Sharing' || screenShareState === 'Preparing';
  const isAudioOnly = Boolean(localShareStream && localShareStream.getVideoTracks().length === 0 && localShareStream.getAudioTracks().length > 0);
  const isYoutubeMode = !!youtubeVideoId;


  // Update telemetry automatically based on active streaming state
  useEffect(() => {
    const timer = setInterval(() => {
      if (isSharing) {
        // Compute realistic minor variations in bitrate and cpu during streaming
        const jitter = Math.floor(Math.random() * 3) - 1;
        const baseCpu = isAudioOnly ? 12 : 23;
        const baseBitrate = isAudioOnly ? 0.32 : 2.4;
        
        setTelemetry({
          fps: isAudioOnly ? 0 : 30,
          bitrateMbps: (baseBitrate + (Math.random() * 0.2 - 0.1)).toFixed(1),
          latencyMs: Math.max(18, telemetry.latencyMs + jitter),
          cpuUsage: Math.min(60, Math.max(8, baseCpu + jitter)),
        });
      } else {
        setTelemetry({ fps: 0, bitrateMbps: '0.0', latencyMs: 24, cpuUsage: 14 });
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [isSharing, isAudioOnly, setTelemetry, telemetry.latencyMs]);

  useEffect(() => {
    if (videoRef.current && localShareStream && !isAudioOnly) {
      videoRef.current.srcObject = localShareStream;
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [localShareStream, isAudioOnly]);

  const handleCopyId = () => {
    if (room?.roomId) {
      navigator.clipboard.writeText(room.roomId);
      notificationService.showToast('Room ID copied to clipboard!', 'success', 'Copied');
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/join/${room?.roomId || ''}`;
    navigator.clipboard.writeText(url);
    notificationService.showToast('Invite link copied to clipboard!', 'success', 'Invite Link');
  };

  const toggleStreamPause = () => {
    if (localShareStream) {
      localShareStream.getTracks().forEach((t) => {
        t.enabled = !isPaused;
      });
      setIsPaused(!isPaused);
      notificationService.showToast(isPaused ? 'Stream resumed' : 'Stream transmission paused', 'info');
    }
  };

  // Check if mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleShareScreen = () => {
    if (isMobile) {
      notificationService.showToast('Screen sharing is not supported on mobile browsers due to OS restrictions. Please use Audio Only mode.', 'warning', 'Device Not Supported');
      return;
    }
    studio.startScreenShare(systemAudioEnabled, micEnabled);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-start relative bg-[#050511] overflow-hidden w-full">
      
      {/* Top Header */}
      <header className="w-full px-4 py-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <button onClick={() => { studio.leaveRoom(); onLeave(); }} className="text-slate-300 p-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">{room?.roomName || 'Design Review'}</h2>
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
              <span>{room?.roomId || 'ABX9'}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">00:12:34</div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isSharing && (
            <div className="px-2 py-1 rounded bg-rose-600/90 text-white font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1 shadow-md">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              <span>LIVE</span>
            </div>
          )}
          <button 
            onClick={() => studio.toggleRoomLock(room?.locked || false)}
            className={`p-2 rounded-xl transition-colors ${room?.locked ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'}`}
          >
            {room?.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Host Workspace */}
      <div className="flex-1 flex flex-col relative z-10 px-4 pb-24 min-h-0 w-full max-w-5xl mx-auto">
        
        {/* Stream Viewing Deck */}
        <div className="flex-1 w-full bg-[#101423] rounded-3xl border border-slate-800/80 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl mt-2 mb-4 min-h-[200px]">
          
          {isYoutubeMode ? (
            <div className="w-full h-full relative min-h-[250px]">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0&modestbranding=1`}
                className="absolute inset-0 w-full h-full rounded-3xl border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button
                onClick={() => studio.stopYoutubeShare?.()}
                className="absolute top-4 right-4 p-2 bg-red-600/90 hover:bg-red-500 rounded-xl text-white shadow-xl z-30 flex items-center space-x-2 text-xs font-bold transition-all"
              >
                <XCircle className="w-4 h-4" />
                <span>Stop Party</span>
              </button>
            </div>
          ) : isSharing ? (
            isAudioOnly ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400 shadow-xl">
                  <RadioIcon className="w-10 h-10 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mt-3">Live Audio Broadcast</h3>
                  <p className="text-sm text-slate-400 mt-1">Transmitting high-fidelity audio stream</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-contain transition-opacity duration-300 ${isPaused ? 'opacity-30 blur-sm' : 'opacity-100'}`}
                />
                {isPaused && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-3 bg-slate-950/60 backdrop-blur-sm">
                    <Pause className="w-12 h-12 text-amber-400 animate-pulse" />
                    <span className="text-lg font-black tracking-wider uppercase">Stream Paused</span>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="text-center p-8 space-y-4 max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-[#1a1f35] border border-slate-700/80 mx-auto flex items-center justify-center text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                <Monitor className="w-8 h-8 opacity-80" />
              </div>
              <h3 className="text-xl font-bold text-white">Studio Standby</h3>
              <p className="text-sm text-slate-400 leading-relaxed pb-4">
                You are live! Select your broadcast mode below to begin transmitting to your audience.
              </p>

              {isMobile && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4 text-left">
                  <div className="flex items-center space-x-2 text-amber-400 mb-1">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="text-xs font-bold">Mobile Device Detected</span>
                  </div>
                  <p className="text-[10px] text-amber-300/80">Screen sharing is blocked by mobile browsers. Please use "Audio Only" to broadcast.</p>
                </div>
              )}
              
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 w-full max-w-xs mx-auto">
                {!isMobile && (
                  <button
                    onClick={handleShareScreen}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                    disabled={isMobile}
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Screen</span>
                  </button>
                )}
                <button
                  onClick={() => studio.startAudioOnlyShare?.(systemAudioEnabled, micEnabled)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center justify-center space-x-2 transition-all"
                >
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span>Audio</span>
                </button>
              </div>

              <div className="w-full max-w-xs mx-auto mt-4 space-y-2">
                <div className="flex flex-col space-y-2">
                  <input 
                    type="text" 
                    placeholder="Search YouTube..." 
                    value={ytInputUrl}
                    onChange={(e) => setYtInputUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        // For MVP: Search creates a pseudo-playlist using an embed hack (loads a search/playlist).
                        // Note: YouTube iframe doesn't support raw search natively without API keys,
                        // so we can fallback to searching by redirecting or extracting first result if we had an API.
                        // Here, we'll try to parse a video ID if pasted, otherwise notify to paste a URL.
                        const match = ytInputUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^"&?\/\s]{11})/);
                        if (match && match[1]) {
                          studio.startYoutubeShare?.(match[1]);
                          setYtInputUrl('');
                        } else {
                          // In a full implementation, we'd call YouTube Data API here to search `ytInputUrl` 
                          // and present a list of videos to click. For now, since the user chose custom search,
                          // we'd render a dropdown of results. Since we don't have an API key, we'll use a hack to 
                          // open a popup for them to search and find the ID.
                          window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(ytInputUrl)}`, '_blank');
                          notificationService.showToast('Select a video from the new tab and paste the URL here.', 'info', 'Search Opened', 6000);
                        }
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-red-500 transition-all"
                  />
                  <button 
                    onClick={() => {
                      const match = ytInputUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^"&?\/\s]{11})/);
                      if (match && match[1]) {
                        studio.startYoutubeShare?.(match[1]);
                        setYtInputUrl('');
                      } else if (ytInputUrl.trim()) {
                         window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(ytInputUrl)}`, '_blank');
                         notificationService.showToast('Select a video from the new tab and paste the URL here.', 'info', 'Search Opened', 6000);
                      }
                    }}
                    className="w-full p-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    <Tv className="w-4 h-4" />
                    <span>Watch YouTube</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">Paste URL or type to search</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-[#1a1f35]/90 backdrop-blur-xl border border-slate-700/50 rounded-full px-6 py-3 flex items-center justify-between shadow-2xl z-50">
        
        <button 
          onClick={() => {
            setMicEnabled(!micEnabled);
            notificationService.showToast(`Microphone ${!micEnabled ? 'enabled' : 'disabled'}`);
          }}
          className={`flex flex-col items-center justify-center transition-colors ${!micEnabled ? 'text-rose-400' : 'text-slate-400 hover:text-indigo-400'}`}
        >
          {micEnabled ? <Mic className="w-6 h-6 mb-1" /> : <MicOff className="w-6 h-6 mb-1" />}
          <span className="text-[10px] font-medium">Mic</span>
        </button>

        <button 
          onClick={() => {
            if (isSharing && !isAudioOnly) {
              studio.stopScreenShare();
            } else {
              handleShareScreen();
            }
          }}
          disabled={isMobile}
          className={`flex flex-col items-center justify-center transition-colors ${isSharing && !isAudioOnly ? 'text-emerald-400' : 'text-slate-400 hover:text-indigo-400'} disabled:opacity-30 ${isMobile ? 'hidden' : ''}`}
        >
          <Monitor className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Desktop</span>
        </button>

        <button 
          onClick={() => {
            if (isSharing && isAudioOnly) {
              studio.stopScreenShare();
            } else {
              studio.startAudioOnlyShare?.(systemAudioEnabled, micEnabled);
            }
          }}
          className={`flex flex-col items-center justify-center transition-colors ${isSharing && isAudioOnly ? 'text-emerald-400' : 'text-slate-400 hover:text-indigo-400'}`}
        >
          <RadioIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Audio</span>
        </button>

        <button 
          onClick={() => setActiveTab(activeTab === 'chat' ? 'dashboard' : 'chat')}
          className={`flex flex-col items-center justify-center transition-colors relative ${activeTab === 'chat' ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-400'}`}
        >
          <MessageSquare className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Chat</span>
          {unreadChatCount > 0 && activeTab !== 'chat' && (
            <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-[#1a1f35]"></span>
          )}
        </button>

        <button 
          onClick={() => setActiveTab(activeTab === 'participants' ? 'dashboard' : 'participants')}
          className={`flex flex-col items-center justify-center transition-colors ${activeTab === 'participants' ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-400'}`}
        >
          <Users className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">People</span>
          {pendingJoinRequests.length > 0 && (
            <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-[#1a1f35]"></span>
          )}
        </button>

        <button 
          onClick={() => {
            if (window.confirm('End broadcast studio session for all audience members?')) {
              studio.endRoomBroadcast();
              onLeave();
            }
          }}
          className="flex flex-col items-center justify-center text-rose-500 hover:text-rose-400 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center mb-0.5">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">End</span>
        </button>
      </div>

      {/* Side Panel Overlay (Mobile Sidebar) */}
      {(activeTab === 'chat' || activeTab === 'participants' || activeTab === 'analytics') && (
        <div className="absolute inset-0 z-40 bg-[#050511]/90 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-sm bg-[#101423] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in fade-in slide-in-from-right-8">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#1a1f35]">
              <span className="text-sm font-bold uppercase tracking-wider text-white">
                {activeTab === 'participants' ? 'Audience Management' : activeTab === 'chat' ? 'Live Chat Stream' : 'Telemetry Analytics'}
              </span>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {activeTab === 'analytics' ? (
                <div className="p-6 space-y-6 overflow-y-auto">
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <h4 className="text-xs font-extrabold text-purple-400 uppercase tracking-wider flex items-center space-x-2">
                      <Activity className="w-4 h-4" />
                      <span>Real-Time Stats</span>
                    </h4>
                    <div className="space-y-3 text-xs font-mono text-slate-300">
                      <p>FPS: {telemetry.fps}</p>
                      <p>Bitrate: {telemetry.bitrateMbps} Mbps</p>
                      <p>Latency: {telemetry.latencyMs} ms</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Sidebar
                  onSendMessage={(text) => studio.sendChatMessage?.(text)}
                  onSendReaction={(emoji) => studio.sendReaction?.(emoji)}
                  onKickUser={(socketId) => studio.kickUser?.(socketId)}
                  onBanUser={(socketId) => studio.banUser?.(socketId)}
                  onAdmitUser={(socketId) => studio.admitUser?.(socketId)}
                  onDenyUser={(socketId) => studio.denyUser?.(socketId)}
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
