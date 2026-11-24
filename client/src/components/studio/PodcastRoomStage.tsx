import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Hand, Radio, Disc3, CheckCircle, Users, LogOut } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface Participant {
  identity: string;
  name: string;
  role?: string;
  hasMic: boolean;
  hasCamera: boolean;
  isSpeaking?: boolean;
}

interface PodcastRoomStageProps {
  localName: string;
  isHost: boolean;
  hasLocalAudio?: boolean;
  speakers: Participant[];
  listeners: Participant[];
  handRaised: boolean;
  onToggleMic?: () => void;
  onToggleRaiseHand: () => void;
  onApproveSpeaker?: (participantId: string) => void;
  onLeave?: () => void;
}

export const PodcastRoomStage: React.FC<PodcastRoomStageProps> = ({
  localName,
  isHost,
  hasLocalAudio = true,
  speakers,
  listeners,
  handRaised,
  onToggleMic,
  onToggleRaiseHand,
  onApproveSpeaker,
  onLeave,
}) => {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div 
      role="region"
      aria-label="Podcast Studio Stage"
      className="w-full h-full flex flex-col bg-[#0B1020] text-slate-100 p-4 md:p-6 select-none overflow-y-auto"
    >
      {/* Studio Header Bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-3">
          <Badge variant="brand" size="md">
            <Radio className="w-3.5 h-3.5 mr-1 text-violet-400" />
            Live Podcast Studio
          </Badge>
          {isRecording ? (
            <Badge variant="live" size="sm" pulse>
              <Disc3 className="w-3 h-3 mr-1 animate-spin" />
              RECORDING
            </Badge>
          ) : (
            <span className="text-xs text-slate-400">Standby</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <Button
              variant={isRecording ? 'danger' : 'secondary'}
              size="sm"
              onClick={() => setIsRecording(!isRecording)}
              aria-label={isRecording ? 'Stop recording podcast episode' : 'Start recording podcast episode'}
              leftIcon={<Disc3 className="w-3.5 h-3.5" />}
            >
              {isRecording ? 'Stop Recording' : 'Record Episode'}
            </Button>
          )}
          <Badge variant="neutral" size="sm">
            <Users className="w-3 h-3 mr-1" />
            {speakers.length + listeners.length} Live
          </Badge>
        </div>
      </div>

      {/* Main Speakers Stage */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Stage Speakers ({speakers.length})
          </span>
        </div>

        <motion.div layout className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AnimatePresence>
            {speakers.map((speaker) => (
              <motion.div
                key={speaker.identity}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-4 rounded-xl bg-[#151C2E] border flex flex-col items-center justify-center relative shadow-lg ${
                  speaker.isSpeaking ? 'border-emerald-500/80 speaker-halo' : 'border-white/8'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-violet-600/20 border-2 border-violet-500/40 flex items-center justify-center mb-2">
                  <span className="text-lg font-bold text-violet-300">
                    {speaker.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="text-sm font-medium text-white truncate max-w-full">
                  {speaker.name}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {speaker.hasMic ? (
                    <Mic className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <MicOff className="w-3 h-3 text-red-400" />
                  )}
                  <span className="text-[11px] text-slate-400">
                    {speaker.role || 'Speaker'}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Audience / Listeners Section */}
      <div className="flex-1 min-h-[160px] bg-[#151C2E]/60 border border-white/8 rounded-xl p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Audience Gallery ({listeners.length})
          </span>

          <Button
            variant={handRaised ? 'primary' : 'secondary'}
            size="sm"
            onClick={onToggleRaiseHand}
            aria-pressed={handRaised}
            aria-label={handRaised ? 'Lower your hand' : 'Raise hand to speak'}
            leftIcon={<Hand className="w-3.5 h-3.5" />}
          >
            {handRaised ? 'Hand Raised' : 'Raise Hand to Speak'}
          </Button>
        </div>

        {listeners.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            No audience listeners yet. Share the room link to invite listeners.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2 overflow-y-auto">
            {listeners.map((listener) => (
              <div
                key={listener.identity}
                className="p-2 rounded-lg bg-[#0B1020] border border-white/5 flex flex-col items-center text-center"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-300 mb-1">
                  {listener.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-[11px] text-slate-300 truncate w-full">
                  {listener.name}
                </span>

                {isHost && onApproveSpeaker && (
                  <button
                    onClick={() => onApproveSpeaker(listener.identity)}
                    className="mt-1 text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-0.5 focus:outline-none"
                    aria-label={`Invite ${listener.name} to speak`}
                  >
                    <CheckCircle className="w-2.5 h-2.5" /> Invite
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dock Controls for Audio and Leaving */}
      <div className="mt-4 pt-3 border-t border-white/8 flex items-center justify-center gap-3 shrink-0">
        {onToggleMic && (
          <Button
            variant={hasLocalAudio ? 'secondary' : 'danger'}
            size="md"
            onClick={onToggleMic}
            aria-pressed={hasLocalAudio}
            aria-label={hasLocalAudio ? 'Mute microphone' : 'Unmute microphone'}
            leftIcon={hasLocalAudio ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          >
            {hasLocalAudio ? 'Mute Mic' : 'Unmute Mic'}
          </Button>
        )}

        {onLeave && (
          <Button
            variant="danger"
            size="md"
            onClick={onLeave}
            aria-label="Leave podcast room"
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Leave Room
          </Button>
        )}
      </div>
    </div>
  );
};
