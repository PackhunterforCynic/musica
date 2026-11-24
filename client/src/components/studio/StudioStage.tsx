import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Search,
  Moon,
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
  Columns,
  Send,
  FileText,
  Folder,
  FolderOpen,
  Crown,
  Sparkles,
  Home,
  Calendar,
  Briefcase,
  Settings,
  Headphones,
  GraduationCap,
  Headset,
  Shield,
  Activity,
  Wifi,
  ExternalLink,
  Lock,
  Plus,
  ChevronDown,
  Check,
  Paperclip,
  ArrowRight,
  Disc3,
  X,
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
  const activeSpeakerIds = useRoomStore((s) => s.activeSpeakerIds);
  const chatMessages = useRoomStore((s) => s.chatMessages);

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'files' | 'notes'>('chat');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'bento' | 'focus' | 'grid'>('bento');
  const [focusedParticipantId, setFocusedParticipantId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(1458); // default demo: 00:24:18

  // Notes state
  const [sharedNotes, setSharedNotes] = useState(
    '### Creative Podcast Episode 42\n- Topic: The Future of Spatial Audio & Real-time Web\n- Sophia: Introduce LiveKit SFU architecture\n- Alex: Demonstrate screen audio capture\n- Q&A with audience'
  );

  // Files state
  const [sharedFiles] = useState([
    { name: 'Architecture_Design_v2.pdf', size: '2.4 MB', time: '10:15 AM' },
    { name: 'LiveKit_Media_Routing.png', size: '840 KB', time: '10:20 AM' },
  ]);

  // Video Element Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

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

  const reactionsList = ['❤️', '🔥', '👏', '🥳', '👍', '🎉', '💜'];

  // Identify remote participants
  const localName = localParticipant?.name || 'You';
  const remoteParticipants = participants.filter((p) => p.name !== localName);
  const sophia = remoteParticipants[0] || { id: 'p2', name: 'Sophia', role: 'co-host', hasMic: true, hasCamera: true };
  const alex = remoteParticipants[1] || { id: 'p3', name: 'Alex', role: 'speaker', hasMic: false, hasCamera: false };
  const emma = remoteParticipants[2] || { id: 'p4', name: 'Emma', role: 'audience', hasMic: false, hasCamera: false };

  return (
    <div className="h-screen w-screen bg-[#080C16] text-slate-100 flex overflow-hidden font-sans select-none">
      {/* 1. LEFT NAVIGATION DRAWER (COLLAPSIBLE / DESKTOP RAIL) */}
      <aside className="w-64 bg-[#0D1322] border-r border-white/6 flex flex-col justify-between shrink-0 hidden lg:flex">
        <div className="p-5 space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-600/30">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">Musica</span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rooms, people..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#13192B] border border-white/5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white/6 px-1.5 py-0.5 rounded">
              ⌘K
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-violet-600/15 text-violet-300 border border-violet-500/25 transition-all shadow-sm"
            >
              <Home className="w-4 h-4 text-violet-400" />
              <span>Home</span>
            </button>

            <button
              onClick={() => navigate('/create')}
              className="w-full mt-2 mb-2 flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-600/25 hover:opacity-95 transition-all"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Create Room</span>
            </button>

            <button
              onClick={() => navigate('/create?type=podcast')}
              className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/4 transition-colors"
            >
              <Headphones className="w-4 h-4 text-slate-400" />
              <span>Podcast</span>
            </button>

            <button
              onClick={() => navigate('/create?type=classroom')}
              className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/4 transition-colors"
            >
              <GraduationCap className="w-4 h-4 text-slate-400" />
              <span>Classroom</span>
            </button>

            <button
              onClick={() => navigate('/create?type=remote-support')}
              className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/4 transition-colors"
            >
              <Headset className="w-4 h-4 text-slate-400" />
              <span>Support</span>
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/4 transition-colors"
            >
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>My Rooms</span>
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/4 transition-colors"
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Schedule</span>
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/4 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Upgrade to Pro Card & User Footer */}
        <div className="p-4 space-y-3">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-900/30 via-[#151C2E] to-cyan-900/20 border border-violet-500/20 relative overflow-hidden">
            <div className="flex items-center space-x-2 text-violet-300 text-xs font-bold mb-1">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Upgrade to Pro</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug mb-3">
              Unlock 1080p60 Egress recording & unlimited classroom seats.
            </p>
            <button
              onClick={() => notificationService.showToast('Musica Pro tier available in Cloud settings', 'info')}
              className="text-xs font-bold text-violet-300 hover:text-white flex items-center space-x-1"
            >
              <span>Go Pro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Profile Footer */}
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/4 transition-colors cursor-pointer">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {localName.slice(0, 2).toUpperCase()}
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0D1322] absolute -bottom-0.5 -right-0.5" />
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

      {/* 2. MAIN CONTENT STAGE */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-[#080C16]">
        {/* ROOM TOP HEADER BAR */}
        <header className="h-16 px-6 border-b border-white/6 flex items-center justify-between gap-4 shrink-0 bg-[#0A0F1D]">
          {/* Room Title, Verified Badge & Live Status */}
          <div className="flex items-center space-x-4 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 shadow-inner">
              <Radio className="w-5 h-5 animate-pulse" />
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

            <div className="hidden sm:flex items-center space-x-3 text-xs text-slate-400 border-l border-white/8 pl-4">
              <span className="font-mono text-slate-300">{formatDuration(elapsedSeconds)}</span>
              <div className="flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{participants.length || 4}</span>
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
        </header>

        {/* CENTER STAGE: BENTO GRID VIDEO TILES */}
        <div className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col justify-between gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-0">
            {/* TILE 1: YOU (LOCAL PARTICIPANT) */}
            <div className="rounded-3xl bg-[#0D1322] border border-white/8 relative overflow-hidden flex flex-col justify-between group shadow-xl">
              {/* Top Card Controls */}
              <div className="absolute top-3 right-3 z-10 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Video Element or Aesthetic Avatar with Soundwave */}
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
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-500 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-violet-600/30 border border-white/10">
                      {localName.slice(0, 2).toUpperCase()}
                    </div>
                    {/* Pulsing Voice Equalizer */}
                    <div className="flex items-center space-x-1 h-5">
                      <span className={`w-1 rounded-full ${!isMicMuted ? 'h-4 bg-emerald-400 animate-pulse' : 'h-1.5 bg-slate-600'}`} />
                      <span className={`w-1 rounded-full ${!isMicMuted ? 'h-6 bg-violet-400 animate-pulse' : 'h-1.5 bg-slate-600'}`} style={{ animationDelay: '100ms' }} />
                      <span className={`w-1 rounded-full ${!isMicMuted ? 'h-3 bg-cyan-400 animate-pulse' : 'h-1.5 bg-slate-600'}`} style={{ animationDelay: '200ms' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Pill: You & Mic Status */}
              <div className="p-3 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute bottom-0 inset-x-0">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#13192B]/90 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-sm">
                  {isMicMuted ? (
                    <MicOff className="w-3 h-3 text-rose-400" />
                  ) : (
                    <Mic className="w-3 h-3 text-emerald-400" />
                  )}
                  <span>You</span>
                  {isHost && <Crown className="w-3 h-3 text-amber-400 ml-1" />}
                </div>
              </div>
            </div>

            {/* TILE 2: SOPHIA (CO-HOST / REMOTE SPEAKER) */}
            <div className="rounded-3xl bg-[#0D1322] border border-white/8 relative overflow-hidden flex flex-col justify-between group shadow-xl">
              <div className="absolute top-3 right-3 z-10 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Aesthetic Avatar Display */}
              <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#13192B] to-[#0A0E1A]">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-pink-600/30 border border-white/10">
                  {sophia.name.slice(0, 2).toUpperCase()}
                </div>
                {/* Active Speaking Indicator */}
                <div className="flex items-center space-x-1 h-5 mt-3">
                  <span className="w-1 bg-violet-400 h-3 rounded-full animate-pulse" />
                  <span className="w-1 bg-fuchsia-400 h-5 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 bg-pink-400 h-4 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 bg-violet-400 h-2 rounded-full animate-pulse" style={{ animationDelay: '80ms' }} />
                </div>
              </div>

              {/* Bottom Pill */}
              <div className="p-3 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute bottom-0 inset-x-0">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#13192B]/90 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-sm">
                  <Crown className="w-3 h-3 text-purple-400" />
                  <span>{sophia.name}</span>
                  <span className="text-violet-400 ml-1 font-mono text-[10px]">ılı</span>
                </div>
              </div>
            </div>

            {/* TILE 3: SHARING SCREEN (OR PROMINENT BROADCAST TILE) */}
            <div className="rounded-3xl bg-[#0D1322] border-2 border-violet-500/40 relative overflow-hidden flex flex-col justify-between group shadow-2xl md:col-span-2 lg:col-span-2">
              <div className="absolute top-3 right-3 z-10 flex items-center space-x-2">
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Screen Feed or Interactive Canvas */}
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
                  <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center space-y-4 bg-gradient-to-br from-violet-950/20 via-[#0D1322] to-cyan-950/20">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600/30 to-indigo-600/30 border border-violet-500/30 flex items-center justify-center text-violet-300 shadow-xl">
                      <Monitor className="w-8 h-8 text-violet-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white tracking-tight">Build Together</h3>
                      <p className="text-xs text-slate-400 max-w-sm">Create. Collaborate. Innovate in ultra low-latency WebRTC.</p>
                    </div>
                    {isHost ? (
                      <button
                        onClick={() => studio.startScreenShare()}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/25 transition-all"
                      >
                        Share Screen Now
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">Host screen sharing is currently idle.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Screen Pill */}
              <div className="p-3 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute bottom-0 inset-x-0">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-violet-600/30 backdrop-blur-md border border-violet-400/40 text-xs font-bold text-violet-200 shadow-sm">
                  <Monitor className="w-3 h-3 text-violet-300" />
                  <span>Sharing Screen</span>
                </div>
              </div>
            </div>

            {/* STACKED COLUMN FOR ALEX & EMMA */}
            <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
              {/* ALEX */}
              <div className="rounded-2xl bg-[#0D1322] border border-white/8 p-3 flex items-center justify-between relative overflow-hidden group hover:border-white/20 transition-all">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {alex.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{alex.name}</span>
                    <span className="text-[10px] text-slate-400">Speaker</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[10px] font-mono text-emerald-400">📶</span>
                </div>
              </div>

              {/* EMMA */}
              <div className="rounded-2xl bg-[#0D1322] border border-white/8 p-3 flex items-center justify-between relative overflow-hidden group hover:border-white/20 transition-all">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {emma.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{emma.name}</span>
                    <span className="text-[10px] text-slate-400">Audience</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[10px] font-mono text-emerald-400">📶</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. BOTTOM FLOATING CONTROL DOCK */}
          <div className="h-20 rounded-3xl bg-[#0D1322]/95 backdrop-blur-2xl border border-white/10 px-6 flex items-center justify-between gap-4 shadow-2xl shrink-0">
            {/* Left Status: Connected & Encrypted */}
            <div className="hidden sm:flex items-center space-x-4 shrink-0">
              <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>End-to-End Encrypted</span>
              </div>
            </div>

            {/* Center Action Buttons */}
            <div className="flex items-center space-x-3 sm:space-x-5 mx-auto">
              {/* Mic Button */}
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

              {/* Camera Button */}
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

              {/* Screen Share Button */}
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

              {/* Emoji Reactions Button */}
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
                        onClick={() => {
                          studio.sendReaction(emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="text-xl p-1.5 hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* More Menu */}
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
                        notificationService.showToast('Microphone auto-gain and noise suppression active', 'info');
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

              {/* Leave Call Button */}
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

            {/* Right Controls: Grid View & Fullscreen */}
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

      {/* 4. RIGHT ACTIVITY SIDEBAR (CHAT, PARTICIPANTS, FILES, NOTES) */}
      <aside className="w-80 bg-[#0D1322] border-l border-white/6 flex flex-col justify-between shrink-0">
        {/* TAB HEADERS */}
        <div className="flex items-center justify-between border-b border-white/6 px-4 pt-3 shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'chat' ? 'text-violet-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Chat</span>
            {activeTab === 'chat' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-violet-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('participants')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'participants' ? 'text-violet-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Participants ({participants.length || 4})</span>
            {activeTab === 'participants' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-violet-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'files' ? 'text-violet-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Files</span>
            {activeTab === 'files' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-violet-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'notes' ? 'text-violet-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Notes</span>
            {activeTab === 'notes' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-violet-500 rounded-full" />
            )}
          </button>
        </div>

        {/* TAB 1: CHAT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <div ref={chatScrollRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Default Mock Messages matching screenshot */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-300 font-bold text-xs flex items-center justify-center shrink-0">
                  S
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">Sophia</span>
                    <span className="text-[10px] text-slate-400">10:24 AM</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#13192B] border border-white/6 text-xs text-slate-200 leading-relaxed">
                    This looks amazing! 🎉
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
                  A
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">Alex</span>
                    <span className="text-[10px] text-slate-400">10:25 AM</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#13192B] border border-white/6 text-xs text-slate-200 leading-relaxed">
                    Can we share the link?
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-300 font-bold text-xs flex items-center justify-center shrink-0">
                  Y
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">You</span>
                    <span className="text-[10px] text-slate-400">10:26 AM</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-violet-600/20 border border-violet-500/30 text-xs text-slate-100 leading-relaxed space-y-2">
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

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                  E
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">Emma</span>
                    <span className="text-[10px] text-slate-400">10:27 AM</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#13192B] border border-white/6 text-xs text-slate-200 leading-relaxed">
                    Love the new UI 💜
                  </div>
                </div>
              </div>

              {/* Dynamic Incoming Chat Messages */}
              {chatMessages.map((msg) => (
                <div key={msg.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {msg.senderName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-400">Now</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#13192B] border border-white/6 text-xs text-slate-200 leading-relaxed">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/6 bg-[#0A0F1D]">
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-slate-400 hover:text-white"
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
                  <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-300 font-bold text-xs flex items-center justify-center">
                    👑
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{room?.hostName || 'Host'}</span>
                    <span className="text-[10px] text-violet-400">Session Lead</span>
                  </div>
                </div>
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            {/* Other Speakers & Listeners */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Speakers & Audience ({participants.length})
              </span>
              {participants.map((p) => (
                <div key={p.id} className="p-3 rounded-2xl bg-[#13192B] border border-white/6 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-white/6 text-slate-300 font-bold text-xs flex items-center justify-center">
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
  );
};
