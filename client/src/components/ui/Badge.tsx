import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps {
  variant?: 'live' | 'brand' | 'cyan' | 'amber' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  pulse = false,
  children,
  className,
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantStyles = {
    live: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium',
    brand: 'bg-violet-500/15 text-violet-300 border border-violet-500/30 font-medium',
    cyan: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium',
    amber: 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium',
    neutral: 'bg-slate-800/60 text-slate-300 border border-white/5',
    outline: 'bg-transparent text-slate-300 border border-white/15',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-full font-medium select-none',
          sizeStyles[size],
          variantStyles[variant],
          className
        )
      )}
    >
      {(variant === 'live' || pulse) && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      {children}
    </span>
  );
};
