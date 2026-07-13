import { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { SocketContext, UserContext } from '../App';
import HostApproval from '../components/HostApproval';
import StreamView from '../components/StreamView';
import Chat from '../components/Chat';
import Participants from '../components/Participants';
import { Copy, Check } from 'lucide-react';

export default function Room() {
  const socket = useContext(SocketContext);
  const { user } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();

  const [roomData, setRoomData] = useState(location.state?.room || null);
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!socket || !socket.connected || !user.name || !roomData) {
      navigate('/');
      return;
    }

    const onJoinApproval = (request) => {
      setApprovalRequests(prev => [...prev, request]);
    };

    const onParticipantsUpdated = (participants) => {
      setRoomData(prev => ({ ...prev, participants }));
    };

    const onHostUpdated = (newHostId) => {
      setRoomData(prev => ({ ...prev, hostId: newHostId }));
    };

    socket.on('room:join_approval', onJoinApproval);
    socket.on('room:participants_updated', onParticipantsUpdated);
    socket.on('room:host_updated', onHostUpdated);

    return () => {
      socket.off('room:join_approval', onJoinApproval);
      socket.off('room:participants_updated', onParticipantsUpdated);
      socket.off('room:host_updated', onHostUpdated);
    };
  }, [socket, user, roomData, navigate]);

  const handleResolveApproval = (socketId, approved, userName) => {
    socket.emit('room:resolve_approval', { socketId, approved, userName, roomId });
    setApprovalRequests(prev => prev.filter(req => req.socketId !== socketId));
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!roomData) return null;

  return (
    <div className="flex" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="glass-panel" style={{ padding: '1rem', margin: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Room Code: 
              <span style={{ color: 'var(--accent)', letterSpacing: '2px', background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                {roomData.id}
              </span>
              <button onClick={copyRoomCode} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}>
                {copied ? <Check size={18} color="var(--success)" /> : <Copy size={18} />}
              </button>
            </h2>
            <p className="text-secondary text-sm">Host: {roomData.participants.find(p => p.id === roomData.hostId)?.name || 'Unknown'}</p>
          </div>
        </div>
        <div>
          <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => { socket.disconnect(); navigate('/'); }}>Leave Room</button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '0 1rem 1rem 1rem', gap: '1rem' }}>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflow: 'hidden' }}>
             <StreamView roomId={roomId} isHost={socket.id === roomData.hostId} participants={roomData.participants} />
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '300px' }}>
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Participants participants={roomData.participants} hostId={roomData.hostId} />
          </div>
          <div className="glass-panel" style={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Chat roomId={roomId} />
          </div>
        </div>
      </div>

      {user.isHost && approvalRequests.map(req => (
        <HostApproval 
          key={req.socketId} 
          request={req} 
          onResolve={handleResolveApproval} 
        />
      ))}
    </div>
  );
}
