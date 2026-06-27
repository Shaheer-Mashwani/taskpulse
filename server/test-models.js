require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Task = require("./models/Task");
const Message = require("./models/Message");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("Connected. Models loaded:", {
    User: !!User,
    Task: !!Task,
    Message: !!Message,
  });
  process.exit(0);
});