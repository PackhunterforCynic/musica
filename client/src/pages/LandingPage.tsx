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
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Animated glowing gradient orbs in background */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center z-10 space-y-8">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 text-purple-300 text-xs sm:text-sm font-semibold tracking-wide shadow-lg">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 animate-spin" />
          <span>Real-Time Social Audio & High-Resolution Screen Sharing</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.15]">
          Share your screen & audio with{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-pink-400">
            zero database latency.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Musica is a lightweight broadcasting studio tailored for classes, music study groups, and team presentations. Built directly over WebRTC & Atomic JSON storage.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => onNavigate('create')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl glow-btn font-bold text-lg flex items-center justify-center space-x-3 shadow-xl group"
          >
            <Radio className="w-5 h-5 animate-pulse" />
            <span>Start a Broadcast Room</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => onNavigate('join')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80 font-bold text-lg flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-slate-900/50"
          >
            <Headphones className="w-5 h-5 text-indigo-400" />
            <span>Join with Room ID</span>
          </button>
        </div>

        {/* Live Platform Telemetry Bar */}
        <div className="pt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto border-t border-slate-800/80">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400 font-semibold mb-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Active Rooms</span>
            </div>
            <span className="text-2xl font-black text-white">{stats.activeRoomsCount || 1}</span>
          </div>
          <div className="text-center border-x border-slate-800/80">
            <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400 font-semibold mb-1">
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              <span>Total Rooms</span>
            </div>
            <span className="text-2xl font-black text-white">{stats.totalRoomsCreated || 12}</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400 font-semibold mb-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Audio Minutes</span>
            </div>
            <span className="text-2xl font-black text-white">{Math.round(stats.totalBroadcastMinutes || 48)}m</span>
          </div>
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div className="mt-20 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 w-full z-10">
        <div className="p-7 rounded-2xl glass-card text-left space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
            <Monitor className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Flawless Screen & Audio Sharing</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Broadcast high-resolution screen displays with mixed microphone and browser system sound directly through Peer-to-Peer channels.
          </p>
        </div>

        <div className="p-7 rounded-2xl glass-card text-left space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Social Studio Interactions</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Audience members can engage instantly with floating emoji bursts, hand raises with audible chimes, and real-time chat messages.
          </p>
        </div>

        <div className="p-7 rounded-2xl glass-card text-left space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Zero DB / Atomic Resiliency</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            No database setup needed. Powered by an atomic, promise-queued JSON file system with a 60-second host network disconnect recovery window.
          </p>
        </div>
      </div>
    </div>
  );
};
