import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  ScreenShare,
  Hand,
  HelpCircle,
  UserCheck,
  Mic,
  MicOff,
  LogOut,
  Monitor,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface Student {
  identity: string;
  name: string;
  handRaised?: boolean;
}

interface ClassroomStageProps {
  isTeacher: boolean;
  teacherName: string;
  students: Student[];
  handRaised: boolean;
  hasLocalAudio?: boolean;
  isScreenSharing?: boolean;
  presentationStream?: MediaStream | null;
  pollVotes?: { A: number; B: number };
  onToggleMic?: () => void;
  onToggleScreenShare?: () => void;
  onToggleRaiseHand: () => void;
  onVotePoll?: (optionIndex: number) => void;
  onLeave?: () => void;
}

export const ClassroomStage: React.FC<ClassroomStageProps> = ({
  isTeacher,
  teacherName,
  students,
  handRaised,
  hasLocalAudio = true,
  isScreenSharing = false,
  presentationStream,
  pollVotes = { A: 4, B: 8 },
  onToggleMic,
  onToggleScreenShare,
  onToggleRaiseHand,
  onVotePoll,
  onLeave,
}) => {
  const [activeTab, setActiveTab] = useState<'screen' | 'whiteboard' | 'notes'>('screen');
  const [hasVoted, setHasVoted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && presentationStream) {
      videoRef.current.srcObject = presentationStream;
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [presentationStream]);

  const studentsWithHandRaised = students.filter((s) => s.handRaised);

  return (
    <div 
      role="region"
      aria-label="Interactive Classroom Stage"
      className="w-full h-full flex flex-col bg-[#0B1020] text-slate-100 p-4 select-none overflow-hidden"
    >
      {/* Classroom Top Bar */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-3">
          <Badge variant="brand" size="md">
            <GraduationCap className="w-3.5 h-3.5 mr-1" />
            Live Classroom
          </Badge>
          <div className="text-xs text-slate-300 font-medium">
            Instructor: <span className="text-white font-semibold">{teacherName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm">
            <UserCheck className="w-3 h-3 mr-1" />
            {students.length} Enrolled
          </Badge>

          {!isTeacher && (
            <Button
              variant={handRaised ? 'primary' : 'secondary'}
              size="sm"
              onClick={onToggleRaiseHand}
              aria-pressed={handRaised}
              aria-label={handRaised ? 'Lower your hand' : 'Raise hand to ask question'}
              leftIcon={<Hand className="w-3.5 h-3.5" />}
            >
              {handRaised ? 'Hand Raised' : 'Raise Hand'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Left 3 cols: Teacher Presentation Stage */}
        <div className="lg:col-span-3 flex flex-col min-h-0 bg-[#151C2E] border border-white/8 rounded-2xl overflow-hidden shadow-xl">
          {/* Accessible View Mode Tabs */}
          <div 
            role="tablist" 
            aria-label="Classroom View Tabs"
            className="h-10 px-4 bg-[#0B1020]/60 border-b border-white/8 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <button
                role="tab"
                id="tab-screen"
                aria-selected={activeTab === 'screen'}
                aria-controls="panel-screen"
                tabIndex={activeTab === 'screen' ? 0 : -1}
                onClick={() => setActiveTab('screen')}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  activeTab === 'screen' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Screen / Lecture
              </button>
              <button
                role="tab"
                id="tab-whiteboard"
                aria-selected={activeTab === 'whiteboard'}
                aria-controls="panel-whiteboard"
                tabIndex={activeTab === 'whiteboard' ? 0 : -1}
                onClick={() => setActiveTab('whiteboard')}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  activeTab === 'whiteboard' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Whiteboard
              </button>
              <button
                role="tab"
                id="tab-notes"
                aria-selected={activeTab === 'notes'}
                aria-controls="panel-notes"
                tabIndex={activeTab === 'notes' ? 0 : -1}
                onClick={() => setActiveTab('notes')}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  activeTab === 'notes' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Lecture Notes
              </button>
            </div>
            <Badge variant="live" size="sm">Classroom Broadcast Active</Badge>
          </div>

          {/* Presentation Viewer with Video Support */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-radial from-slate-900 to-[#151C2E] relative overflow-hidden">
            {activeTab === 'screen' && (
              presentationStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted={isTeacher}
                  className="w-full h-full object-contain rounded-xl max-h-[calc(100vh-14rem)]"
                />
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 rounded-2xl bg-violet-600/20 border border-violet-500/30 mx-auto flex items-center justify-center text-violet-400">
                    <ScreenShare className="w-10 h-10" />
                  </div>
                  <div className="text-base font-semibold text-white">Teacher Presentation Stage</div>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Instructor slides, shared screens, and live code examples appear in this broadcast view.
                  </p>
                  {isTeacher && onToggleScreenShare && (
                    <div className="pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={onToggleScreenShare}
                        leftIcon={<Monitor className="w-4 h-4" />}
                      >
                        Share Screen to Students
                      </Button>
                    </div>
                  )}
                </div>
              )
            )}

            {activeTab === 'whiteboard' && (
              <div 
                id="panel-whiteboard"
                role="tabpanel"
                aria-labelledby="tab-whiteboard"
                className="w-full h-full border border-dashed border-white/10 rounded-xl flex items-center justify-center text-xs text-slate-400"
              >
                Interactive Collaborative Whiteboard Active
              </div>
            )}

            {activeTab === 'notes' && (
              <div 
                id="panel-notes"
                role="tabpanel"
                aria-labelledby="tab-notes"
                className="w-full h-full p-4 overflow-y-auto text-left text-xs text-slate-300 space-y-2 font-mono"
              >
                <div className="font-bold text-violet-400">Lesson Outline: Real-Time Audio & Video Topologies</div>
                <p>1. Mesh vs SFU vs MCU architectures</p>
                <p>2. Selective Forwarding Units (LiveKit Cloud) advantages</p>
                <p>3. Clock drift correction and NTP timestamp sync formulas: P(t) = P0 + (t - T0) * r</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 col: Students Gallery & Hand Queue */}
        <div className="flex flex-col gap-3 min-h-0">
          {/* Hand Raise Queue */}
          <div className="p-3 bg-[#151C2E] border border-white/8 rounded-xl shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Raised Hands ({studentsWithHandRaised.length})
              </span>
              <Hand className="w-3.5 h-3.5 text-amber-400" />
            </div>

            {studentsWithHandRaised.length === 0 ? (
              <div className="text-[11px] text-slate-400 py-1">No pending questions.</div>
            ) : (
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {studentsWithHandRaised.map((student) => (
                  <div
                    key={student.identity}
                    className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs"
                  >
                    <span className="text-amber-200 truncate">{student.name}</span>
                    {isTeacher && (
                      <span className="text-[10px] text-amber-400 font-medium">Called</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real-time Quiz Poll */}
          <div className="p-3 bg-[#151C2E] border border-white/8 rounded-xl flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Live Quiz Poll
              </span>
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            </div>

            <div className="text-xs text-white font-medium mb-3">
              Does an SFU decode and re-encode every audio stream?
            </div>

            <div className="space-y-2 flex-1">
              <button
                onClick={() => {
                  if (!hasVoted) {
                    onVotePoll?.(0);
                    setHasVoted(true);
                  }
                }}
                disabled={hasVoted}
                aria-pressed={hasVoted}
                className="w-full p-2 rounded-lg bg-[#0B1020] border border-white/10 hover:border-violet-500/40 text-left text-xs flex items-center justify-between transition-colors disabled:opacity-80"
              >
                <span>A) Yes, every frame</span>
                <span className="font-mono text-slate-400 tabular-nums">{pollVotes.A}</span>
              </button>

              <button
                onClick={() => {
                  if (!hasVoted) {
                    onVotePoll?.(1);
                    setHasVoted(true);
                  }
                }}
                disabled={hasVoted}
                aria-pressed={hasVoted}
                className="w-full p-2 rounded-lg bg-[#0B1020] border border-white/10 hover:border-violet-500/40 text-left text-xs flex items-center justify-between transition-colors disabled:opacity-80"
              >
                <span>B) No, it selectively forwards packets</span>
                <span className="font-mono text-slate-400 tabular-nums">{pollVotes.B}</span>
              </button>
            </div>
            {hasVoted && (
              <div 
                role="status"
                aria-live="polite"
                className="mt-2 text-[10px] text-emerald-400 text-center font-medium"
              >
                Vote broadcasted to classroom!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Classroom Bottom Controls */}
      <div className="mt-3 pt-2 border-t border-white/8 flex items-center justify-center gap-3 shrink-0">
        {onToggleMic && (
          <Button
            variant={hasLocalAudio ? 'secondary' : 'danger'}
            size="sm"
            onClick={onToggleMic}
            aria-pressed={hasLocalAudio}
            aria-label={hasLocalAudio ? 'Mute microphone' : 'Unmute microphone'}
            leftIcon={hasLocalAudio ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          >
            {hasLocalAudio ? 'Mute Mic' : 'Unmute Mic'}
          </Button>
        )}

        {isTeacher && onToggleScreenShare && (
          <Button
            variant={isScreenSharing ? 'primary' : 'secondary'}
            size="sm"
            onClick={onToggleScreenShare}
            aria-pressed={isScreenSharing}
            aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share screen to classroom'}
            leftIcon={<Monitor className="w-3.5 h-3.5" />}
          >
            {isScreenSharing ? 'Stop Screen' : 'Share Screen'}
          </Button>
        )}

        {onLeave && (
          <Button
            variant="danger"
            size="sm"
            onClick={onLeave}
            aria-label="Leave classroom"
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Leave Class
          </Button>
        )}
      </div>
    </div>
  );
};
