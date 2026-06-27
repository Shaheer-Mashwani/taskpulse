const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ["GET", "POST"] },
});

app.set("io", io); // <-- makes io available inside every route via req.app.get("io")

const registerSocketHandlers = require("./socket/socketHandlers");
registerSocketHandlers(io);

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const taskRoutes = require("./routes/tasks");
app.use("/api/tasks", taskRoutes);

const messageRoutes = require("./routes/messages");
app.use("/api/messages", messageRoutes);

const uploadRoutes = require("./routes/upload");
app.use("/api/upload", uploadRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo error:", err));

app.get("/", (req, res) => res.send("TaskPulse API running"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));