import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/common/ToastContainer';
import { LandingPage } from './pages/LandingPage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { RoomPage } from './pages/RoomPage';

type ViewMode = 'landing' | 'create' | 'join' | 'studio';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [activeSession, setActiveSession] = useState<{ roomId: string; userName: string; password?: string } | null>(null);

  const handleRoomCreatedOrJoined = (roomId: string, userName: string, password?: string) => {
    setActiveSession({ roomId, userName, password });
    setCurrentView('studio');
  };

  const handleLeaveRoom = () => {
    setActiveSession(null);
    setCurrentView('landing');
  };

  if (currentView === 'studio' && activeSession) {
    return (
      <>
        <ToastContainer />
        <RoomPage
          roomId={activeSession.roomId}
          userName={activeSession.userName}
          password={activeSession.password}
          onLeave={handleLeaveRoom}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar onNavigate={(view) => setCurrentView(view as ViewMode)} currentView={currentView} />
      <ToastContainer />

      <main className="flex-1 flex flex-col">
        {currentView === 'landing' && <LandingPage onNavigate={(view) => setCurrentView(view as ViewMode)} />}
        {currentView === 'create' && (
          <CreateRoomPage
            onBack={() => setCurrentView('landing')}
            onRoomCreated={handleRoomCreatedOrJoined}
          />
        )}
        {currentView === 'join' && (
          <JoinRoomPage
            onBack={() => setCurrentView('landing')}
            onRoomJoined={handleRoomCreatedOrJoined}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
