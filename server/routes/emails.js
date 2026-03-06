const express = require("express");
const router = express.Router();
const { Contest, ContestLeaderboard } = require("../models/Contest");
const { protect, isAdmin, restrictTo, optionalAuth } = require("../middleware/authMiddleware"); // ✅ require auth

const {
  sendPostmortemEmail,
  sendReminderEmail
} = require("../services/emailService");

// ─────────────────────────────────────────────
// ADMIN GUARD
// ─────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ msg: "Admin access required" });
  next();
};

// ─────────────────────────────────────────────
// MANUAL POSTMORTEM SEND
// ─────────────────────────────────────────────
router.post("/postmortem/:id", protect, adminOnly, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ error: "Contest not found" });

    if (contest.postmortemEmailSent) {
      return res.json({
        success: false,
        message: "Postmortem already sent"
      });
    }

    const result = await sendPostmortemEmail(req.params.id);
    res.json(result);

  } catch (err) {
    console.error("Postmortem route error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// MANUAL REMINDER SEND
// ─────────────────────────────────────────────
router.post("/reminder/:id", protect, adminOnly, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ error: "Contest not found" });

    if (contest.reminderEmailSent) {
      return res.json({
        success: false,
        message: "Reminder already sent"
      });
    }

    const result = await sendReminderEmail(req.params.id);
    res.json(result);

  } catch (err) {
    console.error("Reminder route error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// SCHEDULE REMINDER
// ─────────────────────────────────────────────
router.post("/schedule/:id", protect, adminOnly, async (req, res) => {
  try {
    const { timing } = req.body;

    const contest = await Contest.findById(req.params.id);
    if (!contest)
      return res.status(404).json({ error: "Contest not found" });

    const hoursMap = {
      "1h before": 1,
      "3h before": 3,
      "6h before": 6
    };

    const hours = hoursMap[timing];
    if (!hours)
      return res.status(400).json({ error: "Invalid timing" });

    contest.reminderScheduledFor =
      new Date(contest.startTime.getTime() - hours * 60 * 60 * 1000);

    contest.reminderTiming = timing;
    contest.reminderEmailSent = false; // reset flag
    await contest.save();

    console.log(
      `⏰ Reminder scheduled for ${contest.reminderScheduledFor}`
    );

    res.json({
      success: true,
      scheduledFor: contest.reminderScheduledFor
    });

  } catch (err) {
    console.error("Schedule reminder error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;