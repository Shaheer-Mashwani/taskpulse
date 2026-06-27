const express = require("express");
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

module.exports = router;