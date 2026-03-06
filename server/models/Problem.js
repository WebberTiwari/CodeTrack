const mongoose = require("mongoose");

// ================= SUB-SCHEMAS =================

const sampleSchema = new mongoose.Schema({
  input:  { type: String, default: "" },
  output: { type: String, default: "" },
}, { _id: false });


// ================= PROBLEM SCHEMA =================

const problemSchema = new mongoose.Schema({

  title: {
    type:      String,
    required:  [true, "Title is required"],
    trim:      true,
    minlength: [3,   "Title must be at least 3 characters"],
    maxlength: [200, "Title cannot exceed 200 characters"],
  },

  slug: {
    type:   String,
    unique: true,  // unique already creates an index
    trim:   true,
  },

  difficulty: {
    type:     String,
    enum:     { values: ["Easy", "Medium", "Hard"], message: "Difficulty must be Easy, Medium or Hard" },
    required: [true, "Difficulty is required"],
  },

  topics:    { type: [String], default: [] },
  companies: { type: [String], default: [] },

  description: {
    type:     String,
    required: [true, "Description is required"],
  },

  constraints: { type: String, default: "" },
  inputFormat: { type: String, default: "" },
  outputFormat:{ type: String, default: "" },
  notes:       { type: String, default: "" },

  // Visible sample test cases shown on the problem page
  samples: { type: [sampleSchema], default: [] },

  // Used by run route for quick "run against sample" execution
  exampleInput:   { type: String, default: "" },
  expectedOutput: { type: String, default: "" },

  // Model (correct) solution — used ONLY when user runs custom input
  modelSolution:   { type: String, default: "",  select: false }, // never expose in API
  modelLanguageId: { type: Number, default: 54  },  // 54=C++, 71=Python, 62=Java

  // Draft problems stay hidden until admin publishes them
  isPublished: {
    type:    Boolean,
    default: false,
  },

  // Scoring for contest problems
  points: {
    type:    Number,
    default: 100,
    min:     [0, "Points cannot be negative"],
  },

  timeLimit: {
    type:    Number,
    default: 1000,  // ms
    min:     [100, "Time limit must be at least 100ms"],
  },

  memoryLimit: {
    type:    Number,
    default: 256,   // MB
    min:     [16,  "Memory limit must be at least 16MB"],
  },

}, { timestamps: true });


// ================= INDEXES =================

// 1. Problems list — only show published problems, filter by difficulty
problemSchema.index({ isPublished: 1, difficulty: 1 });

// 2. Filter problems by topic tags
problemSchema.index({ topics: 1 });

// 3. Filter problems by company
problemSchema.index({ companies: 1 });

// 4. Combined filter — difficulty + topic (most common filter combo)
problemSchema.index({ difficulty: 1, topics: 1 });

// 5. Text search on title and description (search bar)
problemSchema.index({ title: "text", description: "text" });

// 6. Sort problems list by creation date
problemSchema.index({ createdAt: -1 });

// Note: slug unique index auto-created by { unique: true }


module.exports = mongoose.model("Problem", problemSchema);