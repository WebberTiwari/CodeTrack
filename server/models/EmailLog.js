const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema({

  // Type of email
  type: {
    type: String,
    enum: ["postmortem", "reminder"],
    required: true
  },

  // Related contest
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contest"
  },

  contestTitle: {
    type: String
  },

  // Email delivery info
  recipients: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["delivered", "failed"],
    default: "delivered"
  },

  error: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model("EmailLog", emailLogSchema);