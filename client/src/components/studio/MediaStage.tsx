import React, { useEffect, useRef } from 'react';
import { useRoomStore, useIsHost } from '../../store/roomStore';
import { Monitor, Radio, Volume2, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';

export const MediaStage: React.FC = () => {
  const room = useRoomStore((s) => s.room);
  const screenShareState = useRoomStore((s) => s.screenShareState);
  const remoteMediaStream = useRoomStore((s) => s.remoteMediaStream);
  const localShareStream = useRoomStore((s) => s.localShareStream);
  const isHostRecovering = useRoomStore((s) => s.isHostRecovering);
  const isHost = useIsHost();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeStream = isHost ? localShareStream : remoteMediaStream;
  const isAudioOnly = activeStream && activeStream.getVideoTracks().length === 0 && activeStream.getAudioTracks().length > 0;

  useEffect(() => {
    if (videoRef.current && activeStream && !isAudioOnly) {
      videoRef.current.srcObject = activeStream;
      videoRef.current.play().catch((err) => {
        console.warn('[MediaStage] Auto-play blocked by browser:', err);
      });
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (audioRef.current && activeStream && isAudioOnly) {
      audioRef.current.srcObject = activeStream;
      audioRef.current.play().catch((err) => {
        console.warn('[MediaStage] Audio auto-play blocked by browser:', err);
      });
    } else if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
  }, [activeStream, isAudioOnly]);

  return (
    <div className="flex-1 min-w-0 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden p-4">
      {/* HOST RECOVERY WARNING BANNER */}
      {isHostRecovering && (
        <div className="absolute top-4 inset-x-4 z-40 bg-amber-500/90 backdrop-blur-md border border-amber-300 text-slate-950 px-6 py-3 rounded-2xl shadow-2xl flex items-center justify-between animate-bounce">
          <div className="flex items-center space-x-3 font-extrabold text-sm sm:text-base">
            <ShieldAlert className="w-6 h-6 text-slate-950 shrink-0" />
            <span>Host network drop detected. Maintaining room in recovery grace period (up to 60s)...</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider px-3 py-1 bg-slate-950 text-amber-300 rounded-lg">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Reconnecting</span>
          </div>
        </div>
      )}

      {/* ACTIVE MEDIA STREAM or STANDBY STUDIO SCREEN */}
      {screenShareState === 'Sharing' && activeStream ? (
        isAudioOnly ? (
          <div className="max-w-2xl w-full p-12 rounded-3xl glass-card border border-emerald-500/30 text-center relative overflow-hidden space-y-8 shadow-2xl shadow-emerald-500/10">
            <audio ref={audioRef} autoPlay playsInline muted={isHost} />
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-teal-600/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600/30 to-teal-600/30 border border-emerald-400/40 mx-auto flex items-center justify-center text-emerald-300 shadow-xl relative group">
              <Radio className="w-12 h-12 animate-bounce text-emerald-400" />
              <span className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black tracking-wider uppercase shadow-lg">
                Radio Mode
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                <span>{room?.roomName || 'Live Radio Broadcast'}</span>
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </h2>
              <p className="text-sm text-slate-300 font-medium">
                Hosted by <span className="text-emerald-400 font-bold">{room?.hostName}</span>
              </p>
            </div>

            {/* Dynamic animated equalizer bars for Audio Only mode */}
            <div className="flex items-center justify-center space-x-2 h-16 px-6 py-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <span className="w-2 bg-emerald-500 rounded-full h-4 animate-pulse"></span>
              <span className="w-2 bg-teal-400 rounded-full h-12 animate-pulse" style={{ animationDelay: '120ms' }}></span>
              <span className="w-2 bg-emerald-300 rounded-full h-8 animate-pulse" style={{ animationDelay: '240ms' }}></span>
              <span className="w-2 bg-green-500 rounded-full h-14 animate-pulse" style={{ animationDelay: '80ms' }}></span>
              <span className="w-2 bg-teal-300 rounded-full h-6 animate-pulse" style={{ animationDelay: '320ms' }}></span>
              <span className="w-2 bg-emerald-400 rounded-full h-10 animate-pulse" style={{ animationDelay: '180ms' }}></span>
              <span className="w-2 bg-teal-500 rounded-full h-12 animate-pulse" style={{ animationDelay: '280ms' }}></span>
              <span className="w-2 bg-emerald-500 rounded-full h-5 animate-pulse" style={{ animationDelay: '150ms' }}></span>
            </div>

            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-700/60 text-xs text-slate-300 font-bold">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>{isHost ? 'Broadcasting Audio Direct to Audience' : 'Receiving HD Audio Stream'}</span>
              <span className="text-emerald-400">● Live Radio</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full max-w-7xl flex items-center justify-center rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-2xl relative group">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isHost} // Host mutes local video to avoid infinite loop feedback
              className="w-full h-full object-contain max-h-[calc(100vh-14rem)]"
            />
            <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs text-slate-300 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Monitor className="w-4 h-4 text-purple-400" />
              <span>{isHost ? 'Broadcasting Local Display Stream' : `Watching ${room?.hostName || 'Host'}'s Screen`}</span>
              <span className="text-emerald-400 font-bold">● HD P2P</span>
            </div>
          </div>
        )
      ) : screenShareState === 'Preparing' ? (
        <div className="p-10 rounded-3xl glass-card flex flex-col items-center justify-center max-w-md text-center space-y-4">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          <h3 className="text-xl font-bold text-white">Preparing Live Media Stream...</h3>
          <p className="text-sm text-slate-400">Host is selecting screen window and mixing system sound channels.</p>
        </div>
      ) : (
        <div className="max-w-xl w-full p-10 rounded-3xl glass-card border border-slate-800 text-center relative overflow-hidden space-y-6 shadow-2xl">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-600/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/40 mx-auto flex items-center justify-center text-purple-300 shadow-xl">
            <Radio className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {room?.roomName || 'Live Broadcasting Studio'}
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Hosted by <span className="text-purple-300 font-bold">{room?.hostName}</span>
            </p>
          </div>

          {/* Audio Waveform visualizer placeholder */}
          <div className="flex items-center justify-center space-x-1 h-8">
            <span className="w-1.5 bg-purple-500 rounded-full h-3 animate-pulse"></span>
            <span className="w-1.5 bg-indigo-500 rounded-full h-6 animate-pulse" style={{ animationDelay: '100ms' }}></span>
            <span className="w-1.5 bg-pink-500 rounded-full h-8 animate-pulse" style={{ animationDelay: '200ms' }}></span>
            <span className="w-1.5 bg-purple-400 rounded-full h-5 animate-pulse" style={{ animationDelay: '300ms' }}></span>
            <span className="w-1.5 bg-indigo-400 rounded-full h-7 animate-pulse" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 bg-purple-500 rounded-full h-4 animate-pulse" style={{ animationDelay: '250ms' }}></span>
          </div>

          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isHost
              ? 'Click Share Screen in the control deck below to start streaming your display and audio.'
              : 'Screen sharing is currently paused or stopped by the host. Feel free to chat and engage in the sidebar!'}
          </p>
        </div>
      )}
    </div>
  );
};
