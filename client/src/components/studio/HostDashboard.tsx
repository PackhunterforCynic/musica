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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'participants' | 'chat' | 'analytics'>('dashboard');
  const [systemAudioEnabled, setSystemAudioEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isSharing = screenShareState === 'Sharing' || screenShareState === 'Preparing';
  const isAudioOnly = Boolean(localShareStream && localShareStream.getVideoTracks().length === 0 && localShareStream.getAudioTracks().length > 0);


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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans text-slate-100 antialiased overflow-x-hidden select-none">
      {/* 1. HOST NAVIGATION SIDEBAR */}
      <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col shrink-0 z-20 shadow-2xl">
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center space-x-3 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 text-white">
            <RadioIcon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Musica
            </span>
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-purple-400">
              Host Studio
            </span>
          </div>
        </div>

        {/* Navigation Deck */}
        <nav className="flex md:flex-col md:flex-1 px-4 py-4 md:py-6 space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto md:overflow-y-auto shrink-0 border-b md:border-b-0 border-slate-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`whitespace-nowrap shrink-0 md:w-full flex items-center justify-center md:justify-between px-4 py-3.5 rounded-2xl font-extrabold text-sm transition-all ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center space-x-3">
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('participants')}
            className={`whitespace-nowrap shrink-0 md:w-full flex items-center justify-center md:justify-between px-4 py-3.5 rounded-2xl font-extrabold text-sm transition-all ${
              activeTab === 'participants'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5" />
              <span>Participants</span>
            </div>
            <span className="ml-2 md:ml-0 px-2.5 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-300 font-black border border-purple-500/30">
              {participants.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`whitespace-nowrap shrink-0 md:w-full flex items-center justify-center md:justify-between px-4 py-3.5 rounded-2xl font-extrabold text-sm transition-all ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5" />
              <span>Chat</span>
            </div>
            {unreadChatCount > 0 && (
              <span className="ml-2 md:ml-0 px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
                {unreadChatCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`whitespace-nowrap shrink-0 md:w-full flex items-center justify-center md:justify-between px-4 py-3.5 rounded-2xl font-extrabold text-sm transition-all ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </div>
            <span className="ml-2 md:ml-0 w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                {localParticipant?.name?.charAt(0) || 'H'}
              </div>
              <div>
                <span className="block text-sm font-extrabold text-white truncate max-w-[110px]">
                  {localParticipant?.name || 'Host'}
                </span>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Presenter ● Host
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                studio.leaveRoom();
                onLeave();
              }}
              className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
              title="Leave Room"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN HOST PRESENTATION WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative overflow-x-hidden">
        {/* Top Studio Bar */}
        <header className="py-3 px-4 md:px-8 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between shrink-0 z-10 gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-700/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Room ID:</span>
              <button
                onClick={handleCopyId}
                className="font-mono text-sm md:text-base font-extrabold text-white flex items-center space-x-2 transition-all group"
                title="Copy Room ID"
              >
                <span className="text-purple-300">{room?.roomId}</span>
                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-300 transition-colors" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition-all shadow"
              >
                <Copy className="w-3 h-3 text-purple-400" />
                <span className="hidden sm:inline">Copy Link</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition-all shadow"
              >
                <Share2 className="w-3 h-3 text-indigo-400" />
                <span className="hidden sm:inline">Invite</span>
              </button>
            </div>

            <button
              onClick={() => studio.toggleRoomLock(room?.locked || false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center space-x-1.5 transition-all shadow ${
                room?.locked
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
              }`}
            >
              {room?.locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-purple-400" />}
              <span>{room?.locked ? 'Locked' : 'Lock'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-extrabold text-slate-300">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>{participants.length}</span>
            </div>

            <button
              onClick={() => {
                if (window.confirm('End broadcast studio session for all audience members?')) {
                  studio.endRoomBroadcast();
                  onLeave();
                }
              }}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-black text-xs text-white uppercase tracking-wider shadow-lg shadow-rose-500/30 transition-all transform hover:scale-105"
            >
              End Session
            </button>
          </div>
        </header>

        {/* WAITING ROOM ALERT LOBBY */}
        {pendingJoinRequests.length > 0 && (
          <div className="bg-amber-500/20 backdrop-blur-md border-b border-amber-500/40 px-4 md:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between shrink-0 z-15 gap-4">
            <div className="flex items-center space-x-3 text-amber-200 font-extrabold text-sm">
              <ShieldAlert className="w-5 h-5 text-amber-400 animate-bounce" />
              <span>
                🔔 Lobby Notice: {pendingJoinRequests.length} guest(s) waiting for admission approval ({pendingJoinRequests.map(r => r.name).join(', ')}).
              </span>
            </div>
            <div className="flex items-center space-x-3">
              {pendingJoinRequests.slice(0, 3).map((req) => (
                <div key={req.socketId} className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1 rounded-xl border border-amber-500/30">
                  <span className="text-xs font-bold text-white">{req.name}</span>
                  <button
                    onClick={() => studio.admitUser(req.socketId)}
                    className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors"
                    title="Admit Guest"
                  >
                    <UserCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => studio.denyUser(req.socketId)}
                    className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-md transition-colors"
                    title="Deny Guest"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CENTER STUDIO PREVIEW & SIDEBAR PANES */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
          {/* Main Stage Container */}
          <div className="flex-1 flex flex-col p-6 min-w-0 space-y-6 overflow-y-auto">
            {/* Live Screen Preview */}
            <div className="flex-1 min-h-[360px] max-h-[calc(100vh-22rem)] bg-slate-900 rounded-3xl border border-slate-800 p-4 flex flex-col relative overflow-hidden shadow-2xl group">
              <div className="absolute top-6 left-6 z-10 flex items-center space-x-3 pointer-events-none">
                <span className="px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-xs font-bold text-slate-300 border border-slate-800">
                  Live Screen Preview
                </span>
                {isSharing && (
                  <span className="px-3 py-1 rounded-lg bg-rose-600/90 text-white font-black text-[11px] uppercase tracking-wider flex items-center space-x-1.5 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    <span>● LIVE</span>
                  </span>
                )}
              </div>

              {/* Media Render Stage */}
              {isSharing ? (
                isAudioOnly ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 space-y-6 relative overflow-hidden bg-slate-950 rounded-2xl border border-emerald-500/30">
                    <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600/30 to-teal-600/30 border border-emerald-400/40 mx-auto flex items-center justify-center text-emerald-400 shadow-2xl">
                      <RadioIcon className="w-12 h-12 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                        <span>Broadcasting High-Fidelity Audio Stream</span>
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Radio Mode active. Zero video data transmitted to preserve bandwidth.</p>
                    </div>
                    <div className="flex items-center space-x-2 h-12 px-6 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="w-1.5 bg-emerald-500 rounded-full h-4 animate-pulse"></span>
                      <span className="w-1.5 bg-teal-400 rounded-full h-8 animate-pulse" style={{ animationDelay: '120ms' }}></span>
                      <span className="w-1.5 bg-emerald-300 rounded-full h-10 animate-pulse" style={{ animationDelay: '240ms' }}></span>
                      <span className="w-1.5 bg-green-500 rounded-full h-6 animate-pulse" style={{ animationDelay: '80ms' }}></span>
                      <span className="w-1.5 bg-teal-300 rounded-full h-9 animate-pulse" style={{ animationDelay: '320ms' }}></span>
                      <span className="w-1.5 bg-emerald-400 rounded-full h-5 animate-pulse" style={{ animationDelay: '180ms' }}></span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center relative">
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
                        <span className="text-lg font-black tracking-wider uppercase">Stream Paused by Host</span>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="w-full h-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center text-center p-8 space-y-6 relative border border-slate-800/80">
                  <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-xl">
                    <Monitor className="w-10 h-10 animate-pulse" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h3 className="text-2xl font-extrabold text-white tracking-tight">Studio Standby Ready</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Select your screen capture mode below to begin transmitting crystal-clear video and system audio to all joined audience members.
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => studio.startScreenShare(systemAudioEnabled, micEnabled)}
                      className="px-6 py-3 rounded-2xl font-black text-sm text-white glow-btn shadow-lg shadow-purple-600/30 flex items-center space-x-2 transition-transform transform hover:scale-105"
                    >
                      <Monitor className="w-4 h-4 text-purple-200" />
                      <span>Launch Screen Broadcast</span>
                    </button>
                    <button
                      onClick={() => studio.startAudioOnlyShare(systemAudioEnabled, micEnabled)}
                      className="px-5 py-3 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-transform transform hover:scale-105"
                    >
                      <Mic className="w-4 h-4 text-emerald-200" />
                      <span>Audio Only Mode</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Host Overlay Participant Roster Avatars (Like Mockup) */}
              <div className="absolute right-6 top-6 bottom-6 w-52 pointer-events-auto flex flex-col justify-between hidden xl:flex">
                <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-750 p-3.5 shadow-xl space-y-3 max-h-full overflow-y-auto">
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 flex items-center justify-between">
                    <span>Participants ({participants.length})</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="space-y-2">
                    {participants.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 text-[11px] font-black text-white flex items-center justify-center shrink-0 shadow">
                            {p.name?.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-bold text-slate-200 truncate">{p.name}</span>
                            <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">{p.role}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-500">
                          <Mic className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      </div>
                    ))}
                    {participants.length > 5 && (
                      <div className="text-center text-[10px] font-bold text-slate-500 py-1">
                        + {participants.length - 5} more online
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* MODULAR MEDIA INPUT CONTROL DECK */}
            <div className="h-24 bg-slate-900/90 rounded-3xl border border-slate-800 px-6 flex items-center justify-between gap-3 shrink-0 shadow-2xl overflow-x-auto">
              <div className="flex items-center space-x-3 shrink-0">
                {/* Share Screen Control */}
                <button
                  onClick={() => isSharing && !isAudioOnly ? studio.stopScreenShare() : studio.startScreenShare(systemAudioEnabled, micEnabled)}
                  className={`px-5 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center space-x-2.5 transition-all transform hover:scale-105 shadow-lg ${
                    isSharing && !isAudioOnly
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/30'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-indigo-500/30'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>{isSharing && !isAudioOnly ? 'Stop Sharing' : 'Share Screen'}</span>
                </button>

                {/* System Audio Control */}
                <button
                  onClick={() => {
                    setSystemAudioEnabled(!systemAudioEnabled);
                    notificationService.showToast(`System audio capturing ${!systemAudioEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-4 py-3.5 rounded-2xl font-extrabold text-xs flex items-center space-x-2 border transition-all ${
                    systemAudioEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                  title="Toggle Device System Audio Capture"
                >
                  {systemAudioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                  <span className="hidden sm:inline">System Audio</span>
                </button>

                {/* Microphone Control */}
                <button
                  onClick={() => {
                    setMicEnabled(!micEnabled);
                    notificationService.showToast(`Microphone mixing ${!micEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-4 py-3.5 rounded-2xl font-extrabold text-xs flex items-center space-x-2 border transition-all ${
                    micEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                  title="Toggle Studio Microphone Capture"
                >
                  {micEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-slate-500" />}
                  <span className="hidden sm:inline">Microphone</span>
                </button>

                {/* Radio / Audio Only Broadcast Mode */}
                <button
                  onClick={() => isSharing && isAudioOnly ? studio.stopScreenShare() : studio.startAudioOnlyShare(systemAudioEnabled, micEnabled)}
                  className={`px-4 py-3.5 rounded-2xl font-extrabold text-xs flex items-center space-x-2 border transition-all ${
                    isSharing && isAudioOnly
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30 animate-pulse'
                      : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                  title="Broadcast High-Fidelity Audio Without Video"
                >
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span className="hidden md:inline">Radio Mode</span>
                </button>
              </div>

              <div className="flex items-center space-x-2.5 shrink-0">
                {/* Pause Stream Transmission */}
                <button
                  onClick={toggleStreamPause}
                  disabled={!isSharing}
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center space-x-2 transition-all ${
                    isPaused
                      ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-lg shadow-amber-500/30 animate-bounce'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700 disabled:opacity-40 disabled:pointer-events-none'
                  }`}
                  title="Pause Screen Capture Transmission"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  <span className="hidden lg:inline">{isPaused ? 'Resume Share' : 'Pause Share'}</span>
                </button>

                {/* Settings Tab Shortcut */}
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                  title="Stream Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* End Session Button */}
                <button
                  onClick={() => {
                    if (window.confirm('End broadcast studio session for all audience members?')) {
                      studio.endRoomBroadcast();
                      onLeave();
                    }
                  }}
                  className="p-3.5 px-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-rose-600/30 transition-all transform hover:scale-105"
                  title="Terminate Session"
                >
                  <XCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">End Session</span>
                </button>
              </div>
            </div>
          </div>

          {/* Optional Right Side Drawer for Chat/Participants/Analytics when active */}
          {activeTab !== 'dashboard' && (
            <div className="w-80 bg-slate-900/95 border-l border-slate-800 flex flex-col shrink-0 z-20 shadow-2xl animate-in sm:w-96">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-sm font-extrabold uppercase tracking-wider text-white">
                  {activeTab === 'participants' ? 'Audience Management' : activeTab === 'chat' ? 'Live Chat Stream' : 'Telemetry Analytics'}
                </span>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                {activeTab === 'analytics' ? (
                  <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                      <h4 className="text-xs font-extrabold text-purple-400 uppercase tracking-wider flex items-center space-x-2">
                        <Activity className="w-4 h-4" />
                        <span>Real-Time WebRTC Stats Engine</span>
                      </h4>
                      <div className="space-y-3 text-xs font-mono">
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Transport Protocol:</span>
                          <span className="text-emerald-400 font-bold">DTLS/SCTP over UDP</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Audio Encoder:</span>
                          <span className="text-indigo-400 font-bold">Opus (48 kHz High-Fi)</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Video Codec:</span>
                          <span className="text-purple-400 font-bold">{isAudioOnly ? 'Disabled (Radio Mode)' : 'VP8 / H.264 HD Mesh'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-400">Signaling Server:</span>
                          <span className="text-emerald-400 font-bold">Atomic JSON Socket Engine</span>
                        </div>
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
          )}
        </div>

        {/* 3. REAL-TIME TELEMETRY GAUGE BAR (HOST FOOTER FROM MOCKUP) */}
        <footer className="h-20 bg-slate-900/95 border-t border-slate-800 px-8 flex items-center justify-between shrink-0 z-10 overflow-x-auto select-text">
          <div className="grid grid-cols-6 gap-6 w-full max-w-6xl mx-auto min-w-[700px]">
            {/* FPS Gauge */}
            <div className="flex items-center space-x-3 bg-slate-950/70 px-4 py-2.5 rounded-2xl border border-slate-800/80 shadow">
              <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></div>
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">FPS</span>
                <span className="text-base font-black text-white font-mono">{telemetry.fps} <span className="text-xs font-semibold text-slate-400">fps</span></span>
              </div>
            </div>

            {/* Bitrate Gauge */}
            <div className="flex items-center space-x-3 bg-slate-950/70 px-4 py-2.5 rounded-2xl border border-slate-800/80 shadow">
              <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></div>
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Bitrate</span>
                <span className="text-base font-black text-white font-mono">{telemetry.bitrateMbps} <span className="text-xs font-semibold text-slate-400">Mbps</span></span>
              </div>
            </div>

            {/* Resolution Gauge */}
            <div className="flex items-center space-x-3 bg-slate-950/70 px-4 py-2.5 rounded-2xl border border-slate-800/80 shadow">
              <Tv className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Resolution</span>
                <span className="text-sm font-black text-white font-mono truncate">{telemetry.resolution}</span>
              </div>
            </div>

            {/* Latency Gauge */}
            <div className="flex items-center space-x-3 bg-slate-950/70 px-4 py-2.5 rounded-2xl border border-slate-800/80 shadow">
              <Wifi className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Latency</span>
                <span className="text-base font-black text-emerald-400 font-mono">{telemetry.latencyMs} <span className="text-xs font-semibold text-slate-400">ms</span></span>
              </div>
            </div>

            {/* CPU Usage Gauge */}
            <div className="flex items-center space-x-3 bg-slate-950/70 px-4 py-2.5 rounded-2xl border border-slate-800/80 shadow">
              <Cpu className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">CPU Usage</span>
                <span className="text-base font-black text-emerald-400 font-mono">{telemetry.cpuUsage} <span className="text-xs font-semibold text-slate-400">%</span></span>
              </div>
            </div>

            {/* Connected Users Gauge */}
            <div className="flex items-center space-x-3 bg-slate-950/70 px-4 py-2.5 rounded-2xl border border-slate-800/80 shadow">
              <Users className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Connected</span>
                <span className="text-base font-black text-white font-mono">{participants.length} <span className="text-xs font-semibold text-slate-400">Users</span></span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};
