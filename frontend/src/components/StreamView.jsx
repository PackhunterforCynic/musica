import { useState, useContext, useEffect, useRef } from 'react';
import { SocketContext } from '../App';
import { Monitor, MonitorOff } from 'lucide-react';

export default function StreamView({ roomId, isHost, participants }) {
  const socket = useContext(SocketContext);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  const [isSharing, setIsSharing] = useState(false);
  const [hasStream, setHasStream] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  
  const peerConnections = useRef(new Map()); 
  const hostConnection = useRef(null); 

  const STUN_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const startSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { cursor: 'always' }, 
        audio: { echoCancellation: false, noiseSuppression: false, sampleRate: 44100 }
      });
      setLocalStream(stream);
      setIsSharing(true);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      stream.getVideoTracks()[0].onended = () => stopSharing();

      participants.forEach(p => {
        if (p.id !== socket.id) {
          createPeerConnectionForParticipant(p.id, stream);
        }
      });
    } catch (err) {
      console.error("Error sharing screen:", err);
    }
  };

  const stopSharing = () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }
    setLocalStream(null);
    setIsSharing(false);
    
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
  };

  const createPeerConnectionForParticipant = async (targetSocketId, stream) => {
    const pc = new RTCPeerConnection(STUN_SERVERS);
    peerConnections.current.set(targetSocketId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc:ice-candidate', { targetSocketId, candidate: event.candidate });
      }
    };

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('webrtc:offer', { targetSocketId, offer });
  };

  useEffect(() => {
    if (isHost && isSharing && localStream) {
      participants.forEach(p => {
        if (p.id !== socket.id && !peerConnections.current.has(p.id)) {
          createPeerConnectionForParticipant(p.id, localStream);
        }
      });
      
      const currentParticipantIds = new Set(participants.map(p => p.id));
      peerConnections.current.forEach((pc, id) => {
        if (!currentParticipantIds.has(id)) {
          pc.close();
          peerConnections.current.delete(id);
        }
      });
    }
  }, [participants, isHost, isSharing, localStream]);

  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ offer, senderId }) => {
      if (isHost) return;
      
      if (hostConnection.current) {
        hostConnection.current.close();
      }
      
      const pc = new RTCPeerConnection(STUN_SERVERS);
      hostConnection.current = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc:ice-candidate', { targetSocketId: senderId, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setHasStream(true);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          setHasStream(false);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('webrtc:answer', { targetSocketId: senderId, answer });
    };

    const handleAnswer = async ({ answer, senderId }) => {
      if (!isHost) return;
      const pc = peerConnections.current.get(senderId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIceCandidate = async ({ candidate, senderId }) => {
      const pc = isHost ? peerConnections.current.get(senderId) : hostConnection.current;
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
      }
    };

    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);

    return () => {
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
    };
  }, [socket, isHost]);

  useEffect(() => {
    return () => {
      if (localStream) localStream.getTracks().forEach(t => t.stop());
      peerConnections.current.forEach(pc => pc.close());
      if (hostConnection.current) hostConnection.current.close();
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
      {isHost ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', height: '100%' }}>
          <div style={{ flex: 1, width: '100%', background: 'black', borderRadius: '1rem', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!isSharing && (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', position: 'absolute' }}>
                <Monitor size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>You are not sharing your screen</p>
              </div>
            )}
            <video 
              ref={localVideoRef}
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: isSharing ? 1 : 0 }}
            />
          </div>
          <button 
            onClick={isSharing ? stopSharing : startSharing}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: 'auto', padding: '0.75rem 1.5rem', background: isSharing ? 'var(--danger)' : 'var(--accent)' }}
          >
            {isSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
            {isSharing ? 'Stop Sharing' : 'Share Screen & Audio'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', height: '100%' }}>
          <div style={{ flex: 1, width: '100%', background: 'black', borderRadius: '1rem', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video 
              ref={remoteVideoRef}
              autoPlay 
              playsInline 
              style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: hasStream ? 1 : 0 }}
            />
            {!hasStream && (
              <div style={{ position: 'absolute', color: 'var(--text-secondary)', textAlign: 'center' }}>
                <Monitor size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>Waiting for host to share screen...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
