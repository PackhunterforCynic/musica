import { useState, useContext, useEffect, useRef } from 'react';
import { SocketContext } from '../App';
import { Play, Pause, Music } from 'lucide-react';

export default function AudioPlayer({ roomId, isHost, initialPlaybackState }) {
  const socket = useContext(SocketContext);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(initialPlaybackState?.isPlaying || false);
  const [currentTime, setCurrentTime] = useState(initialPlaybackState?.currentTime || 0);
  const [trackUrl, setTrackUrl] = useState(initialPlaybackState?.track || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');

  useEffect(() => {
    if (!socket) return;

    const onPlaybackSync = (state) => {
      if (isHost) return; // Host dictates state, doesn't receive it

      if (state.track && state.track !== trackUrl) {
        setTrackUrl(state.track);
      }
      
      if (audioRef.current) {
        // Sync time if drift is > 1s
        if (Math.abs(audioRef.current.currentTime - state.currentTime) > 1) {
          audioRef.current.currentTime = state.currentTime;
        }

        if (state.isPlaying && audioRef.current.paused) {
          audioRef.current.play().catch(console.error);
        } else if (!state.isPlaying && !audioRef.current.paused) {
          audioRef.current.pause();
        }
      }
      setIsPlaying(state.isPlaying);
    };

    socket.on('playback:sync', onPlaybackSync);
    return () => socket.off('playback:sync', onPlaybackSync);
  }, [socket, isHost, trackUrl]);

  // Host broadcast updates periodically
  useEffect(() => {
    if (!isHost || !socket) return;
    
    const interval = setInterval(() => {
      if (audioRef.current) {
        socket.emit('playback:update', {
          roomId,
          isPlaying: !audioRef.current.paused,
          currentTime: audioRef.current.currentTime,
          track: trackUrl
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [socket, isHost, roomId, trackUrl]);

  const togglePlay = () => {
    if (!isHost) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    socket.emit('playback:update', {
      roomId,
      isPlaying: !audioRef.current.paused,
      currentTime: audioRef.current.currentTime,
      track: trackUrl
    });
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px' }}>
      <div style={{ width: '200px', height: '200px', background: 'linear-gradient(135deg, var(--accent), #9333ea)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.5)' }}>
        <Music size={64} color="white" />
      </div>
      
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Sample Track</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{isHost ? 'You are controlling playback' : 'Synchronized with host'}</p>

      <audio 
        ref={audioRef} 
        src={trackUrl} 
        onTimeUpdate={handleTimeUpdate}
      />

      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
        </span>
        <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}>
          <div style={{ 
            position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--accent)', borderRadius: '2px',
            width: audioRef.current && audioRef.current.duration ? `${(currentTime / audioRef.current.duration) * 100}%` : '0%'
          }} />
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {audioRef.current && !isNaN(audioRef.current.duration) ? 
            `${Math.floor(audioRef.current.duration / 60)}:${(Math.floor(audioRef.current.duration % 60)).toString().padStart(2, '0')}` : '0:00'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button 
          onClick={togglePlay}
          disabled={!isHost}
          style={{ 
            width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent)', border: 'none', color: 'white', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isHost ? 'pointer' : 'not-allowed',
            opacity: isHost ? 1 : 0.5
          }}
        >
          {isPlaying ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: '4px' }} />}
        </button>
      </div>
    </div>
  );
}
