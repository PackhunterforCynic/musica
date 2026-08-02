import React, { useState, useEffect } from 'react';
import { Headphones, Lock, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { formatRoomIdInput, validateRoomId } from '../utils/formatters';
import { storageService } from '../services/StorageService';
import { notificationService } from '../services/NotificationService';

interface JoinRoomPageProps {
  onBack: () => void;
  onRoomJoined: (roomId: string, userName: string, password?: string) => void;
}

export const JoinRoomPage: React.FC<JoinRoomPageProps> = ({ onBack, onRoomJoined }) => {
  const prefs = storageService.getPreferences();
  const [roomId, setRoomId] = useState(prefs.lastJoinedRoomId || '');
  const [displayName, setDisplayName] = useState(prefs.displayName || '');
  const [password, setPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRoomIdInput(e.target.value);
    setRoomId(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRoomId(roomId)) {
      notificationService.showToast('Please enter a valid Room ID (XXXX-XXXX).', 'error', 'Invalid Format');
      return;
    }
    if (!displayName.trim()) {
      notificationService.showToast('Please enter your name.', 'error', 'Validation Error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          name: displayName.trim(),
          password: password.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.error && data.error.toLowerCase().includes('password')) {
          setRequiresPassword(true);
        }
        throw new Error(data.error || 'Could not join room.');
      }

      storageService.savePreferences({ displayName: displayName.trim(), lastJoinedRoomId: roomId });
      notificationService.showToast(`Connecting to ${data.roomName || 'Studio'}...`, 'info', 'Joining', 2500);
      onRoomJoined(roomId, displayName.trim(), password.trim() || undefined);
    } catch (err: any) {
      notificationService.showToast(err.message || 'Error connecting to room.', 'error', 'Join Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-10 relative">
      <div className="absolute top-1/2 -right-20 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full glass-panel rounded-3xl p-8 shadow-2xl border border-slate-700/80 z-10 relative">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white mb-6 font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shadow-inner">
            <Headphones className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Join Room</h2>
            <p className="text-xs text-slate-400">Enter a Room ID to tune into a live broadcast</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Room ID * (Format: XXXX-XXXX)
            </label>
            <input
              type="text"
              required
              placeholder="ABX9-72KD"
              value={roomId}
              onChange={handleRoomIdChange}
              className="w-full px-4 py-3 text-center tracking-widest font-mono text-lg font-extrabold rounded-xl bg-slate-900/90 border border-slate-700/80 text-purple-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Your Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alex"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {requiresPassword && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Room Password Required *</span>
              </label>
              <input
                type="password"
                required={requiresPassword}
                placeholder="Enter host password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-amber-500/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>
          )}

          <div className="pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl glow-btn font-bold text-base flex items-center justify-center space-x-2 shadow-xl disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Join Broadcast Studio</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
