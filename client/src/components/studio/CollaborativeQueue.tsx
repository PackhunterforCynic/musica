import React, { useState } from 'react';
import {
  ListMusic,
  Plus,
  ThumbsUp,
  SkipForward,
  Trash2,
  Disc3,
  Music,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useRoomStore, useIsHost } from '../../store/roomStore';
import { Track, QueueItem } from '@musica/shared';
import { extractYouTubeVideoId } from '../../utils/youtube';
import { formatDuration } from '../../utils/formatters';

interface CollaborativeQueueProps {
  onAddToQueue?: (track: Track) => void;
  onVote?: (itemId: string) => void;
  onRemove?: (itemId: string) => void;
  onSkip?: () => void;
}

export const CollaborativeQueue: React.FC<CollaborativeQueueProps> = ({
  onAddToQueue,
  onVote,
  onRemove,
  onSkip,
}) => {
  const isHost = useIsHost();
  const queue = useRoomStore((s) => s.queue);
  const currentTrack = useRoomStore((s) => s.currentTrack);
  const localParticipant = useRoomStore((s) => s.localParticipant);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const ytId = extractYouTubeVideoId(searchQuery);
    const newTrack: Track = {
      id: ytId || `custom-${Date.now()}`,
      title: ytId ? `YouTube Stream (${ytId})` : searchQuery.trim(),
      artist: ytId ? 'YouTube' : (localParticipant?.name || 'Musica DJ'),
      durationSeconds: 180,
      provider: ytId ? 'youtube' : 'custom',
      streamId: ytId || undefined,
    };

    onAddToQueue?.(newTrack);
    setSearchQuery('');
    setShowAddForm(false);
  };

  const handleQuickAdd = (title: string, artist: string, streamId: string) => {
    const track: Track = {
      id: streamId,
      title,
      artist,
      durationSeconds: 210,
      provider: 'youtube',
      streamId,
    };
    onAddToQueue?.(track);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Active Track Banner */}
      <div className="p-3 bg-gradient-to-r from-indigo-950/70 to-purple-950/70 border-b border-indigo-500/20 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-1.5 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Disc3 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Now Playing</span>
          </div>
          {isHost && onSkip && (
            <button
              onClick={onSkip}
              className="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-500 rounded-lg text-white text-[11px] font-bold flex items-center space-x-1 transition-all"
              title="Skip to next track"
            >
              <SkipForward className="w-3 h-3" />
              <span>Next</span>
            </button>
          )}
        </div>

        {currentTrack ? (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Music className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{currentTrack.track.title}</p>
              <p className="text-xs text-slate-400 truncate">{currentTrack.track.artist}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No track playing. Add a song below to start the party!</p>
        )}
      </div>

      {/* Queue Action Bar */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 shrink-0">
        <div className="flex items-center space-x-2">
          <ListMusic className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Up Next ({queue.length})
          </span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-500 rounded-lg text-white text-xs font-bold flex items-center space-x-1 transition-all shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Song</span>
        </button>
      </div>

      {/* Add Song Form Drawer */}
      {showAddForm && (
        <div className="p-3 bg-[#101423] border-b border-slate-800 space-y-2.5 animate-in fade-in slide-in-from-top-2">
          <form onSubmit={handleAddTrack} className="space-y-2">
            <input
              type="text"
              placeholder="Paste YouTube link or enter song title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-xs font-bold"
              >
                Queue Song
              </button>
            </div>
          </form>

          {/* Instant Quick Picks */}
          <div className="pt-1">
            <p className="text-[10px] text-slate-500 mb-1 font-semibold flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>One-Tap Quick Picks:</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickAdd('Lofi Hip Hop Radio', 'Lofi Girl', 'jfKfPfyJRdk')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-lg border border-slate-700/60"
              >
                ☕ Lofi Radio
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd('Synthwave Beats', 'ChillDrive', '5qap5aO4i9A')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-lg border border-slate-700/60"
              >
                🌆 Synthwave
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd('Deep Focus Flow', 'Study Hub', 'DWcJFNfaw9c')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-lg border border-slate-700/60"
              >
                🌊 Deep Focus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Queue Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {queue.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <Radio className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs font-medium">The queue is currently empty.</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Click "Add Song" to queue up the next vibe.</p>
          </div>
        ) : (
          queue.map((item, index) => {
            const hasVoted = localParticipant ? item.voterIds.includes(localParticipant.id) : false;

            return (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <span className="text-xs font-mono font-bold text-slate-500 w-4 text-center">
                    {index + 1}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{item.track.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.track.artist} • <span className="text-slate-500">by {item.addedBy.name}</span>
                    </p>
                  </div>
                </div>

                {/* Vote & Moderate Actions */}
                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => onVote?.(item.id)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                      hasVoted
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                    title={hasVoted ? 'Remove upvote' : 'Upvote song'}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span className="text-[11px]">{item.votes}</span>
                  </button>

                  {isHost && onRemove && (
                    <button
                      onClick={() => onRemove(item.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-all"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

