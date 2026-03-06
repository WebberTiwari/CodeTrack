const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema({
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true
  },
  input: String,
  output: String,
  isHidden: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("TestCase", testCaseSchema);
