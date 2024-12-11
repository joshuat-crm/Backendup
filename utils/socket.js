// utils/socket.js
const socketIo = require('socket.io');

// Function to initialize Socket.io
const initSocket = (server) => {
  const io = socketIo(server);

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle custom events (e.g., sending notifications)
    socket.on('send-notification', (data) => {
      console.log('Notification data:', data);
      io.emit('receive-notification', data);  // Broadcast to all connected clients
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = initSocket;
