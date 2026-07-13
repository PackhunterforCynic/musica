import { getRoom } from '../utils/roomManager.js';

export const registerChatHandlers = (io, socket) => {
  socket.on('chat:message', ({ roomId, message }) => {
    const room = getRoom(roomId);
    if (room) {
      const participant = room.participants.get(socket.id);
      if (participant) {
        const chatMsg = {
          id: Math.random().toString(36).substring(2, 9),
          senderId: socket.id,
          senderName: participant.name,
          text: message,
          timestamp: Date.now()
        };
        room.chat.push(chatMsg);
        
        if (room.chat.length > 100) room.chat.shift();

        io.to(roomId).emit('chat:message', chatMsg);
      }
    }
  });

  socket.on('chat:reaction', ({ roomId, emoji }) => {
    const room = getRoom(roomId);
    if (room) {
      const participant = room.participants.get(socket.id);
      if (participant) {
        io.to(roomId).emit('chat:reaction', {
          senderName: participant.name,
          emoji,
          timestamp: Date.now()
        });
      }
    }
  });
};
