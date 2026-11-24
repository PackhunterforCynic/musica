import React, { useRef, useEffect } from 'react';
import {
  ShieldAlert,
  Headphones,
  MousePointer2,
  StopCircle,
  Eye,
  Key,
  Mic,
  MicOff,
  LogOut,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface Annotation {
  id: string;
  xRatio: number;
  yRatio: number;
  label?: string;
  technicianName?: string;
}

interface RemoteSupportStageProps {
  sessionCode: string;
  isTechnician: boolean;
  customerName: string;
  technicianName: string;
  isScreenSharing: boolean;
  hasLocalAudio?: boolean;
  screenStream?: MediaStream | null;
  annotations?: Annotation[];
  onToggleMic?: () => void;
  onToggleScreenShare: () => void;
  onStopSession: () => void;
  onSendAnnotation?: (annotation: Omit<Annotation, 'id'>) => void;
}

export const RemoteSupportStage: React.FC<RemoteSupportStageProps> = ({
  sessionCode,
  isTechnician,
  customerName,
  technicianName,
  isScreenSharing,
  hasLocalAudio = true,
  screenStream,
  annotations = [],
  onToggleMic,
  onToggleScreenShare,
  onStopSession,
  onSendAnnotation,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream;
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [screenStream]);

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTechnician || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const xRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const yRatio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    onSendAnnotation?.({
      xRatio,
      yRatio,
      label: 'Focus here',
      technicianName,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isTechnician || !stageRef.current) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Drop laser annotation in center
      onSendAnnotation?.({
        xRatio: 0.5,
        yRatio: 0.5,
        label: 'Focus here',
        technicianName,
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0B1020] text-slate-100 p-4 select-none overflow-hidden">
      {/* Explicit Consent & Security Banner */}
      <div 
        role="alert" 
        className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between shrink-0"
      >
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-amber-300">
              {isScreenSharing ? 'Live Screen Broadcast Active' : 'Remote Guidance Session Ready'}
            </span>
            <span className="text-slate-400 ml-2 hidden sm:inline">
              Browser-based viewing with laser guidance. Remote mouse/keyboard control is not accessed.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleMic && (
            <Button
              variant={hasLocalAudio ? 'secondary' : 'danger'}
              size="sm"
              onClick={onToggleMic}
              aria-pressed={hasLocalAudio}
              aria-label={hasLocalAudio ? 'Mute microphone' : 'Unmute microphone'}
              leftIcon={hasLocalAudio ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            >
              {hasLocalAudio ? 'Mute' : 'Unmuted'}
            </Button>
          )}

          {isScreenSharing && (
            <Button
              variant="danger"
              size="sm"
              onClick={onToggleScreenShare}
              aria-label="Stop sharing your screen immediately"
              leftIcon={<StopCircle className="w-3.5 h-3.5" />}
            >
              Stop Sharing
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onStopSession}
            aria-label="End remote support session"
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            End Session
          </Button>
        </div>
      </div>

      {/* Main Support Stage */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Screen Viewer Canvas with Video Support */}
        <div
          ref={stageRef}
          role="application"
          tabIndex={0}
          aria-label="Remote screen canvas. Click or press Enter to place guidance pin."
          onClick={handleStageClick}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-[#151C2E] border border-white/8 rounded-2xl flex flex-col relative overflow-hidden shadow-2xl cursor-crosshair min-h-0 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          {/* Top Stage Bar */}
          <div className="h-10 px-4 bg-[#0B1020]/70 border-b border-white/8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Badge variant="cyan" size="sm">
                <Eye className="w-3 h-3 mr-1" />
                Customer Screen Viewer
              </Badge>
              {isTechnician && (
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Click anywhere to place a laser guidance pointer
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="neutral" size="sm">
                <Key className="w-3 h-3 mr-1 text-slate-400" />
                PIN: {sessionCode}
              </Badge>
            </div>
          </div>

          {/* Screen Content or Placeholder */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 relative w-full h-full overflow-hidden">
            {isScreenSharing && screenStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={!isTechnician}
                className="w-full h-full object-contain rounded-xl max-h-[calc(100vh-14rem)]"
              />
            ) : (
              <div className="text-center space-y-3 max-w-md p-6">
                <div className="w-16 h-16 rounded-full bg-violet-600/20 border border-violet-500/30 mx-auto flex items-center justify-center text-violet-400">
                  <MousePointer2 className="w-8 h-8" />
                </div>
                <div className="text-base font-semibold text-white">Start Screen Sharing to Begin</div>
                <p className="text-xs text-slate-400">
                  Select the application, tab, or window you would like the technician to assist with.
                </p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={onToggleScreenShare}
                    aria-label="Share my screen"
                  >
                    Share My Screen
                  </Button>
                </div>
              </div>
            )}

            {/* Laser Pointer Annotations */}
            {annotations.map((ann) => (
              <div
                key={ann.id}
                style={{
                  position: 'absolute',
                  left: `${ann.xRatio * 100}%`,
                  top: `${ann.yRatio * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="pointer-events-none z-20 flex flex-col items-center"
              >
                <div className="w-6 h-6 rounded-full bg-red-500/80 border-2 border-white shadow-lg laser-pointer flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-white" />
                </div>
                {ann.label && (
                  <div className="mt-1 px-2 py-0.5 rounded bg-red-600 text-[10px] text-white font-semibold shadow-md whitespace-nowrap">
                    {ann.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Support Sidebar (Technician & Customer Info) */}
        <div className="w-full lg:w-72 bg-[#151C2E] border border-white/8 rounded-2xl p-4 flex flex-col gap-4 shrink-0">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Session Participants
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-[#0B1020] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">{customerName}</div>
                  <div className="text-[10px] text-slate-400">Customer (Host)</div>
                </div>
                <Badge variant={isScreenSharing ? 'live' : 'cyan'} size="sm">
                  {isScreenSharing ? 'Sharing' : 'Idle'}
                </Badge>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0B1020] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">{technicianName || 'Technician'}</div>
                  <div className="text-[10px] text-slate-400">Support Specialist</div>
                </div>
                <Badge variant="brand" size="sm">Assistant</Badge>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#0B1020] rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Headphones className="w-4 h-4 text-violet-400" />
              Voice Channel Active
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Real-time two-way voice is active via LiveKit SFU.
            </p>
          </div>

          <div className="mt-auto text-[10px] text-slate-500 text-center leading-relaxed">
            Musica Support Protocol v1.0 • End-to-end encrypted WebRTC media transport
          </div>
        </div>
      </div>
    </div>
  );
};
