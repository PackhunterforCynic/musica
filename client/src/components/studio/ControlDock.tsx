import React from 'react';
import { useRoomStore, useIsHost } from '../../store/roomStore';
import {
  Monitor,
  MonitorOff,
  Mic,
  MicOff,
  Lock,
  Unlock,
  Hand,
  LogOut,
  XCircle,
  Volume2,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { notificationService } from '../../services/NotificationService';

interface ControlDockProps {
  onStartShare: (includeSystemAudio?: boolean) => void;
  onStopShare: () => void;
  onToggleRaiseHand: (currentlyRaised: boolean) => void;
  onToggleLock: (currentlyLocked: boolean) => void;
  onSendReaction: (emoji: string) => void;
  onEndRoom: () => void;
  onLeaveRoom: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  onStartShare,
  onStopShare,
  onToggleRaiseHand,
  onToggleLock,
  onSendReaction,
  onEndRoom,
  onLeaveRoom,
}) => {
  const room = useRoomStore((s) => s.room);
  const localParticipant = useRoomStore((s) => s.localParticipant);
  const screenShareState = useRoomStore((s) => s.screenShareState);
  const isHost = useIsHost();

  const isSharing = screenShareState === 'Sharing' || screenShareState === 'Preparing';
  const handRaised = localParticipant?.handRaised || false;

  const reactions = ['❤️', '🔥', '👏', '🥳', '👍'];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="h-20 px-4 sm:px-8 glass-panel border-t border-slate-800/80 flex items-center justify-between gap-4 shrink-0 z-30">
      {/* Left Dock: Audio & Fullscreen / Status */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <button
          onClick={toggleFullscreen}
          className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all flex items-center space-x-1.5 text-xs font-bold"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="hidden lg:inline">Fullscreen</span>
        </button>

        {isHost && (
          <button
            onClick={() => onToggleLock(room?.locked || false)}
            className={`p-3 rounded-xl border transition-all flex items-center space-x-1.5 text-xs font-bold ${
              room?.locked
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700'
            }`}
          >
            {room?.locked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{room?.locked ? 'Locked' : 'Unlocked'}</span>
          </button>
        )}
      </div>

      {/* Center Dock: Core Media Controls & Reactions */}
      <div className="flex items-center justify-center space-x-2 sm:space-x-4">
        {/* HOST: Share Screen Control */}
        {isHost ? (
          <button
            onClick={isSharing ? onStopShare : () => onStartShare(true)}
            className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center space-x-2 shadow-xl transition-all transform hover:scale-105 ${
              isSharing
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/30'
                : 'glow-btn text-white'
            }`}
          >
            {isSharing ? (
              <>
                <MonitorOff className="w-5 h-5 animate-pulse" />
                <span>Stop Sharing</span>
              </>
            ) : (
              <>
                <Monitor className="w-5 h-5" />
                <span>Share Screen & Audio</span>
              </>
            )}
          </button>
        ) : (
          /* AUDIENCE: Raise Hand Toggle */
          <button
            onClick={() => onToggleRaiseHand(handRaised)}
            className={`px-5 py-3 rounded-2xl font-extrabold text-sm flex items-center space-x-2 transition-all transform hover:scale-105 shadow-lg ${
              handRaised
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30 animate-bounce'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80'
            }`}
          >
            <Hand className="w-5 h-5" />
            <span>{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
          </button>
        )}

        {/* Emoji Reactions Deck */}
        <div className="hidden sm:flex items-center space-x-1 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-inner">
          {reactions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              className="w-10 h-10 rounded-xl hover:bg-slate-800 flex items-center justify-center text-xl transform hover:scale-125 transition-all"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Right Dock: Leave or End Room Danger Control */}
      <div className="flex items-center space-x-3 shrink-0">
        {isHost ? (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to end the room broadcast for all audience members?')) {
                onEndRoom();
              }
            }}
            className="px-5 py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-all shadow-md"
          >
            <XCircle className="w-4 h-4" />
            <span>End Room</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (window.confirm('Leave this studio broadcast?')) {
                onLeaveRoom();
              }
            }}
            className="px-5 py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-all shadow-md"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Room</span>
          </button>
        )}
      </div>
    </div>
  );
};
