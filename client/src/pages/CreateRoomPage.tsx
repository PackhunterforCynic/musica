import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Mic2,
  GraduationCap,
  Headset,
  Monitor,
  Lock,
  ArrowLeft,
  Loader2,
  Shield,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { storageService } from '../services/StorageService';
import { notificationService } from '../services/NotificationService';
import { API_BASE_URL } from '../config/api';
import { RoomType } from '@musica/shared';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface CreateRoomPageProps {
  onBack: () => void;
  onRoomCreated: (roomId: string, hostName: string, password?: string) => void;
  initialRoomType?: RoomType;
}

export const CreateRoomPage: React.FC<CreateRoomPageProps> = ({
  onBack,
  onRoomCreated,
  initialRoomType,
}) => {
  const [searchParams] = useSearchParams();
  const queryType = (searchParams.get('type') as RoomType) || initialRoomType || 'podcast';

  const prefs = storageService.getPreferences();
  const [displayName, setDisplayName] = useState(prefs.displayName || '');
  const [roomType, setRoomType] = useState<RoomType>(queryType);
  const [roomName, setRoomName] = useState(() => {
    switch (queryType) {
      case 'private': return 'Confidential 1:1 Call';
      case 'podcast': return 'Creative Podcast';
      case 'classroom': return 'Interactive Class Session';
      case 'remote-support': return 'Support & Assistance Session';
      case 'couple': return 'Private Couple Chat';
      default: return 'Creative Podcast';
    }
  });
  const [password, setPassword] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number>(() => {
    return (queryType === 'private' || queryType === 'remote-support' || queryType === 'couple') ? 2 : 50;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (roomType === 'private' || roomType === 'remote-support' || roomType === 'couple') {
      setMaxParticipants(2);
    } else if (maxParticipants <= 2) {
      setMaxParticipants(50);
    }
  }, [roomType]);

  const roomOptions: Array<{
    id: RoomType;
    label: string;
    sublabel: string;
    icon: any;
    badge?: string;
  }> = [
    { id: 'podcast', label: 'Podcast Studio', sublabel: 'Multi-Speaker Broadcasting & Live Stage', icon: Mic2, badge: 'Studio' },
    { id: 'private', label: 'Private Call', sublabel: '1-to-1 Encrypted (Max 2)', icon: Users, badge: '1:1' },
    { id: 'classroom', label: 'Classroom', sublabel: 'Interactive Teaching & Quiz', icon: GraduationCap, badge: 'Edu' },
    { id: 'remote-support', label: 'Remote Support', sublabel: 'Screen Viewing & Laser Pointer', icon: Headset, badge: 'Assist' },
    { id: 'studio', label: 'Media Studio', sublabel: 'General Audio & Video', icon: Monitor },
  ];

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
    <div className="min-h-screen flex flex-col items-center justify-start bg-[#0B1020] text-slate-100 overflow-y-auto p-4 md:p-8">
      <div className="w-full max-w-xl pb-24">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-white/8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-white tracking-tight">Create Studio Room</h1>
            <p className="text-xs text-slate-400">Configure your real-time collaborative space</p>
          </div>
          <div className="w-16" />
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Your Display Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Johnson"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#151C2E] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm"
            />
          </div>

          {/* Room Type Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Select Experience
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roomOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = roomType === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      setRoomType(opt.id);
                      if (opt.id === 'private') setRoomName('Confidential 1:1 Call');
                      if (opt.id === 'podcast') setRoomName('Live Podcast Studio');
                      if (opt.id === 'classroom') setRoomName('Interactive Classroom');
                      if (opt.id === 'remote-support') setRoomName('Remote Support Session');
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-violet-600/15 border-violet-500 text-white shadow-md'
                        : 'bg-[#151C2E] border-white/8 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-violet-400' : 'text-slate-400'}`} />
                      {opt.badge && (
                        <Badge variant={isSelected ? 'brand' : 'neutral'} size="sm">
                          {opt.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-bold text-white">{opt.label}</div>
                    <div className="text-[11px] text-slate-400">{opt.sublabel}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room Name */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Room Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Design Strategy & Screen Review"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#151C2E] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm"
            />
          </div>

          {/* Password (Optional) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password Protection (Optional)
              </label>
              <span className="text-[11px] text-slate-500">Leave blank for public</span>
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="Optional access pin or password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#151C2E] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Capacity Constraint notice */}
          {(roomType === 'private' || roomType === 'remote-support' || roomType === 'couple') ? (
            <div className="p-3 bg-violet-500/10 border border-violet-500/25 rounded-xl flex items-center gap-2 text-xs text-violet-300">
              <Shield className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Capacity strictly enforced to <strong>2 participants</strong> for end-to-end security.</span>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Maximum Audience Capacity
              </label>
              <select
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-[#151C2E] border border-white/10 text-white focus:outline-none focus:border-violet-500 text-sm"
              >
                <option value={10}>10 Participants</option>
                <option value={25}>25 Participants</option>
                <option value={50}>50 Participants</option>
                <option value={100}>100 Participants</option>
              </select>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Launch Room Now
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
