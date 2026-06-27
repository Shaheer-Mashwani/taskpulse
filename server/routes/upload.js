const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const authenticate = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", authenticate, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      resource_type: "auto", // auto-detects image/video/audio/raw
      folder: "taskpulse",
    });

    res.json({
      url: result.secure_url,
      fileName: req.file.originalname,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

module.exports = router;
