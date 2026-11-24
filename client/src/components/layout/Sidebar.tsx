import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Mic2,
  GraduationCap,
  Headset,
  PlusCircle,
  Settings,
  Radio,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Create Room', icon: PlusCircle, path: '/create', highlight: true },
    { label: 'Private Calls', icon: Users, path: '/create?type=private', badge: '1:1' },
    { label: 'Podcasts', icon: Mic2, path: '/create?type=podcast', badge: 'Studio' },
    { label: 'Classrooms', icon: GraduationCap, path: '/create?type=classroom', badge: 'Edu' },
    { label: 'Remote Support', icon: Headset, path: '/create?type=remote-support', badge: 'Assistance' },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className="w-64 bg-[#151C2E] border-r border-white/8 flex flex-col h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/8">
        <div 
          onClick={() => handleNav('/')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Musica <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-400 font-semibold uppercase">2.0</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Real-Time Studio</div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Experiences
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const currentUrl = location.pathname + location.search;
              const isActive = currentUrl === item.path || (location.pathname === item.path && !item.path.includes('?'));

              return (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-violet-600/20 text-white border border-violet-500/30'
                      : item.highlight
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30 hover:bg-violet-500'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : ''}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant={isActive ? 'brand' : 'neutral'} size="sm">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Live Status Card */}
        <div className="p-3.5 rounded-xl bg-[#0B1020] border border-white/8 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">SFU Status</span>
            <Badge variant="live" size="sm">Online</Badge>
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            LiveKit Media Mesh active with authoritative timestamp synchronization.
          </div>
        </div>
      </div>

      {/* Footer User / Settings */}
      <div className="p-4 border-t border-white/8">
        <button
          onClick={() => handleNav('/join')}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Join Existing Room
        </button>
      </div>
    </aside>
  );
};
