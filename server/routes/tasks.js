const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");
const authenticate = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const logSystemMessage = require("../utils/logSystemMessage");

const router = express.Router();

async function resolveEmailsToUsers(emails) {
  const users = await User.find({ email: { $in: emails } });
  const foundEmails = users.map((u) => u.email);
  const notFound = emails.filter((e) => !foundEmails.includes(e));
  return { users, notFound };
}

// CREATE TASK ROUTE
router.post("/", authenticate, async (req, res) => {
  try {
    const io = req.app.get("io");
    const { title, description, priority, assigneeEmails, deadline } = req.body;

    if (!title || !description || !assigneeEmails || assigneeEmails.length === 0) {
      return res.status(400).json({ message: "Title, description, and at least one assignee email are required" });
    }

    const { users, notFound } = await resolveEmailsToUsers(assigneeEmails);
    if (notFound.length > 0) {
      return res.status(404).json({ message: "Some emails don't have a TaskPulse account yet", notFound });
    }

    const assigneeIds = users.map((u) => u._id);
    const memberSet = [...new Set([req.user.id, ...assigneeIds.map((id) => id.toString())])];

    const creatingUser = await User.findById(req.user.id);

    const task = await Task.create({
      title,
      description,
      priority: priority || "moderate",
      deadline: deadline || null, // Integrated deadline logic
      createdBy: req.user.id,
      company: creatingUser.company,
      currentAssignees: assigneeIds,
      members: memberSet,
      delegationChain: assigneeIds.map((id) => ({
        from: req.user.id,
        to: id,
        action: "added",
        note: "Initial assignment",
      })),
    });

    for (const user of users) {
      await logSystemMessage(io, task._id, req.user.id, `${user.name} was assigned to this task`);
    }

    res.status(201).json({ task });
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ message: "Failed to create task" });
  }
});

// GET ALL TASKS FOR USER COMPANY
router.get("/", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const tasks = await Task.find({ members: req.user.id, company: user.company })
      .populate("createdBy", "name email avatar")
      .populate("currentAssignees", "name email avatar")
      .sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (err) {
    console.error("Fetch tasks error:", err);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// GET SINGLE TASK BY ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("createdBy", "name email avatar")
      .populate("currentAssignees", "name email avatar")
      .populate("members", "name email avatar")
      .populate("delegationChain.from", "name email avatar")
      .populate("delegationChain.to", "name email avatar");

    if (!task) return res.status(404).json({ message: "Task not found" });

    const isMember = task.members.some((m) => m._id.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: "Not a member of this task" });

    res.json({ task });
  } catch (err) {
    console.error("Fetch task error:", err);
    res.status(500).json({ message: "Failed to fetch task" });
  }
});

// ADD ASSIGNEE TO TASK
router.post("/:id/add-assignee", authenticate, async (req, res) => {
  try {
    const io = req.app.get("io");
    const { email, note } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isMember = task.members.some((m) => m.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: "Not a member of this task" });

    const newUser = await User.findOne({ email });
    if (!newUser) return res.status(404).json({ message: "No TaskPulse account with that email" });

    const alreadyAssignee = task.currentAssignees.some((id) => id.toString() === newUser._id.toString());
    if (alreadyAssignee) return res.status(400).json({ message: "User is already an assignee" });

    task.currentAssignees.push(newUser._id);
    if (!task.members.some((m) => m.toString() === newUser._id.toString())) {
      task.members.push(newUser._id);
    }
    task.delegationChain.push({ from: req.user.id, to: newUser._id, action: "added", note: note || "" });

    await task.save();
    await logSystemMessage(io, task._id, req.user.id, `${newUser.name} was added to this task`);

    io.to(task._id.toString()).emit("task-updated", task);
    res.json({ task });
  } catch (err) {
    console.error("Add assignee error:", err);
    res.status(500).json({ message: "Failed to add assignee" });
  }
});

// DELEGATE TASK TO ANOTHER USER
router.post("/:id/delegate", authenticate, async (req, res) => {
  try {
    const io = req.app.get("io");
    const { email, note } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isCurrentAssignee = task.currentAssignees.some((id) => id.toString() === req.user.id);
    if (!isCurrentAssignee) return res.status(403).json({ message: "Only a current assignee can delegate" });

    const newUser = await User.findOne({ email });
    if (!newUser) return res.status(404).json({ message: "No TaskPulse account with that email" });

    task.currentAssignees = task.currentAssignees.filter((id) => id.toString() !== req.user.id);

    const alreadyAssignee = task.currentAssignees.some((id) => id.toString() === newUser._id.toString());
    if (!alreadyAssignee) task.currentAssignees.push(newUser._id);

    if (!task.members.some((m) => m.toString() === newUser._id.toString())) {
      task.members.push(newUser._id);
    }

    task.delegationChain.push({ from: req.user.id, to: newUser._id, action: "handed_off", note: note || "" });
    await task.save();

    const fromUser = await User.findById(req.user.id);
    await logSystemMessage(io, task._id, req.user.id, `${fromUser.name} handed off this task to ${newUser.name}`);

    io.to(task._id.toString()).emit("task-updated", task);
    res.json({ task });
  } catch (err) {
    console.error("Delegate task error:", err);
    res.status(500).json({ message: "Failed to delegate task" });
  }
});

// PATCH TASK STATUS
router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    const io = req.app.get("io");
    const { status } = req.body;
    if (!["pending", "working", "done"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isMember = task.members.some((m) => m.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: "Not a member of this task" });

    task.status = status;
    await task.save();

    const user = await User.findById(req.user.id);
    await logSystemMessage(io, task._id, req.user.id, `${user.name} changed status to "${status}"`);

    io.to(task._id.toString()).emit("task-updated", task);
    res.json({ task });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

module.exports = router;