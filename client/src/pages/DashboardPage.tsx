import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Users,
  Mic2,
  GraduationCap,
  Headset,
  Plus,
  ArrowRight,
  Radio,
  Sparkles,
  TrendingUp,
  Clock,
  Shield,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageTransition } from '../components/animation/PageTransition';
import { containerStaggerVariants, cardItemVariants } from '../components/animation/motionVariants';
import { API_BASE_URL } from '../config/api';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeRoomsCount: 0,
    totalRoomsCreated: 0,
    totalParticipantsJoined: 0,
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/stats`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.statistics) {
          setStats(data.statistics);
        }
      })
      .catch(() => {});
  }, []);

  const experiences = [
    {
      id: 'private',
      title: 'Private Call',
      tagline: 'Encrypted 1-to-1 Audio & Video',
      description: 'Ultra-low latency private room for confidential conversations, peer review, and screen sharing.',
      icon: Users,
      badge: 'Exactly 2 Peers',
      accentColor: 'from-violet-600 to-indigo-600',
      borderColor: 'hover:border-violet-500/50',
      actionPath: '/create?type=private',
    },
    {
      id: 'podcast',
      title: 'Podcast Studio',
      tagline: 'Multi-Speaker Broadcasting',
      description: 'Host, co-host, and speaker stages with raise-hand queue, moderator controls, and audience chat.',
      icon: Mic2,
      badge: 'Multi-Speaker',
      accentColor: 'from-fuchsia-600 to-pink-600',
      borderColor: 'hover:border-fuchsia-500/50',
      actionPath: '/create?type=podcast',
    },
    {
      id: 'classroom',
      title: 'Interactive Classroom',
      tagline: 'Online Education & Presentations',
      description: 'Teacher presentation stage, student attendance, lecture whiteboard, quiz polls, and hand-raising.',
      icon: GraduationCap,
      badge: 'Education',
      accentColor: 'from-cyan-600 to-blue-600',
      borderColor: 'hover:border-cyan-500/50',
      actionPath: '/create?type=classroom',
    },
    {
      id: 'remote-support',
      title: 'Remote Support',
      tagline: 'AnyViewer-Style Web Assistance',
      description: 'Live browser screen sharing, voice channel, interactive laser pointer annotations, and consent controls.',
      icon: Headset,
      badge: 'Assistance',
      accentColor: 'from-amber-600 to-orange-600',
      borderColor: 'hover:border-amber-500/50',
      actionPath: '/create?type=remote-support',
    },
  ];

  return (
    <PageTransition routeKey="dashboard" className="w-full min-h-screen flex bg-[#0B1020] text-slate-100">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 px-6 lg:px-10 border-b border-white/8 flex items-center justify-between shrink-0 bg-[#0B1020]/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Studio Dashboard
            </h1>
            <p className="text-xs text-slate-400">Manage real-time rooms and collaborate live</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/create')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Room
            </Button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-6 lg:p-10 space-y-8 max-w-7xl w-full mx-auto">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#151C2E] border border-white/8">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Active Live Rooms</span>
                <Radio className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">{stats.activeRoomsCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#151C2E] border border-white/8">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Total Rooms Hosted</span>
                <TrendingUp className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">{stats.totalRoomsCreated}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#151C2E] border border-white/8">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>LiveKit SFU Mode</span>
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-sm font-semibold text-white mt-1">Selective Forwarding Unit</div>
            </div>
          </div>

          {/* 4 Room Experiences Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Launch a Real-Time Experience
              </h2>
              <p className="text-xs text-slate-400">
                Select a tailored studio environment powered by LiveKit SFU media transport.
              </p>
            </div>

            <motion.div
              variants={containerStaggerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {experiences.map((exp) => {
                const Icon = exp.icon;
                return (
                  <motion.div
                    key={exp.id}
                    variants={cardItemVariants}
                    onClick={() => navigate(exp.actionPath)}
                    className={`p-6 rounded-2xl bg-[#151C2E] border border-white/8 ${exp.borderColor} transition-all duration-200 cursor-pointer group flex flex-col justify-between shadow-lg relative overflow-hidden`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${exp.accentColor} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <Badge variant="neutral" size="sm">
                          {exp.badge}
                        </Badge>
                      </div>

                      <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-violet-300 transition-colors">
                        {exp.title}
                      </h3>
                      <div className="text-xs font-medium text-slate-400 mb-2">
                        {exp.tagline}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {exp.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-slate-300 group-hover:text-white">
                      <span>Launch {exp.title}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};
