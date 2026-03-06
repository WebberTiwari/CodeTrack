const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET PROFILE
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE PROFILE
router.put("/:id", async (req, res) => {
  try {
    const { username, bio, socials } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, bio, socials },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
