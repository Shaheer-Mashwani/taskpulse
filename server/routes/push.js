const express = require("express");
const PushSubscription = require("../models/PushSubscription");
const authenticate = require("../middleware/auth");

const router = express.Router();

// Save a new push subscription for the logged-in user
router.post("/subscribe", authenticate, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ message: "Invalid subscription" });
    }

    // Upsert — update if this endpoint already exists for this user
    await PushSubscription.findOneAndUpdate(
      { user: req.user.id, "subscription.endpoint": subscription.endpoint },
      { user: req.user.id, subscription },
      { upsert: true, new: true }
    );

    res.json({ message: "Subscribed" });
  } catch (err) {
    console.error("Subscribe error:", err);
    res.status(500).json({ message: "Failed to save subscription" });
  }
});

// Remove subscription on logout
router.post("/unsubscribe", authenticate, async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({
      user: req.user.id,
      "subscription.endpoint": endpoint,
    });
    res.json({ message: "Unsubscribed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to unsubscribe" });
  }
});

module.exports = router;