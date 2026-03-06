const similarity = require('./similarity');
const tokenize   = require('./tokenizer');
const cleanCode  = require('./cleanCode');
const normalize  = require('./normalize');
const Submission = require('../models/Submission');
const Contest    = require('../models/Contest');
const { sendPlagiarismEmail } = require('../utils/plagiarismMailer');

const PLAGIARISM_THRESHOLD = 0.80;

async function runPostContestPlagiarismCheck(contestId) {
  try {
    const contest = await Contest.findById(contestId);
    if (!contest) throw new Error('Contest not found');

    console.log(`[PlagCheck] Starting for contest: ${contest.title}`);

    for (const problemEntry of contest.problems) {
      const problemId = problemEntry.problemId;

      const submissions = await Submission.find({
        contestId: contestId,
        problemId: problemId,
        status:    'Accepted'
      }).populate('userId', 'username email');

      if (submissions.length < 2) continue;

      console.log(`[PlagCheck] Comparing ${submissions.length} submissions for problem ${problemId}`);

      for (let i = 0; i < submissions.length; i++) {
        for (let j = i + 1; j < submissions.length; j++) {
          const sub1 = submissions[i];
          const sub2 = submissions[j];

          if (
            sub1.matchedSubmission?.toString() === sub2._id.toString() ||
            sub2.matchedSubmission?.toString() === sub1._id.toString()
          ) continue;

          const tokens1 = tokenize(normalize(cleanCode(sub1.code)));
          const tokens2 = tokenize(normalize(cleanCode(sub2.code)));
          const score   = similarity(tokens1, tokens2);

          if (score >= PLAGIARISM_THRESHOLD) {
            console.log(
              `[PlagCheck] FLAGGED: ${sub1.userId.username} & ${sub2.userId.username} — ${Math.round(score * 100)}%`
            );
            await handlePlagiarism(sub1, sub2, score, contest);
          }
        }
      }
    }

    console.log(`[PlagCheck] ✅ Done for contest: ${contest.title}`);
  } catch (err) {
    console.error('[PlagCheck] ❌ Error:', err);
  }
}

async function handlePlagiarism(sub1, sub2, score, contest) {
  const scorePercent = Math.round(score * 100);

  await Submission.findByIdAndUpdate(sub1._id, {
    isPlagiarised:     true,
    similarityScore:   scorePercent,
    matchedSubmission: sub2._id
  });
  await Submission.findByIdAndUpdate(sub2._id, {
    isPlagiarised:     true,
    similarityScore:   scorePercent,
    matchedSubmission: sub1._id
  });

  await Contest.updateOne(
    { _id: contest._id, 'leaderboard.user': sub1.userId._id },
    { $set: { 'leaderboard.$.score': 0 } }
  );
  await Contest.updateOne(
    { _id: contest._id, 'leaderboard.user': sub2.userId._id },
    { $set: { 'leaderboard.$.score': 0 } }
  );

  console.log(`[PlagCheck] Scores zeroed for ${sub1.userId.username} & ${sub2.userId.username}`);

  await sendPlagiarismEmail(sub1.userId, sub2.userId, contest, score);
}

module.exports = { runPostContestPlagiarismCheck };