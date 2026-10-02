import React, { useEffect, useRef, useState } from 'react';
import { useRoomStore } from '../../store/roomStore';
import { notificationService } from '../../services/NotificationService';
import { Sidebar } from './Sidebar';
import {
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Tv,
  Hand,
  LogOut,
  Users,
  MessageSquare,
  Radio as RadioIcon,
  Sparkles,
  Wifi,
  Smile,
  ChevronRight,
  Shield,
  Music,
} from 'lucide-react';

interface AudienceInterfaceProps {
  studio: {
    toggleRaiseHand: (currentlyRaised: boolean) => void;
    sendReaction: (emoji: string) => void;
    leaveRoom: () => void;
    sendChatMessage?: (text: string) => void;
  };
  onLeave: () => void;
}

const REACTION_EMOJIS = ['👍', '❤️', '🔥', '🎉', '👏', '🎵'];

export const AudienceInterface: React.FC<AudienceInterfaceProps> = ({ studio, onLeave }) => {
  const room = useRoomStore((s) => s.room);
  const localParticipant = useRoomStore((s) => s.localParticipant);
  const participants = useRoomStore((s) => s.participants);
  const remoteMediaStream = useRoomStore((s) => s.remoteMediaStream);
  const screenShareState = useRoomStore((s) => s.screenShareState);
  const connectionQuality = useRoomStore((s) => s.connectionQuality);
  const unreadChatCount = useRoomStore((s) => s.unreadChatCount);

  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [showReactions, setShowReactions] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  const host = participants.find((p) => p.role === 'host') || { name: 'Host' };
  const isAudioOnly = Boolean(remoteMediaStream && remoteMediaStream.getVideoTracks().length === 0 && remoteMediaStream.getAudioTracks().length > 0);

  const isReceiving = !!remoteMediaStream;
  const handRaised = localParticipant?.handRaised || false;

  useEffect(() => {
    if (videoRef.current && remoteMediaStream) {
      videoRef.current.srcObject = remoteMediaStream;
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.play().catch(() => {
        // Handle autoplay policies gracefully
      });
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [remoteMediaStream, volume, isMuted]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : val;
    }
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.volume = nextMuted ? 0 : volume;
    }
    notificationService.showToast(`Audio playback ${nextMuted ? 'muted' : 'unmuted'}`, 'info');
  };

  const toggleFullScreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {
        notificationService.showToast('Fullscreen not supported on this browser display', 'warning');
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        notificationService.showToast('Exited Picture-in-Picture window', 'info');
      } else if (document.pictureInPictureEnabled && remoteMediaStream && !isAudioOnly) {
        await videoRef.current.requestPictureInPicture();
        notificationService.showToast('Floating Picture-in-Picture active', 'success');
      } else {
        notificationService.showToast('PiP is available during active screen streaming', 'warning');
      }
    } catch (err: any) {
      notificationService.showToast('Could not initiate PiP mode', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 antialiased overflow-hidden select-none">
      {/* 1. AUDIENCE TOP HEADER BAR */}
      <header className="h-16 px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shrink-0 z-20 shadow-xl">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow">
              <RadioIcon className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Room ID:</span>
              <span className="ml-2 font-mono text-sm font-black text-white">{room?.roomId || 'ACTIVE'}</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-bold text-slate-200">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Host: <strong className="text-white">{host.name}</strong></span>
          </div>

          {screenShareState === 'Sharing' && (
            <span className="px-2.5 py-1 rounded-lg bg-rose-600/90 text-white font-black text-[10px] uppercase tracking-widest flex items-center space-x-1.5 shadow-md animate-pulse">
              <span>● LIVE BROADCAST</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-extrabold text-slate-300">
            <Users className="w-4 h-4 text-purple-400" />
            <span>{participants.length}</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-extrabold text-emerald-300">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>{connectionQuality === 'Good' ? '📶 Good' : connectionQuality}</span>
          </div>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-2 rounded-xl border transition-all ${
              showSidebar
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Toggle Chat & Roster"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadChatCount > 0 && !showSidebar && (
              <span className="absolute top-3 right-5 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </button>
        </div>
      </header>

      {/* 2. MAIN CONSUMER WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative bg-slate-950">
        {/* Stream Viewing Deck */}
        <div className="flex-1 flex flex-col p-3 sm:p-6 min-w-0 space-y-4 overflow-y-auto">
          {/* Main Video & Audio Stage */}
          <div
            ref={playerContainerRef}
            className="flex-1 min-h-[250px] md:min-h-[380px] max-h-[calc(100vh-14rem)] bg-slate-900/90 rounded-3xl border border-slate-800 flex flex-col relative overflow-hidden shadow-2xl group justify-between p-2 sm:p-4"
          >
            {/* Stage Media Display */}
            <div className="flex-1 w-full h-full flex items-center justify-center min-h-0 relative rounded-2xl overflow-hidden bg-slate-950">
              {isReceiving ? (
                isAudioOnly ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/20">
                    <div className="w-24 h-24 rounded-3xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-2xl">
                      <Music className="w-12 h-12 animate-bounce" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                        Radio Audio Mode Active
                      </span>
                      <h3 className="text-2xl font-black text-white mt-3">High-Fidelity Audio Broadcast</h3>
                      <p className="text-xs text-slate-400 mt-1">Listening to live studio feed from {host.name}</p>
                    </div>
                    {/* Visualizer Equalizer Waves */}
                    <div className="flex items-center justify-center space-x-2 h-12 px-6 py-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="w-1.5 bg-emerald-400 rounded-full h-4 animate-pulse"></span>
                      <span className="w-1.5 bg-teal-400 rounded-full h-8 animate-pulse" style={{ animationDelay: '100ms' }}></span>
                      <span className="w-1.5 bg-green-400 rounded-full h-10 animate-pulse" style={{ animationDelay: '250ms' }}></span>
                      <span className="w-1.5 bg-emerald-300 rounded-full h-6 animate-pulse" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 bg-teal-300 rounded-full h-9 animate-pulse" style={{ animationDelay: '300ms' }}></span>
                      <span className="w-1.5 bg-green-500 rounded-full h-5 animate-pulse" style={{ animationDelay: '200ms' }}></span>
                    </div>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <div className="text-center p-8 space-y-4 max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 mx-auto flex items-center justify-center text-purple-400">
                    <Tv className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Waiting for Host Stream...</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You are connected to the live studio room. The broadcast stream will automatically appear here as soon as {host.name} initiates sharing.
                  </p>
                </div>
              )}
            </div>

            {/* AUDIENCE VIEWER CONTROL BAR (From Mockup) */}
            <div className="h-16 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-slate-800/90 px-6 mt-3 flex items-center justify-between shrink-0 shadow-xl">
              {/* Left Volume Controls */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleMute}
                  className="text-slate-300 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
                  title="Toggle Audio Mute"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-purple-400" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-28 sm:w-36 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  title="Audio Playback Volume"
                />
              </div>

              {/* Center Viewer Actions (Mute, Fullscreen, PiP) */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleMute}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all ${
                    isMuted
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>

                <button
                  onClick={toggleFullScreen}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-800 flex items-center space-x-2 transition-all"
                >
                  {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  <span>Fullscreen</span>
                </button>

                <button
                  onClick={togglePiP}
                  disabled={!isReceiving || isAudioOnly}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-800 flex items-center space-x-2 transition-all disabled:opacity-40 disabled:pointer-events-none"
                  title="Picture-in-Picture Pop-out Window"
                >
                  <Tv className="w-4 h-4 text-indigo-400" />
                  <span>PiP</span>
                </button>
              </div>

              {/* Right Interactive Controls */}
              <div className="flex items-center space-x-3">
                {/* Raise Hand Button */}
                <button
                  onClick={() => studio.toggleRaiseHand(handRaised)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all transform hover:scale-105 shadow-md ${
                    handRaised
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30 animate-bounce'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title="Raise Hand to speak or alert host"
                >
                  <Hand className="w-4 h-4" />
                  <span className="hidden md:inline">{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
                </button>

                {/* Emoji Reaction Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowReactions(!showReactions)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                    title="Send Quick Emoji Reaction"
                  >
                    <Smile className="w-4 h-4 text-amber-400" />
                  </button>

                  {showReactions && (
                    <div className="absolute bottom-12 right-0 bg-slate-900 border border-slate-700 p-2 rounded-2xl shadow-2xl flex space-x-1 z-30 animate-in">
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            studio.sendReaction(emoji);
                            setShowReactions(false);
                          }}
                          className="p-2 hover:bg-slate-800 rounded-xl text-lg transition-transform hover:scale-125"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Leave Room Button */}
                <button
                  onClick={() => {
                    studio.leaveRoom();
                    onLeave();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-rose-600/30 transition-transform hover:scale-105"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Leave</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. RIGHT AUDIENCE SIDEBAR (CHAT & PARTICIPANTS FROM MOCKUP) */}
        {showSidebar && (
          <aside className="w-80 sm:w-96 bg-slate-900/95 border-l border-slate-800 flex flex-col shrink-0 z-20 shadow-2xl animate-in">
            <div className="flex border-b border-slate-800 p-2 space-x-2 bg-slate-950/40">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                  activeTab === 'chat'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setActiveTab('participants')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                  activeTab === 'participants'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Participants ({participants.length})</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <Sidebar
                onSendMessage={(text) => studio.sendChatMessage?.(text)}
                onSendReaction={(emoji) => studio.sendReaction(emoji)}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
