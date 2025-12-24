const User = require('../models/User');
const Message = require('../models/Message');

const socketManager = (io) => {
  // Middleware to track who is connecting (if you had auth tokens, verify here)
  io.use((socket, next) => {
    const username = socket.handshake.auth.username || socket.handshake.query.username;
    if (!username) {
      return next(new Error("invalid username"));
    }
    socket.username = username;
    next();
  });

  io.on('connection', async (socket) => {
    console.log(`User Connected: ${socket.username} (${socket.id})`);

    // 1. Update User Status to ONLINE in DB
    await User.findOneAndUpdate(
      { username: socket.username },
      { isOnline: true, socketId: socket.id }
    );

    // 2. Broadcast to ALL clients that this user is now Online
    io.emit('user_status_change', { username: socket.username, status: 'online' });

    // 3. Join a specific room for this user (for private messaging)
    socket.join(socket.username);

    // --- HANDLE MESSAGES ---
    socket.on('send_message', async (data) => {
      const { recipient, content } = data;

      // Save to MongoDB
      const newMessage = await Message.create({
        sender: socket.username,
        recipient,
        content
      });

      // Emit to Recipient (if they are online/in their room)
      io.to(recipient).emit('receive_message', newMessage);
      
      // Emit to Sender (so their UI updates instantly or to confirm sent)
      socket.emit('message_sent', newMessage);

      // Real-time Notification logic:
      // The frontend uses 'receive_message' to trigger a toast/badge
    });

    // --- HANDLE DISCONNECT ---
    socket.on('disconnect', async () => {
      console.log(`User Disconnected: ${socket.username}`);
      
      // Update DB
      await User.findOneAndUpdate(
        { username: socket.username },
        { isOnline: false, socketId: null }
      );

      // Broadcast Offline Status
      io.emit('user_status_change', { username: socket.username, status: 'offline' });
    });
  });
};

module.exports = socketManager;