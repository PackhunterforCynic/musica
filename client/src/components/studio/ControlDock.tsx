import React, { useState } from 'react';
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
  Speaker,
  SpeakerOff,
  Palette,
  Blur,
  Clapperboard,
} from 'lucide-react';
import { notificationService } from '../../services/NotificationService';

interface ControlDockProps {
  onStartShare: (includeSystemAudio?: boolean) => void;
  onStartAudioOnly?: () => void;
  onStopShare: () => void;
  onToggleMicrophone?: () => void;
  onToggleRaiseHand: (currentlyRaised: boolean) => void;
  onToggleLock: (currentlyLocked: boolean) => void;
  onSendReaction: (emoji: string) => void;
  onEndRoom: () => void;
  onLeaveRoom: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  onStartShare,
  onStartAudioOnly,
  onStopShare,
  onToggleMicrophone,
  onToggleRaiseHand,
  onToggleLock,
  onSendReaction,
  onEndRoom,
  onLeaveRoom,
}) => {
  const room = useRoomStore((s) => s.room);
  const localParticipant = useRoomStore((s) => s.localParticipant);
  const screenShareState = useRoomStore((s) => s.screenShareState);
  const isMicMuted = useRoomStore((s) => s.isMicMuted);
  const isHost = useIsHost();
  const canBroadcastAudio = isHost || Boolean(localParticipant?.permissions?.canBroadcastAudio);

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

  // Audio quality toggle state
  const [audioQuality, setAudioQuality] = useState<'standard' 'high' 'ultra'>('standard');

  return (
    <div className="h-20 px-4 sm:px-8 glass-panel border-t border-slate-800/80 flex items-center justify-between gap-4 shrink-0 z-30">
      {/* Left Dock: Audio & Fullscreen / Status - stacked on mobile */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 space-x-2 sm:space-x-3 shrink-0">
        <button
          onClick={toggleFullscreen}
          className="w-10 h-10 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all flex items-center justify-center text-sm font-bold"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="hidden lg:inline text-sm">Fullscreen</span>
        </button>

        {isHost && (
          <button
            onClick={() => onToggleLock(room?.locked || false)}
            className={`w-10 h-10 rounded-2xl border transition-all flex items-center justify-center text-sm font-bold ${
              room?.locked
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700'
            }`}
          >
            {room?.locked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline text-sm">{room?.locked ? 'Locked' : 'Unlocked'}</span>
          </button>
        )}

        {/* Audio Quality Selector - stacked on mobile */}
        {canBroadcastAudio && (
          <div className="w-10 h-10 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all flex items-center justify-center shrink-0">
            <Speaker className="w-4 h-4" />
            <span className="hidden sm:inline text-[9px]">{audioQuality}</span>
          </div>
        )}
      </div>

      {/* Center Dock: Core Media Controls & Reactions - stacked on mobile */}
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 space-x-2 sm:space-x-4">
        {/* LiveKit Microphone Toggle (for Host, DJ, Speaker) */}
        {canBroadcastAudio && onToggleMicrophone && (
          <button
            onClick={onToggleMicrophone}
            className={`w-full sm:w-auto px-4 py-3 rounded-2xl font-black text-sm sm:text-sm flex items-center space-x-2 transition-all transform hover:scale-105 shadow-lg ${
              !isMicMuted
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-400/50 animate-pulse'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80'
            }`}
            title={!isMicMuted ? 'Mute Microphone (LiveKit SFU)' : 'Unmute Microphone (LiveKit SFU)'}
          >
            {!isMicMuted ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-rose-400" />}
            <span className="hidden md:inline">{!isMicMuted ? 'Mic Live' : 'Muted'}</span>
          </button>
        )}

        {/* HOST: Share Media Controls */}
        {isHost ? (
          isSharing ? (
            <button
              onClick={onStopShare}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-sm flex items-center space-x-2 bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-500/30 transition-all transform hover:scale-105"
            >
              <MonitorOff className="w-5 h-5 animate-pulse" />
              <span>Stop Broadcast</span>
            </button>
          ) : (
            <div className="w-full sm:w-auto flex items-center space-x-2">
              <button
                onClick={() => onStartShare(true)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl font-black text-sm sm:text-sm flex items-center space-x-2 glow-btn text-white transition-all transform hover:scale-105 shadow-lg shadow-purple-500/20"
              >
                <Monitor className="w-4 h-4 text-purple-200" />
                <span>Share Screen</span>
              </button>
              {onStartAudioOnly && (
                <button
                  onClick={onStartAudioOnly}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl font-black text-sm sm:text-sm flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/20"
                  title="Broadcast Microphone & Audio Only (No Video)"
                >
                  <Mic className="w-4 h-4 text-emerald-200 animate-pulse" />
                  <span>Audio Only Mode</span>
                </button>
              )}
            </div>
          )
        ) : (
          /* AUDIENCE: Raise Hand Toggle */
          <button
            onClick={() => onToggleRaiseHand(handRaised)}
            className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-extrabold text-sm flex items-center space-x-2 transition-all transform hover:scale-105 shadow-lg ${
              handRaised
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30 animate-bounce'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80'
            }`}
          >
            <Hand className="w-5 h-5" />
            <span>{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
          </button>
        )}

        {/* Emoji Reactions Deck - hidden on mobile, visible on lg+ */}
        {reactions.length > 0 && !isHost && (
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
        )}
      </div>

      {/* Right Dock: Leave or End Room Danger Control */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 space-x-3 shrink-0">
        {isHost ? (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to end the room broadcast for all audience members?')) {
                onEndRoom();
              }
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-sm sm:text-sm flex items-center space-x-1.5 transition-all shadow-md"
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
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-sm sm:text-sm flex items-center space-x-1.5 transition-all shadow-md"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Room</span>
          </button>
        )}
      </div>

      {/* Audio Settings Modal (Host-only) */}
      {isHost && (
        <div
          id="audio-settings-modal"
          className="fixed inset-0 bg-black/60 backdrop-blur-xl z-40 hidden items-center justify-center"
          style={{ display: 'none' }}
        >
          <div
            className="bg-[#13192B] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl transform scale-95 opacity-0 transition-all duration-300"
            style={{ display: 'block' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Audio Settings</h3>
              <button
                onClick={() => notificationService.showToast('Audio settings toggle dismissed', 'info')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1">Audio Quality</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setAudioQuality('standard')}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      audioQuality === 'standard'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                      } transition-all`}
                  >
                    <Speaker className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => setAudioQuality('high')}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      audioQuality === 'high'
                        ? 'bg-violet-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                      } transition-all`}
                  >
                    <Speaker className="w-4 h-4 text-violet-300" />
                  </button>
                  <button
                    onClick={() => setAudioQuality('ultra')}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      audioQuality === 'ultra'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                      } transition-all`}
                  >
                    <Speaker className="w-4 h-4 text-emerald-300" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-1">Noise Suppression</label>
                <div className="flex space-x-3">
                  <label
                    className={`flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/70 text-sm ${
                      audioQuality !== 'ultra' ? 'text-slate-400 opacity-50' : 'text-emerald-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={audioQuality !== 'ultra'}
                      onChange={() => setAudioQuality((q) => (q === 'ultra' ? 'standard' : 'ultra'))}
                      className="hidden"
                    />
                    <span>Enabled</span>
                  </label>
                  <label
                    className={`flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/70 text-sm ${
                      audioQuality !== 'high' ? 'text-slate-400 opacity-50' : 'text-violet-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={audioQuality !== 'high' && audioQuality !== 'ultra'}
                      onChange={() => setAudioQuality('high')}
                      className="hidden"
                    />
                    <span>High</span>
                  </label>
                  <label
                    className={`flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/70 text-sm ${
                      audioQuality === 'ultra' ? 'text-emerald-400' : 'text-slate-400 opacity-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={audioQuality === 'ultra'}
                      onChange={() => setAudioQuality('standard')}
                      className="hidden"
                    />
                    <span>Ultra</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    notificationService.showToast('Audio settings applied', 'success');
                    // TODO: Pass audio quality to studio
                    setAudioQuality('standard');
                  }}
                  className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all"
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    notificationService.showToast('Audio settings dismissed', 'info');
                    setAudioQuality('standard');
                  }}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all ml-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
