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
      <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-1/3 -right-20 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

      <div className="max-w-md w-full glass-panel rounded-[2rem] p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700/50 z-10 relative">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white mb-8 font-bold transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center space-x-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Create Room</h2>
            <p className="text-sm text-slate-400 mt-1 font-medium">Launch a live studio session</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
              Your Display Name <span className="text-purple-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Robinson"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
              Room Name <span className="text-purple-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={64}
              placeholder="e.g. Design Review & Listening Session"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Password (Optional)</span>
              </label>
              <input
                type="password"
                placeholder="Leave blank if open"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Max Participants</span>
              </label>
              <select
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full px-5 py-4 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner appearance-none cursor-pointer"
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
