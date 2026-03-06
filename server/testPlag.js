require('dotenv').config();
const mongoose = require('mongoose');
const Submission = require('./models/Submission');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const CONTEST_ID = '69a7fcbd1d8bcb91ec1a88f3';
  const PROBLEM_ID = '69a6a839b61b3bc2a2e91012';
  const USER_1_ID  = '69a808e19c1198205bf5a851';
  const USER_2_ID  = '69a747620f24c18365a70747';

  await Submission.create([
    {
      userId: USER_1_ID,
      problemId: PROBLEM_ID,
      contestId: CONTEST_ID,
      languageId: 63,
      status: 'Accepted',
      code: `function solve(n) {
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    sum += i;
  }
  return sum;
}`
    },
    {
      userId: USER_2_ID,
      problemId: PROBLEM_ID,
      contestId: CONTEST_ID,
      languageId: 63,
      status: 'Accepted',
      code: `function solve(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
  return total;
}`
    }
  ]);

  console.log('✅ Test submissions created!');
  await mongoose.disconnect();
}

seed();