require('dotenv').config();
const mongoose = require('mongoose');
const Submission = require('./models/Submission');

async function reset() {
  await mongoose.connect(process.env.MONGO_URI);

  await Submission.updateMany(
    { contestId: '69a7fcbd1d8bcb91ec1a88f3' },
    {
      $set: {
        isPlagiarised:     false,
        similarityScore:   0,
        matchedSubmission: null
      }
    }
  );

  console.log('✅ Submissions reset!');
  await mongoose.disconnect();
}

reset();