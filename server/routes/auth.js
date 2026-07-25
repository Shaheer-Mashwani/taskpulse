const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authenticate = require("../middleware/auth");

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * ================================
 * GOOGLE LOGIN (WEB - ID TOKEN)
 * ================================
 */
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Missing Google credential" });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: "Email not found" });
    }

    let user = await User.findOne({ googleId });
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        googleId,
        email,
        name,
        avatar: picture,
        role: "pending", // important for role selection
      });
      isNewUser = true;
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user, isNewUser });
  } catch (err) {
    console.error("Google auth error:", err.message);
    res.status(401).json({ message: "Google authentication failed" });
  }
});

/**
 * ==========================================
 * GOOGLE LOGIN (CAPACITOR - ACCESS TOKEN)
 * ==========================================
 */
router.post("/google-token", async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ message: "Missing access token" });
    }

    // Fetch user info from Google
    const googleRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    if (!googleRes.ok) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const googleUser = await googleRes.json();
    const { sub: googleId, email, name, picture } = googleUser;

    if (!email) {
      return res.status(400).json({ message: "Email not found" });
    }

    let user = await User.findOne({ googleId });
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        googleId,
        email,
        name,
        avatar: picture,
        role: "pending",
      });
      isNewUser = true;
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user, isNewUser });
  } catch (err) {
    console.error("Google token auth error:", err.message);
    res.status(401).json({ message: "Authentication failed" });
  }
});

/**
 * ================================
 * SELECT ROLE (FIRST TIME USER)
 * ================================
 */
router.post("/select-role", authenticate, async (req, res) => {
  try {
    const { role } = req.body;

    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "pending") {
      return res.status(400).json({ message: "Role already set" });
    }

    user.role = role;
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error("Select role error:", err.message);
    res.status(500).json({ message: "Failed to set role" });
  }
});

/**
 * ================================
 * RESTORE SESSION
 * ================================
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Get me error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ================================
 * PROMOTE USER (ADMIN ONLY)
 * ================================
 */
router.patch("/promote/:userId", authenticate, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);

    if (requester.role !== "admin") {
      return res.status(403).json({ message: "Only admins can promote users" });
    }

    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ message: "User not found" });

    target.role = "admin";
    await target.save();

    res.json({ user: target });
  } catch (err) {
    console.error("Promote error:", err.message);
    res.status(500).json({ message: "Failed to promote user" });
  }
});

module.exports = router;