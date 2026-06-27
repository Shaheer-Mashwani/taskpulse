const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatar: { type: String },
    role: {
      type: String,
      enum: ["pending", "admin", "member"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);