const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();

/**
 * =================================
 * ✅ CORS CONFIG (DYNAMIC ORIGIN FIX)
 * =================================
 */
const allowedOrigins = [
  "http://localhost:5173",
  "https://taskpulse-fawn.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 200,
};

// 1. Global CORS middleware
app.use(cors(corsOptions));

// 2. Explicit Preflight responder for all routes
app.options("*", cors(corsOptions));
/**
 * =================================
 * ✅ SERVER + SOCKET.IO
 * =================================
 */

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions, // Reuse the same exact CORS config
});

app.set("io", io);

/**
 * =================================
 * ✅ SOCKET HANDLERS
 * =================================
 */

const registerSocketHandlers = require("./socket/socketHandlers");
registerSocketHandlers(io);

/**
 * =================================
 * ✅ ROUTES
 * =================================
 */

app.use("/api/auth", require("./routes/auth"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/company", require("./routes/company"));
app.use("/api/push", require("./routes/push"));

/**
 * =================================
 * ✅ HEALTH CHECK
 * =================================
 */

app.get("/", (req, res) => {
  res.send("✅ TaskPulse API running");
});

/**
 * =================================
 * ✅ DATABASE
 * =================================
 */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Mongo error:", err));

/**
 * =================================
 * ✅ START SERVER
 * =================================
 */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});