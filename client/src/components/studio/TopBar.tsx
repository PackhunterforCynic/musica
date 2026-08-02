import React, { useEffect, useState } from 'react';
import { useRoomStore, useIsHost } from '../../store/roomStore';
import { copyToClipboard } from '../../utils/clipboard';
import { formatDuration } from '../../utils/formatters';
import { Radio, Copy, Lock, Unlock, Users, Wifi, AlertTriangle, ShieldCheck } from 'lucide-react';

export const TopBar: React.FC = () => {
  const room = useRoomStore((s) => s.room);
  const participants = useRoomStore((s) => s.participants);
  const connectionQuality = useRoomStore((s) => s.connectionQuality);
  const isHost = useIsHost();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!room || !room.createdAt) return;
    const startMs = new Date(room.createdAt).getTime();
    const updateClock = () => {
      const diffSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setElapsedSeconds(diffSec);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [room]);

  if (!room) return null;

  const qualityColors = {
    Excellent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    Good: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    Fair: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    Poor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    Disconnected: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
  };

  return (
    <div className="h-14 px-4 sm:px-6 glass-panel border-b border-slate-800/80 flex items-center justify-between shrink-0">
      {/* Left info: Live Badge & Title */}
      <div className="flex items-center space-x-3 min-w-0">
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs shrink-0 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-rose-500 live-pulse"></span>
          <span>LIVE</span>
        </div>

        <h1 className="text-base font-extrabold text-white truncate max-w-[220px] sm:max-w-md">
          {room.roomName}
        </h1>

        {isHost ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
            HOST
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
            AUDIENCE
          </span>
        )}
      </div>

      {/* Right info: Room ID, Clock, Stats & Quality */}
      <div className="flex items-center space-x-3 shrink-0">
        {/* Duration Clock */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800 font-mono text-xs font-semibold text-slate-300">
          <span>⏱ {formatDuration(elapsedSeconds)}</span>
        </div>

        {/* Room ID with Copy button */}
        <button
          onClick={() => copyToClipboard(room.roomId, 'Room ID copied to clipboard!')}
          className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-purple-300 transition-all group shadow-sm"
          title="Click to copy Room ID"
        >
          <span>ID: {room.roomId}</span>
          <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
        </button>

        {/* Participant Counter */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-semibold text-slate-300">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>{participants.length} / {room.maxParticipants}</span>
        </div>

        {/* Lock status */}
        <div className={`p-1.5 rounded-lg border text-xs ${room.locked ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-slate-500 bg-slate-900/40 border-slate-800'}`} title={room.locked ? 'Room is locked' : 'Room is unlocked'}>
          {room.locked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-slate-400" />}
        </div>

        {/* Connection Quality Chip */}
        <div className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${qualityColors[connectionQuality]}`}>
          <Wifi className="w-3.5 h-3.5" />
          <span>{connectionQuality}</span>
        </div>
      </div>
    </div>
  );
};
