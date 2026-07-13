import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext, UserContext } from '../App';

export default function CreateRoom() {
  const socket = useContext(SocketContext);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!userName.trim()) return setError('Display name is required');
    
    setIsLoading(true);
    socket.connect();
    
    // Auto-generate a secure random room code
    const generatedRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    socket.emit('room:create', { roomId: generatedRoomId, password, userName }, (response) => {
      setIsLoading(false);
      if (response.success) {
        setUser({ name: userName, isHost: true });
        navigate(`/room/${generatedRoomId}`, { state: { room: response.room } });
      } else {
        setError(response.message);
        socket.disconnect();
      }
    });
  };

  return (
    <form onSubmit={handleCreate} className="flex flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
      
      <div>
        <label className="text-sm text-secondary mb-2 block" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Display Name</label>
        <input 
          type="text" 
          className="glass-input" 
          placeholder="Enter your name" 
          value={userName} 
          onChange={(e) => setUserName(e.target.value)} 
          required 
        />
      </div>

      <div>
        <label className="text-sm text-secondary mb-2 block" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Room Password (Optional)</label>
        <input 
          type="password" 
          className="glass-input" 
          placeholder="Leave blank for public room" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
      </div>

      <button type="submit" className="btn-primary mt-2" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Room'}
      </button>
    </form>
  );
}
