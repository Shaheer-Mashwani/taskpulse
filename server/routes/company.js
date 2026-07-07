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

    // Prevent creating a second company if already in one
    const existingUser = await User.findById(req.user.id);
    if (existingUser.company) {
      return res.status(400).json({
        message: "You are already part of a workspace. Leave it first before creating a new one.",
      });
    }

    const inviteCode = nanoid(8).toUpperCase();
    const company = await Company.create({
      name,
      createdBy: req.user.id,
      members: [req.user.id],
      inviteCode,
    });

    await User.findByIdAndUpdate(req.user.id, {
      company: company._id,
      role: "admin",
    });

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

    // Prevent joining a second company
    const existingUser = await User.findById(req.user.id);
    if (existingUser.company) {
      return res.status(400).json({
        message: "You are already part of a workspace. Leave it first before joining another.",
      });
    }

    const company = await Company.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!company) return res.status(404).json({ message: "Invalid invite code" });

    if (!company.members.includes(req.user.id)) {
      company.members.push(req.user.id);
      await company.save();
    }

    await User.findByIdAndUpdate(req.user.id, {
      company: company._id,
      role: "member",
    });

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

// GET all members of the current user's company
router.get("/members", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.company) return res.status(404).json({ message: "No company found" });

    const company = await Company.findById(user.company).populate(
      "members",
      "name email avatar role"
    );

    res.json({ members: company.members });
  } catch (err) {
    console.error("Get members error:", err);
    res.status(500).json({ message: "Failed to fetch members" });
  }
});

// ADD a member to the company by email (any member can do this)
router.post("/members/add", authenticate, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const currentUser = await User.findById(req.user.id);
    if (!currentUser.company) {
      return res.status(400).json({ message: "You are not part of a company" });
    }

    const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!targetUser) {
      return res.status(404).json({
        message: "No TaskPulse account found with that email. Ask them to sign up first.",
      });
    }

    if (targetUser.company && targetUser.company.toString() === currentUser.company.toString()) {
      return res.status(400).json({ message: "This person is already in your workspace" });
    }

    const company = await Company.findById(currentUser.company);

    if (!company.members.includes(targetUser._id)) {
      company.members.push(targetUser._id);
      await company.save();
    }

    await User.findByIdAndUpdate(targetUser._id, {
      company: currentUser.company,
    });

    const updatedCompany = await Company.findById(currentUser.company).populate(
      "members",
      "name email avatar role"
    );

    res.json({ message: "Member added successfully", members: updatedCompany.members });
  } catch (err) {
    console.error("Add member error:", err);
    res.status(500).json({ message: "Failed to add member" });
  }
});

router.post("/leave", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.company) {
      return res.status(400).json({ message: "You are not in a workspace" });
    }

    const company = await Company.findById(user.company);
    if (company) {
      company.members = company.members.filter(
        (m) => m.toString() !== req.user.id
      );
      await company.save();
    }

    await User.findByIdAndUpdate(req.user.id, {
      company: null,
      role: "member",
    });

    const updatedUser = await User.findById(req.user.id);
    const token = await issueToken(updatedUser);

    res.json({ message: "Left workspace", token, user: updatedUser });
  } catch (err) {
    console.error("Leave company error:", err);
    res.status(500).json({ message: "Failed to leave workspace" });
  }
});


module.exports = router;