const express = require('express');
const router = express.Router();
const { runPostContestPlagiarismCheck } = require('../plagiarism/contestChecker');
const Submission = require('../models/Submission');
const Contest = require('../models/Contest');
const { protect } = require('../middleware/authMiddleware'); // ✅ fixed named import

// ── Admin guard (inline, same as contestRoutes) ───────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Admin access required' });
  }
  next();
};

// ── Manual trigger from Admin Dashboard ──────────────────────────────────────
router.post('/contests/:contestId/check-plagiarism', protect, adminOnly, async (req, res) => {
  const { contestId } = req.params;
  try {
    // Fire and forget — returns immediately, runs in background
    runPostContestPlagiarismCheck(contestId);
    res.json({ success: true, message: 'Plagiarism check started in background.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get all flagged submissions for a contest (Admin report view) ─────────────
router.get('/contests/:contestId/plagiarism-report', protect, adminOnly, async (req, res) => {
  try {
    const flagged = await Submission.find({
      contestId: req.params.contestId,
      isPlagiarised: true
    })
      .populate('userId', 'username email')
      .populate('problemId', 'title difficulty')
      .populate('matchedSubmission', 'userId code')
      .sort({ similarityScore: -1 });

    const contest = await Contest.findById(req.params.contestId)
      .select('title leaderboard')
      .populate('leaderboard.user', 'username email');

    const scoreLookup = {};
    if (contest?.leaderboard) {
      for (const entry of contest.leaderboard) {
        scoreLookup[entry.user?._id?.toString()] = entry.score;
      }
    }

    const enriched = flagged.map(sub => ({
      ...sub.toObject(),
      currentScore: scoreLookup[sub.userId?._id?.toString()] ?? 'N/A'
    }));

    res.json({
      success: true,
      contestTitle: contest?.title,
      count: enriched.length,
      flagged: enriched
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Plagiarism summary stats for a contest ────────────────────────────────────
router.get('/contests/:contestId/plagiarism-stats', protect, adminOnly, async (req, res) => {
  try {
    const total = await Submission.countDocuments({
      contestId: req.params.contestId
    });

    const flagged = await Submission.countDocuments({
      contestId: req.params.contestId,
      isPlagiarised: true
    });

    const highSimilarity = await Submission.countDocuments({
      contestId: req.params.contestId,
      isPlagiarised: true,
      similarityScore: { $gte: 90 }
    });

    res.json({
      success: true,
      stats: {
        totalSubmissions: total,
        flaggedSubmissions: flagged,
        highSimilarityCount: highSimilarity,
        plagiarismRate: total > 0
          ? ((flagged / total) * 100).toFixed(1) + '%'
          : '0%'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Confirm penalty + send email ──────────────────────────────────────────────
router.post('/confirm-penalty', protect, adminOnly, async (req, res) => {
  const { sub1Id, sub2Id } = req.body;
  try {
    const sub1 = await Submission.findById(sub1Id).populate('userId', 'username email');
    const sub2 = await Submission.findById(sub2Id).populate('userId', 'username email');
    if (!sub1 || !sub2) return res.status(404).json({ success: false, message: 'Submissions not found' });

    const contest = await Contest.findById(sub1.contestId);
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });

    await Contest.updateOne(
      { _id: contest._id, 'leaderboard.user': sub1.userId._id },
      { $set: { 'leaderboard.$.score': 0 } }
    );
    await Contest.updateOne(
      { _id: contest._id, 'leaderboard.user': sub2.userId._id },
      { $set: { 'leaderboard.$.score': 0 } }
    );

    const { sendPlagiarismEmail } = require('../utils/plagiarismMailer');
    await sendPlagiarismEmail(sub1.userId, sub2.userId, contest, sub1.similarityScore / 100);

    res.json({ success: true, message: 'Penalty confirmed and emails sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Clear false positive ──────────────────────────────────────────────────────
router.post('/clear-false-positive', protect, adminOnly, async (req, res) => {
  const { sub1Id, sub2Id } = req.body;
  try {
    await Submission.findByIdAndUpdate(sub1Id, {
      isPlagiarised: false, similarityScore: 0, matchedSubmission: null
    });
    await Submission.findByIdAndUpdate(sub2Id, {
      isPlagiarised: false, similarityScore: 0, matchedSubmission: null
    });

    res.json({ success: true, message: 'False positive cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;