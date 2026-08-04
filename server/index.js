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
 * ✅ CORS CONFIG (CLEAN FIX)
 * =================================
 */


const allowedOrigins = [
  "http://localhost:5173",
  "https://taskpulse-fawn.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("❌ CORS blocked:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // VERY IMPORTANT
app.set("trust proxy", 1);
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

// Make io available in routes
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