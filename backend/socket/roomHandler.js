import { createRoom, getRoom, addParticipant } from '../utils/roomManager.js';

export const registerRoomHandlers = (io, socket) => {
  // Create a new room
  socket.on('room:create', ({ roomId, password, userName }, callback) => {
    const success = createRoom(roomId, password, socket.id, userName);
    if (success) {
      socket.join(roomId);
      const room = getRoom(roomId);
      callback({ success: true, room: { id: roomId, hostId: socket.id, participants: Array.from(room.participants.values()) } });
    } else {
      callback({ success: false, message: 'Room already exists' });
    }
  });

  // Request to join a room
  socket.on('room:request_join', ({ roomId, password, userName }, callback) => {
    const room = getRoom(roomId);
    if (!room) {
      return callback({ success: false, message: 'Room not found' });
    }
    if (room.password && room.password !== password) {
      return callback({ success: false, message: 'Incorrect password' });
    }

    // Send approval request to the host
    io.to(room.hostId).emit('room:join_approval', {
      socketId: socket.id,
      userName,
      roomId
    });
    callback({ success: true, message: 'Waiting for host approval' });
  });

  // Host approves or rejects
  socket.on('room:resolve_approval', ({ socketId, approved, userName, roomId }) => {
    if (approved) {
      const room = getRoom(roomId);
      if (room && room.hostId === socket.id) {
        addParticipant(roomId, socketId, userName);
        
        // Notify the approved user
        const participants = Array.from(room.participants.values());
        io.to(socketId).emit('room:join_accepted', {
          room: { id: roomId, hostId: room.hostId, participants, playbackState: room.playbackState }
        });

        // Add them to the socket room
        const targetSocket = io.sockets.sockets.get(socketId);
        if (targetSocket) {
          targetSocket.join(roomId);
        }

        // Notify others
        io.to(roomId).emit('room:participants_updated', participants);
      }
    } else {
      io.to(socketId).emit('room:join_rejected', { message: 'Host rejected your request' });
    }
  });
};
