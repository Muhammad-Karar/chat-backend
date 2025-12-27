require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./src/config/db");
const apiRoutes = require("./src/routes/apiRoutes");
const socketManager = require("./src/sockets/socketManager");

// Initialize App
const app = express();
const server = http.createServer(app);

// Connect Database
connectDB();

// =====================
// ✅ CORS CONFIG (FIXED)
// =====================
const corsOptions = {
  origin: process.env.CLIENT_URL, // deployed frontend URL
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // 🔴 REQUIRED FOR PREFLIGHT

app.use(express.json());

// API Routes
app.use("/api", apiRoutes);

// =====================
// ✅ SOCKET.IO CONFIG
// =====================
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

socketManager(io);

// Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
