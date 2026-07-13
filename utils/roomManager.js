const rooms = new Map();

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
      if (room.participants.size === 0) {
        removeRoom(roomId);
      } else {
        const updatedParticipants = Array.from(room.participants.values());
        io.to(roomId).emit('room:participants_updated', updatedParticipants);
        io.to(roomId).emit('room:host_updated', room.hostId);
      }
    }
  }
};
