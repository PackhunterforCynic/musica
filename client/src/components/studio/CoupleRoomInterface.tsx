import React, { useEffect, useRef, useState } from 'react';
import { useRoomStore } from '../../store/roomStore';
import { notificationService } from '../../services/NotificationService';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Maximize } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface CoupleRoomInterfaceProps {
  studio: {
    leaveRoom: () => void;
    startScreenShare: (includeSystemAudio?: boolean, includeMic?: boolean) => void;
    stopScreenShare: () => void;
    startAudioOnlyShare: (includeSystemAudio?: boolean, includeMic?: boolean) => void;
  };
  onLeave: () => void;
}

export const CoupleRoomInterface: React.FC<CoupleRoomInterfaceProps> = ({ studio, onLeave }) => {
  const room = useRoomStore((s) => s.room);
  const localParticipant = useRoomStore((s) => s.localParticipant);
  const participants = useRoomStore((s) => s.participants);
  const localShareStream = useRoomStore((s) => s.localShareStream);
  const remoteMediaStream = useRoomStore((s) => s.remoteMediaStream);
  const unreadChatCount = useRoomStore((s) => s.unreadChatCount);

  const [micEnabled, setMicEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localShareStream) {
      localVideoRef.current.srcObject = localShareStream;
    } else if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, [localShareStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteMediaStream) {
      remoteVideoRef.current.srcObject = remoteMediaStream;
      remoteVideoRef.current.play().catch(e => console.warn('Autoplay prevented', e));
    } else if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, [remoteMediaStream]);

  const toggleMic = async () => {
    if (!micEnabled && !cameraEnabled) {
      studio.startAudioOnlyShare(false, true);
    } else if (localShareStream) {
      const audioTracks = localShareStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !micEnabled;
      });
    }
    setMicEnabled(!micEnabled);
  };

  const toggleCamera = async () => {
    if (!cameraEnabled) {
      studio.startScreenShare(false, micEnabled);
    } else {
      studio.stopScreenShare();
      if (micEnabled) {
        studio.startAudioOnlyShare(false, true);
      }
    }
    setCameraEnabled(!cameraEnabled);
  };

  const remoteParticipant = participants.find(p => p.id !== localParticipant?.id);

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans text-slate-100 overflow-hidden">
      
      {/* Main Call Area */}
      <div className="flex-1 flex flex-col relative h-screen">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 pointer-events-none">
          <div className="pointer-events-auto">
            <h2 className="text-xl font-bold drop-shadow-md">{room?.roomName}</h2>
            <div className="text-sm text-slate-300 drop-shadow-md opacity-80">End-to-End Encrypted</div>
          </div>
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="pointer-events-auto p-3 bg-slate-900/60 hover:bg-slate-800/80 backdrop-blur-md rounded-full text-white transition-all relative"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadChatCount > 0 && !showSidebar && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-900"></span>
            )}
          </button>
        </header>

        {/* Video Grid */}
        <div className="flex-1 bg-black relative">
          
          {/* Remote Video (Full Screen) */}
          {remoteMediaStream ? (
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-4xl shadow-xl border-4 border-slate-700/50">
                {remoteParticipant ? remoteParticipant.name.charAt(0).toUpperCase() : '?'}
              </div>
              <h3 className="text-2xl font-semibold text-slate-300">
                {remoteParticipant ? 'Waiting for video...' : 'Waiting for partner to join...'}
              </h3>
            </div>
          )}

          {/* Local Video (Floating PiP) */}
          <div className="absolute bottom-24 right-6 w-32 h-48 sm:w-48 sm:h-72 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 z-10 transition-all">
            {localShareStream && cameraEnabled ? (
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover mirror" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/50">
                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl shadow-inner">
                  {localParticipant?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold truncate max-w-[120px]">
              You
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-4 z-20 pointer-events-auto">
          <button 
            onClick={toggleMic}
            className={`p-4 rounded-full shadow-lg transition-all ${micEnabled ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-rose-500 hover:bg-rose-400 text-white'}`}
          >
            {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={toggleCamera}
            className={`p-4 rounded-full shadow-lg transition-all ${cameraEnabled ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-rose-500 hover:bg-rose-400 text-white'}`}
          >
            {cameraEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          <button 
            onClick={() => { studio.leaveRoom(); onLeave(); }}
            className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg transition-all"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 h-full bg-[#101423] border-l border-slate-800 flex flex-col z-30 transition-all shrink-0">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold">Chat</h3>
            <button onClick={() => setShowSidebar(false)} className="text-slate-400 hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <Sidebar />
          </div>
        </div>
      )}
    </div>
  );
};
