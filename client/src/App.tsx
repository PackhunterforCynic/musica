import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/common/ToastContainer';
import { LandingPage } from './pages/LandingPage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { RoomPage } from './pages/RoomPage';

export default function App() {
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<{ roomId: string; userName: string; password?: string } | null>(null);

  const handleRoomCreatedOrJoined = (roomId: string, userName: string, password?: string) => {
    setActiveSession({ roomId, userName, password });
    navigate(`/room/${roomId}`);
  };

  const handleLeaveRoom = () => {
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
          activeSession ? (
            <RoomPage
              roomId={activeSession.roomId}
              userName={activeSession.userName}
              password={activeSession.password}
              onLeave={handleLeaveRoom}
            />
          ) : (
            <Navigate to="/join" replace />
          )
        } />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
