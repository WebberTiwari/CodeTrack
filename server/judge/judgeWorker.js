const TestCase    = require("../models/TestCase");
const Submission  = require("../models/Submission");
const User        = require("../models/User");
const { Contest, ContestLeaderboard } = require("../models/Contest");

const compareOutput  = require("./compareOutput");
const { createSubmission, getResult } = require("../services/judge0Service");
const { checkPlagiarism } = require("../plagiarism/contestChecker");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function judgeSubmission(submissionId, problemId, code, languageId) {
  try {
    console.log("Judging submission:", submissionId, "| lang:", languageId);

    const testcases = await TestCase.find({ problemId });

    if (!testcases || testcases.length === 0) {
      await Submission.findByIdAndUpdate(submissionId, {
        status: "Judge Error",
        output: "No testcases found"
      });
      return;
    }

    await Submission.findByIdAndUpdate(submissionId, { status: "Running" });

    let finalStatus    = "Accepted";
    let lastOutput     = "";
    let totalRuntimeMs = 0;
    const testResults  = [];

    for (const tc of testcases) {
      try {
        const input = (tc.input ?? "") + "\n";
        const token = await createSubmission(code, input, languageId);

        let result;
        let attempts = 0;
        const MAX_ATTEMPTS = 20;

        while (attempts < MAX_ATTEMPTS) {
          await sleep(1500);
          result = await getResult(token);
          if (result.status && result.status.id >= 3) break;
          attempts++;
        }

        if (!result || result.status.id < 3) {
          finalStatus = "Judge Timeout";
          lastOutput  = "Judge0 did not respond in time.";
          testResults.push({
            passed:   false,
            input:    tc.input || "",
            expected: tc.output || "",
            got:      "Judge Timeout",
          });
          break;
        }

        if (result.time) {
          totalRuntimeMs += Math.round(parseFloat(result.time) * 1000);
        }

        if (result.status.id !== 3) {
          finalStatus = result.status.description || "Error";
          lastOutput  =
            result.stderr        ||
            result.compile_output ||
            result.message       ||
            "Execution Failed";
          testResults.push({
            passed:   false,
            input:    tc.input || "",
            expected: tc.output || "",
            got:      lastOutput,
          });
          break;
        }

        lastOutput = result.stdout ?? "";

        const correct = compareOutput(lastOutput, tc.output);
        testResults.push({
          passed:   correct,
          input:    tc.input   || "",
          expected: tc.output  || "",
          got:      lastOutput || "",
        });

        if (!correct) {
          finalStatus = "Wrong Answer";
          break;
        }

      } catch (err) {
        console.error("Judge0 execution error:", err.message);
        finalStatus = "Judge Error";
        lastOutput  = err.message;
        testResults.push({
          passed:   false,
          input:    tc.input || "",
          expected: tc.output || "",
          got:      err.message,
        });
        break;
      }
    }

    await Submission.findByIdAndUpdate(submissionId, {
      status:      finalStatus,
      output:      lastOutput,
      runtime:     totalRuntimeMs,
      verdictTime: new Date(),
      testResults,
    });

    console.log("Judging finished:", submissionId, finalStatus);

    const submission = await Submission.findById(submissionId);
    if (!submission) return;

    // ================= UPDATE SOLVED PROBLEMS =================
    if (finalStatus === "Accepted") {

      try {
        await checkPlagiarism(submission);
      } catch (err) {
        console.error("Plagiarism error:", err.message);
      }

      try {
        await User.findByIdAndUpdate(submission.userId, {
          $addToSet: { solvedProblems: submission.problemId }
        });
        console.log("solvedProblems updated for user:", submission.userId);
      } catch (err) {
        console.error("solvedProblems update error:", err.message);
      }
    }

    // ================= CONTEST LEADERBOARD UPDATE =================
    if (submission.contestId) {
      try {
        const contest = await Contest.findById(submission.contestId);
        if (!contest) return;

        let entry = await ContestLeaderboard.findOne({
          contestId: submission.contestId,
          userId:    submission.userId
        });

        if (!entry) {
          entry = await ContestLeaderboard.create({
            contestId:      submission.contestId,
            userId:         submission.userId,
            score:          finalStatus === "Accepted" ? 100 : 0,
            penalty:        0,
            solvedProblems: finalStatus === "Accepted" ? 1 : 0,
            submissions:    1,
            problemResults: [{
              problemId:   submission.problemId,
              solved:      finalStatus === "Accepted",
              attempts:    1,
              solvedAt:    finalStatus === "Accepted" ? new Date() : undefined,
              penaltyMins: finalStatus === "Accepted"
                ? Math.floor((Date.now() - new Date(contest.startTime).getTime()) / 60000)
                : 0
            }]
          });
        } else {
          entry.submissions += 1;

          let probResult = entry.problemResults.find(
            p => p.problemId?.toString() === submission.problemId?.toString()
          );

          if (!probResult) {
            entry.problemResults.push({
              problemId:   submission.problemId,
              solved:      finalStatus === "Accepted",
              attempts:    1,
              solvedAt:    finalStatus === "Accepted" ? new Date() : undefined,
              penaltyMins: finalStatus === "Accepted"
                ? Math.floor((Date.now() - new Date(contest.startTime).getTime()) / 60000)
                : 0
            });
          } else {
            probResult.attempts += 1;
          }

          if (finalStatus === "Accepted" && probResult && !probResult.solved) {
            const probConfig = contest.problems.find(
              p => (p.problemId?._id || p.problemId)?.toString() === submission.problemId?.toString()
            );
            entry.score          += probConfig?.points ?? 100;
            entry.solvedProblems += 1;
            entry.penalty        += Math.floor(
              (Date.now() - new Date(contest.startTime).getTime()) / 60000
            );
            if (probResult) {
              probResult.solved   = true;
              probResult.solvedAt = new Date();
            }
          }

          await entry.save();
        }

        try {
          if (global.io && contest.status === "live") {
            const leaderboard = await ContestLeaderboard
              .find({ contestId: submission.contestId })
              .populate("userId", "username name")
              .sort({ score: -1, penalty: 1 })
              .lean();
            global.io.to(`contest_${contest._id}`).emit("leaderboardUpdate", leaderboard);
          }
        } catch (err) {
          console.warn("Socket emit error:", err.message);
        }

      } catch (err) {
        console.error("Contest leaderboard update error:", err.message);
      }
    }

  } catch (err) {
    console.error("Fatal judge error:", err);
    await Submission.findByIdAndUpdate(submissionId, {
      status: "Judge Crash",
      output: err.message
    });
  }
}

module.exports = judgeSubmission;