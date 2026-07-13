import { getRoom } from '../utils/roomManager.js';

export const registerPlaybackHandlers = (io, socket) => {
  socket.on('playback:update', ({ roomId, isPlaying, currentTime, track }) => {
    const room = getRoom(roomId);
    if (room && room.hostId === socket.id) {
      room.playbackState = {
        isPlaying,
        currentTime,
        track,
        lastUpdate: Date.now()
      };
      
      // Broadcast to everyone EXCEPT the host
      socket.to(roomId).emit('playback:sync', room.playbackState);
    }
  });
};
