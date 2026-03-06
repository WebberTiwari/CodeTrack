const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function buildEmailHtml(username, contestTitle, similarityPercent) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; padding: 40px 20px; }
        .card { background: #141414; border: 1px solid #222; border-radius: 14px; padding: 36px; max-width: 520px; margin: auto; }
        .badge { display: inline-block; background: #ff3333; color: #fff; font-size: 11px; font-weight: 700; padding: 5px 14px; border-radius: 20px; letter-spacing: 1px; margin-bottom: 24px; }
        h2 { font-size: 22px; color: #ff4444; margin-bottom: 12px; }
        p { color: #aaa; font-size: 14px; line-height: 1.7; margin-bottom: 8px; }
        .stat { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 14px 18px; margin: 10px 0; }
        .stat .label { color: #555; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat .value { color: #fff; font-size: 15px; font-weight: 600; margin-top: 4px; }
        .stat.danger .value { color: #ff4444; }
        .stat.action { background: #1f0f0f; border-color: #ff333333; }
        .stat.action .value { color: #ff6666; }
        .divider { border: none; border-top: 1px solid #222; margin: 24px 0; }
        .footer { color: #333; font-size: 12px; text-align: center; margin-top: 24px; }
        .footer a { color: #00c853; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">⚠️ PLAGIARISM DETECTED</div>
        <h2>Your Submission Was Flagged</h2>
        <p>Hi <strong style="color:#fff">${username}</strong>,</p>
        <p>Our automated integrity system detected a high similarity between your submission and another participant's code.</p>
        <div class="stat">
          <div class="label">Contest</div>
          <div class="value">${contestTitle}</div>
        </div>
        <div class="stat danger">
          <div class="label">Similarity Score</div>
          <div class="value">${similarityPercent}% match detected</div>
        </div>
        <div class="stat action">
          <div class="label">Action Taken</div>
          <div class="value">Your contest score has been set to 0</div>
        </div>
        <hr class="divider"/>
        <p>If you believe this is a false positive, contact our support team within <strong style="color:#fff">48 hours</strong>.</p>
        <div class="footer">
          CodeTrack · Automated Integrity System<br/>
          <a href="mailto:${process.env.EMAIL_USER}">Contact Support</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendPlagiarismEmail(user1, user2, contest, similarity) {
  const percent = Math.round(similarity * 100);

  await transporter.sendMail({
    from:    `"CodeTrack" <${process.env.EMAIL_USER}>`,
    to:      user1.email,
    subject: `⚠️ Plagiarism Detected — ${contest.title}`,
    html:    buildEmailHtml(user1.username, contest.title, percent)
  });

  await transporter.sendMail({
    from:    `"CodeTrack" <${process.env.EMAIL_USER}>`,
    to:      user2.email,
    subject: `⚠️ Plagiarism Detected — ${contest.title}`,
    html:    buildEmailHtml(user2.username, contest.title, percent)
  });

  console.log(`[Mailer] ✅ Emails sent to ${user1.email} & ${user2.email}`);
}

module.exports = { sendPlagiarismEmail };