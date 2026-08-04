import React from 'react';
import { useWebRTCStudio } from '../webrtc/useWebRTCStudio';
import { useRoomStore, useIsHost } from '../store/roomStore';
import { HostDashboard } from '../components/studio/HostDashboard';
import { AudienceInterface } from '../components/studio/AudienceInterface';
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
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 space-y-4">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Connecting to Musica Studio...</p>
      </div>
    );
  }

  if (isWaitingForHost) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 select-none">
        <div className="max-w-md w-full glass-panel border border-purple-500/30 p-8 rounded-3xl flex flex-col items-center space-y-6 shadow-2xl shadow-purple-950/50 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-600/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="w-20 h-20 rounded-3xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-4xl animate-bounce shadow-inner">
            ⏳
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-white">Waiting for Host Approval</h2>
            <p className="text-sm font-medium text-slate-300 leading-relaxed">
              You are in the secure waiting room for <strong className="text-purple-300 font-bold">{waitingRoomInfo?.roomName || roomId}</strong>. The host ({waitingRoomInfo?.hostName || 'Host'}) has been notified of your request to join.
            </p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-900/40 border border-purple-500/30 text-xs text-purple-200 animate-pulse font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Connection Live ● Standing by for Admission</span>
          </div>
          <button
            onClick={() => {
              studio.leaveRoom();
              onLeave();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-rose-500/40 text-rose-300 font-extrabold text-xs uppercase tracking-wider shadow transition-all transform hover:scale-105"
          >
            Cancel Request & Leave
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 overflow-hidden relative select-none">
      <ReactionsOverlay />
      {isHost ? (
        <HostDashboard studio={studio} onLeave={onLeave} />
      ) : (
        <AudienceInterface studio={studio} onLeave={onLeave} />
      )}
    </div>
  );
};
