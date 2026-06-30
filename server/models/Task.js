const mongoose = require("mongoose");

const delegationSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: ["added", "handed_off"],
      required: true,
    },
    note: { type: String, default: "" },
    delegatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },

    priority: {
      type: String,
      enum: ["urgent", "moderate", "easy"],
      default: "moderate",
    },

    status: {
      type: String,
      enum: ["pending", "working", "done"],
      default: "pending",
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Can hold ONE or MANY people actively working the task right now
    currentAssignees: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],

    deadline: { type: Date, default: null },
    // Every member who has EVER been part of this task — admin, current, and past assignees
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Full history: assignments AND delegations, in order
    delegationChain: [delegationSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);