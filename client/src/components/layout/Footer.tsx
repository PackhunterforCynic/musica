import React from 'react';
import { Database, Lock, Cpu, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-10 glass-panel border-t border-slate-800/80 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-2 text-slate-300 font-medium">
          <span>⚡ Musica Broadcasting Platform</span>
          <span className="text-slate-600">•</span>
          <span className="text-xs text-slate-400">v1.0.0 (No Database Required)</span>
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold text-slate-400">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-800">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Zero DB / JSON Storage</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>WebRTC P2P Media Mesh</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-800">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Atomic Write Protection</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 text-center md:text-right">
          © {new Date().getFullYear()} Musica. Built for ultra-low latency collaboration.
        </div>
      </div>
    </footer>
  );
};
