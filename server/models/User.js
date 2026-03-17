const mongoose = require("mongoose");

// ================= SOCIAL SCHEMA =================

const socialSchema = new mongoose.Schema({
  codeforces: { type: String, default: "", trim: true, maxlength: 100 },
  codechef:   { type: String, default: "", trim: true, maxlength: 100 },
  leetcode:   { type: String, default: "", trim: true, maxlength: 100 },
  github:     { type: String, default: "", trim: true, maxlength: 100 },
  linkedin:   { type: String, default: "", trim: true, maxlength: 100 },
}, { _id: false });


// ================= RATING HISTORY SCHEMA =================

const ratingHistorySchema = new mongoose.Schema({
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  "Contest",
    required: true,
  },
  rank:         { type: Number, min: 1 },
  ratingChange: { type: Number },
  newRating:    { type: Number, min: 0 },
  date:         { type: Date, default: Date.now },
}, { _id: false });


// ================= SUBSCRIPTION HISTORY SCHEMA =================

const subscriptionHistorySchema = new mongoose.Schema({
  plan:              { type: String, enum: ["pro"], required: true },
  amount:            { type: Number, required: true },           // in paise
  razorpayOrderId:   { type: String, required: true },
  razorpayPaymentId: { type: String, default: null },
  status:            { type: String, enum: ["created", "paid", "failed"], default: "created" },
  startedAt:         { type: Date, default: Date.now },
  expiresAt:         { type: Date },
}, { _id: false });


// ================= USER SCHEMA =================

const userSchema = new mongoose.Schema({

  // ── Basic Info ──────────────────────────────────────────────────────────
  name: {
    type:      String,
    required:  [true, "Name is required"],
    trim:      true,
    minlength: [2,  "Name must be at least 2 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"],
  },

  email: {
    type:      String,
    required:  [true, "Email is required"],
    unique:    true,
    lowercase: true,
    trim:      true,
    match:     [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
  },

  password: {
    type:     String,
    required: [true, "Password is required"],
    select:   false,
  },

  username: {
    type:      String,
    unique:    true,
    sparse:    true,
    trim:      true,
    maxlength: [30, "Username cannot exceed 30 characters"],
  },

  bio: {
    type:      String,
    default:   "Competitive Programmer",
    maxlength: [300, "Bio cannot exceed 300 characters"],
    trim:      true,
  },

  avatar: {
    type:    String,
    default: "",
    trim:    true,
  },

  // ── Social Links ────────────────────────────────────────────────────────
  socials: {
    type:    socialSchema,
    default: () => ({}),
  },

  // ── Problem Activity ────────────────────────────────────────────────────
  solvedProblems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:  "Problem",
  }],

  attemptedProblems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:  "Problem",
  }],

  // ── Contest Stats ───────────────────────────────────────────────────────
  rating: {
    type:    Number,
    default: 1200,
    min:     [0, "Rating cannot be negative"],
  },

  maxRating: {
    type:    Number,
    default: 1200,
    min:     [0, "Max rating cannot be negative"],
  },

  ratingHistory: [ratingHistorySchema],

  contestsPlayed: {
    type:    Number,
    default: 0,
    min:     [0, "Cannot be negative"],
  },

  contestsWon: {
    type:    Number,
    default: 0,
    min:     [0, "Cannot be negative"],
  },

  // ── Email System ────────────────────────────────────────────────────────
  receiveEmails: {
    type:    Boolean,
    default: true,
  },

  emailVerified: {
    type:    Boolean,
    default: false,
  },

  unsubscribeToken: {
    type:    String,
    default: null,
    select:  false,
  },

  // ── Account State ───────────────────────────────────────────────────────
  isActive: {
    type:    Boolean,
    default: true,
  },

  lastLoginAt: {
    type: Date,
  },

  // ── Role ────────────────────────────────────────────────────────────────
  role: {
    type:    String,
    enum:    { values: ["user", "admin"], message: "Role must be user or admin" },
    default: "user",
  },

  // ── Subscription / Plan ─────────────────────────────────────────────────
  // "free"  → 5 AI reviews/day (default)
  // "pro"   → unlimited AI reviews/day until planExpiry
  plan: {
    type:    String,
    enum:    ["free", "pro"],
    default: "free",
  },

  planExpiry: {
    type:    Date,
    default: null,
  },

  subscriptionHistory: [subscriptionHistorySchema],

  // ── AI Daily Quota (free tier) ───────────────────────────────────────────
  // Tracks usage per day; resets lazily on first AI request of each new day.
  aiUsedToday: {
    type:    Number,
    default: 0,
    min:     0,
  },

  aiLastResetDate: {
    type:    String,   // stored as "YYYY-MM-DD" for cheap string comparison
    default: null,
  },

}, {
  timestamps: true,
  toJSON:     { virtuals: true },
  toObject:   { virtuals: true },
});


// ================= VIRTUALS =================

userSchema.virtual("solvedCount").get(function () {
  return this.solvedProblems?.length ?? 0;
});

userSchema.virtual("attemptedCount").get(function () {
  return this.attemptedProblems?.length ?? 0;
});

// Whether the user currently has an active Pro subscription
userSchema.virtual("isPro").get(function () {
  return this.plan === "pro" && this.planExpiry && this.planExpiry > new Date();
});


// ================= INSTANCE METHODS =================

userSchema.methods.hasSolved = function (problemId) {
  return this.solvedProblems.some((id) => id.equals(problemId));
};

userSchema.methods.hasAttempted = function (problemId) {
  return this.attemptedProblems.some((id) => id.equals(problemId));
};


// ================= PRE-SAVE HOOK =================

userSchema.pre("save", function () {
  if (this.isModified("rating") && this.rating > this.maxRating) {
    this.maxRating = this.rating;
  }
});


// ================= INDEXES =================

userSchema.index({ rating: -1 });
userSchema.index({ rating: -1, contestsPlayed: -1 });
userSchema.index({ role: 1 });
userSchema.index({ unsubscribeToken: 1 }, { sparse: true });
userSchema.index({ receiveEmails: 1, emailVerified: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ plan: 1, planExpiry: 1 });   // for subscription queries


module.exports = mongoose.model("User", userSchema);