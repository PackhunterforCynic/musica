import React from 'react';
import { useWebRTCStudio } from '../webrtc/useWebRTCStudio';
import { useRoomStore } from '../store/roomStore';
import { TopBar } from '../components/studio/TopBar';
import { MediaStage } from '../components/studio/MediaStage';
import { Sidebar } from '../components/studio/Sidebar';
import { ControlDock } from '../components/studio/ControlDock';
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
        <div className="max-w-md w-full glass-panel border border-purple-500/30 p-8 rounded-2xl flex flex-col items-center space-y-6 shadow-2xl shadow-purple-950/50">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center text-3xl animate-bounce">
            ⏳
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-white">Waiting for Host Approval</h2>
            <p className="text-sm font-medium text-slate-400">
              You are in the waiting room for <span className="text-purple-300 font-bold">{waitingRoomInfo?.roomName || roomId}</span>. The host ({waitingRoomInfo?.hostName || 'Host'}) has been notified of your request to join.
            </p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-900/40 border border-purple-500/20 text-xs text-purple-200 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            <span>Connection live • Standing by</span>
          </div>
          <button
            onClick={() => {
              studio.leaveRoom();
              onLeave();
            }}
            className="w-full py-3 px-4 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition font-semibold text-sm cursor-pointer"
          >
            Cancel Request & Leave
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* 1. Top Bar */}
      <TopBar />

      {/* 2. Main Workspace: Media Stage + Interactive Sidebar */}
      <div className="flex-1 flex min-h-0 relative">
        <MediaStage />
        <ReactionsOverlay />
        <Sidebar
          onSendMessage={(text) => studio.sendChatMessage(text)}
          onSendReaction={(emoji) => studio.sendReaction(emoji)}
          onKickUser={(socketId) => studio.kickUser(socketId)}
          onBanUser={(socketId) => studio.banUser(socketId)}
          onAdmitUser={(socketId) => studio.admitUser(socketId)}
          onDenyUser={(socketId) => studio.denyUser(socketId)}
        />
      </div>

      {/* 3. Bottom Control Dock */}
      <ControlDock
        onStartShare={(includeSystemAudio) => studio.startScreenShare(includeSystemAudio, false)}
        onStopShare={() => studio.stopScreenShare()}
        onToggleRaiseHand={(raised) => studio.toggleRaiseHand(raised)}
        onToggleLock={(locked) => studio.toggleRoomLock(locked)}
        onSendReaction={(emoji) => studio.sendReaction(emoji)}
        onEndRoom={() => {
          studio.endRoomBroadcast();
          onLeave();
        }}
        onLeaveRoom={() => {
          studio.leaveRoom();
          onLeave();
        }}
      />
    </div>
  );
};
