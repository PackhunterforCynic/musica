import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate, useParams } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/common/ToastContainer';
import { LandingPage } from './pages/LandingPage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { RoomPage } from './pages/RoomPage';

interface SessionData {
  roomId: string;
  userName: string;
  password?: string;
}

const RoomRoute: React.FC<{
  activeSession: SessionData | null;
  onLeave: () => void;
  onRestoreSession: (session: SessionData) => void;
}> = ({ activeSession, onLeave, onRestoreSession }) => {
  const { roomId } = useParams<{ roomId: string }>();
  const normalizedId = roomId?.trim().toUpperCase();

  // 1. If activeSession in memory matches current route, render immediately
  if (activeSession && activeSession.roomId.toUpperCase() === normalizedId) {
    return (
      <RoomPage
        roomId={activeSession.roomId}
        userName={activeSession.userName}
        password={activeSession.password}
        onLeave={onLeave}
      />
    );
  }

  // 2. Check sessionStorage so page refreshes never kick the user out
  try {
    const raw = sessionStorage.getItem(`musica_session_${normalizedId}`);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && saved.roomId && saved.userName) {
        onRestoreSession(saved);
        return (
          <RoomPage
            roomId={saved.roomId}
            userName={saved.userName}
            password={saved.password}
            onLeave={onLeave}
          />
        );
      }
    }
  } catch (e) {}

  // 3. Fallback: redirect to join with room query param so the room ID is prefilled
  return <Navigate to={`/join${normalizedId ? `?room=${normalizedId}` : ''}`} replace />;
};

export default function App() {
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<SessionData | null>(() => {
    try {
      const last = sessionStorage.getItem('musica_last_session');
      if (last) return JSON.parse(last);
    } catch (e) {}
    return null;
  });

  const handleRoomCreatedOrJoined = (roomId: string, userName: string, password?: string) => {
    const session: SessionData = { roomId: roomId.trim().toUpperCase(), userName: userName.trim(), password };
    setActiveSession(session);
    try {
      sessionStorage.setItem(`musica_session_${session.roomId}`, JSON.stringify(session));
      sessionStorage.setItem('musica_last_session', JSON.stringify(session));
    } catch (e) {}
    navigate(`/room/${session.roomId}`);
  };

  const handleLeaveRoom = () => {
    if (activeSession) {
      try {
        sessionStorage.removeItem(`musica_session_${activeSession.roomId}`);
        sessionStorage.removeItem('musica_last_session');
      } catch (e) {}
    }
    setActiveSession(null);
    navigate('/');
  };

  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Landing */}
        <Route path="/" element={
          <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <Navbar onNavigate={(view) => navigate(`/${view === 'landing' ? '' : view}`)} currentView="landing" />
            <main className="flex-1 flex flex-col">
              <LandingPage onNavigate={(view) => navigate(`/${view}`)} />
            </main>
            <Footer />
          </div>
        } />

        {/* Create Studio Room */}
        <Route path="/create" element={
          <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <Navbar onNavigate={(view) => navigate(`/${view === 'landing' ? '' : view}`)} currentView="create" />
            <main className="flex-1 flex flex-col">
              <CreateRoomPage
                initialRoomType="studio"
                onBack={() => navigate('/')}
                onRoomCreated={handleRoomCreatedOrJoined}
              />
            </main>
            <Footer />
          </div>
        } />

        {/* Create Couple Room */}
        <Route path="/create-couple" element={
          <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <Navbar onNavigate={(view) => navigate(`/${view === 'landing' ? '' : view}`)} currentView="create-couple" />
            <main className="flex-1 flex flex-col">
              <CreateRoomPage
                initialRoomType="couple"
                onBack={() => navigate('/')}
                onRoomCreated={handleRoomCreatedOrJoined}
              />
            </main>
            <Footer />
          </div>
        } />

        {/* Join Room */}
        <Route path="/join" element={
          <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <Navbar onNavigate={(view) => navigate(`/${view === 'landing' ? '' : view}`)} currentView="join" />
            <main className="flex-1 flex flex-col">
              <JoinRoomPage
                onBack={() => navigate('/')}
                onRoomJoined={handleRoomCreatedOrJoined}
              />
            </main>
            <Footer />
          </div>
        } />

        {/* Room / Stream */}
        <Route path="/room/:roomId" element={
          <RoomRoute
            activeSession={activeSession}
            onLeave={handleLeaveRoom}
            onRestoreSession={setActiveSession}
          />
        } />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
