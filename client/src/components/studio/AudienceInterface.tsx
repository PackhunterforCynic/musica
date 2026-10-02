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
  Headphones,
  RefreshCw,
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
  const youtubeVideoId = useRoomStore((s) => s.youtubeVideoId);

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
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 antialiased overflow-x-hidden select-none">
      {/* 1. AUDIENCE TOP HEADER BAR */}
      <header className="px-4 py-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <button onClick={() => { studio.leaveRoom(); onLeave(); }} className="text-slate-300 p-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">{room?.roomName || 'Design Review'}</h2>
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
              <span>{room?.roomId || 'ABX9-72KD'}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">00:12:34</div>
          </div>
        </div>

        {screenShareState === 'Sharing' && (
          <div className="px-2 py-1 rounded bg-rose-600/90 text-white font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1 shadow-md">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            <span>LIVE</span>
          </div>
        )}
      </header>

      {/* 2. MAIN CONSUMER WORKSPACE */}
      <div className="flex-1 flex flex-col relative z-10 px-4 pb-24 min-h-0 bg-[#050511]">
        
        {/* Stream Viewing Deck */}
        <div className="flex-1 w-full bg-[#101423] rounded-3xl border border-slate-800/80 flex items-center justify-center relative overflow-hidden shadow-2xl mt-2 mb-4">
          {youtubeVideoId ? (
            <div className="w-full h-full relative">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0&modestbranding=1`}
                className="w-full h-full absolute inset-0 rounded-3xl pointer-events-auto"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : isReceiving ? (
            isAudioOnly ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                <video ref={videoRef} autoPlay playsInline className="hidden" />
                <div className="w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400 shadow-xl">
                  <Music className="w-10 h-10 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mt-3">Audio Broadcast</h3>
                  <p className="text-sm text-slate-400 mt-1">Listening to {host.name}</p>
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
            <div className="text-center p-8 space-y-4 max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-[#1a1f35] border border-slate-700/80 mx-auto flex items-center justify-center text-indigo-400">
                <Tv className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Waiting for host stream...
              </p>
            </div>
          )}
        </div>

        {/* Video Controls (under video) */}
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center space-x-3">
            <button onClick={toggleMute} className="text-slate-400">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => {
                // To force a refresh of the video stream, we just briefly clear and reset the srcObject
                if (videoRef.current && remoteMediaStream) {
                  videoRef.current.srcObject = null;
                  setTimeout(() => {
                    if (videoRef.current) {
                      videoRef.current.srcObject = remoteMediaStream;
                      videoRef.current.play().catch(()=>{});
                    }
                  }, 100);
                  notificationService.showToast('Stream refreshed', 'success');
                }
              }} 
              className="text-slate-400 hover:text-indigo-400 transition-colors"
              title="Refresh Stream Sync"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={toggleFullScreen} className="text-slate-400 hover:text-indigo-400 transition-colors">
              {isFullScreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Floating Bottom Navigation Bar */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-[#1a1f35]/90 backdrop-blur-xl border border-slate-700/50 rounded-full px-6 py-3 flex items-center justify-between shadow-2xl z-50">
          
          <button 
            className="flex flex-col items-center justify-center text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <Headphones className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Audio</span>
          </button>

          <button 
            onClick={() => { setShowSidebar(true); setActiveTab('chat'); }}
            className="flex flex-col items-center justify-center text-slate-400 hover:text-indigo-400 transition-colors relative"
          >
            <MessageSquare className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Chat</span>
            {unreadChatCount > 0 && (
              <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-[#1a1f35]"></span>
            )}
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowReactions(!showReactions)}
              className="flex flex-col items-center justify-center text-slate-400 hover:text-indigo-400 transition-colors"
            >
              <Smile className="w-6 h-6 mb-1 text-amber-400" />
              <span className="text-[10px] font-medium">React</span>
            </button>
            {showReactions && (
              <div className="absolute bottom-16 -left-16 bg-[#1a1f35] border border-slate-700 p-2 rounded-2xl shadow-2xl flex space-x-1 z-50 animate-in">
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

          <button 
            onClick={() => studio.toggleRaiseHand(handRaised)}
            className={`flex flex-col items-center justify-center transition-colors ${handRaised ? 'text-amber-400' : 'text-slate-400 hover:text-indigo-400'}`}
          >
            <Hand className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Raise</span>
          </button>

          <button 
            onClick={() => {
              studio.leaveRoom();
              onLeave();
            }}
            className="flex flex-col items-center justify-center text-rose-500 hover:text-rose-400 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center mb-0.5">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">Leave</span>
          </button>
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
  );
};
