const Message = require("../models/Message");

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-task", (taskId) => {
      socket.join(taskId);
      console.log(`Socket ${socket.id} joined room: ${taskId}`);
    });

    socket.on("leave-task", (taskId) => {
      socket.leave(taskId);
      console.log(`Socket ${socket.id} left room: ${taskId}`);
    });

    // Someone sends a message in a task's chat
    socket.on("send-message", async ({ taskId, senderId, type, content, fileName }) => {
      try {
        const message = await Message.create({
          task: taskId,
          sender: senderId,
          type,
          content,
          fileName,
        });

        const populatedMessage = await message.populate("sender", "name email avatar");

        // Broadcast to everyone in this task's room, INCLUDING the sender
        io.to(taskId).emit("new-message", populatedMessage);
      } catch (err) {
        console.error("Send message error:", err);
        socket.emit("message-error", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}

module.exports = registerSocketHandlers;