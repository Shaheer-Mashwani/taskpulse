const Message = require("../models/Message");
const Task = require("../models/Task");
const sendPushToUsers = require("../utils/sendPushNotification");

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-task", (taskId) => {
      socket.join(taskId);
    });

    socket.on("leave-task", (taskId) => {
      socket.leave(taskId);
    });

    socket.on("send-message", async ({ taskId, senderId, type, content, fileName }) => {
      try {
        const message = await Message.create({
          task: taskId,
          sender: senderId,
          type,
          content,
          fileName,
        });

        const populated = await message.populate("sender", "name email avatar");

        // Broadcast to everyone in the room
        io.to(taskId).emit("new-message", populated);

        // Send push to members who are NOT currently in this socket room
        const task = await Task.findById(taskId);
        if (task) {
          const roomSockets = await io.in(taskId).allSockets();

          const offlineMembers = task.members.filter(
            (memberId) => memberId.toString() !== senderId
          );

          if (offlineMembers.length > 0) {
            const senderName = populated.sender?.name || "Someone";
            const preview =
              type === "text"
                ? content.slice(0, 80)
                : type === "audio"
                ? "🎙️ Voice message"
                : type === "video"
                ? "📹 Video"
                : `📄 ${fileName}`;

            sendPushToUsers(offlineMembers, {
              title: `${senderName} — ${task.title}`,
              body: preview,
              icon: "/icon-192.png",
              badge: "/badge-72.png",
              tag: `task-${taskId}`,
              data: {
                url: `/task/${taskId}`,
              },
            }).catch(console.error);
          }
        }
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