const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();

/**
 * =================================
 * ✅ BULLETPROOF MANUAL CORS CONFIG
 * =================================
 */
const allowedOrigins = [
  "http://localhost:5173",
  "https://taskpulse-fawn.vercel.app",
  "https://localhost",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Echo allowed origin dynamically
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  // Force credentials and headers on every response
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept"
  );

  // Instantly handle preflight OPTIONS checks with 200 OK
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ✅ Trust proxy (Required when behind Nginx for cookies / auth)
app.set("trust proxy", 1);

app.use(express.json());

/**
 * =================================
 * ✅ SERVER + SOCKET.IO
 * =================================
 */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
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