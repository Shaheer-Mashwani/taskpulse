const express = require("express");
const Company = require("../models/Company");
const User = require("../models/User");
const authenticate = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");

const router = express.Router();

// Generate a fresh token with updated user data
async function issueToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// CREATE a new company (admin flow)
router.post("/create", authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Company name is required" });

    const inviteCode = nanoid(8).toUpperCase();

    const company = await Company.create({
      name,
      createdBy: req.user.id,
      members: [req.user.id],
      inviteCode,
    });

    await User.findByIdAndUpdate(req.user.id, { company: company._id, role: "admin" });

    const updatedUser = await User.findById(req.user.id);
    const token = await issueToken(updatedUser);

    res.status(201).json({ company, token, user: updatedUser });
  } catch (err) {
    console.error("Create company error:", err);
    res.status(500).json({ message: "Failed to create company" });
  }
});

// JOIN an existing company via invite code (member flow)
router.post("/join", authenticate, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ message: "Invite code is required" });

    const company = await Company.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!company) return res.status(404).json({ message: "Invalid invite code" });

    if (!company.members.includes(req.user.id)) {
      company.members.push(req.user.id);
      await company.save();
    }

    await User.findByIdAndUpdate(req.user.id, { company: company._id, role: "member" });

    const updatedUser = await User.findById(req.user.id);
    const token = await issueToken(updatedUser);

    res.status(200).json({ company, token, user: updatedUser });
  } catch (err) {
    console.error("Join company error:", err);
    res.status(500).json({ message: "Failed to join company" });
  }
});

// GET current company info (with invite code for admin to share)
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.company) return res.status(404).json({ message: "No company found" });

    const company = await Company.findById(user.company).populate("members", "name email avatar role");
    res.json({ company });
  } catch (err) {
    console.error("Get company error:", err);
    res.status(500).json({ message: "Failed to fetch company" });
  }
});

module.exports = router;