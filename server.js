require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./src/config/db');
const apiRoutes = require('./src/routes/apiRoutes');
const socketManager = require('./src/sockets/socketManager');

// Initialize App
const app = express();
const server = http.createServer(app);

// Connect Database
connectDB();

// Middleware
const allowedOrigins = [
  process.env.LOCALPATH,
  process.env.HOSTPATH,
  process.env.CLIENT_URL,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
); // Allow requests from Next.js
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize Socket Logic
socketManager(io);

// Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});