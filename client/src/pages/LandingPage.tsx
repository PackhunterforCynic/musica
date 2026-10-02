import React, { useEffect, useState } from 'react';
import { Radio, Headphones, Monitor, Users, Shield, Sparkles, ArrowRight, Activity, Clock } from 'lucide-react';
import { getBrowserCompatibility } from '../utils/browserCompat';
import { notificationService } from '../services/NotificationService';
import { API_BASE_URL } from '../config/api';

interface LandingPageProps {
  onNavigate: (view: 'create' | 'join') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<{ activeRoomsCount: number; totalRoomsCreated: number; totalBroadcastMinutes: number }>({
    activeRoomsCount: 0,
    totalRoomsCreated: 0,
    totalBroadcastMinutes: 0,
  });

  useEffect(() => {
    // Check browser compatibility silently and notify if unsupported features exist
    const compat = getBrowserCompatibility();
    if (!compat.isSupported && compat.warnings.length > 0) {
      notificationService.showToast(compat.warnings[0], 'warning', 'Browser Compatibility Notice', 6000);
    }

    // Fetch platform metrics from backend
    fetch(`${API_BASE_URL}/stats`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => {
        // use fallback zeros if offline
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pb-12 relative overflow-y-auto">
      {/* Background Graphic / Waves */}
      <div className="fixed top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-blue-900/20 via-purple-900/10 to-transparent pointer-events-none mix-blend-screen" />
      <div className="absolute top-1/2 -left-20 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

      <div className="w-full max-w-md px-6 z-10">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <h1 className="text-xl font-bold text-white tracking-wide">Musica</h1>
          <button className="p-2 text-slate-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </header>

        {/* Hero Copy */}
        <div className="mt-4 space-y-4">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Real-Time Audio &<br />Screen Sharing
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
            Create or join a room and experience seamless collaboration, learning, and entertainment.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-4">
          <button
            onClick={() => onNavigate('create')}
            className="w-full py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 font-semibold text-white flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20"
          >
            <span className="text-xl leading-none font-light">+</span>
            <span>Create Room</span>
          </button>

          <button
            onClick={() => onNavigate('join')}
            className="w-full py-4 rounded-full bg-[#101423] border border-slate-700/80 text-white font-semibold flex items-center justify-center space-x-2"
          >
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span>Join Room</span>
          </button>
        </div>

        {/* Mockup Illustration Placeholder */}
        <div className="mt-10 mb-8 relative w-full aspect-video rounded-2xl bg-gradient-to-br from-[#1a1f35] to-[#0a0f1c] border border-slate-800/80 flex items-center justify-center overflow-hidden">
          <Monitor className="w-16 h-16 text-indigo-500/50" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen"></div>
        </div>

        {/* Features Section */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-white mb-6">Why Musica?</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#101423] border border-slate-800/80">
              <div className="flex items-center space-x-2 mb-2">
                <Monitor className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white">Screen Sharing</h4>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">Share your screen, window or tab</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-[#101423] border border-slate-800/80">
              <div className="flex items-center space-x-2 mb-2">
                <Headphones className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white">High Quality Audio</h4>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">Mic, system audio & more</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#101423] border border-slate-800/80">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">Real-time Chat</h4>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">Stay connected with everyone</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#101423] border border-slate-800/80">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white">Secure & Simple</h4>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">No installation required</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
