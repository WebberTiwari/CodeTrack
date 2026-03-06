const mongoose = require("mongoose");

const problemSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },

  firstOpenedAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },

  totalActiveTime: { type: Number, default: 0 }, // seconds

  hintsUsed: { type: Number, default: 0 },
  runs: { type: Number, default: 0 },
  submissions: { type: Number, default: 0 },

  solutionUnlocked: { type: Boolean, default: false }
});

module.exports = mongoose.model("ProblemSession", problemSessionSchema);
