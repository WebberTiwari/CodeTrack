const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({

  // ── References ───────────────────────────────────────────────────────────
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "User",
    required: [true, "userId is required"],
  },

  problemId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "Problem",
    required: [true, "problemId is required"],
  },

  // Null for practice submissions, set for contest submissions
  contestId: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     "Contest",
    default: null,
  },

  // ── Code ─────────────────────────────────────────────────────────────────
  code: {
    type:     String,
    required: [true, "Code is required"],
    select:   false,  // don't return code in list queries — only fetch when needed
  },

  languageId: {
    type:     Number,
    required: [true, "languageId is required"],
  },

  // ── Result ───────────────────────────────────────────────────────────────
  status: {
    type:    String,
    enum: {
      values: [
        "Queued",
        "Running",
        "Accepted",
        "Wrong Answer",
        "Time Limit Exceeded",
        "Memory Limit Exceeded",
        "Compilation Error",
        "Runtime Error",
        "Judge Error",
        "Judge Crash",
        "Judge Timeout",
],

      message: "Invalid status value",
    },
    default: "Queued",
  },

  output: {
    type:   String,
    default: "",
    select: false,  // large field — only fetch when viewing a single submission
  },

  runtime: {
    type:    Number,
    default: 0,
    min:     0,
  },

  memory: {
    type:    Number,  // KB — returned by Judge0
    default: 0,
    min:     0,
  },

  verdictTime: {
    type: Date,
  },

  // ── Plagiarism ───────────────────────────────────────────────────────────
  fingerprints: {
    type:   [Number],
    default: [],
    select: false,  // internal use only — never expose in API responses
  },

  isPlagiarised: {
    type:    Boolean,
    default: false,
  },

  similarityScore: {
    type:    Number,
    default: 0,
    min:     0,
    max:     100,
  },

  matchedSubmission: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     "Submission",
    default: null,
  },

  testResults: {
  type: [{
    passed:   { type: Boolean },
    input:    { type: String  },
    expected: { type: String  },
    got:      { type: String  },
  }],
  default: [],
  select: false,
},

}, { timestamps: true });


// ================= INDEXES =================

// 1. Fetch all submissions by a user (profile page, submission history)
submissionSchema.index({ userId: 1, createdAt: -1 });

// 2. Fetch submissions for a specific problem (problem page history)
submissionSchema.index({ problemId: 1, createdAt: -1 });

// 3. Fetch a user's submissions for a specific problem (most common query)
submissionSchema.index({ userId: 1, problemId: 1, createdAt: -1 });

// 4. Fetch all submissions for a contest (leaderboard)
submissionSchema.index({ contestId: 1, createdAt: -1 });

// 5. Fetch accepted submissions only (solved problems, stats)
submissionSchema.index({ userId: 1, status: 1 });

// 6. Plagiarism checker — find submissions for same problem + language
submissionSchema.index({ problemId: 1, status: 1, languageId: 1 });

// 7. Contest leaderboard — accepted submissions per contest per user
submissionSchema.index({ contestId: 1, userId: 1, status: 1 });

// 8. Admin submissions view — latest across all users
submissionSchema.index({ createdAt: -1 });


module.exports = mongoose.model("Submission", submissionSchema);