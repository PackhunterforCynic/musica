import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Shield, PhoneCall, Monitor, Mic, MicOff, Video, VideoOff, Check, X } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface PendingRequest {
  socketId: string;
  name: string;
  timestamp: string;
}

interface PrivateRoomStageProps {
  localParticipantName: string;
  isHost: boolean;
  hasLocalVideo: boolean;
  hasLocalAudio: boolean;
  isScreenSharing: boolean;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  pendingRequests?: PendingRequest[];
  remoteParticipants: Array<{
    identity: string;
    name: string;
    hasMic: boolean;
    hasCamera: boolean;
    isSpeaking?: boolean;
  }>;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
  onAdmitUser?: (socketId: string) => void;
  onDenyUser?: (socketId: string) => void;
}

export const PrivateRoomStage: React.FC<PrivateRoomStageProps> = ({
  localParticipantName,
  isHost,
  hasLocalVideo,
  hasLocalAudio,
  isScreenSharing,
  localStream,
  remoteStream,
  pendingRequests = [],
  remoteParticipants,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onEndCall,
  onAdmitUser,
  onDenyUser,
}) => {
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCallDurationSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Bind local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // Bind remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const peer = remoteParticipants[0];
  const hasRemoteVideo = Boolean(remoteStream && remoteStream.getVideoTracks().length > 0);
  const hasLocalVideoStream = Boolean(localStream && localStream.getVideoTracks().length > 0);

  return (
    <div className="w-full h-full flex flex-col bg-[#0B1020] text-slate-100 p-4 md:p-6 select-none">
      {/* Waiting Room Admission Banner (Host Only) */}
      {isHost && pendingRequests.length > 0 && (
        <div className="mb-3 p-3 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-violet-200">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span>
              <strong>{pendingRequests[0].name}</strong> is in the lobby waiting to join this private call.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAdmitUser?.(pendingRequests[0].socketId)}
              className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
              aria-label={`Admit ${pendingRequests[0].name}`}
            >
              <Check className="w-3.5 h-3.5" /> Admit
            </button>
            <button
              onClick={() => onDenyUser?.(pendingRequests[0].socketId)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
              aria-label={`Deny ${pendingRequests[0].name}`}
            >
              <X className="w-3.5 h-3.5" /> Deny
            </button>
          </div>
        </div>
      )}

      {/* Top Session Bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/8">
        <div className="flex items-center gap-3">
          <Badge variant="brand" size="md">
            <Shield className="w-3.5 h-3.5 mr-1" />
            1:1 Private Call
          </Badge>
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 text-xs font-mono text-slate-400"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="tabular-nums font-semibold text-white">{formatTimer(callDurationSeconds)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={peer ? 'live' : 'amber'} size="sm">
            {peer ? 'Peer Connected' : 'Waiting for Partner'}
          </Badge>
        </div>
      </div>

      {/* 2-Person Stage Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center min-h-0">
        {/* Local Participant Card with Video Support */}
        <motion.div
          layout
          className="w-full h-full min-h-[260px] md:min-h-0 rounded-2xl bg-[#151C2E] border border-white/8 flex flex-col relative overflow-hidden shadow-xl"
        >
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <Badge variant="brand" size="sm">You ({localParticipantName})</Badge>
            {isHost && <Badge variant="neutral" size="sm">Host</Badge>}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative w-full h-full">
            {hasLocalVideoStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-violet-600/20 border-2 border-violet-500/30 flex items-center justify-center shadow-lg mb-3">
                  <User className="w-12 h-12 text-violet-400" />
                </div>
                <div className="text-base font-semibold text-white">{localParticipantName}</div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>{hasLocalAudio ? 'Mic active' : 'Muted'}</span>
                  <span>•</span>
                  <span>{hasLocalVideo ? 'Video active' : 'Camera off'}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Remote Peer Card with Video Support */}
        <motion.div
          layout
          className={`w-full h-full min-h-[260px] md:min-h-0 rounded-2xl bg-[#151C2E] border flex flex-col relative overflow-hidden shadow-xl transition-all ${
            peer?.isSpeaking ? 'border-emerald-500/60 speaker-halo' : 'border-white/8'
          }`}
        >
          {peer ? (
            <>
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                <Badge variant="cyan" size="sm">{peer.name}</Badge>
                {peer.isSpeaking && (
                  <Badge variant="live" size="sm" pulse>Speaking</Badge>
                )}
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative w-full h-full">
                {hasRemoteVideo ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-cyan-600/20 border-2 border-cyan-500/30 flex items-center justify-center shadow-lg mb-3">
                      <User className="w-12 h-12 text-cyan-400" />
                    </div>
                    <div className="text-base font-semibold text-white">{peer.name}</div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>{peer.hasMic ? 'Mic on' : 'Muted'}</span>
                      <span>•</span>
                      <span>{peer.hasCamera ? 'Video on' : 'Camera off'}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800/60 border border-dashed border-white/20 flex items-center justify-center mb-3 text-slate-400">
                <User className="w-8 h-8 opacity-40" />
              </div>
              <div className="text-sm font-semibold text-slate-300">Invite a partner to start</div>
              <div className="text-xs text-slate-400 mt-1 max-w-xs">
                Share this room link to begin your private encrypted session.
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Dock Controls */}
      <div className="mt-4 pt-3 flex items-center justify-center gap-3">
        <Button
          variant={hasLocalAudio ? 'secondary' : 'danger'}
          size="md"
          onClick={onToggleMic}
          aria-pressed={hasLocalAudio}
          aria-label={hasLocalAudio ? 'Mute microphone' : 'Unmute microphone'}
          leftIcon={hasLocalAudio ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        >
          {hasLocalAudio ? 'Mute' : 'Unmute'}
        </Button>

        <Button
          variant={hasLocalVideo ? 'secondary' : 'outline'}
          size="md"
          onClick={onToggleCamera}
          aria-pressed={hasLocalVideo}
          aria-label={hasLocalVideo ? 'Turn off camera' : 'Turn on camera'}
          leftIcon={hasLocalVideo ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        >
          {hasLocalVideo ? 'Stop Video' : 'Start Video'}
        </Button>

        <Button
          variant={isScreenSharing ? 'primary' : 'secondary'}
          size="md"
          onClick={onToggleScreenShare}
          aria-pressed={isScreenSharing}
          aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
          leftIcon={<Monitor className="w-4 h-4" />}
        >
          {isScreenSharing ? 'Stop Screen' : 'Share Screen'}
        </Button>

        <Button
          variant="danger"
          size="md"
          onClick={onEndCall}
          aria-label="End call"
          leftIcon={<PhoneCall className="w-4 h-4 rotate-[135deg]" />}
        >
          End Call
        </Button>
      </div>
    </div>
  );
};
