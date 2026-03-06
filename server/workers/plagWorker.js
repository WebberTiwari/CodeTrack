require("dotenv").config();

const connectDB = require("../config/db");
const Submission = require("../models/Submission");
const checkPlagiarism = require("../plagiarism/checker");

async function startWorker() {

  await connectDB();
  console.log("Plagiarism Worker Started");

  while (true) {
    try {

      const sub = await Submission.findOne({
        status: "Accepted",
        fingerprints: { $size: 0 }
      });

      if (sub) {
        console.log("Checking submission:", sub._id);
        await checkPlagiarism(sub);
      } else {
        await new Promise(r => setTimeout(r, 3000));
      }

    } catch (err) {
      console.log("Worker error:", err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

startWorker();
