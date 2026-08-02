import React from 'react';
import { Radio, Shield, Zap, Sparkles } from 'lucide-react';

interface NavbarProps {
  onNavigate: (view: 'landing' | 'create' | 'join') => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView }) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-purple-400">
              Musica
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Studio
            </span>
          </div>
        </div>

        {/* Server status & quick navigation */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Atomic JSON Engine Active</span>
          </div>

          {currentView !== 'create' && (
            <button
              onClick={() => onNavigate('create')}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-all shadow-sm"
            >
              Create Room
            </button>
          )}

          {currentView !== 'join' && (
            <button
              onClick={() => onNavigate('join')}
              className="px-4 py-2 text-sm font-semibold rounded-lg glow-btn text-white transition-all shadow-md flex items-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Join Room</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
