import React, { useState } from 'react';
import { Radio, Lock, Users, Sparkles, ArrowLeft, Loader2, Monitor } from 'lucide-react';
import { storageService } from '../services/StorageService';
import { notificationService } from '../services/NotificationService';
import { API_BASE_URL } from '../config/api';

interface CreateRoomPageProps {
  onBack: () => void;
  onRoomCreated: (roomId: string, hostName: string, password?: string) => void;
  initialRoomType?: 'studio' | 'couple';
}

export const CreateRoomPage: React.FC<CreateRoomPageProps> = ({ onBack, onRoomCreated, initialRoomType }) => {
  const prefs = storageService.getPreferences();
  const [displayName, setDisplayName] = useState(prefs.displayName || '');
  const [roomName, setRoomName] = useState(initialRoomType === 'couple' ? 'Private Couple Chat' : 'Audio & Screen Showcase');
  const [password, setPassword] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(initialRoomType === 'couple' ? 2 : 50);
  const [roomType, setRoomType] = useState<'studio' | 'couple'>(initialRoomType || 'studio');
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
          roomType,
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
    <div className="min-h-screen flex flex-col items-center justify-start relative bg-[#050511] overflow-y-auto">
      <div className="w-full max-w-md px-6 py-6 pb-32">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 relative">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <h2 className="text-lg font-bold text-white absolute left-1/2 -translate-x-1/2">Create Room</h2>
          <div className="w-10"></div> {/* Placeholder for balance */}
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Alex Johnson"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#101423] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Room Name */}
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Room Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Users className="w-5 h-5 text-slate-500" />
              </div>
              <input
                type="text"
                required
                placeholder="Design Review"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#101423] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Password (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-500" />
              </div>
              <input
                type="password"
                placeholder="Set a password (optional)"
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

          {/* Room Type */}
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Room Type</label>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setRoomType('studio')}
                className={`flex-1 p-3 rounded-xl border ${roomType === 'studio' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-[#101423]'} transition-all`}
              >
                <Monitor className={`w-6 h-6 mx-auto mb-2 ${roomType === 'studio' ? 'text-indigo-400' : 'text-slate-500'}`} />
                <div className={`text-sm font-bold ${roomType === 'studio' ? 'text-white' : 'text-slate-400'}`}>Studio</div>
                <div className="text-[10px] text-slate-500 mt-1">1 Host to Many</div>
              </button>
              <button
                type="button"
                onClick={() => setRoomType('couple')}
                className={`flex-1 p-3 rounded-xl border ${roomType === 'couple' ? 'border-pink-500 bg-pink-500/10' : 'border-slate-800 bg-[#101423]'} transition-all`}
              >
                <Users className={`w-6 h-6 mx-auto mb-2 ${roomType === 'couple' ? 'text-pink-400' : 'text-slate-500'}`} />
                <div className={`text-sm font-bold ${roomType === 'couple' ? 'text-white' : 'text-slate-400'}`}>Couple</div>
                <div className="text-[10px] text-slate-500 mt-1">1-on-1 Video Chat</div>
              </button>
            </div>
          </div>

          {/* Max Participants */}
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Max Participants</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Users className="w-5 h-5 text-slate-500" />
              </div>
              <select
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full pl-12 pr-12 py-4 rounded-xl bg-[#101423] border border-slate-800 text-white appearance-none focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value={5}>5</option>
                <option value={15}>15</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Room Settings */}
          <div className="space-y-2 pt-2">
            <label className="block text-sm text-slate-300">Room Settings</label>
            <div className="bg-[#101423] border border-slate-800 rounded-xl p-2">
              <div className="flex items-center justify-between p-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <Monitor className="w-5 h-5 text-slate-400" />
                  <span className="text-white text-sm">Allow Webcam</span>
                </div>
                <div className="w-12 h-6 bg-indigo-500 rounded-full relative cursor-pointer">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <Monitor className="w-5 h-5 text-slate-400" />
                  <span className="text-white text-sm">Allow System Audio</span>
                </div>
                <div className="w-12 h-6 bg-indigo-500 rounded-full relative cursor-pointer">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-3">
                  <Radio className="w-5 h-5 text-slate-400" />
                  <span className="text-white text-sm">Start Muted</span>
                </div>
                <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer">
                  <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
                </div>
              </div>
            </div>
          </div>

        </form>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#050511] via-[#050511] to-transparent z-20">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full max-w-md mx-auto py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 font-semibold text-white flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Room</span>}
          </button>
        </div>

      </div>
    </div>
  );
};
