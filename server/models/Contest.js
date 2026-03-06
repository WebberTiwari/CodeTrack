const mongoose = require("mongoose");

// ================= CONTEST MODEL =================

const contestSchema = new mongoose.Schema({

  title: { type: String, required: true },

  startTime: { type: Date, required: true },

  endTime: { type: Date, required: true },

  status: {
    type: String,
    enum: ["upcoming", "live", "ended"],
    default: "upcoming"
  },

  problems: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem"
    },
    points: { type: Number, default: 100 }
  }],

  // FIX: derive participant count from ContestLeaderboard.countDocuments()
  // Keep as a cached counter — sync it after each registration
  participants: { type: Number, default: 0 },

  freezeTime: {
    type: Date
  },

  stats: {
    submissions:    { type: Number, default: 0 },
    accepted:       { type: Number, default: 0 },
    topScore:       { type: Number, default: 0 },
    // FIX: acceptanceRate is computed on the fly — not stored
    // acceptanceRate = stats.accepted / stats.submissions * 100
  },

  ratingCalculated: {
    type: Boolean,
    default: false
  },

  // ================= EMAIL TRACKING =================
  postmortemEmailSent:   { type: Boolean, default: false },
  postmortemEmailSentAt: { type: Date },

  reminderEmailSent:     { type: Boolean, default: false },
  reminderEmailSentAt:   { type: Date },

  reminderScheduledFor:  { type: Date },
  reminderTiming:        { type: String }

}, { timestamps: true });


// ================= INDEXES =================

// 1. Fetch contests by status (upcoming / live / ended tabs)
contestSchema.index({ status: 1 });

// 2. Sort contests by start time (contest list page)
contestSchema.index({ startTime: -1 });

// 3. Cron job — find contests that need status update
contestSchema.index({ status: 1, startTime: 1, endTime: 1 });

// 4. Email system — find contests that need reminder/postmortem emails
contestSchema.index({ reminderEmailSent: 1, reminderScheduledFor: 1 });
contestSchema.index({ postmortemEmailSent: 1, status: 1 });


// ================= CONTEST LEADERBOARD MODEL =================
// FIX: Moved OUT of Contest document to avoid 16MB doc limit
// and prevent full-document rewrites on every submission

const contestLeaderboardSchema = new mongoose.Schema({

  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contest",
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  score: {
    type: Number,
    default: 0
  },

  penalty: {
    type: Number,
    default: 0   // total penalty time in minutes (ICPC style)
  },

  solvedProblems: {
    type: Number,
    default: 0
  },

  submissions: {
    type: Number,
    default: 0
  },

  // Per-problem breakdown for detailed leaderboard view
  problemResults: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem"
    },
    solved:       { type: Boolean, default: false },
    attempts:     { type: Number,  default: 0 },
    solvedAt:     { type: Date },     // time of AC submission
    penaltyMins:  { type: Number, default: 0 }
  }]

}, { timestamps: true });


// ================= LEADERBOARD INDEXES =================

// 1. Sorted leaderboard for a contest (score DESC, penalty ASC = standard ranking)
contestLeaderboardSchema.index({ contestId: 1, score: -1, penalty: 1 });

// 2. Unique constraint — one entry per user per contest
contestLeaderboardSchema.index({ contestId: 1, userId: 1 }, { unique: true });

// 3. User's contest history (profile page — contests participated)
contestLeaderboardSchema.index({ userId: 1, createdAt: -1 });


const Contest = mongoose.model("Contest", contestSchema);
const ContestLeaderboard = mongoose.model("ContestLeaderboard", contestLeaderboardSchema);

module.exports = { Contest, ContestLeaderboard };