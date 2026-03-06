// migrateTestCases.js
// Run once with: node migrateTestCases.js
// Place this file in your project root

require("dotenv").config();
const mongoose = require("mongoose");
const Problem = require("./models/Problem");
const TestCase = require("./models/TestCase");

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const problems = await Problem.find({});
  console.log(`Found ${problems.length} problems`);

  let totalSeeded = 0;

  for (const problem of problems) {
    // Check if test cases already exist for this problem
    const existing = await TestCase.countDocuments({ problemId: problem._id });
    if (existing > 0) {
      console.log(`⏭️  Skipping "${problem.slug}" — already has ${existing} test cases`);
      continue;
    }

    // Support both "samples" and "testCases" field names
    const raw = problem.testCases ?? problem.samples ?? [];

    if (raw.length === 0) {
      console.log(`⚠️  No samples found for "${problem.slug}" — skipping`);
      continue;
    }

    const testCases = raw.map((tc) => ({
      problemId: problem._id,
      input: tc.input ?? "",
      output: tc.expectedOutput ?? tc.output ?? "",
      isHidden: tc.isHidden ?? true
    }));

    await TestCase.insertMany(testCases);
    console.log(`✅ Seeded ${testCases.length} test cases for "${problem.slug}"`);
    totalSeeded += testCases.length;
  }

  console.log(`\nDone! Total test cases seeded: ${totalSeeded}`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});