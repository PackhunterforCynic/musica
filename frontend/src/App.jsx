import { createContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Home from './pages/Home';
import Room from './pages/Room';

export const SocketContext = createContext(null);
export const UserContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState({ name: '', isHost: false });

  useEffect(() => {
    const newSocket = io(SOCKET_URL, { autoConnect: false });
    setSocket(newSocket);
    
    return () => newSocket.close();
  }, []);

  if (!socket) return null;

  return (
    <SocketContext.Provider value={socket}>
      <UserContext.Provider value={{ user, setUser }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomId" element={<Room />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </UserContext.Provider>
    </SocketContext.Provider>
  );
}

export default App;
