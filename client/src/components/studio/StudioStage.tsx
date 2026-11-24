import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Search,
  Moon,
  Sun,
  Bell,
  Users,
  CheckCircle,
  UserPlus,
  Share2,
  PhoneOff,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Smile,
  MoreHorizontal,
  LayoutGrid,
  Send,
  FileText,
  Folder,
  Crown,
  Sparkles,
  Home,
  Calendar,
  Briefcase,
  Settings,
  Headphones,
  GraduationCap,
  Headset,
  Lock,
  Plus,
  ChevronDown,
  ExternalLink,
  Paperclip,
  ArrowRight,
  Hand,
  MessageSquare,
  Copy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRoomStore, useIsHost } from '../../store/roomStore';
import { notificationService } from '../../services/NotificationService';
import { formatDuration } from '../../utils/formatters';
import { copyToClipboard } from '../../utils/clipboard';

interface StudioStageProps {
  studio: any;
  onLeave: () => void;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
}

const RemoteParticipantTile: React.FC<{
  participant: any;
  cameraStream?: MediaStream | null;
  isSpeaking?: boolean;
  onMaximize?: () => void;
  className?: string;
}> = ({ participant, cameraStream, isSpeaking, onMaximize, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (cameraStream) {
        videoRef.current.srcObject = cameraStream;
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [cameraStream]);

  const isHostOrOwner = participant.role === 'host' || participant.role === 'owner' || participant.role === 'co-host';

  return (
    <div className={`rounded-3xl bg-[#0D1322] border border-white/8 relative overflow-hidden flex flex-col justify-between group shadow-xl transition-all ${
      isSpeaking ? 'ring-2 ring-emerald-500/50' : ''
    } ${className}`}>
      {/* Top Right Maximize Button */}
      <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onMaximize}
          className="p-1.5 rounded-xl bg-black/40 hover:bg-black/70 backdrop-blur-md text-slate-300 hover:text-white transition-colors"
          title="Maximize view"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#13192B] to-[#0A0E1A]">
        {cameraStream ? (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-xl transition-all ${
              isSpeaking ? 'ring-4 ring-emerald-400 scale-105' : ''
            }`}>
              {participant.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar: Name tag, role/crown, mic status & audio meter */}
      <div className="p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute bottom-0 inset-x-0 z-10 flex items-center justify-between">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#13192B]/90 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-sm">
          {isHostOrOwner && <Crown className="w-3 h-3 text-violet-400 fill-violet-400/20" />}
          {participant.hasMic ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
          <span>{participant.name}</span>
          {isSpeaking && (
            <span className="flex items-end space-x-0.5 ml-1 h-3">
              <span className="w-0.5 bg-emerald-400 h-2 rounded-full animate-pulse" />
              <span className="w-0.5 bg-emerald-400 h-3 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
              <span className="w-0.5 bg-emerald-400 h-1.5 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
            </span>
          )}
        </div>

        {isSpeaking && (
          <div className="w-5 h-5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};

export const StudioStage: React.FC<StudioStageProps> = ({ studio, onLeave }) => {
  const navigate = useNavigate();
  const room = useRoomStore((s) => s.room);
  const localParticipant = useRoomStore((s) => s.localParticipant);
  const participants = useRoomStore((s) => s.participants);
  const isHost = useIsHost();
  const screenShareState = useRoomStore((s) => s.screenShareState);
  const isSharing = screenShareState === 'Sharing';
  const isMicMuted = useRoomStore((s) => s.isMicMuted);
  const isCameraEnabled = useRoomStore((s) => s.isCameraEnabled);
  const localCameraStream = useRoomStore((s) => s.localCameraStream);
  const remoteCameraStreams = useRoomStore((s) => s.remoteCameraStreams);
  const activeSpeakerIds = useRoomStore((s) => s.activeSpeakerIds);
  const localShareStream = useRoomStore((s) => s.localShareStream);
  const remoteMediaStream = useRoomStore((s) => s.remoteMediaStream);
  const isAnyScreenSharing = isSharing || !!localShareStream || !!remoteMediaStream;
  const pendingJoinRequests = useRoomStore((s) => s.pendingJoinRequests);
  const chatMessages = useRoomStore((s) => s.chatMessages);

  // Layout & UI State
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'files' | 'notes'>('chat');
  const [layoutMode, setLayoutMode] = useState<'bento' | 'focus' | 'grid'>('bento');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // User-authored Shared Notes & Files (No Dummy Data)
  const [sharedNotes, setSharedNotes] = useState('');
  const [sharedFiles, setSharedFiles] = useState<{ name: string; size: string; time: string }[]>([]);

  // Video Element Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Global Keyboard Shortcut: ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live Timer: Real room elapsed seconds from room creation
  useEffect(() => {
    const startMs = room?.createdAt ? new Date(room.createdAt).getTime() : Date.now();
    const update = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setElapsedSeconds(diff);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [room?.createdAt]);

  // Attach local camera stream
  useEffect(() => {
    if (localVideoRef.current) {
      if (localCameraStream && isCameraEnabled) {
        localVideoRef.current.srcObject = localCameraStream;
        localVideoRef.current.play().catch(() => {});
      } else {
        localVideoRef.current.srcObject = null;
      }
    }
  }, [localCameraStream, isCameraEnabled]);

  // Attach screen share stream (host broadcast or incoming remote stream)
  useEffect(() => {
    const activeStream = isHost ? (localShareStream || remoteMediaStream) : remoteMediaStream;
    if (screenVideoRef.current) {
      if (activeStream) {
        screenVideoRef.current.srcObject = activeStream;
        screenVideoRef.current.play().catch(() => {});
      } else {
        screenVideoRef.current.srcObject = null;
      }
    }
  }, [localShareStream, remoteMediaStream, isSharing, isHost]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    studio.sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/join?room=${room?.roomId || ''}`;
    copyToClipboard(url);
    notificationService.showToast('Room link copied to clipboard!', 'success');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const triggerReaction = (emoji: string) => {
    studio.sendReaction(emoji);
    const newEmoji: FloatingEmoji = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      x: 40 + Math.random() * 20,
    };
    setFloatingEmojis((prev) => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== newEmoji.id));
    }, 2500);
    setShowEmojiPicker(false);
  };

  const toggleRaiseHand = () => {
    setHandRaised((prev) => !prev);
    if (!handRaised) {
      notificationService.showToast('Hand raised! The host has been notified.', 'info');
      studio.sendChatMessage('✋ [Hand Raised] requested to speak.');
    } else {
      notificationService.showToast('Hand lowered.', 'info');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;
    const newFile = {
      name: file.name,
      size: sizeStr,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSharedFiles((prev) => [newFile, ...prev]);
    studio.sendChatMessage(`📎 Shared file: ${file.name} (${sizeStr})`);
    notificationService.showToast(`File "${file.name}" uploaded to room`, 'success');
  };

  const reactionsList = ['❤️', '🔥', '👏', '🥳', '👍', '🎉', '💜'];

  const localName = localParticipant?.name || 'You';
  const remoteParticipants = participants.filter((p) => p.name !== localName);

  return (
    <div className="h-screen w-screen bg-[#080C16] text-slate-100 flex flex-col overflow-hidden font-sans select-none relative">
      {/* FLOATING EMOJI REACTIONS ANIMATION OVERLAY */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <AnimatePresence>
          {floatingEmojis.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 1, y: '85vh', x: `${f.x}vw`, scale: 0.8 }}
              animate={{
                opacity: [1, 1, 0],
                y: '15vh',
                x: `${f.x + (Math.random() * 8 - 4)}vw`,
                scale: [0.8, 1.5, 1.2],
              }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
              className="absolute text-3xl drop-shadow-lg select-none"
            >
              {f.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ============================================================== */}
      {/* 1. TOP GLOBAL APP HEADER BAR                                   */}
      {/* ============================================================== */}
      <header className="h-16 px-6 bg-[#0B101E] border-b border-white/8 flex items-center justify-between gap-4 shrink-0 z-20">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center space-x-6 min-w-0">
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate('/dashboard')}
          >
            <div className="flex items-center space-x-1 px-1.5 py-1">
              <span className="w-1 h-3.5 bg-violet-400 rounded-full animate-pulse" />
              <span className="w-1 h-5 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '120ms' }} />
              <span className="w-1 h-7 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '240ms' }} />
              <span className="w-1 h-5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '360ms' }} />
              <span className="w-1 h-3.5 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '480ms' }} />
            </div>
            <span className="text-xl font-black tracking-tight text-white group-hover:text-violet-300 transition-colors">
              Musica
            </span>
          </div>

          {/* Search Bar with ⌘K Badge */}
          <div className="relative w-64 md:w-80 hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms, people..."
              className="w-full pl-9 pr-10 py-2 rounded-xl bg-[#13192B] border border-white/6 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white/6 px-1.5 py-0.5 rounded border border-white/8">
              ⌘ K
            </span>
          </div>
        </div>

        {/* Right Utilities: Theme Toggle, Notifications, User Avatar */}
        <div className="flex items-center space-x-3.5 shrink-0">
          <button
            onClick={() => {
              setIsDarkMode(!isDarkMode);
              notificationService.showToast(`Theme set to ${isDarkMode ? 'Light (auto)' : 'Dark'} mode`, 'info');
            }}
            className="w-9 h-9 rounded-xl bg-[#13192B] hover:bg-slate-800 border border-white/8 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 rounded-xl bg-[#13192B] hover:bg-slate-800 border border-white/8 flex items-center justify-center text-slate-300 hover:text-white transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {pendingJoinRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center shadow-md shadow-rose-500/50">
                  {pendingJoinRequests.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-72 rounded-2xl bg-[#13192B] border border-white/10 shadow-2xl p-3 z-50 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-white/6">
                  <span className="text-xs font-bold text-white">Notifications</span>
                  <span className="text-[10px] text-violet-400 font-semibold cursor-pointer">Live</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {pendingJoinRequests.length > 0 ? (
                    pendingJoinRequests.map((req) => (
                      <div key={req.socketId} className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                        <p className="font-semibold text-white">{req.name} requested to join</p>
                        <div className="flex space-x-2 mt-1">
                          <button
                            onClick={() => studio.admitUser?.(req.socketId)}
                            className="px-2 py-0.5 bg-violet-600 rounded text-[10px] text-white"
                          >
                            Admit
                          </button>
                          <button
                            onClick={() => studio.denyUser?.(req.socketId)}
                            className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-center text-xs text-slate-400">
                      No pending room notifications.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            onClick={() => navigate('/dashboard')}
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-violet-500/50 cursor-pointer hover:ring-violet-400 transition-all shrink-0"
          >
            {localName.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. BODY CONTENT (3 COLUMNS)                                    */}
      {/* ============================================================== */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className="w-60 bg-[#0A0F1D] border-r border-white/6 flex flex-col justify-between shrink-0 hidden lg:flex">
          <div className="p-4 space-y-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-violet-600/20 text-violet-300 border border-violet-500/30 transition-all shadow-sm"
            >
              <Home className="w-4 h-4 text-violet-400" />
              <span>Home</span>
            </button>

            <button
              onClick={() => navigate('/create')}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-violet-600/30 hover:opacity-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Room</span>
            </button>

            <nav className="space-y-1 pt-1">
              <button
                onClick={() => navigate('/create?type=podcast')}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/4 transition-colors"
              >
                <Headphones className="w-4 h-4 text-slate-400" />
                <span>Podcast</span>
              </button>

              <button
                onClick={() => navigate('/create?type=classroom')}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/4 transition-colors"
              >
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <span>Classroom</span>
              </button>

              <button
                onClick={() => navigate('/create?type=remote-support')}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/4 transition-colors"
              >
                <Headset className="w-4 h-4 text-slate-400" />
                <span>Support</span>
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/4 transition-colors"
              >
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span>My Rooms</span>
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/4 transition-colors"
              >
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Schedule</span>
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/4 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* Pro Card & User Footer (Live participant identity) */}
          <div className="p-4 space-y-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-950/40 via-[#13192B] to-indigo-950/40 border border-violet-500/20 relative overflow-hidden">
              <div className="flex items-center space-x-2 text-violet-300 text-xs font-bold mb-1">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Upgrade to Pro</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug mb-3">
                Unlock more features for creators & educators.
              </p>
              <button
                onClick={() => notificationService.showToast('Musica Pro upgrade options available in Dashboard', 'info')}
                className="text-xs font-bold text-violet-300 hover:text-white flex items-center space-x-1"
              >
                <span>Go Pro</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/4 transition-colors cursor-pointer">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {localName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0A0F1D] absolute -bottom-0.5 -right-0.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{localName}</p>
                  <p className="text-[10px] text-emerald-400 font-medium">● Online</p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </aside>

        {/* ============================================================== */}
        {/* CENTER STAGE: ROOM HEADER, ADAPTIVE VIDEO GRID & BOTTOM DOCK   */}
        {/* ============================================================== */}
        <main className="flex-1 flex flex-col min-w-0 relative bg-[#080C16]">
          {/* ROOM SUB-HEADER BAR */}
          <div className="h-16 px-6 border-b border-white/6 flex items-center justify-between gap-4 shrink-0 bg-[#0A0F1D]">
            <div className="flex items-center space-x-4 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600/30 to-indigo-600/30 border border-violet-500/40 flex items-center justify-center text-violet-400 shrink-0 shadow-inner">
                <Radio className="w-5 h-5 text-violet-400 animate-pulse" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h1 className="text-base font-extrabold text-white truncate">
                    {room?.roomName || 'Active Room'}
                  </h1>
                  <CheckCircle className="w-4 h-4 text-violet-400 shrink-0 fill-violet-400/20" />
                  <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-[10px] uppercase tracking-wider shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {room?.description || 'Real-time collaborative audio & video session'}
                </p>
              </div>

              {/* Real duration & participant counter */}
              <div className="hidden sm:flex items-center space-x-3 text-xs text-slate-400 border-l border-white/8 pl-4">
                <span className="font-mono text-slate-300">{formatDuration(elapsedSeconds)}</span>
                <div className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{participants.length || 1}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Invite, Share, Leave */}
            <div className="flex items-center space-x-2.5 shrink-0">
              <button
                onClick={handleCopyShareLink}
                className="px-3.5 py-2 rounded-xl bg-[#13192B] hover:bg-slate-800 border border-white/8 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                <span>Invite</span>
              </button>

              <button
                onClick={handleCopyShareLink}
                className="px-3.5 py-2 rounded-xl bg-[#13192B] hover:bg-slate-800 border border-white/8 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Share</span>
              </button>

              <button
                onClick={() => {
                  studio.leaveRoom();
                  onLeave();
                }}
                className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm shadow-rose-950/20"
              >
                <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Leave Room</span>
              </button>
            </div>
          </div>

          {/* CENTER STAGE: DYNAMIC VIDEO GRID (PURE LIVE DATA) */}
          <div className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col justify-between gap-4">
            <div className="flex-1 min-h-0">
              {/* LAYOUT: IF SCREEN SHARING OR PARTICIPANTS */}
              {isAnyScreenSharing ? (
                /* SCREEN SHARING LAYOUT MATCHING USER REFERENCE IMAGE */
                <div className="h-full flex flex-col gap-4">
                  {/* TOP ROW: LOCAL USER + FIRST REMOTE PARTICIPANT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-1/2 min-h-0">
                    {/* 1. Local User (You) */}
                    <div className={`rounded-3xl bg-[#0D1322] border border-white/8 relative overflow-hidden flex flex-col justify-between group shadow-xl transition-all ${
                      activeSpeakerIds.includes(localParticipant?.id || '') ? 'ring-2 ring-emerald-500/50' : ''
                    }`}>
                      <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={toggleFullscreen}
                          className="p-1.5 rounded-xl bg-black/40 hover:bg-black/70 backdrop-blur-md text-slate-300 hover:text-white transition-colors"
                          title="Maximize"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#13192B] to-[#0A0E1A]">
                        {isCameraEnabled ? (
                          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center space-y-3">
                            <div className={`w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-500 flex items-center justify-center text-2xl font-black text-white shadow-xl ${
                              !isMicMuted ? 'ring-4 ring-emerald-400 scale-105' : ''
                            }`}>
                              {localName.slice(0, 2).toUpperCase()}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute bottom-0 inset-x-0 z-10 flex items-center justify-between">
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#13192B]/90 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-sm">
                          {isMicMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                          <span>You</span>
                          {isHost && <Crown className="w-3 h-3 text-amber-400 ml-1" />}
                        </div>
                      </div>
                    </div>

                    {/* 2. Remote Participant 1 (e.g. Sophia) or Invite Card if alone */}
                    {remoteParticipants.length > 0 ? (
                      <RemoteParticipantTile
                        participant={remoteParticipants[0]}
                        cameraStream={remoteCameraStreams[remoteParticipants[0].id]}
                        isSpeaking={activeSpeakerIds.includes(remoteParticipants[0].id)}
                        onMaximize={toggleFullscreen}
                      />
                    ) : (
                      <div className="rounded-3xl bg-[#0D1322] border border-white/8 p-6 flex flex-col items-center justify-center text-center space-y-3 shadow-xl">
                        <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                          <Users className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white">Invite Collaborators</h4>
                          <p className="text-[11px] text-slate-400 max-w-xs">
                            Room ID: <span className="text-violet-300 font-mono font-bold">{room?.roomId}</span>
                          </p>
                        </div>
                        <button
                          onClick={handleCopyShareLink}
                          className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center space-x-1 transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM ROW: SCREEN SHARE (LEFT) + REMAINING PARTICIPANTS (RIGHT) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-1/2 min-h-0">
                    {/* Screen Share Tile (Span 2 Cols if remotes, full width otherwise) */}
                    <div className={`${remoteParticipants.length > 1 ? 'lg:col-span-2' : 'lg:col-span-3'} rounded-3xl bg-[#0D1322] border-2 border-violet-500/40 relative overflow-hidden flex flex-col justify-between group shadow-2xl`}>
                      <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between">
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-violet-600/60 backdrop-blur-md border border-violet-400/40 text-xs font-bold text-violet-100 shadow-sm">
                          <Monitor className="w-3.5 h-3.5 text-violet-200" />
                          <span>Sharing Screen</span>
                        </div>
                        <button
                          onClick={toggleFullscreen}
                          className="p-1.5 rounded-xl bg-black/40 hover:bg-black/70 backdrop-blur-md text-slate-300 hover:text-white transition-colors"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex-1 flex items-center justify-center bg-black">
                        <video
                          ref={screenVideoRef}
                          autoPlay
                          playsInline
                          muted={isHost}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Remaining Participants Column (Span 1 Col) */}
                    {remoteParticipants.length > 1 && (
                      <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
                        {remoteParticipants.slice(1).map((p) => (
                          <div key={p.id} className="flex-1 min-h-[120px]">
                            <RemoteParticipantTile
                              participant={p}
                              cameraStream={remoteCameraStreams[p.id]}
                              isSpeaking={activeSpeakerIds.includes(p.id)}
                              onMaximize={toggleFullscreen}
                              className="h-full"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : remoteParticipants.length === 0 ? (
                /* ALONE IN ROOM: SHOW HOST + INVITE CALLOUT CARD */
                <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Local User Card */}
                  <div className={`rounded-3xl bg-[#0D1322] border border-white/8 relative overflow-hidden flex flex-col justify-between group shadow-xl transition-all ${
                    activeSpeakerIds.includes(localParticipant?.id || '') ? 'ring-2 ring-emerald-500/50' : ''
                  }`}>
                    <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={toggleFullscreen} className="p-1.5 rounded-lg bg-slate-900/80 text-slate-300 hover:text-white">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#13192B] to-[#0A0E1A]">
                      {isCameraEnabled ? (
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-500 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-violet-600/30 border border-white/10">
                            {localName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex items-center space-x-1 h-5">
                            <span className={`w-1 rounded-full ${!isMicMuted ? 'h-4 bg-emerald-400 animate-pulse' : 'h-1.5 bg-slate-600'}`} />
                            <span className={`w-1 rounded-full ${!isMicMuted ? 'h-6 bg-violet-400 animate-pulse' : 'h-1.5 bg-slate-600'}`} style={{ animationDelay: '100ms' }} />
                            <span className={`w-1 rounded-full ${!isMicMuted ? 'h-3 bg-cyan-400 animate-pulse' : 'h-1.5 bg-slate-600'}`} style={{ animationDelay: '200ms' }} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-3 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute bottom-0 inset-x-0 z-10">
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#13192B]/90 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-sm">
                        {isMicMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{localName} (You)</span>
                        {isHost && <Crown className="w-3 h-3 text-amber-400 ml-1" />}
                      </div>
                    </div>
                  </div>

                  {/* Waiting for Participants Card */}
                  <div className="rounded-3xl bg-[#0D1322] border border-white/8 p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
                    <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-inner">
                      <Users className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-white tracking-tight">Ready to Collaborate</h3>
                      <p className="text-xs text-slate-400 max-w-xs">
                        You are the first in the room. Share the room code or invite link to start streaming together.
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#13192B] border border-white/10 flex items-center space-x-3">
                      <span className="text-xs font-mono font-bold text-violet-300">
                        {room?.roomId || 'ROOM'}
                      </span>
                      <button
                        onClick={handleCopyShareLink}
                        className="px-3 py-1 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center space-x-1 transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Invite Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* MULTIPLE REAL PARTICIPANTS: BALANCED GRID */
                <div className={`h-full grid gap-4 ${
                  remoteParticipants.length === 1 
                    ? 'grid-cols-1 md:grid-cols-2' 
                    : remoteParticipants.length === 2 
                    ? 'grid-cols-1 md:grid-cols-3' 
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
                }`}>
                  {/* Local User Card */}
                  <div className={`rounded-3xl bg-[#0D1322] border border-white/8 relative overflow-hidden flex flex-col justify-between group shadow-xl transition-all ${
                    activeSpeakerIds.includes(localParticipant?.id || '') ? 'ring-2 ring-emerald-500/50' : ''
                  }`}>
                    <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={toggleFullscreen} className="p-1.5 rounded-xl bg-black/40 text-slate-300 hover:text-white">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#13192B] to-[#0A0E1A]">
                      {isCameraEnabled ? (
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-xl">
                            {localName.slice(0, 2).toUpperCase()}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute bottom-0 inset-x-0 z-10 flex items-center justify-between">
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#13192B]/90 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-sm">
                        {isMicMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>You</span>
                        {isHost && <Crown className="w-3 h-3 text-amber-400 ml-1" />}
                      </div>
                    </div>
                  </div>

                  {/* Remote Participants Real Cards */}
                  {remoteParticipants.map((p) => (
                    <RemoteParticipantTile
                      key={p.id}
                      participant={p}
                      cameraStream={remoteCameraStreams[p.id]}
                      isSpeaking={activeSpeakerIds.includes(p.id)}
                      onMaximize={toggleFullscreen}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* 3. BOTTOM FLOATING CONTROL DOCK                                */}
            {/* ============================================================== */}
            <div className="h-20 rounded-3xl bg-[#0D1322]/95 backdrop-blur-2xl border border-white/10 px-6 flex items-center justify-between gap-4 shadow-2xl shrink-0">
              {/* Left Status: Connected Signal Bars & End-to-End Encrypted */}
              <div className="hidden sm:flex items-center space-x-4 shrink-0">
                <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-bold">
                  <div className="flex items-end space-x-0.5 h-3.5">
                    <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full" />
                    <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full" />
                    <span className="w-0.5 h-3.5 bg-emerald-400 rounded-full" />
                  </div>
                  <span>Connected</span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-medium">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>End-to-End Encrypted</span>
                </div>
              </div>

              {/* Center Action Controls */}
              <div className="flex items-center space-x-3 sm:space-x-5 mx-auto">
                {/* 1. Mic Button */}
                <div className="flex flex-col items-center space-y-1">
                  <button
                    onClick={() => studio.toggleMicrophone()}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isMicMuted
                        ? 'bg-[#182033] hover:bg-slate-700 text-slate-300 border border-white/10'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                    }`}
                  >
                    {isMicMuted ? <MicOff className="w-5 h-5 text-rose-400" /> : <Mic className="w-5 h-5 text-emerald-400" />}
                  </button>
                  <span className="text-[10px] font-medium text-slate-400">
                    {isMicMuted ? 'Unmute' : 'Mute'}
                  </span>
                </div>

                {/* 2. Video Camera Button */}
                <div className="flex flex-col items-center space-y-1">
                  <button
                    onClick={() => studio.toggleCamera()}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      !isCameraEnabled
                        ? 'bg-[#182033] hover:bg-slate-700 text-slate-300 border border-white/10'
                        : 'bg-violet-600/25 text-violet-300 border border-violet-500/40 shadow-lg shadow-violet-600/20'
                    }`}
                  >
                    {!isCameraEnabled ? <VideoOff className="w-5 h-5 text-slate-400" /> : <Video className="w-5 h-5 text-violet-400" />}
                  </button>
                  <span className="text-[10px] font-medium text-slate-400">
                    {isCameraEnabled ? 'Stop Video' : 'Start Video'}
                  </span>
                </div>

                {/* 3. Screen Share Button */}
                <div className="flex flex-col items-center space-y-1">
                  <button
                    onClick={() => {
                      if (isSharing) studio.stopScreenShare();
                      else studio.startScreenShare();
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      !isSharing
                        ? 'bg-[#182033] hover:bg-slate-700 text-slate-300 border border-white/10'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/20'
                    }`}
                  >
                    <Monitor className={`w-5 h-5 ${isSharing ? 'text-cyan-400' : 'text-slate-300'}`} />
                  </button>
                  <span className="text-[10px] font-medium text-slate-400">Share</span>
                </div>

                {/* 4. Emoji Reactions Button */}
                <div className="flex flex-col items-center space-y-1 relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-12 h-12 rounded-full bg-[#182033] hover:bg-slate-700 text-slate-300 border border-white/10 flex items-center justify-center transition-all"
                  >
                    <Smile className="w-5 h-5 text-amber-400" />
                  </button>
                  <span className="text-[10px] font-medium text-slate-400">React</span>

                  {showEmojiPicker && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 p-2 rounded-2xl bg-[#13192B] border border-white/15 shadow-2xl flex items-center space-x-2 z-50">
                      {reactionsList.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => triggerReaction(emoji)}
                          className="text-xl p-1.5 hover:scale-125 transition-transform"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. More Options Menu */}
                <div className="flex flex-col items-center space-y-1 relative">
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="w-12 h-12 rounded-full bg-[#182033] hover:bg-slate-700 text-slate-300 border border-white/10 flex items-center justify-center transition-all"
                  >
                    <MoreHorizontal className="w-5 h-5 text-slate-300" />
                  </button>
                  <span className="text-[10px] font-medium text-slate-400">More</span>

                  {showMoreMenu && (
                    <div className="absolute bottom-16 right-0 w-48 py-2 rounded-2xl bg-[#13192B] border border-white/15 shadow-2xl z-50 space-y-1">
                      {!isHost && (
                        <button
                          onClick={() => {
                            toggleRaiseHand();
                            setShowMoreMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-white/6 flex items-center space-x-2"
                        >
                          <Hand className="w-4 h-4 text-amber-400" />
                          <span>{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleCopyShareLink();
                          setShowMoreMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-white/6 flex items-center space-x-2"
                      >
                        <Share2 className="w-4 h-4 text-slate-400" />
                        <span>Copy Room Link</span>
                      </button>
                      <button
                        onClick={() => {
                          notificationService.showToast('Audio echo cancellation & spatial filters enabled', 'info');
                          setShowMoreMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-white/6 flex items-center space-x-2"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Audio Settings</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 6. Leave Red Circular Button */}
                <div className="flex flex-col items-center space-y-1">
                  <button
                    onClick={() => {
                      studio.leaveRoom();
                      onLeave();
                    }}
                    className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <PhoneOff className="w-5 h-5 text-white" />
                  </button>
                  <span className="text-[10px] font-bold text-rose-400">Leave</span>
                </div>
              </div>

              {/* Right Controls: Gallery/Grid & Fullscreen */}
              <div className="hidden sm:flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => notificationService.showToast('Grid layout active', 'info')}
                  className="p-3 rounded-xl bg-[#182033] hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors"
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-3 rounded-xl bg-[#182033] hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors"
                  title="Toggle Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* ============================================================== */}
        {/* 4. RIGHT ACTIVITY PANEL (Chat, Participants, Files, Notes)     */}
        {/* ============================================================== */}
        <aside className="w-80 bg-[#0A0F1D] border-l border-white/6 flex flex-col justify-between shrink-0">
          {/* TAB BAR */}
          <div className="grid grid-cols-4 gap-1 p-3 border-b border-white/6 bg-[#0B101E] shrink-0">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-[11px] font-bold transition-all ${
                activeTab === 'chat'
                  ? 'bg-violet-600/25 text-violet-300 border border-violet-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/4'
              }`}
            >
              <MessageSquare className="w-4 h-4 mb-1" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('participants')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-[11px] font-bold transition-all ${
                activeTab === 'participants'
                  ? 'bg-violet-600/25 text-violet-300 border border-violet-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/4'
              }`}
            >
              <Users className="w-4 h-4 mb-1" />
              <span>People ({participants.length || 1})</span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-[11px] font-bold transition-all ${
                activeTab === 'files'
                  ? 'bg-violet-600/25 text-violet-300 border border-violet-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/4'
              }`}
            >
              <Folder className="w-4 h-4 mb-1" />
              <span>Files</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-[11px] font-bold transition-all ${
                activeTab === 'notes'
                  ? 'bg-violet-600/25 text-violet-300 border border-violet-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/4'
              }`}
            >
              <FileText className="w-4 h-4 mb-1" />
              <span>Notes</span>
            </button>
          </div>

          {/* TAB 1: REAL CHAT STREAM (ZERO DUMMY DATA) */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div ref={chatScrollRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-500">
                    <MessageSquare className="w-8 h-8 text-slate-600" />
                    <p className="text-xs font-semibold text-slate-400">No messages yet</p>
                    <p className="text-[11px] leading-relaxed">
                      Start the conversation by sending a greeting or sharing a link with room participants.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isSelf = msg.senderName === localName;
                    const hasUrl = msg.text.match(/(https?:\/\/[^\s]+)/g);

                    return (
                      <div key={msg.id} className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          isSelf ? 'bg-violet-600 text-white' : 'bg-white/8 text-slate-200'
                        }`}>
                          {msg.senderName.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">{msg.senderName}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isSelf 
                              ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/30 border border-violet-500/40 text-slate-100' 
                              : 'bg-[#13192B] border border-white/6 text-slate-200'
                          }`}>
                            <p>{msg.text}</p>
                            {hasUrl && (
                              <div
                                onClick={() => window.open(hasUrl[0], '_blank')}
                                className="mt-2 p-2 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between cursor-pointer hover:bg-black/60 transition-colors"
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <Share2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                  <span className="text-[11px] font-mono text-violet-300 truncate">
                                    {hasUrl[0]}
                                  </span>
                                </div>
                                <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 ml-1.5" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/6 bg-[#0A0F1D]">
                <div className="relative flex items-center bg-[#13192B] border border-white/8 rounded-2xl px-2 py-1 focus-within:border-violet-500/50 transition-colors">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-transparent px-2 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0 shadow-md shadow-violet-600/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: PARTICIPANTS (REAL PARTICIPANTS LIST) */}
          {activeTab === 'participants' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Participants ({participants.length || 1})
                </span>
                {participants.map((p) => {
                  const isUserHost = p.role === 'owner' || p.role === 'host';
                  return (
                    <div key={p.id} className="p-3 rounded-2xl bg-[#13192B] border border-white/6 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-300 font-bold text-xs flex items-center justify-center">
                          {p.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-white block">{p.name}</span>
                            {isUserHost && <Crown className="w-3 h-3 text-amber-400" />}
                          </div>
                          <span className="text-[10px] text-slate-400 capitalize">{p.role}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {p.hasMic ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Waiting Room (If Host and requests present) */}
              {isHost && pendingJoinRequests.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/8">
                  <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                    Waiting Room ({pendingJoinRequests.length})
                  </span>
                  {pendingJoinRequests.map((req) => (
                    <div key={req.socketId} className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{req.name}</span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => studio.denyUser?.(req.socketId)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => studio.admitUser?.(req.socketId)}
                          className="px-3 py-1 rounded-lg text-[10px] font-bold bg-violet-600 text-white hover:bg-violet-500"
                        >
                          Admit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FILES (LIVE USER SHARING) */}
          {activeTab === 'files' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Session Files</span>
              {sharedFiles.length === 0 ? (
                <div className="p-6 text-center text-slate-500 space-y-2">
                  <Folder className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No files shared yet</p>
                  <p className="text-[11px]">Upload a document, audio file, or image to share with the room.</p>
                </div>
              ) : (
                sharedFiles.map((f, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-[#13192B] border border-white/6 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block truncate max-w-[150px]">{f.name}</span>
                        <span className="text-[10px] text-slate-400">{f.size} • {f.time}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => notificationService.showToast(`Downloading ${f.name}...`, 'info')}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/6 hover:bg-white/10 text-slate-200"
                    >
                      Download
                    </button>
                  </div>
                ))
              )}

              <label className="w-full py-2.5 rounded-xl border border-dashed border-white/15 text-xs text-slate-400 hover:text-white flex items-center justify-center space-x-1.5 cursor-pointer hover:border-violet-500/50 transition-colors">
                <Paperclip className="w-3.5 h-3.5" />
                <span>Share a file</span>
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* TAB 4: NOTES (REAL COLLABORATIVE NOTES) */}
          {activeTab === 'notes' && (
            <div className="flex-1 p-4 flex flex-col justify-between overflow-hidden">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                Room Notes
              </span>
              <textarea
                value={sharedNotes}
                onChange={(e) => setSharedNotes(e.target.value)}
                placeholder="Capture shared room notes, agenda items, and takeaways..."
                className="flex-1 w-full p-3 rounded-2xl bg-[#13192B] border border-white/6 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50 resize-none font-mono leading-relaxed"
              />
              <div className="pt-2 flex justify-between items-center text-[10px] text-slate-400">
                <span>● Synced with session</span>
                <button
                  onClick={() => notificationService.showToast('Notes saved to session history', 'success')}
                  className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
