const User = require('../models/User');
const Message = require('../models/Message');

const socketManager = (io) => {
  // Middleware to verify username
  io.use((socket, next) => {
    const username = socket.handshake.auth.username || socket.handshake.query.username;
    if (!username) {
      return next(new Error("invalid username"));
    }
    socket.username = username;
    next();
  });

  io.on('connection', async (socket) => {
    console.log(`🟢 User Connected: ${socket.username} (${socket.id})`);

    // --- FIX 1: Join Room & Broadcast IMMEDIATELY ---
    // Do not wait for DB. This ensures the UI updates instantly.
    socket.join(socket.username);
    
    // Broadcast "Online" status to everyone
    io.emit('user_status_change', { username: socket.username, status: 'online' });

    // --- FIX 2: Update DB in Background (with Error Handling) ---
    try {
      await User.findOneAndUpdate(
        { username: socket.username },
        { isOnline: true, socketId: socket.id }
      );
    } catch (err) {
      console.error(`❌ DB Error marking ${socket.username} online:`, err);
    }

    // --- HANDLE MESSAGES ---
    socket.on('send_message', async (data) => {
      const { recipient, content } = data;

      try {
        // 1. Save to MongoDB
        const newMessage = await Message.create({
          sender: socket.username,
          recipient,
          content
        });

        // 2. Emit to Recipient
        io.to(recipient).emit('receive_message', newMessage);

        // 3. Emit to Sender (Confirm sent)
        socket.emit('message_sent', newMessage);
        
      } catch (err) {
        console.error("Message Error:", err);
      }
    });

    // --- HANDLE DISCONNECT ---
    socket.on('disconnect', async () => {
      console.log(`🔴 User Disconnected: ${socket.username}`);

      // --- FIX 3: Broadcast Offline Status ---
      io.emit('user_status_change', { username: socket.username, status: 'offline' });

      // Update DB in Background
      try {
        await User.findOneAndUpdate(
          { username: socket.username },
          { isOnline: false, socketId: null }
        );
      } catch (err) {
        console.error(`❌ DB Error marking ${socket.username} offline:`, err);
      }
    });
  });
};

module.exports = socketManager;