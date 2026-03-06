const nodemailer = require("nodemailer");
const User       = require("../models/User");
const Contest    = require("../models/Contest");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Recipients ───────────────────────────────────────────────────────────────
async function getRecipients() {
  const users = await User.find({ receiveEmails: true }).select("email");
  return users.map(u => u.email);
}

// ─── Base HTML wrapper ────────────────────────────────────────────────────────
function baseTemplate(content) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CodeTrack</title>
</head>
<body style="margin:0;padding:0;background:#0D1117;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D1117;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#161B22;border-radius:16px;border:1px solid #21262D;overflow:hidden;">

          <!-- Top accent bar -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#22C55E,#00B4D8,#8B5CF6);"></td>
          </tr>

          <!-- Logo header -->
          <tr>
            <td style="padding:28px 36px 20px;border-bottom:1px solid #21262D;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
                      Code<span style="color:#22C55E;">Track</span>
                    </span>
                    <span style="display:inline-block;margin-left:10px;font-size:10px;font-weight:700;color:#22C55E;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);border-radius:20px;padding:2px 10px;letter-spacing:1px;vertical-align:middle;">
                      COMPETITIVE CODING
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main content -->
          ${content}

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px 28px;border-top:1px solid #21262D;background:#0D1117;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:11px;color:#475569;line-height:1.6;">
                    © ${new Date().getFullYear()} CodeTrack · All rights reserved<br/>
                    <a href="${process.env.CLIENT_URL}/settings" style="color:#22C55E;text-decoration:none;">Manage email preferences</a>
                    &nbsp;·&nbsp;
                    <a href="${process.env.CLIENT_URL}" style="color:#64748B;text-decoration:none;">Visit CodeTrack</a>
                  </td>
                  <td align="right">
                    <span style="font-size:18px;">⚡</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Generic email sender ─────────────────────────────────────────────────────
async function sendEmail(subject, html) {
  try {
    const emails = await getRecipients();
    if (!emails.length) { console.log("⚠ No users to send email"); return; }
    await transporter.sendMail({
      from:    `"CodeTrack" <${process.env.EMAIL_USER}>`,
      to:      emails,
      subject,
      html,
    });
    console.log("📧 Email sent to", emails.length, "users");
  } catch (err) {
    console.error("❌ Email failed:", err);
  }
}

// ─── Contest Created Email ────────────────────────────────────────────────────
async function sendContestCreatedEmail(contestId) {
  try {
    const contest = await Contest.findById(contestId);
    if (!contest) return;

    const startStr = new Date(contest.startTime).toLocaleString("en-US", {
      weekday:"short", month:"short", day:"numeric",
      hour:"2-digit", minute:"2-digit", timeZoneName:"short",
    });
    const endStr = new Date(contest.endTime).toLocaleString("en-US", {
      weekday:"short", month:"short", day:"numeric",
      hour:"2-digit", minute:"2-digit", timeZoneName:"short",
    });
    const durationMin = Math.round((new Date(contest.endTime) - new Date(contest.startTime)) / 60000);
    const problemCount = contest.problems?.length || 0;

    const html = baseTemplate(`
      <!-- Hero -->
      <tr>
        <td style="padding:36px 36px 28px;background:linear-gradient(135deg,#0D1117 0%,#0a1a12 100%);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="font-size:11px;font-weight:700;color:#22C55E;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">
                  🚀 NEW CONTEST ANNOUNCED
                </div>
                <h1 style="margin:0 0 14px;font-size:28px;font-weight:800;color:#fff;line-height:1.2;letter-spacing:-0.5px;">
                  ${contest.title}
                </h1>
                <p style="margin:0;font-size:14px;color:#94A3B8;line-height:1.7;">
                  A new rated contest is live on CodeTrack. Register now before spots fill up and compete with the best programmers on the platform.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Stats row -->
      <tr>
        <td style="padding:0 36px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="33%" style="padding-right:8px;">
                <div style="background:#1C2333;border:1px solid #21262D;border-radius:12px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:#22C55E;font-family:monospace;">${durationMin}m</div>
                  <div style="font-size:11px;color:#64748B;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Duration</div>
                </div>
              </td>
              <td width="33%" style="padding:0 4px;">
                <div style="background:#1C2333;border:1px solid #21262D;border-radius:12px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:#00B4D8;font-family:monospace;">${problemCount}</div>
                  <div style="font-size:11px;color:#64748B;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Problems</div>
                </div>
              </td>
              <td width="33%" style="padding-left:8px;">
                <div style="background:#1C2333;border:1px solid #21262D;border-radius:12px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:#8B5CF6;font-family:monospace;">Rated</div>
                  <div style="font-size:11px;color:#64748B;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Type</div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Schedule -->
      <tr>
        <td style="padding:0 36px 28px;">
          <div style="background:#1C2333;border:1px solid #21262D;border-radius:12px;overflow:hidden;">
            <div style="padding:14px 18px;border-bottom:1px solid #21262D;">
              <span style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:1px;">Schedule</span>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:14px 18px;border-bottom:1px solid #21262D;">
                  <span style="font-size:12px;color:#64748B;">▶&nbsp; Starts</span>
                  <span style="float:right;font-size:13px;font-weight:600;color:#E2E8F0;font-family:monospace;">${startStr}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 18px;">
                  <span style="font-size:12px;color:#64748B;">◼&nbsp; Ends</span>
                  <span style="float:right;font-size:13px;font-weight:600;color:#E2E8F0;font-family:monospace;">${endStr}</span>
                </td>
              </tr>
            </table>
          </div>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="padding:0 36px 36px;text-align:center;">
          <a href="${process.env.CLIENT_URL}/contests-list"
            style="display:inline-block;background:linear-gradient(135deg,#22C55E,#16A34A);color:#000;font-weight:800;font-size:15px;text-decoration:none;padding:14px 40px;border-radius:10px;letter-spacing:0.3px;">
            Register Now →
          </a>
          <p style="margin:14px 0 0;font-size:12px;color:#475569;">
            Rating changes will be applied after the contest ends.
          </p>
        </td>
      </tr>
    `);

    await sendEmail(`🚀 New Contest: ${contest.title}`, html);
  } catch (err) {
    console.error("Contest created email error:", err);
  }
}

// ─── Reminder Email ───────────────────────────────────────────────────────────
async function sendReminderEmail(contest) {
  try {
    const startStr = new Date(contest.startTime).toLocaleString("en-US", {
      weekday:"short", month:"short", day:"numeric",
      hour:"2-digit", minute:"2-digit", timeZoneName:"short",
    });

    const html = baseTemplate(`
      <!-- Hero -->
      <tr>
        <td style="padding:36px 36px 28px;background:linear-gradient(135deg,#0D1117,#1c1200);">
          <div style="font-size:11px;font-weight:700;color:#F59E0B;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">
            ⏰ CONTEST STARTS IN 1 HOUR
          </div>
          <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#fff;line-height:1.2;">
            ${contest.title}
          </h1>
          <p style="margin:0;font-size:14px;color:#94A3B8;line-height:1.7;">
            Get ready! The contest begins soon. Make sure you're warmed up and ready to compete.
          </p>
        </td>
      </tr>

      <!-- Time banner -->
      <tr>
        <td style="padding:0 36px 28px;">
          <div style="background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.05));border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:20px 24px;text-align:center;">
            <div style="font-size:11px;font-weight:700;color:#F59E0B;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">
              Start Time
            </div>
            <div style="font-size:20px;font-weight:800;color:#fff;font-family:monospace;">
              ${startStr}
            </div>
          </div>
        </td>
      </tr>

      <!-- Quick tips -->
      <tr>
        <td style="padding:0 36px 28px;">
          <div style="background:#1C2333;border:1px solid #21262D;border-radius:12px;padding:20px 24px;">
            <div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">
              Quick Reminders
            </div>
            ${["Read all problems before starting", "Manage your time wisely", "Test edge cases carefully", "Check the leaderboard for strategy"].map(tip => `
            <div style="display:flex;align-items:flex-start;margin-bottom:10px;">
              <span style="color:#22C55E;font-size:14px;margin-right:10px;flex-shrink:0;">✓</span>
              <span style="font-size:13px;color:#94A3B8;line-height:1.5;">${tip}</span>
            </div>`).join("")}
          </div>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="padding:0 36px 36px;text-align:center;">
          <a href="${process.env.CLIENT_URL}/contests-list"
            style="display:inline-block;background:linear-gradient(135deg,#F59E0B,#D97706);color:#000;font-weight:800;font-size:15px;text-decoration:none;padding:14px 40px;border-radius:10px;">
            Enter Arena →
          </a>
        </td>
      </tr>
    `);

    await sendEmail(`⏰ Reminder: ${contest.title} starts in 1 hour`, html);
  } catch (err) {
    console.error("Reminder email error:", err);
  }
}

// ─── Postmortem Email ─────────────────────────────────────────────────────────
async function sendPostmortemEmail(contestId) {
  try {
    const contest = await Contest.findById(contestId);
    if (!contest) return;

    const acceptanceRate = contest.stats?.acceptanceRate ?? 0;
    const rateColor      = acceptanceRate >= 60 ? "#22C55E" : acceptanceRate >= 30 ? "#F59E0B" : "#EF4444";

    const html = baseTemplate(`
      <!-- Hero -->
      <tr>
        <td style="padding:36px 36px 28px;background:linear-gradient(135deg,#0D1117,#0a0d1a);">
          <div style="font-size:11px;font-weight:700;color:#8B5CF6;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">
            📊 CONTEST RESULTS
          </div>
          <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#fff;line-height:1.2;">
            ${contest.title}
          </h1>
          <p style="margin:0;font-size:14px;color:#94A3B8;">
            The contest has ended. Here's a summary of how everyone performed.
          </p>
        </td>
      </tr>

      <!-- Stats grid -->
      <tr>
        <td style="padding:0 36px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding-right:6px;padding-bottom:12px;">
                <div style="background:#1C2333;border:1px solid #21262D;border-radius:12px;padding:18px;text-align:center;">
                  <div style="font-size:30px;font-weight:800;color:#22C55E;font-family:monospace;">${contest.participants ?? 0}</div>
                  <div style="font-size:11px;color:#64748B;margin-top:5px;text-transform:uppercase;letter-spacing:0.5px;">Participants</div>
                </div>
              </td>
              <td width="50%" style="padding-left:6px;padding-bottom:12px;">
                <div style="background:#1C2333;border:1px solid #21262D;border-radius:12px;padding:18px;text-align:center;">
                  <div style="font-size:30px;font-weight:800;color:#00B4D8;font-family:monospace;">${contest.stats?.submissions ?? 0}</div>
                  <div style="font-size:11px;color:#64748B;margin-top:5px;text-transform:uppercase;letter-spacing:0.5px;">Submissions</div>
                </div>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding-right:6px;">
                <div style="background:#1C2333;border:1px solid #21262D;border-radius:12px;padding:18px;text-align:center;">
                  <div style="font-size:30px;font-weight:800;color:#8B5CF6;font-family:monospace;">${contest.stats?.accepted ?? 0}</div>
                  <div style="font-size:11px;color:#64748B;margin-top:5px;text-transform:uppercase;letter-spacing:0.5px;">Accepted</div>
                </div>
              </td>
              <td width="50%" style="padding-left:6px;">
                <div style="background:#1C2333;border:1px solid #21262D;border-radius:12px;padding:18px;text-align:center;">
                  <div style="font-size:30px;font-weight:800;color:${rateColor};font-family:monospace;">${acceptanceRate}%</div>
                  <div style="font-size:11px;color:#64748B;margin-top:5px;text-transform:uppercase;letter-spacing:0.5px;">Acceptance Rate</div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Acceptance bar -->
      <tr>
        <td style="padding:0 36px 28px;">
          <div style="background:#1C2333;border:1px solid #21262D;border-radius:12px;padding:18px 20px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:12px;color:#64748B;">Acceptance Rate</span>
              <span style="font-size:12px;font-weight:700;color:${rateColor};">${acceptanceRate}%</span>
            </div>
            <div style="background:#0D1117;border-radius:99px;height:8px;overflow:hidden;">
              <div style="width:${acceptanceRate}%;height:100%;background:linear-gradient(90deg,${rateColor}88,${rateColor});border-radius:99px;"></div>
            </div>
          </div>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="padding:0 36px 36px;text-align:center;">
          <a href="${process.env.CLIENT_URL}/contests-list"
            style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#7C3AED);color:#fff;font-weight:800;font-size:15px;text-decoration:none;padding:14px 40px;border-radius:10px;">
            View Leaderboard →
          </a>
          <p style="margin:14px 0 0;font-size:12px;color:#475569;">
            Rating changes have been applied to all participants.
          </p>
        </td>
      </tr>
    `);

    await sendEmail(`📊 ${contest.title} — Results`, html);

    contest.postmortemEmailSent   = true;
    contest.postmortemEmailSentAt = new Date();
    await contest.save();

    console.log("📊 Postmortem email sent for:", contest.title);
  } catch (err) {
    console.error("Postmortem email error:", err);
  }
}

module.exports = {
  sendEmail,
  sendContestCreatedEmail,
  sendPostmortemEmail,
  sendReminderEmail,
};