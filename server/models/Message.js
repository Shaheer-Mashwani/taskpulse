const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: ["text", "audio", "video", "file", "system"],
      required: true,
    },

    content: { type: String },
    fileName: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);