const express = require("express");
const User = require("../models/User");
const Message = require("../models/Message");
const Task = require("../models/Task");
const authenticate = require("../middleware/auth");

const router = express.Router();

router.get("/:taskId", authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isMember = task.members.some((m) => m.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: "Not a member of this task" });

    const messages = await Message.find({ task: req.params.taskId })
      .populate("sender", "name email avatar")
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

router.delete("/:taskId", authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const user = await User.findById(req.user.id);
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete chats" });
    }

    await Message.deleteMany({ task: req.params.taskId });
    res.json({ message: "Chat cleared" });
  } catch (err) {
    console.error("Delete chat error:", err);
    res.status(500).json({ message: "Failed to delete chat" });
  }
});

module.exports = router;