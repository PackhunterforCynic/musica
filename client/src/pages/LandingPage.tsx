import React, { useEffect, useState } from 'react';
import {
  Radio,
  Headphones,
  Monitor,
  Users,
  Shield,
  Sparkles,
  ArrowRight,
  Activity,
  Clock,
  Mic2,
  GraduationCap,
  Headset,
  Lock,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getBrowserCompatibility } from '../utils/browserCompat';
import { notificationService } from '../services/NotificationService';
import { API_BASE_URL } from '../config/api';
import { formatRoomIdInput, validateRoomId } from '../utils/formatters';

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [quickRoomCode, setQuickRoomCode] = useState('');
  const [stats, setStats] = useState<{
    activeRoomsCount: number;
    totalRoomsCreated: number;
    totalBroadcastMinutes: number;
  }>({
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

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = quickRoomCode.trim().toUpperCase();
    if (!validateRoomId(cleanCode)) {
      notificationService.showToast('Please enter a valid 4-character Room ID (e.g. ABX9).', 'error', 'Invalid Code');
      return;
    }
    onNavigate(`/join?room=${cleanCode}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1020] text-slate-100 overflow-x-hidden">
      {/* Background Glow Elements */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-100px] left-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-[50px] right-1/4 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col justify-between">
        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto pt-6 pb-14 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-semibold shadow-inner"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Musica 2.0 • LiveKit SFU + Supabase Real-Time</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight"
          >
            Listen together. Watch together.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-400">
              Connect in real time.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed"
          >
            A high-performance real-time platform engineered with four dedicated room experiences: 1-to-1 encrypted calls, podcast broadcasting, interactive online classrooms, and remote screen assistance.
          </motion.p>

          {/* ACTION ROW / QUICK JOIN BAR */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto"
          >
            <button
              onClick={() => onNavigate('/dashboard')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-violet-600/25 transition-all flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-4 h-4 text-cyan-300" />
              <span>Launch Studio Dashboard</span>
              <ArrowRight className="w-4 h-4 text-violet-200" />
            </button>

            {/* Quick Code Input */}
            <form onSubmit={handleQuickJoin} className="w-full sm:w-auto flex items-center gap-2">
              <div className="relative flex-1 sm:w-44">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="CODE (e.g. ABX9)"
                  value={quickRoomCode}
                  onChange={(e) => setQuickRoomCode(formatRoomIdInput(e.target.value))}
                  className="w-full pl-3.5 pr-3 py-3.5 rounded-2xl bg-[#151C2E] border border-white/10 text-white placeholder-slate-500 font-mono text-sm tracking-widest text-center focus:outline-none focus:border-violet-500 uppercase transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-slate-200 font-bold text-sm transition-all shadow-sm shrink-0"
              >
                Join
              </button>
            </form>
          </motion.div>
        </section>

        {/* 4 EXPERIENCES CARDS GRID */}
        <section className="py-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Four Core Room Experiences
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Configurable, purpose-built stages powered by LiveKit SFU media transport.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Private Room */}
            <div className="group rounded-3xl bg-[#151C2E]/80 border border-white/8 p-6 flex flex-col justify-between hover:border-violet-500/40 hover:bg-[#151C2E] transition-all hover:shadow-xl hover:shadow-violet-950/30">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    Max 2 Users
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                    Private Room
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    1-on-1 confidential calls with encrypted audio/video, system audio screen sharing, live timer, and automatic lobby admission.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('/create?type=private')}
                className="mt-6 w-full py-2.5 rounded-xl bg-violet-600/15 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>Start 1:1 Call</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. Podcast Studio */}
            <div className="group rounded-3xl bg-[#151C2E]/80 border border-white/8 p-6 flex flex-col justify-between hover:border-fuchsia-500/40 hover:bg-[#151C2E] transition-all hover:shadow-xl hover:shadow-fuchsia-950/30">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-fuchsia-600/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 group-hover:scale-105 transition-transform">
                    <Radio className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20">
                    Broadcast Stage
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-fuchsia-300 transition-colors">
                    Podcast Studio
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    Multi-speaker audio/video stage with audience listeners, raise-hand promotion queue, live recording status, and studio audio dock.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('/create?type=podcast')}
                className="mt-6 w-full py-2.5 rounded-xl bg-fuchsia-600/15 hover:bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>Launch Podcast</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3. Interactive Classroom */}
            <div className="group rounded-3xl bg-[#151C2E]/80 border border-white/8 p-6 flex flex-col justify-between hover:border-cyan-500/40 hover:bg-[#151C2E] transition-all hover:shadow-xl hover:shadow-cyan-950/30">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    Online Education
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                    Classroom
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    Teacher presentation stage (screen, notes, whiteboard), student attendance grid, question hand-raising, and live quiz polls.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('/create?type=classroom')}
                className="mt-6 w-full py-2.5 rounded-xl bg-cyan-600/15 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>Create Classroom</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 4. Remote Support */}
            <div className="group rounded-3xl bg-[#151C2E]/80 border border-white/8 p-6 flex flex-col justify-between hover:border-emerald-500/40 hover:bg-[#151C2E] transition-all hover:shadow-xl hover:shadow-emerald-950/30">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <Headset className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    AnyViewer Style
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Remote Support
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    Browser screen sharing with live laser pointer annotations, technician voice, and persistent customer stop-sharing safety banner.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('/create?type=remote-support')}
                className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>Start Support</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* METRICS & RELIABILITY BANNER */}
        <section className="py-8 border-t border-white/8 mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-[#151C2E]/40 border border-white/5">
              <div className="flex items-center justify-center gap-2 text-violet-400 mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Status</span>
              </div>
              <div className="text-xl font-black text-white flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Operational</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">LiveKit SFU Connected</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#151C2E]/40 border border-white/5">
              <div className="flex items-center justify-center gap-2 text-cyan-400 mb-1">
                <Radio className="w-4 h-4" />
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Active Rooms</span>
              </div>
              <div className="text-xl font-black text-white">
                {stats.activeRoomsCount > 0 ? stats.activeRoomsCount : 'Live'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">4-Char Code Rooms</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#151C2E]/40 border border-white/5">
              <div className="flex items-center justify-center gap-2 text-fuchsia-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Broadcasts</span>
              </div>
              <div className="text-xl font-black text-white">
                {stats.totalRoomsCreated > 0 ? stats.totalRoomsCreated : '24/7'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Host 60s Failover</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#151C2E]/40 border border-white/5">
              <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
                <Shield className="w-4 h-4" />
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Security</span>
              </div>
              <div className="text-xl font-black text-white">
                DTLS-SRTP
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Supabase RLS & JWKS</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
