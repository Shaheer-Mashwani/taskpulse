const Message = require("../models/Message");

async function logSystemMessage(io, taskId, senderId, content) {
  const message = await Message.create({
    task: taskId,
    sender: senderId,
    type: "system",
    content,
  });

  const populated = await message.populate("sender", "name email avatar");
  io.to(taskId.toString()).emit("new-message", populated);
}

module.exports = logSystemMessage;