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
  Check,
  X,
  Volume2,
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
  const localShareStream = useRoomStore((s) => s.localShareStream);
  const remoteMediaStream = useRoomStore((s) => s.remoteMediaStream);
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
  const [elapsedSeconds, setElapsedSeconds] = useState(1458); // default: 00:24:18
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Shared Notes
  const [sharedNotes, setSharedNotes] = useState(
    '### Creative Podcast Episode 42\n- Topic: The Future of Spatial Audio & Real-time Web\n- Sophia: LiveKit SFU high-capacity distribution\n- Alex: Screen audio capture & low latency\n- Q&A with live audience'
  );

  // Shared Files
  const [sharedFiles] = useState([
    { name: 'Podcast_ShowNotes_Ep42.pdf', size: '2.4 MB', time: '10:15 AM' },
    { name: 'LiveKit_Routing_Diagram.png', size: '840 KB', time: '10:20 AM' },
  ]);

  // Video Element Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Global Keyboard Shortcut: ⌘K / Ctrl+K for search
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

  // Live Timer
  useEffect(() => {
    if (!room?.createdAt) return;
    const startMs = new Date(room.createdAt).getTime();
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

  // Attach screen share stream
  useEffect(() => {
    const activeStream = isHost ? localShareStream : remoteMediaStream;
    if (screenVideoRef.current && activeStream && isSharing) {
      screenVideoRef.current.srcObject = activeStream;
      screenVideoRef.current.play().catch(() => {});
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
    const url = `${window.location.origin}/join?room=${room?.roomId || 'CP98'}`;
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

  const reactionsList = ['❤️', '🔥', '👏', '🥳', '👍', '🎉', '💜'];

  const localName = localParticipant?.name || 'You';
  const remoteParticipants = participants.filter((p) => p.name !== localName);
  const sophia = remoteParticipants[0] || {
    id: 'p2',
    name: 'Sophia',
    role: 'co-host',
    hasMic: true,
    hasCamera: true,
  };
  const alex = remoteParticipants[1] || {
    id: 'p3',
    name: 'Alex',
    role: 'speaker',
    hasMic: false,
    hasCamera: false,
  };
  const emma = remoteParticipants[2] || {
    id: 'p4',
    name: 'Emma',
    role: 'audience',
    hasMic: false,
    hasCamera: false,
  };

  const sophiaAvatar = (sophia as any).avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';
  const alexAvatar = (alex as any).avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80';
  const emmaAvatar = (emma as any).avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80';

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
      {/* 1. TOP GLOBAL APP HEADER BAR (Full Width Spanning Header)       */}
      {/* ============================================================== */}
      <header className="h-16 px-6 bg-[#0B101E] border-b border-white/8 flex items-center justify-between gap-4 shrink-0 z-20">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center space-x-6 min-w-0">
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate('/dashboard')}
          >
            {/* Audio Waveform Brand Icon */}
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

        {/* Right Utilities: Theme Toggle, Notifications Bell with Badge, User Avatar */}
        <div className="flex items-center space-x-3.5 shrink-0">
          {/* Moon / Theme Toggle */}
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

          {/* Notifications Bell with Unread Badge "3" */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 rounded-xl bg-[#13192B] hover:bg-slate-800 border border-white/8 flex items-center justify-center text-slate-300 hover:text-white transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center shadow-md shadow-rose-500/50">
                3
              </span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-72 rounded-2xl bg-[#13192B] border border-white/10 shadow-2xl p-3 z-50 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-white/6">
                  <span className="text-xs font-bold text-white">Notifications</span>
                  <span className="text-[10px] text-violet-400 font-semibold cursor-pointer">Mark read</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded-xl bg-white/4 hover:bg-white/6 cursor-pointer">
                    <p className="font-semibold text-white">Sophia joined the podcast</p>
                    <p className="text-[10px] text-slate-400">2 minutes ago</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white/4 hover:bg-white/6 cursor-pointer">
                    <p className="font-semibold text-white">Audio bitrate optimized to 48kHz</p>
                    <p className="text-[10px] text-slate-400">5 minutes ago</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white/4 hover:bg-white/6 cursor-pointer">
                    <p className="font-semibold text-white">Screen share resolution 1080p</p>
                    <p className="text-[10px] text-slate-400">10 minutes ago</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top User Avatar */}
          <div
            onClick={() => navigate('/dashboard')}
            className="w-9 h-9 rounded-full ring-2 ring-violet-500/50 overflow-hidden cursor-pointer hover:ring-violet-400 transition-all shrink-0"
          >
            <img
              src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. BODY CONTENT (3 COLUMNS: LEFT SIDEBAR, CENTER STAGE, RIGHT) */}
      {/* ============================================================== */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ============================================================== */}
        {/* LEFT NAVIGATION SIDEBAR                                         */}
        {/* ============================================================== */}
        <aside className="w-60 bg-[#0A0F1D] border-r border-white/6 flex flex-col justify-between shrink-0 hidden lg:flex">
          <div className="p-4 space-y-4">
            {/* Home Pill Button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-violet-600/20 text-violet-300 border border-violet-500/30 transition-all shadow-sm"
            >
              <Home className="w-4 h-4 text-violet-400" />
              <span>Home</span>
            </button>

            {/* Gradient Action Button: + Create Room */}
            <button
              onClick={() => navigate('/create')}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-violet-600/30 hover:opacity-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Room</span>
            </button>

            {/* Navigation Category Links */}
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

          {/* Upgrade to Pro Card & User Footer */}
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

            {/* User Profile Footer */}
            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/4 transition-colors cursor-pointer">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80"
                    alt={localName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-500/30"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0A0F1D] absolute -bottom-0.5 -right-0.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Robinson J.</p>
                  <p className="text-[10px] text-emerald-400 font-medium">● Online</p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </aside>

        {/* ============================================================== */}
        {/* CENTER STAGE: ROOM HEADER, BENTO VIDEO GRID & BOTTOM DOCK      */}
        {/* ============================================================== */}
        <main className="flex-1 flex flex-col min-w-0 relative bg-[#080C16]">
          {/* ROOM SUB-HEADER BAR */}
          <div className="h-16 px-6 border-b border-white/6 flex items-center justify-between gap-4 shrink-0 bg-[#0A0F1D]">
            {/* Left: Room Icon, Title, Verified Check, Live status & counter */}
            <div className="flex items-center space-x-4 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600/30 to-indigo-600/30 border border-violet-500/40 flex items-center justify-center text-violet-400 shrink-0 shadow-inner">
                {/* Audio wave icon */}
                <div className="flex items-center space-x-0.5">
                  <span className="w-0.5 h-3 bg-violet-400 rounded-full animate-pulse" />
                  <span className="w-0.5 h-4.5 bg-violet-300 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                  <span className="w-0.5 h-2.5 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h1 className="text-base font-extrabold text-white truncate">
                    {room?.roomName || 'Creative Podcast'}
                  </h1>
                  <CheckCircle className="w-4 h-4 text-violet-400 shrink-0 fill-violet-400/20" />
                  <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-[10px] uppercase tracking-wider shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {room?.description || 'Listen · Discuss · Create Together'}
                </p>
              </div>

              {/* Timer & Participants count */}
              <div className="hidden sm:flex items-center space-x-3 text-xs text-slate-400 border-l border-white/8 pl-4">
                <span className="font-mono text-slate-300">{formatDuration(elapsedSeconds)}</span>
                <div className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{participants.length || 4}</span>
                </div>
              </div>
            </div>

            {/* Right Header Action Buttons: Invite, Share, Leave Room */}
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

          {/* CENTER STAGE: BENTO GRID VIDEO TILES */}
          <div className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col justify-between gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-0">
              {/* TILE 1: YOU (LOCAL PARTICIPANT - TOP LEFT) */}
              <div className="rounded-3xl bg-[#0D1322] border border-white/8 relative overflow-hidden flex flex-col justify-between group shadow-xl">
                {/* Expand Button */}
                <div className="absolute top-3 right-3 z-10 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Video Feed or Photo Avatar */}
                <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#13192B] to-[#0A0E1A]">
                  {isCameraEnabled ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <img
                        src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80"
                        alt="You"
                        className="w-full h-full object-cover filter brightness-95"
                      />
                    </div>
                  )}
                </div>

                {/* Bottom Pill: Mic Status & Name */}
                <div className="p-3 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute bottom-0 inset-x-0 z-10">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#13192B]/90 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-sm">
                    {isMicMuted ? (
                      <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>You</span>
                    {isHost && <Crown className="w-3 h-3 text-amber-400 ml-1" />}
                  </div>
                </div>
              </div>

              {/* TILE 2: SOPHIA (CO-HOST / REMOTE SPEAKER - TOP RIGHT) */}
              <div className="rounded-3xl bg-[#0D1322] border border-white/8 relative overflow-hidden flex flex-col justify-between group shadow-xl">
                {/* Expand Button */}
                <div className="absolute top-3 right-3 z-10 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Video or Photo Avatar */}
                <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#13192B] to-[#0A0E1A]">
                  <img
                    src={sophiaAvatar}
                    alt={sophia.name}
                    className="w-full h-full object-cover filter brightness-95"
                  />
                </div>

                {/* Bottom Pill: Crown & Audio Waves */}
                <div className="p-3 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute bottom-0 inset-x-0 z-10">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#13192B]/90 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-sm">
                    <Crown className="w-3 h-3 text-purple-400" />
                    <span>{sophia.name}</span>
                    <span className="text-violet-400 ml-1 font-mono text-[10px] tracking-tight">ılı</span>
                  </div>
                </div>
              </div>

              {/* TILE 3: SHARING SCREEN (BOTTOM LEFT - SPANS 2 COLS ON DESKTOP) */}
              <div className="rounded-3xl bg-[#0D1322] border-2 border-violet-500/40 relative overflow-hidden flex flex-col justify-between group shadow-2xl md:col-span-2 lg:col-span-2">
                {/* Top Overlay Controls */}
                <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-violet-600/60 backdrop-blur-md border border-violet-400/40 text-xs font-bold text-violet-100 shadow-sm">
                    <Monitor className="w-3.5 h-3.5 text-violet-200" />
                    <span>Sharing Screen</span>
                  </div>

                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Screen Feed or Interactive Canvas Preview */}
                <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-[#0A0D18]">
                  {isSharing ? (
                    <video
                      ref={screenVideoRef}
                      autoPlay
                      playsInline
                      muted={isHost}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center space-y-4 bg-gradient-to-br from-violet-950/20 via-[#0D1322] to-cyan-950/20 relative">
                      {/* Stylized App Presentation Frame matching mockup */}
                      <div className="w-full max-w-md p-6 rounded-2xl bg-[#090D1A]/90 border border-white/10 shadow-2xl space-y-3">
                        <div className="flex items-center space-x-2 text-violet-400 text-xs font-bold">
                          <Radio className="w-4 h-4" />
                          <span>Musica Studio</span>
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight">
                          Build Together
                        </h3>
                        <p className="text-xs text-slate-400">
                          Create. Collaborate. Innovate.
                        </p>
                        {isHost ? (
                          <button
                            onClick={() => studio.startScreenShare()}
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition-all"
                          >
                            Share Screen Now
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 block">
                            Screen broadcast ready for host streaming.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* TILE 4 & 5: STACKED COLUMN FOR ALEX & EMMA (BOTTOM RIGHT) */}
              <div className="flex flex-col gap-4 justify-between">
                {/* ALEX CARD */}
                <div className="flex-1 rounded-2xl bg-[#0D1322] border border-white/8 relative overflow-hidden group shadow-lg min-h-[110px]">
                  <img
                    src={alexAvatar}
                    alt={alex.name}
                    className="w-full h-full object-cover filter brightness-95"
                  />
                  {/* Bottom details */}
                  <div className="p-2.5 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute bottom-0 inset-x-0">
                    <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#13192B]/90 backdrop-blur-md border border-white/10 text-xs font-bold text-white">
                      <MicOff className="w-3 h-3 text-rose-400" />
                      <span>{alex.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">📶</span>
                  </div>
                </div>

                {/* EMMA CARD */}
                <div className="flex-1 rounded-2xl bg-[#0D1322] border border-white/8 relative overflow-hidden group shadow-lg min-h-[110px]">
                  <img
                    src={emmaAvatar}
                    alt={emma.name}
                    className="w-full h-full object-cover filter brightness-95"
                  />
                  {/* Bottom details */}
                  <div className="p-2.5 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute bottom-0 inset-x-0">
                    <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#13192B]/90 backdrop-blur-md border border-white/10 text-xs font-bold text-white">
                      <MicOff className="w-3 h-3 text-rose-400" />
                      <span>{emma.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">📶</span>
                  </div>
                </div>
              </div>
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

                {/* 3. Screen Share Button (Viewer or Host) */}
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

                  {/* Floating Emoji Picker Popover */}
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

              {/* Right Dock Controls: Grid Mode & Fullscreen */}
              <div className="hidden sm:flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setLayoutMode(layoutMode === 'bento' ? 'grid' : 'bento')}
                  className="p-3 rounded-xl bg-[#182033] hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors"
                  title="Toggle View Mode"
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
          {/* TAB BAR: 4 TABS MATCHING MOCKUP ICON + TEXT PILLS */}
          <div className="grid grid-cols-4 gap-1 p-3 border-b border-white/6 bg-[#0B101E] shrink-0">
            {/* 1. Chat Tab */}
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

            {/* 2. Participants Tab */}
            <button
              onClick={() => setActiveTab('participants')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-[11px] font-bold transition-all ${
                activeTab === 'participants'
                  ? 'bg-violet-600/25 text-violet-300 border border-violet-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/4'
              }`}
            >
              <Users className="w-4 h-4 mb-1" />
              <span>Participants</span>
            </button>

            {/* 3. Files Tab */}
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

            {/* 4. Notes Tab */}
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

          {/* TAB 1: CHAT STREAM */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div ref={chatScrollRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                {/* Sophia Message */}
                <div className="flex items-start space-x-3">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="Sophia"
                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">Sophia</span>
                      <span className="text-[10px] text-slate-400">10:24 AM</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#13192B] border border-white/6 text-xs text-slate-200 leading-relaxed shadow-sm">
                      This looks amazing! 🎉
                    </div>
                  </div>
                </div>

                {/* Alex Message */}
                <div className="flex items-start space-x-3">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                    alt="Alex"
                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">Alex</span>
                      <span className="text-[10px] text-slate-400">10:25 AM</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#13192B] border border-white/6 text-xs text-slate-200 leading-relaxed shadow-sm">
                      Can we share the link?
                    </div>
                  </div>
                </div>

                {/* You Message (Purple Bubble with Rich Link Card) */}
                <div className="flex items-start space-x-3">
                  <img
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80"
                    alt="You"
                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">You</span>
                      <span className="text-[10px] text-slate-400">10:26 AM</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-violet-600/30 to-indigo-600/30 border border-violet-500/40 text-xs text-slate-100 leading-relaxed space-y-2 shadow-sm">
                      <p>Sure! Here it is:</p>
                      <div
                        onClick={handleCopyShareLink}
                        className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between cursor-pointer hover:bg-black/60 transition-colors"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <Share2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                          <span className="text-[11px] font-mono text-violet-300 truncate">
                            https://musica.app/room/{room?.roomId || 'CP98'}
                          </span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 ml-1.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emma Message */}
                <div className="flex items-start space-x-3">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                    alt="Emma"
                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">Emma</span>
                      <span className="text-[10px] text-slate-400">10:27 AM</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#13192B] border border-white/6 text-xs text-slate-200 leading-relaxed shadow-sm">
                      Love the new UI 💜
                    </div>
                  </div>
                </div>

                {/* Dynamic Incoming Chat Messages */}
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {msg.senderName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">{msg.senderName}</span>
                        <span className="text-[10px] text-slate-400">Now</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#13192B] border border-white/6 text-xs text-slate-200 leading-relaxed shadow-sm">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input Bar matching mockup */}
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

          {/* TAB 2: PARTICIPANTS */}
          {activeTab === 'participants' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {/* Host Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Host</span>
                <div className="p-3 rounded-2xl bg-[#13192B] border border-white/6 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80"
                      alt="Host"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">{room?.hostName || 'Robinson J.'}</span>
                      <span className="text-[10px] text-violet-400">Host (Lead)</span>
                    </div>
                  </div>
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

              {/* Other Speakers & Listeners */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Speakers & Audience ({participants.length || 4})
                </span>
                {participants.map((p) => (
                  <div key={p.id} className="p-3 rounded-2xl bg-[#13192B] border border-white/6 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-300 font-bold text-xs flex items-center justify-center">
                        {p.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{p.name}</span>
                        <span className="text-[10px] text-slate-400">{p.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {p.hasMic ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                    </div>
                  </div>
                ))}
              </div>

              {/* Waiting Lobby (If Host) */}
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

          {/* TAB 3: FILES */}
          {activeTab === 'files' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Session Files</span>
              {sharedFiles.map((f, i) => (
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
              ))}
              <button
                onClick={() => notificationService.showToast('Upload feature linked to Supabase Storage', 'info')}
                className="w-full py-2.5 rounded-xl border border-dashed border-white/15 text-xs text-slate-400 hover:text-white flex items-center justify-center space-x-1.5"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Share a file</span>
              </button>
            </div>
          )}

          {/* TAB 4: NOTES */}
          {activeTab === 'notes' && (
            <div className="flex-1 p-4 flex flex-col justify-between overflow-hidden">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                Shared Session Notes
              </span>
              <textarea
                value={sharedNotes}
                onChange={(e) => setSharedNotes(e.target.value)}
                placeholder="Jot down notes, agenda, and action items..."
                className="flex-1 w-full p-3 rounded-2xl bg-[#13192B] border border-white/6 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50 resize-none font-mono leading-relaxed"
              />
              <div className="pt-2 flex justify-between items-center text-[10px] text-slate-400">
                <span>● Synced with room</span>
                <button
                  onClick={() => notificationService.showToast('Notes saved to session history', 'success')}
                  className="px-3 py-1 rounded-lg bg-violet-600 text-white font-bold"
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
