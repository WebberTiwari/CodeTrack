import { useState, useRef } from "react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ENDED_CONTESTS_INIT = [
  {
    id: 1,
    name: "Weekly Contest 4",
    endedAt: "Mar 4, 2026 · 1:40 AM",
    duration: 120,
    format: "ICPC Style",
    participants: 3,
    problems: [
      { title: "Sum of Two Numbers", difficulty: "Easy",   solved: 3, attempts: 17, avgTime: "2m 30s", points: 100 },
      { title: "Binary Tree Paths",  difficulty: "Medium", solved: 1, attempts: 5,  avgTime: "18m 10s",points: 200 },
    ],
    leaderboard: [
      { rank: 1, name: "Pawan Tiwari",     score: 300, solved: 2, time: "0m", avatar: "P", color: "#f59e0b" },
      { rank: 2, name: "Virendra Tiwa",    score: 100, solved: 1, time: "3m", avatar: "V", color: "#8b5cf6" },
      { rank: 3, name: "Priyanshu Tiwari", score: 100, solved: 1, time: "5m", avatar: "P", color: "#22c55e" },
    ],
    stats: { submissions: 17, accepted: 12, avgScore: 167, topScore: 300, acceptanceRate: 71 },
    emailSent: false,
    autoEmailSentAt: null,
  },
  {
    id: 2,
    name: "Weekly Contest 3",
    endedAt: "Feb 24, 2026 · 2:00 AM",
    duration: 90,
    format: "Rated",
    participants: 5,
    problems: [
      { title: "Two Sum",   difficulty: "Easy", solved: 5, attempts: 8, avgTime: "1m 20s", points: 100 },
      { title: "LRU Cache", difficulty: "Hard", solved: 0, attempts: 7, avgTime: "—",       points: 400 },
    ],
    leaderboard: [
      { rank: 1, name: "Pawan Tiwari",  score: 100, solved: 1, time: "1m", avatar: "P", color: "#f59e0b" },
      { rank: 2, name: "Virendra Tiwa", score: 100, solved: 1, time: "2m", avatar: "V", color: "#8b5cf6" },
    ],
    stats: { submissions: 15, accepted: 5, avgScore: 80, topScore: 100, acceptanceRate: 33 },
    emailSent: true,
    autoEmailSentAt: "Feb 24, 2026 · 2:10 AM",
  },
];

const UPCOMING_INIT = [
  { id: 101, name: "Weekly Contest 5",  startDate: "Mar 10, 2026", startTime: "11:40 PM", duration: 120, format: "ICPC Style", problems: 3, reminderSent: false, scheduledFor: null },
  { id: 102, name: "Spring Challenge",  startDate: "Mar 15, 2026", startTime: "8:00 PM",  duration: 180, format: "Rated",      problems: 5, reminderSent: false, scheduledFor: null },
  { id: 103, name: "Weekend Blitz",     startDate: "Mar 22, 2026", startTime: "10:00 PM", duration: 60,  format: "Unrated",    problems: 2, reminderSent: true,  scheduledFor: "1h before", reminderSentAt: "Mar 22, 2026 · 9:00 PM" },
];

const MOCK_USERS = [
  { id: 1, name: "Pawan Tiwari",     email: "pawan@codetrack.dev" },
  { id: 2, name: "Virendra Tiwa",    email: "virendra@codetrack.dev" },
  { id: 3, name: "Priyanshu Tiwari", email: "priyanshu@codetrack.dev" },
  { id: 4, name: "Test User",        email: "test@codetrack.dev" },
];

const EMAIL_LOG_INIT = [
  { id: 1, type: "postmortem", contest: "Weekly Contest 3", sentAt: "Feb 24, 2026 · 2:10 AM", recipients: 4, status: "delivered" },
  { id: 2, type: "reminder",   contest: "Weekend Blitz",    sentAt: "Mar 22, 2026 · 9:00 PM",  recipients: 4, status: "delivered" },
];

const REMINDER_OPTIONS = ["1h before", "3h before", "6h before", "12h before", "24h before"];
const dc = (d) => d === "Easy" ? "#22c55e" : d === "Medium" ? "#f59e0b" : "#ef4444";
const medal = (r) => r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `#${r}`;
const nowStr = () => new Date().toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"});

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toasts({ list }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:10 }}>
      {list.map(t => (
        <div key={t.id} style={{
          background: t.type==="success" ? "linear-gradient(135deg,#16a34a,#15803d)"
            : t.type==="auto" ? "linear-gradient(135deg,#7c3aed,#5b21b6)"
            : "linear-gradient(135deg,#2563eb,#1d4ed8)",
          color:"#fff", padding:"12px 20px", borderRadius:10, fontSize:13, fontWeight:600,
          boxShadow:"0 8px 32px rgba(0,0,0,.6)", display:"flex", alignItems:"center", gap:10,
          animation:"fadeUp .35s ease", minWidth:260, maxWidth:380,
        }}>
          <span style={{fontSize:16}}>{t.type==="success"?"✅":t.type==="auto"?"🤖":"📧"}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Auto Settings Modal ──────────────────────────────────────────────────────
function AutoSettingsModal({ globalAuto, setGlobalAuto, defaultReminder, setDefaultReminder, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", zIndex:1200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(5px)" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:16, width:"min(520px,95vw)", boxShadow:"0 32px 80px rgba(0,0,0,.7)" }}>
        <div style={{ padding:"20px 24px", borderBottom:"1px solid #1f2937", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ color:"#6b7280", fontSize:10, letterSpacing:2, marginBottom:4 }}>CONFIGURATION</div>
            <div style={{ color:"#f9fafb", fontWeight:700, fontSize:16 }}>🤖 Auto Email System</div>
          </div>
          <button onClick={onClose} style={{ background:"#1f2937", border:"1px solid #374151", color:"#9ca3af", width:32, height:32, borderRadius:8, cursor:"pointer", fontSize:18 }}>×</button>
        </div>

        <div style={{ padding:24, display:"flex", flexDirection:"column", gap:20 }}>
          {/* Master toggle */}
          <div style={{ background:"#0f172a", border:"1px solid #1f2937", borderRadius:12, padding:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div>
                <div style={{ color:"#f9fafb", fontWeight:700, fontSize:14 }}>Auto Email System</div>
                <div style={{ color:"#6b7280", fontSize:12, marginTop:2 }}>Fire emails automatically on contest events</div>
              </div>
              <div onClick={() => setGlobalAuto(v => !v)} style={{ width:48, height:26, borderRadius:99, cursor:"pointer", background: globalAuto ? "#22c55e" : "#374151", position:"relative", transition:"background .2s" }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute", top:3, left: globalAuto ? 25 : 3, transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,.3)" }}/>
              </div>
            </div>
            <div style={{ background: globalAuto?"#14532d33":"#1f293733", border:`1px solid ${globalAuto?"#166534":"#374151"}`, borderRadius:8, padding:"8px 12px", fontSize:12, color: globalAuto?"#22c55e":"#6b7280" }}>
              {globalAuto ? "✅ Active — emails fire automatically on contest end & scheduled reminders" : "⏸ Paused — no automatic emails will be sent"}
            </div>
          </div>

          {/* Post-mortem timing */}
          <div style={{ background:"#0f172a", border:"1px solid #1f2937", borderRadius:12, padding:18 }}>
            <div style={{ color:"#f9fafb", fontWeight:700, fontSize:14, marginBottom:4 }}>📊 Post-Mortem Emails</div>
            <div style={{ color:"#6b7280", fontSize:12, marginBottom:12 }}>Sent automatically when a contest ends</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["Immediately","5 min delay","15 min delay"].map((opt,i) => (
                <button key={opt} style={{ background: i===0?"#1e3a5f":"#1f2937", border:`1px solid ${i===0?"#2563eb":"#374151"}`, color: i===0?"#60a5fa":"#6b7280", padding:"6px 14px", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:600 }}>{opt}</button>
              ))}
            </div>
          </div>

          {/* Default reminder timing */}
          <div style={{ background:"#0f172a", border:"1px solid #1f2937", borderRadius:12, padding:18 }}>
            <div style={{ color:"#f9fafb", fontWeight:700, fontSize:14, marginBottom:4 }}>⏰ Default Reminder Timing</div>
            <div style={{ color:"#6b7280", fontSize:12, marginBottom:12 }}>How long before contest start to send the reminder email</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {REMINDER_OPTIONS.map(opt => (
                <button key={opt} onClick={() => setDefaultReminder(opt)} style={{ background: defaultReminder===opt?"#1e3a5f":"#1f2937", border:`1px solid ${defaultReminder===opt?"#2563eb":"#374151"}`, color: defaultReminder===opt?"#60a5fa":"#6b7280", padding:"6px 14px", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:600, transition:"all .15s" }}>{opt}</button>
              ))}
            </div>
          </div>

          {/* What's included */}
          <div style={{ background:"#0f172a", border:"1px solid #374151", borderRadius:12, padding:16 }}>
            <div style={{ color:"#9ca3af", fontSize:10, letterSpacing:2, marginBottom:10 }}>EMAILS INCLUDE</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {["📊 Contest results & stats","🏆 Top 3 leaderboard","💡 Problem breakdown","🚀 Direct join link","👤 Personal performance","📅 Contest schedule & timing"].map(e => (
                <div key={e} style={{ fontSize:12, color:"#d1d5db" }}>{e}</div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding:"14px 24px", borderTop:"1px solid #1f2937", display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button onClick={onClose} style={{ background:"#1f2937", border:"1px solid #374151", color:"#9ca3af", padding:"9px 20px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600 }}>Close</button>
          <button onClick={onClose} style={{ background:"linear-gradient(135deg,#22c55e,#16a34a)", border:"none", color:"#000", padding:"9px 24px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700 }}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}

// ─── Email Preview Modal ──────────────────────────────────────────────────────
function EmailModal({ data, type, onClose, onSend }) {
  const isPost = type === "postmortem";
  const subject = isPost ? `📊 ${data.name} — Post-Mortem & Results` : `⏰ Reminder: ${data.name} starts soon on CodeTrack!`;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.82)", zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(5px)" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:16, width:"min(680px,95vw)", maxHeight:"88vh", overflow:"auto", boxShadow:"0 32px 80px rgba(0,0,0,.7)" }}>
        <div style={{ padding:"20px 24px", borderBottom:"1px solid #1f2937", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ color:"#6b7280", fontSize:10, letterSpacing:2, marginBottom:4 }}>EMAIL PREVIEW</div>
            <div style={{ color:"#f9fafb", fontWeight:700, fontSize:15 }}>📧 {subject}</div>
          </div>
          <button onClick={onClose} style={{ background:"#1f2937", border:"1px solid #374151", color:"#9ca3af", width:32, height:32, borderRadius:8, cursor:"pointer", fontSize:18 }}>×</button>
        </div>

        <div style={{ padding:"12px 24px", background:"#0f172a", borderBottom:"1px solid #1f2937" }}>
          <div style={{ color:"#6b7280", fontSize:11, marginBottom:6 }}>TO: {MOCK_USERS.length} registered users</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {MOCK_USERS.map(u => (
              <span key={u.id} style={{ background:"#1f2937", border:"1px solid #374151", padding:"3px 10px", borderRadius:20, fontSize:11, color:"#d1d5db" }}>{u.name} &lt;{u.email}&gt;</span>
            ))}
          </div>
        </div>

        <div style={{ padding:24 }}>
          <div style={{ background:"#0f172a", border:"1px solid #1f2937", borderRadius:12, overflow:"hidden" }}>
            <div style={{ background: isPost?"linear-gradient(135deg,#1e3a5f,#0f2027)":"linear-gradient(135deg,#14532d,#052e16)", padding:"26px 28px 20px", borderBottom:"1px solid #1f2937" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:20 }}>⚡</span>
                <span style={{ color:"#22c55e", fontWeight:800, fontSize:16 }}>CodeTrack</span>
              </div>
              <div style={{ color:"#f9fafb", fontSize:20, fontWeight:700, marginBottom:4 }}>{isPost ? `📊 ${data.name} — Contest Ended` : `⏰ Don't miss: ${data.name}`}</div>
              <div style={{ color:"#9ca3af", fontSize:13 }}>{isPost ? "Here's your complete post-mortem report." : "Your upcoming contest reminder from CodeTrack."}</div>
            </div>
            <div style={{ padding:24 }}>
              {isPost ? (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
                    {[
                      { label:"Participants", val:data.participants,               color:"#8b5cf6" },
                      { label:"Submissions",  val:data.stats.submissions,          color:"#3b82f6" },
                      { label:"Top Score",    val:data.stats.topScore,             color:"#f59e0b" },
                      { label:"Acceptance",   val:`${data.stats.acceptanceRate}%`, color:"#22c55e" },
                    ].map(s => (
                      <div key={s.label} style={{ background:"#1f2937", borderRadius:10, padding:"12px 8px", textAlign:"center", border:`1px solid ${s.color}22` }}>
                        <div style={{ color:s.color, fontSize:20, fontWeight:800 }}>{s.val}</div>
                        <div style={{ color:"#6b7280", fontSize:9, letterSpacing:1, marginTop:2 }}>{s.label.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom:18 }}>
                    <div style={{ color:"#6b7280", fontSize:10, letterSpacing:2, marginBottom:8 }}>🏆 TOP PERFORMERS</div>
                    {data.leaderboard.slice(0,3).map(u => (
                      <div key={u.rank} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"#1f2937", borderRadius:8, marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:16 }}>{medal(u.rank)}</span>
                          <div style={{ width:26, height:26, borderRadius:"50%", background:u.color+"33", border:`1px solid ${u.color}`, display:"flex", alignItems:"center", justifyContent:"center", color:u.color, fontSize:11, fontWeight:700 }}>{u.avatar[0]}</div>
                          <span style={{ color:"#f9fafb", fontSize:13, fontWeight:600 }}>{u.name}</span>
                        </div>
                        <span style={{ color:u.color, fontWeight:700 }}>{u.score} pts</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom:18 }}>
                    <div style={{ color:"#6b7280", fontSize:10, letterSpacing:2, marginBottom:8 }}>💡 PROBLEM BREAKDOWN</div>
                    {data.problems.map(p => (
                      <div key={p.title} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#1f2937", borderRadius:8, marginBottom:6 }}>
                        <div>
                          <span style={{ color:"#f9fafb", fontSize:13, fontWeight:600 }}>{p.title}</span>
                          <span style={{ marginLeft:8, fontSize:10, padding:"2px 8px", borderRadius:20, background:dc(p.difficulty)+"22", color:dc(p.difficulty), fontWeight:600 }}>{p.difficulty}</span>
                        </div>
                        <div style={{ display:"flex", gap:14, fontSize:12, color:"#9ca3af" }}>
                          <span>✅ {p.solved} solved</span><span>📤 {p.attempts} attempts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background:"linear-gradient(135deg,#14532d22,transparent)", border:"1px solid #166534", borderRadius:12, padding:20, marginBottom:18, textAlign:"center" }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>🏆</div>
                    <div style={{ color:"#f9fafb", fontSize:20, fontWeight:700, marginBottom:4 }}>{data.name}</div>
                    <div style={{ color:"#22c55e", fontSize:15, fontWeight:600 }}>📅 {data.startDate} at {data.startTime}</div>
                    {data.scheduledFor && (
                      <div style={{ marginTop:10, display:"inline-block", background:"#1e3a5f", border:"1px solid #2563eb", borderRadius:6, padding:"5px 14px", color:"#60a5fa", fontSize:12, fontWeight:600 }}>
                        ⏰ Sending this reminder {data.scheduledFor}
                      </div>
                    )}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:18 }}>
                    {[
                      { icon:"⏱", label:"Duration", val:`${data.duration} min` },
                      { icon:"📝", label:"Problems", val:`${data.problems} problems` },
                      { icon:"🎯", label:"Format",   val:data.format },
                    ].map(s => (
                      <div key={s.label} style={{ background:"#1f2937", borderRadius:10, padding:14, textAlign:"center", border:"1px solid #374151" }}>
                        <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
                        <div style={{ color:"#f9fafb", fontSize:13, fontWeight:600 }}>{s.val}</div>
                        <div style={{ color:"#6b7280", fontSize:10 }}>{s.label.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:"#1f2937", borderRadius:10, padding:16, textAlign:"center", marginBottom:16 }}>
                    <div style={{ color:"#9ca3af", fontSize:12, marginBottom:10 }}>Register now and warm up before the contest!</div>
                    <div style={{ display:"inline-block", background:"#22c55e", color:"#000", fontWeight:700, padding:"10px 28px", borderRadius:8, fontSize:14 }}>🚀 Enter Arena →</div>
                  </div>
                </>
              )}
              <div style={{ borderTop:"1px solid #1f2937", paddingTop:14, color:"#4b5563", fontSize:11, textAlign:"center" }}>
                You're receiving this because you have an account on CodeTrack · <span style={{ color:"#6b7280", cursor:"pointer" }}>Unsubscribe</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding:"14px 24px", borderTop:"1px solid #1f2937", display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button onClick={onClose} style={{ background:"#1f2937", border:"1px solid #374151", color:"#9ca3af", padding:"9px 20px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600 }}>Cancel</button>
          <button onClick={onSend} style={{ background:"linear-gradient(135deg,#22c55e,#16a34a)", border:"none", color:"#000", padding:"9px 24px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700, boxShadow:"0 4px 14px rgba(34,197,94,.3)" }}>
            📧 Send to {MOCK_USERS.length} Users
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Post-Mortem Detail Panel ─────────────────────────────────────────────────
function PostMortemPanel({ contest, onClose, onSendEmail }) {
  const [tab, setTab] = useState("summary");
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:900, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:16, width:"min(760px,95vw)", maxHeight:"88vh", overflow:"auto", boxShadow:"0 32px 80px rgba(0,0,0,.7)" }}>
        <div style={{ padding:"20px 24px", borderBottom:"1px solid #1f2937", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <span style={{ background:"#1f2937", border:"1px solid #374151", color:"#9ca3af", fontSize:10, padding:"2px 8px", borderRadius:4, letterSpacing:2 }}>✓ ENDED</span>
              <span style={{ color:"#6b7280", fontSize:12 }}>{contest.endedAt}</span>
            </div>
            <div style={{ color:"#f9fafb", fontSize:20, fontWeight:700 }}>{contest.name}</div>
            <div style={{ color:"#6b7280", fontSize:13, marginTop:2 }}>{contest.duration}min · {contest.format} · {contest.participants} participants</div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
            {contest.emailSent ? (
              <div style={{ textAlign:"right" }}>
                <span style={{ background:"#14532d", border:"1px solid #166534", color:"#22c55e", fontSize:11, padding:"5px 12px", borderRadius:6, fontWeight:600, display:"block", marginBottom:4 }}>✅ Post-Mortem Email Sent</span>
                {contest.autoEmailSentAt && <div style={{ color:"#4b5563", fontSize:10 }}>🤖 Auto · {contest.autoEmailSentAt}</div>}
              </div>
            ) : (
              <button onClick={onSendEmail} style={{ background:"linear-gradient(135deg,#2563eb,#1d4ed8)", border:"none", color:"#fff", padding:"8px 16px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700 }}>📧 Send Post-Mortem Email</button>
            )}
            <button onClick={onClose} style={{ background:"#1f2937", border:"1px solid #374151", color:"#9ca3af", width:32, height:32, borderRadius:8, cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>
        </div>

        <div style={{ display:"flex", borderBottom:"1px solid #1f2937" }}>
          {["summary","leaderboard","problems"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background:"transparent", border:"none", borderBottom: tab===t?"2px solid #22c55e":"2px solid transparent", color: tab===t?"#22c55e":"#6b7280", padding:"12px 24px", cursor:"pointer", fontSize:13, fontWeight: tab===t?700:400, textTransform:"capitalize" }}>{t}</button>
          ))}
        </div>

        <div style={{ padding:24 }}>
          {tab === "summary" && (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:20 }}>
                {[
                  { label:"PARTICIPANTS", val:contest.participants,              color:"#8b5cf6", icon:"👥" },
                  { label:"SUBMISSIONS",  val:contest.stats.submissions,         color:"#3b82f6", icon:"📤" },
                  { label:"ACCEPTED",     val:contest.stats.accepted,            color:"#22c55e", icon:"✅" },
                  { label:"TOP SCORE",    val:contest.stats.topScore,            color:"#f59e0b", icon:"🏆" },
                  { label:"ACCEPT RATE",  val:`${contest.stats.acceptanceRate}%`,color:"#06b6d4", icon:"📊" },
                ].map(s => (
                  <div key={s.label} style={{ background:"#1f2937", border:`1px solid ${s.color}33`, borderRadius:10, padding:"14px 10px", textAlign:"center" }}>
                    <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
                    <div style={{ color:s.color, fontSize:20, fontWeight:800 }}>{s.val}</div>
                    <div style={{ color:"#4b5563", fontSize:9, letterSpacing:1, marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:"#1f2937", borderRadius:10, padding:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ color:"#9ca3af", fontSize:12 }}>Overall Acceptance Rate</span>
                  <span style={{ color:"#22c55e", fontSize:12, fontWeight:700 }}>{contest.stats.acceptanceRate}%</span>
                </div>
                <div style={{ background:"#374151", borderRadius:99, height:8, overflow:"hidden" }}>
                  <div style={{ width:`${contest.stats.acceptanceRate}%`, height:"100%", background:"linear-gradient(90deg,#22c55e,#16a34a)", borderRadius:99 }}/>
                </div>
              </div>
            </>
          )}
          {tab === "leaderboard" && (
            <div style={{ display:"grid", gridTemplateColumns:"60px 1fr 100px 80px 80px" }}>
              {["RANK","USER","SCORE","SOLVED","TIME"].map(h => (
                <div key={h} style={{ color:"#4b5563", fontSize:10, letterSpacing:2, padding:"8px 12px", borderBottom:"1px solid #1f2937" }}>{h}</div>
              ))}
              {contest.leaderboard.map(u => ([
                <div key={u.rank+"r"} style={{ padding:"14px 12px", borderBottom:"1px solid #1f2937", fontSize:18, display:"flex", alignItems:"center" }}>{medal(u.rank)}</div>,
                <div key={u.rank+"u"} style={{ padding:"14px 12px", borderBottom:"1px solid #1f2937", display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:30, height:30, borderRadius:"50%", background:u.color+"33", border:`1.5px solid ${u.color}`, display:"flex", alignItems:"center", justifyContent:"center", color:u.color, fontSize:11, fontWeight:700 }}>{u.avatar[0]}</div>
                  <span style={{ color:"#f9fafb", fontSize:14, fontWeight:600 }}>{u.name}</span>
                </div>,
                <div key={u.rank+"s"} style={{ padding:"14px 12px", borderBottom:"1px solid #1f2937", color:"#f59e0b", fontWeight:700, display:"flex", alignItems:"center" }}>{u.score}</div>,
                <div key={u.rank+"sv"} style={{ padding:"14px 12px", borderBottom:"1px solid #1f2937", color:"#22c55e", fontWeight:700, display:"flex", alignItems:"center" }}>{u.solved}</div>,
                <div key={u.rank+"t"} style={{ padding:"14px 12px", borderBottom:"1px solid #1f2937", color:"#9ca3af", display:"flex", alignItems:"center" }}>{u.time}</div>,
              ]))}
            </div>
          )}
          {tab === "problems" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {contest.problems.map(p => (
                <div key={p.title} style={{ background:"#1f2937", border:"1px solid #374151", borderRadius:10, padding:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                    <div>
                      <span style={{ color:"#f9fafb", fontWeight:700, fontSize:15 }}>{p.title}</span>
                      <span style={{ marginLeft:10, fontSize:10, padding:"2px 8px", borderRadius:20, background:dc(p.difficulty)+"22", color:dc(p.difficulty), fontWeight:600 }}>{p.difficulty}</span>
                    </div>
                    <span style={{ color:"#f59e0b", fontWeight:700 }}>{p.points} pts</span>
                  </div>
                  <div style={{ display:"flex", gap:20 }}>
                    {[{l:"Solved",v:p.solved,c:"#22c55e"},{l:"Attempts",v:p.attempts,c:"#3b82f6"},{l:"Avg Time",v:p.avgTime,c:"#f59e0b"}].map(s=>(
                      <div key={s.l}><div style={{ color:s.c, fontSize:16, fontWeight:700 }}>{s.v}</div><div style={{ color:"#6b7280", fontSize:10 }}>{s.l.toUpperCase()}</div></div>
                    ))}
                  </div>
                  <div style={{ marginTop:12 }}>
                    <div style={{ background:"#374151", borderRadius:99, height:4, overflow:"hidden" }}>
                      <div style={{ width:`${Math.round(p.solved/Math.max(p.attempts,1)*100)}%`, height:"100%", background:"linear-gradient(90deg,#22c55e,#16a34a)", borderRadius:99 }}/>
                    </div>
                    <div style={{ color:"#4b5563", fontSize:10, marginTop:4 }}>{Math.round(p.solved/Math.max(p.attempts,1)*100)}% solve rate</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ContestPostMortem() {
  const [tab, setTab]               = useState("postmortem");
  const [ended, setEnded]           = useState(ENDED_CONTESTS_INIT);
  const [upcoming, setUpcoming]     = useState(UPCOMING_INIT);
  const [selected, setSelected]     = useState(null);
  const [emailModal, setEmailModal] = useState(null);
  const [toasts, setToasts]         = useState([]);
  const [scheduleOpen, setScheduleOpen] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [globalAuto, setGlobalAuto] = useState(true);
  const [defaultReminder, setDefaultReminder] = useState("1h before");
  const [emailLog, setEmailLog]     = useState(EMAIL_LOG_INIT);
  const [showLog, setShowLog]       = useState(false);
  const [simulating, setSimulating] = useState(false);
  const logIdRef = useRef(10);

  const toast = (msg, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  const addLog = (type, contestName) => {
    logIdRef.current++;
    const entry = { id: logIdRef.current, type, contest: contestName, sentAt: nowStr(), recipients: MOCK_USERS.length, status: "delivered" };
    setEmailLog(p => [entry, ...p]);
  };

  const confirmSend = () => {
    const { contest, type } = emailModal;
    const sentAt = nowStr();
    if (type === "postmortem") {
      setEnded(p => p.map(c => c.id===contest.id ? { ...c, emailSent:true, autoEmailSentAt:sentAt } : c));
      if (selected?.id === contest.id) setSelected(s => ({ ...s, emailSent:true, autoEmailSentAt:sentAt }));
      addLog("postmortem", contest.name);
      toast(`Post-mortem sent to ${MOCK_USERS.length} users for "${contest.name}"`, "success");
    } else {
      setUpcoming(p => p.map(c => c.id===contest.id ? { ...c, reminderSent:true, reminderSentAt:sentAt } : c));
      addLog("reminder", contest.name);
      toast(`Reminder sent to ${MOCK_USERS.length} users for "${contest.name}"`, "info");
    }
    setEmailModal(null);
  };

  const scheduleReminder = (contestId, when) => {
    setUpcoming(p => p.map(c => c.id===contestId ? { ...c, scheduledFor:when } : c));
    const c = upcoming.find(x => x.id===contestId);
    toast(`⏰ Reminder scheduled ${when} before "${c?.name}"`, "info");
    setScheduleOpen(null);
  };

  // ── Simulate a contest ending with auto email ─────────────────────────────
  const simulateContestEnd = () => {
    if (simulating) return;
    setSimulating(true);
    const newContest = {
      id: Date.now(),
      name: "Live Demo Contest",
      endedAt: nowStr(),
      duration: 60,
      format: "ICPC Style",
      participants: 4,
      problems: [
        { title: "Hello World",     difficulty: "Easy", solved: 4, attempts: 6, avgTime: "1m 10s", points: 100 },
        { title: "Graph Traversal", difficulty: "Hard", solved: 1, attempts: 8, avgTime: "44m 00s",points: 300 },
      ],
      leaderboard: [
        { rank:1, name:"Pawan Tiwari", score:400, solved:2, time:"45m", avatar:"P", color:"#f59e0b" },
        { rank:2, name:"Test User",    score:100, solved:1, time:"2m",  avatar:"T", color:"#22c55e" },
      ],
      stats: { submissions: 14, accepted:5, avgScore:125, topScore:400, acceptanceRate:36 },
      emailSent: false,
      autoEmailSentAt: null,
    };

    toast(`🏁 "Live Demo Contest" just ended!`, "info");

    setTimeout(() => {
      setEnded(p => [newContest, ...p]);
      setTab("postmortem");
      toast(`Contest queued for post-mortem`, "info");

      if (globalAuto) {
        setTimeout(() => {
          const sentAt = nowStr();
          setEnded(p => p.map(c => c.id===newContest.id ? { ...c, emailSent:true, autoEmailSentAt:sentAt } : c));
          addLog("postmortem", newContest.name);
          toast(`🤖 Auto post-mortem email sent to ${MOCK_USERS.length} users!`, "auto");
          setSimulating(false);
        }, 2500);
      } else {
        toast(`⚠️ Auto email is OFF — send the post-mortem manually`, "info");
        setSimulating(false);
      }
    }, 1200);
  };

  const pendingPostmortem = ended.filter(c => !c.emailSent).length;
  const pendingReminders  = upcoming.filter(c => !c.reminderSent && !c.scheduledFor).length;

  return (
    <div style={{ minHeight:"100vh", background:"#0d1117", color:"#f9fafb", fontFamily:"'JetBrains Mono',monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#0d1117}
        ::-webkit-scrollbar-thumb{background:#374151;border-radius:99px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .hov:hover{border-color:#374151!important;transform:translateY(-1px);transition:all .2s}
        .btn:hover{opacity:.82;transform:translateY(-1px);transition:all .15s}
      `}</style>

      {/* Nav */}
      <div style={{ background:"#111827", borderBottom:"1px solid #1f2937", padding:"0 28px", display:"flex", alignItems:"center", justifyContent:"space-between", height:52 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:"#22c55e", fontSize:20 }}>⚡</span>
          <span style={{ fontWeight:800, fontSize:16 }}>CodeTrack</span>
          <span style={{ background:"#1f2937", border:"1px solid #374151", color:"#f59e0b", fontSize:10, padding:"2px 8px", borderRadius:4, letterSpacing:1, marginLeft:4 }}>ADMIN</span>
        </div>
        <div style={{ display:"flex", gap:24, fontSize:12 }}>
          {["Home","Arena","Problems","Dashboard","Manage Users"].map(n => (
            <span key={n} style={{ color: n==="Dashboard"?"#22c55e":"#6b7280", cursor:"pointer", fontWeight: n==="Dashboard"?700:400 }}>{n}</span>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {/* Auto system pill */}
          <div onClick={() => setShowSettings(true)} style={{ display:"flex", alignItems:"center", gap:6, background: globalAuto?"#14532d33":"#1f2937", border:`1px solid ${globalAuto?"#166534":"#374151"}`, borderRadius:20, padding:"4px 12px", fontSize:11, cursor:"pointer" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background: globalAuto?"#22c55e":"#6b7280", display:"inline-block", animation: globalAuto?"pulse 2s infinite":"none" }}/>
            <span style={{ color: globalAuto?"#22c55e":"#6b7280", fontWeight:600 }}>AUTO {globalAuto?"ON":"OFF"}</span>
          </div>
          <div style={{ background:"#1f2937", border:"1px solid #374151", padding:"5px 14px", borderRadius:8, fontSize:12, color:"#f59e0b", fontWeight:700 }}>⚡ ADMIN</div>
        </div>
      </div>

      {/* Page header */}
      <div style={{ padding:"32px 32px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:14, marginBottom:14 }}>
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#1f2937", border:"1px solid #374151", borderRadius:20, padding:"4px 12px", fontSize:10, color:"#9ca3af", letterSpacing:2, marginBottom:14 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#f59e0b", display:"inline-block" }}/>
              CONTEST MANAGEMENT
            </div>
            <h1 style={{ margin:"0 0 4px", fontSize:28, fontWeight:800 }}>
              Contest <span style={{ color:"#f59e0b" }}>Post-Mortem</span><span style={{ color:"#22c55e" }}>.</span>
            </h1>
            <p style={{ color:"#6b7280", margin:0, fontSize:13 }}>
              Review ended contests · Auto-send post-mortem emails · Schedule reminders for upcoming contests
            </p>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button className="btn" onClick={() => setShowLog(true)} style={{ background:"#1f2937", border:"1px solid #374151", color:"#d1d5db", padding:"8px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
              📋 Email Log
              <span style={{ background:"#374151", borderRadius:99, padding:"1px 7px", fontSize:10 }}>{emailLog.length}</span>
            </button>
            <button className="btn" onClick={() => setShowSettings(true)} style={{ background:"#1f2937", border:"1px solid #374151", color:"#d1d5db", padding:"8px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600 }}>⚙️ Auto Settings</button>
            <button className="btn" onClick={simulateContestEnd} disabled={simulating} style={{
              background: simulating?"#374151":"linear-gradient(135deg,#dc2626,#b91c1c)",
              border:"none", color:"#fff", padding:"8px 16px", borderRadius:8,
              cursor: simulating?"not-allowed":"pointer", fontSize:12, fontWeight:700,
              display:"flex", alignItems:"center", gap:6,
              animation: simulating?"pulse 1s infinite":"none",
            }}>
              {simulating ? "⏳ Running..." : "🏁 Simulate Contest End"}
            </button>
          </div>
        </div>

        {/* Auto system banner */}
        {globalAuto && (
          <div style={{ background:"linear-gradient(135deg,#14532d18,#1e3a5f18)", border:"1px solid #166534", borderRadius:10, padding:"10px 18px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:13 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", display:"inline-block", animation:"pulse 2s infinite" }}/>
              <span style={{ color:"#d1d5db" }}>
                <strong style={{ color:"#22c55e" }}>Auto Email System active.</strong>
                {" "}Post-mortem fires immediately on contest end · Reminders default to{" "}
                <strong style={{ color:"#60a5fa" }}>{defaultReminder}</strong> · {MOCK_USERS.length} users on list
              </span>
            </div>
            <button onClick={() => setShowSettings(true)} style={{ background:"transparent", border:"1px solid #374151", color:"#9ca3af", padding:"4px 10px", borderRadius:6, cursor:"pointer", fontSize:11 }}>Configure →</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid #1f2937", marginBottom:28 }}>
          {[
            { key:"postmortem", label:"📊 Post-Mortem",        count: pendingPostmortem },
            { key:"reminders",  label:"⏰ Upcoming Reminders", count: pendingReminders  },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ background:"transparent", border:"none", borderBottom: tab===t.key?"2px solid #f59e0b":"2px solid transparent", color: tab===t.key?"#f9fafb":"#6b7280", padding:"10px 24px", cursor:"pointer", fontSize:13, fontWeight: tab===t.key?700:400, display:"flex", alignItems:"center", gap:8 }}>
              {t.label}
              {t.count > 0 && <span style={{ background:"#dc2626", color:"#fff", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:99 }}>{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"0 32px 48px" }}>

        {/* ── POST-MORTEM TAB ── */}
        {tab === "postmortem" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {ended.map(c => (
              <div key={c.id} className="hov" style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:12, overflow:"hidden", cursor:"pointer" }} onClick={() => setSelected(c)}>
                <div style={{ padding:"18px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ width:44, height:44, borderRadius:10, background:"#1f2937", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>📊</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{c.name}</div>
                      <div style={{ color:"#6b7280", fontSize:12, display:"flex", gap:14, flexWrap:"wrap" }}>
                        <span>✓ {c.endedAt}</span>
                        <span>⏱ {c.duration}min</span>
                        <span>👥 {c.participants} participants</span>
                        <span>📝 {c.problems.length} problems</span>
                      </div>
                      {c.autoEmailSentAt && <div style={{ marginTop:4, color:"#4b5563", fontSize:11 }}>🤖 Auto email · {c.autoEmailSentAt}</div>}
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                    <div style={{ display:"flex", gap:16, fontSize:12 }}>
                      {[
                        { label:"Top Score",   val:c.stats.topScore,             color:"#f59e0b" },
                        { label:"Acceptance",  val:`${c.stats.acceptanceRate}%`, color:"#22c55e" },
                        { label:"Submissions", val:c.stats.submissions,          color:"#3b82f6" },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign:"center" }}>
                          <div style={{ color:s.color, fontWeight:700, fontSize:16 }}>{s.val}</div>
                          <div style={{ color:"#4b5563", fontSize:10 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div onClick={e=>e.stopPropagation()} style={{ display:"flex", gap:8 }}>
                      {c.emailSent
                        ? <span style={{ background:"#14532d", border:"1px solid #166534", color:"#22c55e", fontSize:11, padding:"6px 12px", borderRadius:6, fontWeight:600 }}>✅ Email Sent</span>
                        : <button className="btn" onClick={() => setEmailModal({ contest:c, type:"postmortem" })} style={{ background:"linear-gradient(135deg,#2563eb,#1d4ed8)", border:"none", color:"#fff", padding:"8px 16px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700 }}>📧 Send Summary</button>
                      }
                      <button className="btn" onClick={() => setSelected(c)} style={{ background:"#1f2937", border:"1px solid #374151", color:"#9ca3af", padding:"8px 14px", borderRadius:8, cursor:"pointer", fontSize:12 }}>View →</button>
                    </div>
                  </div>
                </div>
                <div style={{ height:2, background: c.emailSent?"linear-gradient(90deg,#22c55e,transparent)":"linear-gradient(90deg,#2563eb,transparent)" }}/>
              </div>
            ))}
          </div>
        )}

        {/* ── REMINDERS TAB ── */}
        {tab === "reminders" && (
          <>
            <div style={{ background:"#1f2937", border:"1px solid #374151", borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:10, fontSize:13 }}>
              <span>📧</span>
              <span style={{ color:"#d1d5db" }}>
                Reminder emails are sent to all <strong style={{ color:"#f9fafb" }}>{MOCK_USERS.length} users</strong> before a contest starts — schedule in advance or send right now.
              </span>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:32 }}>
              {upcoming.map(c => (
                <div key={c.id} className="hov" style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:12, overflow:"hidden" }}>
                  <div style={{ padding:"18px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                      <div style={{ width:44, height:44, borderRadius:10, background:"linear-gradient(135deg,#14532d,#052e16)", border:"1px solid #166534", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>🏆</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{c.name}</div>
                        <div style={{ color:"#6b7280", fontSize:12, display:"flex", gap:14, flexWrap:"wrap" }}>
                          <span style={{ color:"#22c55e" }}>📅 {c.startDate} · {c.startTime}</span>
                          <span>⏱ {c.duration}min</span>
                          <span>📝 {c.problems} problems</span>
                          <span style={{ background:"#1f2937", padding:"1px 8px", borderRadius:4, border:"1px solid #374151" }}>{c.format}</span>
                        </div>
                        {c.reminderSentAt && <div style={{ marginTop:4, color:"#4b5563", fontSize:11 }}>✅ Reminder sent · {c.reminderSentAt}</div>}
                      </div>
                    </div>

                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      {c.scheduledFor && !c.reminderSent && (
                        <span style={{ background:"#1e3a5f", border:"1px solid #2563eb", color:"#60a5fa", fontSize:11, padding:"5px 10px", borderRadius:6, fontWeight:600 }}>
                          ⏰ Scheduled · {c.scheduledFor}
                        </span>
                      )}
                      {c.reminderSent
                        ? <span style={{ background:"#14532d", border:"1px solid #166534", color:"#22c55e", fontSize:11, padding:"6px 12px", borderRadius:6, fontWeight:600 }}>✅ Reminder Sent</span>
                        : (
                          <>
                            <div style={{ position:"relative" }}>
                              <button className="btn" onClick={() => setScheduleOpen(scheduleOpen===c.id ? null : c.id)}
                                style={{ background: c.scheduledFor?"#1e3a5f":"#1f2937", border:`1px solid ${c.scheduledFor?"#2563eb":"#374151"}`, color: c.scheduledFor?"#60a5fa":"#d1d5db", padding:"8px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600 }}>
                                {c.scheduledFor ? `⏰ ${c.scheduledFor} ▾` : "⏰ Schedule ▾"}
                              </button>
                              {scheduleOpen === c.id && (
                                <div style={{ position:"absolute", right:0, top:"110%", background:"#1f2937", border:"1px solid #374151", borderRadius:10, zIndex:100, minWidth:160, boxShadow:"0 8px 32px rgba(0,0,0,.5)", overflow:"hidden" }}>
                                  {REMINDER_OPTIONS.map(w => (
                                    <button key={w} onClick={() => scheduleReminder(c.id, w)}
                                      style={{ display:"block", width:"100%", textAlign:"left", background: c.scheduledFor===w?"#374151":"transparent", border:"none", borderBottom:"1px solid #374151", color: c.scheduledFor===w?"#f9fafb":"#d1d5db", padding:"10px 16px", cursor:"pointer", fontSize:13 }}
                                      onMouseEnter={e=>e.target.style.background="#374151"}
                                      onMouseLeave={e=>e.target.style.background=c.scheduledFor===w?"#374151":"transparent"}
                                    >⏰ {w}</button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button className="btn" onClick={() => setEmailModal({ contest:c, type:"reminder" })}
                              style={{ background:"linear-gradient(135deg,#22c55e,#16a34a)", border:"none", color:"#000", padding:"8px 16px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700 }}>
                              📧 Send Now
                            </button>
                          </>
                        )
                      }
                    </div>
                  </div>
                  <div style={{ height:2, background: c.reminderSent?"linear-gradient(90deg,#22c55e,transparent)":c.scheduledFor?"linear-gradient(90deg,#2563eb,transparent)":"linear-gradient(90deg,#374151,transparent)" }}/>
                </div>
              ))}
            </div>

            {/* Users list */}
            <div style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:12, overflow:"hidden" }}>
              <div style={{ padding:"14px 20px", borderBottom:"1px solid #1f2937", display:"flex", alignItems:"center", gap:8 }}>
                <span>👥</span>
                <span style={{ fontWeight:700, fontSize:14 }}>Will Receive Emails</span>
                <span style={{ background:"#1f2937", color:"#9ca3af", fontSize:11, padding:"2px 8px", borderRadius:99 }}>{MOCK_USERS.length}</span>
              </div>
              {MOCK_USERS.map((u, i) => (
                <div key={u.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderBottom: i<MOCK_USERS.length-1?"1px solid #1f2937":"none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:"#1f2937", border:"1px solid #374151", display:"flex", alignItems:"center", justifyContent:"center", color:"#9ca3af", fontSize:12, fontWeight:700 }}>{u.name[0]}</div>
                    <div>
                      <div style={{ color:"#f9fafb", fontSize:13, fontWeight:600 }}>{u.name}</div>
                      <div style={{ color:"#6b7280", fontSize:12 }}>{u.email}</div>
                    </div>
                  </div>
                  <span style={{ background:"#14532d", border:"1px solid #166534", color:"#22c55e", fontSize:10, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>✓ Will Receive</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Email Log Modal ── */}
      {showLog && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", zIndex:1050, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(5px)" }} onClick={() => setShowLog(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:16, width:"min(620px,95vw)", maxHeight:"80vh", overflow:"auto", boxShadow:"0 32px 80px rgba(0,0,0,.7)" }}>
            <div style={{ padding:"18px 22px", borderBottom:"1px solid #1f2937", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ color:"#6b7280", fontSize:10, letterSpacing:2, marginBottom:4 }}>SYSTEM LOG</div>
                <div style={{ color:"#f9fafb", fontWeight:700, fontSize:15 }}>📋 Email Send History</div>
              </div>
              <button onClick={() => setShowLog(false)} style={{ background:"#1f2937", border:"1px solid #374151", color:"#9ca3af", width:32, height:32, borderRadius:8, cursor:"pointer", fontSize:18 }}>×</button>
            </div>
            <div style={{ padding:20, display:"flex", flexDirection:"column", gap:8 }}>
              {emailLog.length === 0 && (
                <div style={{ textAlign:"center", color:"#6b7280", padding:32, fontSize:13 }}>No emails sent yet.</div>
              )}
              {emailLog.map(e => (
                <div key={e.id} style={{ background:"#1f2937", border:"1px solid #374151", borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:20 }}>{e.type==="postmortem"?"📊":"⏰"}</span>
                    <div>
                      <div style={{ color:"#f9fafb", fontSize:13, fontWeight:600 }}>{e.contest}</div>
                      <div style={{ color:"#6b7280", fontSize:11, marginTop:2, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{ background: e.type==="postmortem"?"#1e3a5f":"#14532d", border:`1px solid ${e.type==="postmortem"?"#2563eb":"#166534"}`, color: e.type==="postmortem"?"#60a5fa":"#22c55e", padding:"1px 8px", borderRadius:4, fontWeight:600, fontSize:10 }}>
                          {e.type==="postmortem"?"POST-MORTEM":"REMINDER"}
                        </span>
                        {e.sentAt} · {e.recipients} recipients
                      </div>
                    </div>
                  </div>
                  <span style={{ background:"#14532d", border:"1px solid #166534", color:"#22c55e", fontSize:10, padding:"3px 10px", borderRadius:20, fontWeight:600, whiteSpace:"nowrap" }}>✓ {e.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selected && (
        <PostMortemPanel contest={selected} onClose={() => setSelected(null)} onSendEmail={() => setEmailModal({ contest:selected, type:"postmortem" })} />
      )}
      {emailModal && (
        <EmailModal data={emailModal.contest} type={emailModal.type} onClose={() => setEmailModal(null)} onSend={confirmSend} />
      )}
      {showSettings && (
        <AutoSettingsModal globalAuto={globalAuto} setGlobalAuto={setGlobalAuto} defaultReminder={defaultReminder} setDefaultReminder={setDefaultReminder} onClose={() => setShowSettings(false)} />
      )}

      <Toasts list={toasts} />
    </div>
  );
}