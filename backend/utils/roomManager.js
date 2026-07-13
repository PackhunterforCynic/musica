const rooms = new Map();

// Room structure:
// {
//   id: string,
//   password: string | null,
//   hostId: string,
//   participants: Map<socketId, { id: string, name: string, role: 'host' | 'listener' }>,
//   playbackState: { isPlaying: boolean, currentTime: number, track: string | null, lastUpdate: number },
//   chat: Array<{ id: string, senderName: string, text: string, timestamp: number }>
// }

export const createRoom = (roomId, password, hostSocketId, hostName) => {
  if (rooms.has(roomId)) {
    return false;
  }
  const participants = new Map();
  participants.set(hostSocketId, { id: hostSocketId, name: hostName, role: 'host' });
  
  rooms.set(roomId, {
    id: roomId,
    password: password || null,
    hostId: hostSocketId,
    participants,
    playbackState: { isPlaying: false, currentTime: 0, track: null, lastUpdate: Date.now() },
    chat: []
  });
  return true;
};

export const getRoom = (roomId) => {
  return rooms.get(roomId);
};

export const removeRoom = (roomId) => {
  rooms.delete(roomId);
};

export const addParticipant = (roomId, socketId, name) => {
  const room = rooms.get(roomId);
  if (room) {
    room.participants.set(socketId, { id: socketId, name, role: 'listener' });
    return true;
  }
  return false;
};

export const removeParticipant = (roomId, socketId) => {
  const room = rooms.get(roomId);
  if (room) {
    room.participants.delete(socketId);
    if (room.hostId === socketId && room.participants.size > 0) {
      // Transfer host to the first available participant
      const nextHostId = room.participants.keys().next().value;
      room.hostId = nextHostId;
      room.participants.get(nextHostId).role = 'host';
    }
  }
};

export const cleanupEmptyRooms = (io, socketId) => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.participants.has(socketId)) {
      removeParticipant(roomId, socketId);
      
      // Notify remaining participants
      if (room.participants.size === 0) {
        removeRoom(roomId);
        console.log(`Room ${roomId} deleted as it became empty.`);
      } else {
        const updatedParticipants = Array.from(room.participants.values());
        io.to(roomId).emit('room:participants_updated', updatedParticipants);
        io.to(roomId).emit('room:host_updated', room.hostId);
      }
    }
  }
};
