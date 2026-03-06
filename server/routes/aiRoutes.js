// routes/aiRoutes.js

const express    = require("express");
const router     = express.Router();

const { protect }    = require("../middleware/authMiddleware");
const { reviewCode, getQuota } = require("../controllers/aiReviewController");
const aiRateLimit    = require("../middleware/aiRateLimit");

// POST /api/ai/review  — 5 free reviews per day, unlimited for Pro
router.post("/review", protect, aiRateLimit(), reviewCode);

// GET  /api/ai/quota   — returns current daily usage (no increment)
router.get("/quota", protect, getQuota);

module.exports = router;