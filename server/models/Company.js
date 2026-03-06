// models/Company.js
const mongoose = require("mongoose");

// ── Embedded problem schema ───────────────────────────────────────────────
const ProblemSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    difficulty:  { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    tags:        [{ type: String, trim: true }],
    frequency:   { type: Number, default: 0, min: 0, max: 100 }, // interview frequency %
    isPremium:   { type: Boolean, default: true },
    leetcodeUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

// ── Company schema ────────────────────────────────────────────────────────
const CompanySchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, unique: true, trim: true },
    logo:     { type: String, default: "" },        // letter/emoji for UI card
    color:    { type: String, default: "#22C55E" }, // hex accent for UI card
    problems: [ProblemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", CompanySchema);