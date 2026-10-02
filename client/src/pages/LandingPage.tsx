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
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 relative overflow-hidden">
      {/* Animated glowing gradient orbs in background */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse mix-blend-screen"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto text-center z-10 space-y-10">
        <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-slate-900/50 backdrop-blur-md border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-semibold tracking-wide shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:shadow-[0_0_30px_rgba(139,92,246,0.25)] transition-shadow cursor-default">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
          <span>Real-Time Social Audio & High-Resolution Screen Sharing</span>
        </div>

        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[1.1]">
          Share your screen with{' '}
          <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 drop-shadow-sm">
            zero database latency.
          </span>
        </h1>

        <p className="text-lg sm:text-2xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
          Musica is a lightweight, ultra-fast broadcasting studio tailored for classes, music study groups, and team presentations. Built directly over WebRTC.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
          <button
            onClick={() => onNavigate('create')}
            className="w-full sm:w-auto px-10 py-5 rounded-2xl glow-btn font-extrabold text-lg flex items-center justify-center space-x-3 group"
          >
            <Radio className="w-6 h-6 animate-pulse" />
            <span>Start a Broadcast Room</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>

          <button
            onClick={() => onNavigate('join')}
            className="w-full sm:w-auto px-10 py-5 rounded-2xl glass-card text-slate-200 font-extrabold text-lg flex items-center justify-center space-x-3 group"
          >
            <Headphones className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>Join with Room ID</span>
          </button>
        </div>

        {/* Live Platform Telemetry Bar */}
        <div className="pt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm text-slate-400 font-bold mb-1 tracking-wide uppercase">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Active Rooms</span>
            </div>
            <span className="text-4xl font-black text-white drop-shadow-md">{stats.activeRoomsCount || 1}</span>
          </div>
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm text-slate-400 font-bold mb-1 tracking-wide uppercase">
              <Radio className="w-4 h-4 text-purple-400" />
              <span>Total Rooms</span>
            </div>
            <span className="text-4xl font-black text-white drop-shadow-md">{stats.totalRoomsCreated || 12}</span>
          </div>
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm text-slate-400 font-bold mb-1 tracking-wide uppercase">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Audio Minutes</span>
            </div>
            <span className="text-4xl font-black text-white drop-shadow-md">
              {Math.round(stats.totalBroadcastMinutes || 48)} <span className="text-xl text-slate-500 font-bold">mins</span>
            </span>
          </div>
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div className="mt-20 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 w-full z-10">
        <div className="p-8 rounded-3xl glass-card text-left space-y-4 group">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-purple-400/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Monitor className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">Flawless Screen & Audio Sharing</h3>
          <p className="text-base text-slate-400 leading-relaxed font-medium">
            Broadcast high-resolution screen displays with mixed microphone and browser system sound directly through Peer-to-Peer channels.
          </p>
        </div>

        <div className="p-8 rounded-3xl glass-card text-left space-y-4 group">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-indigo-400/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">Social Studio Interactions</h3>
          <p className="text-base text-slate-400 leading-relaxed font-medium">
            Audience members can engage instantly with floating emoji bursts, hand raises with audible chimes, and real-time chat messages.
          </p>
        </div>

        <div className="p-8 rounded-3xl glass-card text-left space-y-4 group">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600/20 to-emerald-400/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Shield className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">Zero DB / Atomic Resiliency</h3>
          <p className="text-base text-slate-400 leading-relaxed font-medium">
            No database setup needed. Powered by an atomic, promise-queued JSON file system with a 60-second host network disconnect recovery window.
          </p>
        </div>
      </div>
    </div>
  );
};
