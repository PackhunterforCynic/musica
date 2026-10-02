import React from 'react';
import { useWebRTCStudio } from '../webrtc/useWebRTCStudio';
import { useRoomStore, useIsHost } from '../store/roomStore';
import { HostDashboard } from '../components/studio/HostDashboard';
import { AudienceInterface } from '../components/studio/AudienceInterface';
import { CoupleRoomInterface } from '../components/studio/CoupleRoomInterface';
import { ReactionsOverlay } from '../components/studio/ReactionsOverlay';
import { Loader2 } from 'lucide-react';

interface RoomPageProps {
  roomId: string;
  userName: string;
  password?: string;
  onLeave: () => void;
}

export const RoomPage: React.FC<RoomPageProps> = ({ roomId, userName, password, onLeave }) => {
  const studio = useWebRTCStudio(roomId, userName, password);
  const isHost = useIsHost();
  const isWaitingForHost = useRoomStore((s) => s.isWaitingForHost);
  const waitingRoomInfo = useRoomStore((s) => s.waitingRoomInfo);

  if (!roomId || !userName) {
    return (
      <div className="h-screen w-screen bg-[#050511] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Connecting to Musica Studio...</p>
      </div>
    );
  }

  if (isWaitingForHost) {
    return (
      <div className="h-screen w-screen bg-[#050511] flex flex-col relative select-none">
        {/* Header */}
        <header className="flex items-center justify-start p-6">
          <button onClick={() => { studio.leaveRoom(); onLeave(); }} className="text-slate-300 p-2 -ml-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Animated Ring */}
          <div className="relative w-32 h-32 flex items-center justify-center mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-indigo-500 border-r-purple-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-slate-800 border-b-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="w-12 h-12 text-indigo-400 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">Connecting to Room</h2>
          <p className="text-sm text-slate-400 text-center max-w-xs mb-12">
            Please wait while we set up your session...
          </p>

          {/* Room Details Card */}
          <div className="w-full max-w-sm rounded-3xl bg-[#101423] border border-slate-800/80 p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">{waitingRoomInfo?.roomName || 'Studio Room'}</h3>
              <p className="text-xs text-slate-400 mt-1">Room ID: {roomId}</p>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <span className="text-xs font-medium text-slate-300">Host: {waitingRoomInfo?.hostName || 'Host'}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                  <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <span className="text-xs font-medium text-slate-300">Waiting for admission</span>
              </div>

              {password && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                    <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <span className="text-xs font-medium text-slate-300">Password protected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#050511] overflow-hidden relative select-none">
      <ReactionsOverlay />
      {room?.roomType === 'couple' ? (
        <CoupleRoomInterface studio={studio} onLeave={onLeave} />
      ) : isHost ? (
        <HostDashboard studio={studio} onLeave={onLeave} />
      ) : (
        <AudienceInterface studio={studio} onLeave={onLeave} />
      )}
    </div>
  );
};
