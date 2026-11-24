import React, { useEffect, useState } from 'react';
import { useRoomStore, useIsHost } from '../../store/roomStore';
import { copyToClipboard } from '../../utils/clipboard';
import { formatDuration } from '../../utils/formatters';
import { Radio, Copy, Lock, Unlock, Users, Wifi, AlertTriangle, ShieldCheck } from 'lucide-react';

export const TopBar: React.FC = () => {
  const room = useRoomStore((s) => s.room);
  const participants = useRoomStore((s) => s.participants);
  const connectionQuality = useRoomStore((s) => s.connectionQuality);
  const liveKitConnected = useRoomStore((s) => s.liveKitConnected);
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
      <div className="flex items-center space-x-2 min-w-0">
        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-sm shrink-0 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 live-pulse"></span>
          <span>LIVE</span>
        </div>

        <h1 className="text-sm font-extrabold text-white truncate max-w-[180px] sm:max-w-md">
          {room.roomName}
        </h1>

        {isHost ? (
          <span className="px-1.5 py-0.5 rounded text-sm font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
            HOST
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
            AUDIENCE
          </span>
        )}
      </div>

      {/* Right info: Mobile-first stacked layout, condenses on lg+ */}
      <div className="flex flex-col lg:flex-row items-center justify-center space-y-2 lg:space-y-0 space-x-3 shrink-0">
        {/* Duration Clock - always visible */}
        <div className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 font-mono text-sm font-semibold text-slate-300">
          <span>⏱ {formatDuration(elapsedSeconds)}</span>
        </div>

        {/* Room ID with Copy button - always visible on mobile, condensed on lg+ */}
        <button
          onClick={() => copyToClipboard(room.roomId, 'Room ID copied to clipboard!')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-sm font-medium text-purple-300 transition-all group shadow-sm"
          title="Click to copy Room ID"
        >
          <span>ID: {room.roomId}</span>
          <Copy className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
        </button>

        {/* Participant Counter */}
        <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-sm font-medium text-slate-300">
          <Users className="w-3 h-3 text-indigo-400" />
          <span>{participants.length} / {room.maxParticipants}</span>
        </div>

        {/* Lock status */}
        <div className={`rounded border text-sm ${room.locked ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-slate-500 bg-slate-900/40 border-slate-800'}`} title={room.locked ? 'Room is locked' : 'Room is unlocked'}>
          {room.locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-slate-400" />}
        </div>

        {/* Connection Quality Chip - always visible */}
        <div className={`flex items-center gap-2 rounded-full bg-slate-800/70 border border-slate-700/50 px-2.5 py-1.5 text-sm font-bold ${qualityColors[connectionQuality]}`}>
          <Wifi className="w-2.5 h-2.5" />
          <span>{connectionQuality}</span>
        </div>

        {/* LiveKit SFU Status - always visible */}
        <div className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-sm font-bold ${
          liveKitConnected
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
            : 'bg-slate-800/60 border-slate-700/50 text-slate-400'
        }`}>
          <span
            className={`w-3 h-3 rounded-full ${
              liveKitConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          ></span>
          <span>{liveKitConnected ? 'LiveKit 2.0 SFU' : 'LiveKit Standby'}</span>
        </div>
      </div>
    </div>
  );
};