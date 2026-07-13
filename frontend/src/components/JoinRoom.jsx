import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext, UserContext } from '../App';

export default function JoinRoom() {
  const socket = useContext(SocketContext);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'requesting', 'rejected'

  useEffect(() => {
    if (!socket) return;

    const onJoinAccepted = ({ room }) => {
      setStatus('idle');
      setUser({ name: userName, isHost: false });
      navigate(`/room/${room.id}`, { state: { room } });
    };

    const onJoinRejected = ({ message }) => {
      setStatus('rejected');
      setError(message || 'Host rejected your request.');
      socket.disconnect();
    };

    socket.on('room:join_accepted', onJoinAccepted);
    socket.on('room:join_rejected', onJoinRejected);

    return () => {
      socket.off('room:join_accepted', onJoinAccepted);
      socket.off('room:join_rejected', onJoinRejected);
    };
  }, [socket, navigate, setUser, userName]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!userName.trim() || !roomId.trim()) return setError('Name and Room Code are required');
    
    setStatus('requesting');
    setError('');
    socket.connect();
    
    socket.emit('room:request_join', { roomId: roomId.toUpperCase(), password, userName }, (response) => {
      if (!response.success) {
        setStatus('idle');
        setError(response.message);
        socket.disconnect();
      }
      // If success, we wait for 'room:join_accepted' or 'room:join_rejected'
    });
  };

  return (
    <form onSubmit={handleJoin} className="flex flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
      {status === 'requesting' && !error && <div style={{ color: 'var(--accent)', fontSize: '0.875rem', textAlign: 'center' }}>Waiting for host approval...</div>}
      
      <div>
        <label className="text-sm text-secondary mb-2 block" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Display Name</label>
        <input 
          type="text" 
          className="glass-input" 
          placeholder="Enter your name" 
          value={userName} 
          onChange={(e) => setUserName(e.target.value)} 
          disabled={status === 'requesting'}
          required 
        />
      </div>

      <div>
        <label className="text-sm text-secondary mb-2 block" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Room Code</label>
        <input 
          type="text" 
          className="glass-input" 
          placeholder="e.g. ABCD12" 
          value={roomId} 
          onChange={(e) => setRoomId(e.target.value)} 
          disabled={status === 'requesting'}
          required 
        />
      </div>

      <div>
        <label className="text-sm text-secondary mb-2 block" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Room Password (If required)</label>
        <input 
          type="password" 
          className="glass-input" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          disabled={status === 'requesting'}
        />
      </div>

      <button type="submit" className="btn-primary mt-2" disabled={status === 'requesting'}>
        {status === 'requesting' ? 'Requesting...' : 'Join Room'}
      </button>
    </form>
  );
}
