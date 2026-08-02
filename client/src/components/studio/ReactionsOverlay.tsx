import React, { useEffect, useState } from 'react';
import { useRoomStore } from '../../store/roomStore';
import confetti from 'canvas-confetti';

interface FloatingItem {
  id: string;
  emoji: string;
  senderName: string;
  leftPct: number; // random horizontal origin
}

export const ReactionsOverlay: React.FC = () => {
  const activeReactions = useRoomStore((s) => s.activeReactions);
  const [items, setItems] = useState<FloatingItem[]>([]);

  useEffect(() => {
    if (activeReactions.length === 0) return;
    const latest = activeReactions[activeReactions.length - 1];
    if (!latest) return;

    // If celebration emoji, trigger gentle canvas confetti burst
    if (latest.emoji === '🥳' || latest.emoji === '🔥') {
      confetti({
        particleCount: 25,
        spread: 70,
        origin: { y: 0.85 },
      });
    }

    const item: FloatingItem = {
      id: `${latest.id}-${Date.now()}`,
      emoji: latest.emoji,
      senderName: latest.senderName,
      leftPct: 20 + Math.random() * 60, // scatter between 20% and 80% width
    };

    setItems((prev) => [...prev, item]);

    const timer = setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      useRoomStore.getState().removeReaction(latest.id);
    }, 2500);

    return () => clearTimeout(timer);
  }, [activeReactions]);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          style={{ left: `${item.leftPct}%`, bottom: '20px' }}
          className="absolute flex flex-col items-center animate-reaction"
        >
          <span className="text-4xl sm:text-5xl filter drop-shadow-lg transform transition-transform">{item.emoji}</span>
          <span className="mt-1 px-2 py-0.5 rounded-md bg-slate-900/80 text-white font-bold text-[10px] border border-slate-700 shadow-md">
            {item.senderName}
          </span>
        </div>
      ))}
    </div>
  );
};
