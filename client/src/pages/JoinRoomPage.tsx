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
    <div className="min-h-screen flex flex-col items-center justify-start relative bg-[#050511] overflow-y-auto">
      <div className="w-full max-w-md px-6 py-6 pb-32">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 relative">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <h2 className="text-lg font-bold text-white absolute left-1/2 -translate-x-1/2">Join Room</h2>
          <div className="w-10"></div> {/* Placeholder for balance */}
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room ID */}
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Room ID</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
              </div>
              <input
                type="text"
                required
                placeholder="ABX9-72KD"
                value={roomId}
                onChange={handleRoomIdChange}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#101423] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors uppercase tracking-widest font-mono"
              />
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Your Display Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                required
                placeholder="Taylor"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#101423] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Password (if required)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-500" />
              </div>
              <input
                type="password"
                required={requiresPassword}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 rounded-xl bg-[#101423] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>

        </form>

        {/* Info Box */}
        <div className="mt-20 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-start space-x-3">
          <div className="w-5 h-5 mt-0.5 rounded-full border border-indigo-400 flex items-center justify-center text-indigo-400 text-xs shrink-0 font-bold">i</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Ask the host for the Room ID and password (if required).
          </p>
        </div>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#050511] via-[#050511] to-transparent z-20">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full max-w-md mx-auto py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 font-semibold text-white flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Join Room</span>}
          </button>
        </div>

      </div>
    </div>
  );
};
