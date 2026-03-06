const express = require("express");
const router = express.Router();
const Submission = require("../models/Submission");
const { protect, isAdmin, restrictTo, optionalAuth } = require("../middleware/authMiddleware"); // ⭐ add this

// GET SOLVED PROBLEMS — only for logged in user
router.get("/solved", protect, async (req, res) => { // ⭐ add protect
  try {

    const accepted = await Submission.find({
      status: "Accepted",
      userId: req.user._id  // ⭐ filter by logged in user
    }).populate("problemId", "title slug difficulty");

    const map = new Map();

    for (let sub of accepted) {
      if (!sub.problemId) continue;

      const id = sub.problemId._id.toString();

      if (!map.has(id)) {
        map.set(id, {
          problemId:    id,
          title:        sub.problemId.title,
          slug:         sub.problemId.slug,
          difficulty:   sub.problemId.difficulty,
          submissionId: sub._id
        });
      }
    }

    res.json(Array.from(map.values()));

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed" });
  }
});

// GET SPECIFIC SUBMISSION CODE — only own submission
router.get("/:id", protect, async (req, res) => { // ⭐ add protect
  try {
    const sub = await Submission.findById(req.params.id)
      .populate("problemId", "title");

    if (!sub) return res.status(404).json({ error: "Not found" });

    // non-admin can only see their own
    if (sub.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(sub);
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

module.exports = router;