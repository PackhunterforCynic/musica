import React, { useState, useEffect } from 'react';
import { Headphones, Lock, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { formatRoomIdInput, validateRoomId } from '../utils/formatters';
import { storageService } from '../services/StorageService';
import { notificationService } from '../services/NotificationService';
import { API_BASE_URL } from '../config/api';

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
      const res = await fetch(`${API_BASE_URL}/rooms/join`, {
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
      <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute top-1/4 -left-20 w-[300px] h-[300px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

      <div className="max-w-md w-full glass-panel rounded-[2rem] p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700/50 z-10 relative">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white mb-8 font-bold transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center space-x-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]">
            <Headphones className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Join Room</h2>
            <p className="text-sm text-slate-400 mt-1 font-medium">Tune into a live broadcast</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
              Room ID <span className="text-indigo-400">*</span> (Format: XXXX-XXXX)
            </label>
            <input
              type="text"
              required
              placeholder="ABX9-72KD"
              value={roomId}
              onChange={handleRoomIdChange}
              className="w-full px-5 py-4 text-center tracking-widest font-mono text-xl font-black rounded-xl bg-slate-900/60 border border-slate-700/60 text-indigo-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all uppercase shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
              Your Name <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alex"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
            />
          </div>

          {requiresPassword && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Room Password Required <span className="text-amber-300">*</span></span>
              </label>
              <input
                type="password"
                required={requiresPassword}
                placeholder="Enter host password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-slate-900/60 border border-amber-500/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]"
              />
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl glow-btn font-bold text-lg flex items-center justify-center space-x-2 shadow-xl disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
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
