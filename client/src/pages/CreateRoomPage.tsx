import React, { useState } from 'react';
import { Radio, Lock, Users, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { storageService } from '../services/StorageService';
import { notificationService } from '../services/NotificationService';
import { API_BASE_URL } from '../config/api';

interface CreateRoomPageProps {
  onBack: () => void;
  onRoomCreated: (roomId: string, hostName: string, password?: string) => void;
}

export const CreateRoomPage: React.FC<CreateRoomPageProps> = ({ onBack, onRoomCreated }) => {
  const prefs = storageService.getPreferences();
  const [displayName, setDisplayName] = useState(prefs.displayName || '');
  const [roomName, setRoomName] = useState('Audio & Screen Showcase');
  const [password, setPassword] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      notificationService.showToast('Please enter your display name.', 'error', 'Validation Error');
      return;
    }
    if (!roomName.trim()) {
      notificationService.showToast('Please specify a room title.', 'error', 'Validation Error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: displayName.trim(),
          roomName: roomName.trim(),
          password: password.trim() || undefined,
          maxParticipants: Number(maxParticipants),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create room.');
      }

      // Save user display name preference
      storageService.savePreferences({ displayName: displayName.trim(), lastJoinedRoomId: data.roomId });
      notificationService.showToast(`Room created successfully! ID: ${data.roomId}`, 'success', 'Room Ready', 3500);
      onRoomCreated(data.roomId, displayName.trim(), password.trim() || undefined);
    } catch (err: any) {
      notificationService.showToast(err.message || 'Error communicating with server.', 'error', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-10 relative">
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full glass-panel rounded-3xl p-8 shadow-2xl border border-slate-700/80 z-10 relative">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white mb-6 font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-inner">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Create Room</h2>
            <p className="text-xs text-slate-400">Launch a real-time studio broadcast session</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Your Display Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Robinson"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Room Name *
            </label>
            <input
              type="text"
              required
              maxLength={64}
              placeholder="e.g. Design Review & Listening Session"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center space-x-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Password (Optional)</span>
              </label>
              <input
                type="password"
                placeholder="Leave blank if open"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center space-x-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span>Max Participants</span>
              </label>
              <select
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500 transition-all"
              >
                <option value={5}>5 (Intimate Group)</option>
                <option value={15}>15 (Standard Team)</option>
                <option value={50}>50 (Full Class / Showcase)</option>
                <option value={100}>100 (Max Capacity)</option>
              </select>
            </div>
          </div>

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
                  <span>Launch Broadcast Studio</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
