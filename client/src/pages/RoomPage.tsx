import React, { useState, useEffect } from 'react';
import { useWebRTCStudio } from '../webrtc/useWebRTCStudio';
import { useRoomStore, useIsHost } from '../store/roomStore';
import { HostDashboard } from '../components/studio/HostDashboard';
import { AudienceInterface } from '../components/studio/AudienceInterface';
import { CoupleRoomInterface } from '../components/studio/CoupleRoomInterface';
import { PrivateRoomStage } from '../components/studio/PrivateRoomStage';
import { PodcastRoomStage } from '../components/studio/PodcastRoomStage';
import { ClassroomStage } from '../components/studio/ClassroomStage';
import { RemoteSupportStage } from '../components/studio/RemoteSupportStage';
import { ReactionsOverlay } from '../components/studio/ReactionsOverlay';
import { Loader2 } from 'lucide-react';

interface RoomPageProps {
  roomId: string;
  userName: string;
  password?: string;
  onLeave: () => void;
}

export const RoomPage: React.FC<RoomPageProps> = ({ roomId, userName, password, onLeave }) => {
  const studio = useWebRTCStudio(roomId, userName, password);
  const isHost = useIsHost();
  const room = useRoomStore((s) => s.room);
  const screenShareState = useRoomStore((s) => s.screenShareState);
  const isSharing = screenShareState === 'Sharing';
  const isWaitingForHost = useRoomStore((s) => s.isWaitingForHost);
  const waitingRoomInfo = useRoomStore((s) => s.waitingRoomInfo);
  const isMicMuted = useRoomStore((s) => s.isMicMuted);
  const localShareStream = useRoomStore((s) => s.localShareStream);
  const remoteMediaStream = useRoomStore((s) => s.remoteMediaStream);
  const pendingJoinRequests = useRoomStore((s) => s.pendingJoinRequests);
  const activeSpeakerIds = useRoomStore((s) => s.activeSpeakerIds);

  // Synchronized Remote Support Annotations
  const [annotations, setAnnotations] = useState<any[]>([]);
  useEffect(() => {
    const handleAnnotation = (e: any) => {
      if (e.detail) {
        setAnnotations((prev) => [...prev.slice(-4), { ...e.detail, id: Date.now().toString() }]);
      }
    };
    window.addEventListener('musica:annotation', handleAnnotation);
    return () => window.removeEventListener('musica:annotation', handleAnnotation);
  }, []);

  // Synchronized Classroom Quiz Poll Votes
  const [pollVotes, setPollVotes] = useState({ A: 4, B: 8 });
  useEffect(() => {
    const handlePollVote = (e: any) => {
      if (e.detail) {
        const key = e.detail.optionIndex === 0 ? 'A' : 'B';
        setPollVotes((prev) => ({ ...prev, [key]: prev[key] + 1 }));
      }
    };
    window.addEventListener('musica:poll_vote', handlePollVote);
    return () => window.removeEventListener('musica:poll_vote', handlePollVote);
  }, []);

  if (!roomId || !userName) {
    return (
      <div className="h-screen w-screen bg-[#0B1020] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Connecting to Musica Studio...</p>
      </div>
    );
  }

  // Show loading spinner while waiting for server to confirm room join
  if (!room && !isWaitingForHost) {
    return (
      <div className="h-screen w-screen bg-[#0B1020] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Joining room {roomId}...</p>
        <p className="text-xs text-slate-500">Establishing LiveKit SFU connection</p>
      </div>
    );
  }

  if (isWaitingForHost) {
    return (
      <div className="h-screen w-screen bg-[#0B1020] flex flex-col relative select-none">
        <header className="flex items-center justify-start p-6">
          <button onClick={() => { studio.leaveRoom(); onLeave(); }} className="text-slate-300 p-2 -ml-2" aria-label="Leave waiting room">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="relative w-32 h-32 flex items-center justify-center mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-violet-500 border-r-purple-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-slate-800 border-b-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="w-12 h-12 text-violet-400 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">Connecting to Room</h2>
          <p className="text-sm text-slate-400 text-center max-w-xs mb-12">
            Please wait while the host admits you to the session...
          </p>

          <div className="w-full max-w-sm rounded-3xl bg-[#151C2E] border border-white/8 p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">{waitingRoomInfo?.roomName || 'Studio Room'}</h3>
              <p className="text-xs text-slate-400 mt-1">Room ID: {roomId}</p>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <span className="text-xs font-medium text-slate-300">Host: {waitingRoomInfo?.hostName || 'Host'}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                  <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <span className="text-xs font-medium text-slate-300">Waiting for admission</span>
              </div>

              {password && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                    <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <span className="text-xs font-medium text-slate-300">Password protected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderRoomExperience = () => {
    switch (room?.roomType) {
      case 'private':
        return (
          <PrivateRoomStage
            localParticipantName={userName}
            isHost={isHost}
            hasLocalVideo={false}
            hasLocalAudio={!isMicMuted}
            isScreenSharing={isSharing}
            localStream={localShareStream}
            remoteStream={remoteMediaStream}
            pendingRequests={pendingJoinRequests}
            remoteParticipants={room.participants
              .filter((p) => p.name !== userName)
              .map((p) => ({
                identity: p.id,
                name: p.name,
                hasMic: p.hasMic,
                hasCamera: p.hasCamera,
                isSpeaking: activeSpeakerIds.includes(p.id) || p.presence === 'Speaking',
              }))}
            onToggleMic={() => studio.toggleMicrophone?.()}
            onToggleCamera={() => {}}
            onToggleScreenShare={() => {
              if (isSharing) studio.stopScreenShare();
              else studio.startScreenShare();
            }}
            onEndCall={() => {
              studio.leaveRoom();
              onLeave();
            }}
            onAdmitUser={(sid) => studio.admitUser(sid)}
            onDenyUser={(sid) => studio.denyUser(sid)}
          />
        );

      case 'podcast': {
        const isHandRaised = room.participants.find((p) => p.name === userName)?.handRaised || false;
        const speakers = room.participants
          .filter((p) => p.role === 'host' || p.role === 'speaker' || p.role === 'co-host')
          .map((p) => ({
            identity: p.id,
            name: p.name,
            role: p.role,
            hasMic: p.hasMic,
            hasCamera: p.hasCamera,
            isSpeaking: activeSpeakerIds.includes(p.id) || p.presence === 'Speaking',
          }));

        const listeners = room.participants
          .filter((p) => p.role !== 'host' && p.role !== 'speaker' && p.role !== 'co-host')
          .map((p) => ({
            identity: p.id,
            name: p.name,
            hasMic: p.hasMic,
            hasCamera: p.hasCamera,
            isSpeaking: false,
          }));

        return (
          <PodcastRoomStage
            localName={userName}
            isHost={isHost}
            hasLocalAudio={!isMicMuted}
            speakers={speakers.length > 0 ? speakers : [{ identity: 'host', name: room.hostName, hasMic: true, hasCamera: false, role: 'host' }]}
            listeners={listeners}
            handRaised={isHandRaised}
            onToggleMic={() => studio.toggleMicrophone?.()}
            onToggleRaiseHand={() => studio.toggleRaiseHand?.(isHandRaised)}
            onApproveSpeaker={(participantId) => studio.promotePodcastSpeaker(participantId)}
            onLeave={() => {
              studio.leaveRoom();
              onLeave();
            }}
          />
        );
      }

      case 'classroom': {
        const isHandRaised = room.participants.find((p) => p.name === userName)?.handRaised || false;
        const activePresentationStream = isHost ? localShareStream : remoteMediaStream;

        return (
          <ClassroomStage
            isTeacher={isHost}
            teacherName={room.hostName}
            hasLocalAudio={!isMicMuted}
            isScreenSharing={isSharing}
            presentationStream={activePresentationStream}
            pollVotes={pollVotes}
            students={room.participants
              .filter((p) => p.name !== room.hostName)
              .map((p) => ({
                identity: p.id,
                name: p.name,
                handRaised: p.handRaised,
              }))}
            handRaised={isHandRaised}
            onToggleMic={() => studio.toggleMicrophone?.()}
            onToggleScreenShare={() => {
              if (isSharing) studio.stopScreenShare();
              else studio.startScreenShare();
            }}
            onToggleRaiseHand={() => studio.toggleRaiseHand?.(isHandRaised)}
            onVotePoll={(idx) => studio.voteClassroomPoll(idx)}
            onLeave={() => {
              studio.leaveRoom();
              onLeave();
            }}
          />
        );
      }

      case 'remote-support': {
        const supportScreenStream = isHost ? localShareStream : remoteMediaStream;
        return (
          <RemoteSupportStage
            sessionCode={roomId}
            isTechnician={!isHost}
            customerName={room.hostName}
            technicianName={room.participants.find((p) => p.name !== room.hostName)?.name || 'Technician'}
            isScreenSharing={isSharing}
            hasLocalAudio={!isMicMuted}
            screenStream={supportScreenStream}
            annotations={annotations}
            onToggleMic={() => studio.toggleMicrophone?.()}
            onToggleScreenShare={() => {
              if (isSharing) studio.stopScreenShare();
              else studio.startScreenShare();
            }}
            onStopSession={() => {
              studio.leaveRoom();
              onLeave();
            }}
            onSendAnnotation={(ann) => {
              studio.sendSupportAnnotation(ann);
              setAnnotations((prev) => [...prev.slice(-4), { ...ann, id: Date.now().toString() }]);
            }}
          />
        );
      }

      case 'couple':
        return <CoupleRoomInterface studio={studio} onLeave={onLeave} />;

      default:
        return isHost ? (
          <HostDashboard studio={studio} onLeave={onLeave} />
        ) : (
          <AudienceInterface studio={studio} onLeave={onLeave} />
        );
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0B1020] overflow-hidden relative select-none">
      <ReactionsOverlay />
      {renderRoomExperience()}
    </div>
  );
};
