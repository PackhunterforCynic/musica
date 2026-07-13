export const registerWebRTCHandlers = (io, socket) => {
  socket.on('webrtc:offer', ({ targetSocketId, offer }) => {
    io.to(targetSocketId).emit('webrtc:offer', {
      offer,
      senderId: socket.id
    });
  });

  socket.on('webrtc:answer', ({ targetSocketId, answer }) => {
    io.to(targetSocketId).emit('webrtc:answer', {
      answer,
      senderId: socket.id
    });
  });

  socket.on('webrtc:ice-candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('webrtc:ice-candidate', {
      candidate,
      senderId: socket.id
    });
  });
};
