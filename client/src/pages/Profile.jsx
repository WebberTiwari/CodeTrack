import { useEffect, useState, useRef } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { FaGithub, FaLinkedin, FaCode } from "react-icons/fa";
import { SiLeetcode } from "react-icons/si";

ChartJS.register(ArcElement, Tooltip, Legend);

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:#0D1117; --surface:#161B22; --surface2:#1C2333; --border:#21262D;
    --green:#22C55E; --cyan:#00B4D8; --amber:#F59E0B; --red:#EF4444;
    --purple:#8B5CF6; --text:#E2E8F0; --muted:#64748B;
    --font:'Outfit',sans-serif; --mono:'JetBrains Mono',monospace;
  }
  .pf-page { min-height:100vh; background:var(--bg); color:var(--text); font-family:var(--font); }
  .pf-grid-bg { position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image:linear-gradient(rgba(34,197,94,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.025) 1px,transparent 1px);
    background-size:48px 48px; }
  .pf-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; position:relative; overflow:hidden; }
  .pf-card-glow::before { content:''; position:absolute; top:0; left:10%; right:10%; height:1px;
    background:linear-gradient(90deg,transparent,var(--green),transparent); opacity:0.5; }
  .pf-fade { opacity:0; transform:translateY(18px); animation:pfFadeUp 0.55s ease forwards; }
  @keyframes pfFadeUp { to { opacity:1; transform:translateY(0); } }
  .pf-shimmer { background:linear-gradient(90deg,#1E2530 25%,#252D3A 50%,#1E2530 75%); background-size:200% 100%; animation:pfShimmer 1.4s infinite; border-radius:8px; }
  @keyframes pfShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes avatarPulse { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(1.7);opacity:0} }
  @keyframes modalIn { from{opacity:0;transform:scale(0.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes countUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes barGrow { from{width:0} to{width:var(--target-w)} }
  @keyframes heatPop { 0%{transform:scale(1)} 50%{transform:scale(1.5)} 100%{transform:scale(1)} }
  @keyframes glowPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
  @keyframes timelineDot { 0%{box-shadow:0 0 0 0 rgba(34,197,94,0.6)} 70%{box-shadow:0 0 0 8px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }

  .pf-stat-card { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:22px 20px;
    position:relative; overflow:hidden; transition:all 0.25s; cursor:default; }
  .pf-stat-card:hover { transform:translateY(-4px); border-color:var(--glow-color); box-shadow:0 12px 40px rgba(0,0,0,0.3); }
  .pf-stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px;
    background:linear-gradient(90deg,transparent,var(--glow-color,var(--green)),transparent); }
  .pf-stat-card::after { content:''; position:absolute; top:-40px; left:-40px; width:100px; height:100px;
    background:radial-gradient(circle,var(--glow-color,var(--green)) 0%,transparent 70%); opacity:0.06; pointer-events:none; }

  .pf-row { transition:background 0.15s; cursor:pointer; }
  .pf-row:hover { background:rgba(34,197,94,0.04) !important; }
  .pf-input { width:100%; background:var(--surface2); border:1px solid var(--border); border-radius:10px;
    color:var(--text); font-family:var(--font); font-size:14px; padding:10px 14px; outline:none; transition:border-color 0.18s; }
  .pf-input:focus { border-color:rgba(34,197,94,0.45); box-shadow:0 0 0 3px rgba(34,197,94,0.08); }
  .pf-input::placeholder { color:var(--muted); }
  .pf-social { transition:all 0.2s; }
  .pf-social:hover { transform:translateX(4px); }
  .pf-badge { display:inline-flex; align-items:center; gap:6px; border-radius:20px; padding:3px 12px;
    font-size:11px; font-weight:700; letter-spacing:0.5px; }
  .pf-admin-section { background:linear-gradient(135deg,rgba(245,158,11,0.06),rgba(245,158,11,0.02));
    border:1px solid rgba(245,158,11,0.2); border-radius:14px; padding:20px 24px; }
  .pf-admin-btn { display:inline-flex; align-items:center; gap:8px; background:rgba(245,158,11,0.12);
    color:var(--amber); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:8px 16px;
    font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:var(--font); }
  .pf-admin-btn:hover { background:rgba(245,158,11,0.22); transform:translateY(-1px); }
  ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }

  .heat-cell { width:11px; height:11px; border-radius:2px; flex-shrink:0; cursor:pointer; transition:all 0.15s; position:relative; }
  .heat-cell:hover { transform:scale(1.5); z-index:10; }
  .heat-cell:hover .heat-tip { display:block; }
  .heat-tip { display:none; position:absolute; bottom:calc(100% + 6px); left:50%; transform:translateX(-50%);
    background:#1C2333; border:1px solid var(--border); border-radius:6px; padding:5px 9px;
    font-size:11px; color:var(--text); white-space:nowrap; z-index:100; pointer-events:none;
    font-family:var(--mono); box-shadow:0 4px 12px rgba(0,0,0,0.4); }

  .tl-item { display:flex; gap:14px; padding:10px 0; position:relative; }
  .tl-item::before { content:''; position:absolute; left:15px; top:32px; bottom:-10px; width:1px;
    background:linear-gradient(to bottom,var(--border),transparent); }
  .tl-item:last-child::before { display:none; }
  .tl-dot { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-size:13px; flex-shrink:0; border:2px solid; position:relative; z-index:1; }
  .tl-dot.active { animation:timelineDot 2s infinite; }

  .rank-node { display:flex; flex-direction:column; align-items:center; gap:6px; position:relative; z-index:1; }
  .rank-dot { width:14px; height:14px; border-radius:50%; border:2px solid; transition:all 0.3s; }
  .rank-dot.active { width:20px; height:20px; box-shadow:0 0 16px var(--dot-color); animation:glowPulse 2s infinite; }

  .streak-flame { font-size:32px; animation:pfFadeUp 0.5s ease; display:inline-block; }
  @keyframes flameWiggle { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
  .streak-flame { animation:flameWiggle 0.8s ease-in-out infinite; }

  /* AI Quota bar */
  .ai-quota-bar { height:5px; border-radius:99px; background:var(--border); overflow:hidden; margin-top:6px; }
  .ai-quota-fill { height:100%; border-radius:99px; transition:width 1s ease; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const diffColor = d => d==="Easy"?"#22C55E":d==="Medium"?"#F59E0B":"#EF4444";

const RANKS = [
  { label:"Beginner",     min:0,   color:"#22C55E" },
  { label:"Intermediate", min:20,  color:"#00B4D8" },
  { label:"Advanced",     min:50,  color:"#8B5CF6" },
  { label:"Expert",       min:100, color:"#F59E0B" },
  { label:"Master",       min:200, color:"#EF4444" },
];

function getRank(total) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (total >= RANKS[i].min) return { ...RANKS[i], index: i };
  }
  return { ...RANKS[0], index: 0 };
}

function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return "just now"; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// AI QUOTA WIDGET (sidebar)
// ─────────────────────────────────────────────────────────────────────────────
function AiQuotaCard({ planStatus, onUpgradeClick }) {
  if (!planStatus) return null;

  const isPro      = planStatus.isPro;
  const used       = planStatus.ai?.used   ?? 0;
  const limit      = planStatus.ai?.limit  ?? 5;
  const remaining  = planStatus.ai?.remaining ?? (5 - used);
  const resetsAt   = planStatus.ai?.resetsAt;
  const pct        = isPro ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const barColor   = isPro ? "#22C55E" : used >= limit ? "#EF4444" : used >= 3 ? "#F59E0B" : "#22C55E";

  // Countdown to reset
  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    if (!resetsAt || isPro) return;
    const tick = () => {
      const ms = new Date(resetsAt) - Date.now();
      if (ms <= 0) { setCountdown("00:00:00"); return; }
      const h = String(Math.floor(ms / 3600000)).padStart(2,"0");
      const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2,"0");
      const s = String(Math.floor((ms % 60000) / 1000)).padStart(2,"0");
      setCountdown(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [resetsAt, isPro]);

  return (
    <div className="pf-card pf-fade" style={{ padding:20, animationDelay:"0.18s", border: isPro ? "1px solid rgba(34,197,94,0.3)" : "1px solid var(--border)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1.5px" }}>
          AI Reviews
        </div>
        {isPro
          ? <span className="pf-badge" style={{ background:"rgba(34,197,94,0.1)", color:"var(--green)", border:"1px solid rgba(34,197,94,0.25)" }}>✨ Unlimited</span>
          : <span className="pf-badge" style={{ background:"rgba(100,116,139,0.1)", color:"var(--muted)", border:"1px solid var(--border)" }}>Free</span>
        }
      </div>

      {isPro ? (
        <div>
          <div style={{ fontSize:13, color:"var(--green)", fontWeight:600, marginBottom:4 }}>
            🎉 Unlimited AI reviews active
          </div>
          {planStatus.planExpiry && (
            <div style={{ fontSize:11, color:"var(--muted)", fontFamily:"var(--mono)" }}>
              Pro until {new Date(planStatus.planExpiry).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Counter */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
            <span style={{ fontSize:24, fontWeight:800, color: used >= limit ? "#EF4444" : "#fff", fontFamily:"var(--mono)", lineHeight:1 }}>
              {used}<span style={{ fontSize:14, color:"var(--muted)", fontWeight:500 }}>/{limit}</span>
            </span>
            <span style={{ fontSize:11, color:"var(--muted)", fontFamily:"var(--mono)" }}>
              {remaining} left
            </span>
          </div>

          {/* Progress bar */}
          <div className="ai-quota-bar">
            <div className="ai-quota-fill" style={{ width:`${pct}%`, background:barColor }}/>
          </div>

          {/* Reset countdown or upgrade prompt */}
          <div style={{ marginTop:10 }}>
            {used >= limit ? (
              <div>
                <div style={{ fontSize:11, color:"var(--red)", marginBottom:8 }}>
                  🔒 Limit reached · Resets in <span style={{ fontFamily:"var(--mono)", fontWeight:700 }}>{countdown}</span>
                </div>
                <button
                  onClick={onUpgradeClick}
                  style={{ width:"100%", padding:"8px", borderRadius:8, border:"none", background:"var(--green)", color:"#0D1117", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font)", transition:"all 0.2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 4px 14px rgba(34,197,94,0.35)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                  ⚡ Upgrade to Pro — ₹99/mo
                </button>
              </div>
            ) : (
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, color:"var(--muted)" }}>
                  Resets in <span style={{ fontFamily:"var(--mono)", color:"var(--amber)" }}>{countdown}</span>
                </span>
                <button
                  onClick={onUpgradeClick}
                  style={{ fontSize:11, color:"var(--cyan)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font)", fontWeight:600, padding:"2px 6px", borderRadius:4, transition:"all 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(0,180,216,0.1)"}
                  onMouseLeave={e=>e.currentTarget.style.background="none"}>
                  Get unlimited →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY HEATMAP
// ─────────────────────────────────────────────────────────────────────────────
function ActivityHeatmap({ submissions }) {
  const DAYS = 364;
  const today = new Date(); today.setHours(0,0,0,0);

  const countMap = {};
  (submissions || []).forEach(s => {
    const d = new Date(s.createdAt); d.setHours(0,0,0,0);
    const key = d.toISOString().split("T")[0];
    countMap[key] = (countMap[key] || 0) + 1;
  });

  const cells = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    cells.push({ date: d, key, count: countMap[key] || 0 });
  }

  const firstDay = cells[0].date.getDay();
  const padded = Array(firstDay).fill(null).concat(cells);
  const weeks = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

  const getColor = count => {
    if (count === 0) return "var(--border)";
    if (count === 1) return "rgba(34,197,94,0.25)";
    if (count === 2) return "rgba(34,197,94,0.45)";
    if (count <= 4) return "rgba(34,197,94,0.65)";
    return "#22C55E";
  };

  const totalActive = Object.keys(countMap).length;
  const maxStreak = (() => {
    let best = 0, cur = 0;
    cells.forEach((c) => { if (c.count > 0) { cur++; best = Math.max(best, cur); } else cur = 0; });
    return best;
  })();

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstReal = week.find(c => c !== null);
    if (firstReal) {
      const m = firstReal.date.getMonth();
      if (m !== lastMonth) { monthLabels.push({ wi, label: MONTHS[m] }); lastMonth = m; }
    }
  });

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>Activity</div>
        <div style={{ display:"flex", gap:16, fontSize:11, color:"var(--muted)", fontFamily:"var(--mono)" }}>
          <span><span style={{ color:"var(--green)", fontWeight:700 }}>{totalActive}</span> active days</span>
          <span><span style={{ color:"var(--amber)", fontWeight:700 }}>{maxStreak}</span> best streak</span>
        </div>
      </div>
      <div style={{ display:"flex", gap:2, marginBottom:4, paddingLeft:20, position:"relative", height:16 }}>
        {monthLabels.map(({ wi, label }) => (
          <div key={wi} style={{ position:"absolute", left: 20 + wi * 13, fontSize:10, color:"var(--muted)", fontFamily:"var(--mono)" }}>{label}</div>
        ))}
      </div>
      <div style={{ display:"flex", gap:2 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:2, paddingTop:0, marginRight:4 }}>
          {["","M","","W","","F",""].map((d, i) => (
            <div key={i} style={{ height:11, fontSize:9, color:"var(--muted)", fontFamily:"var(--mono)", lineHeight:"11px", textAlign:"right", width:12 }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"flex", gap:2, overflowX:"auto" }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display:"flex", flexDirection:"column", gap:2 }}>
              {week.map((cell, di) => cell === null
                ? <div key={di} style={{ width:11, height:11, flexShrink:0 }}/>
                : (
                  <div key={di} className="heat-cell" style={{ background: getColor(cell.count) }}>
                    <div className="heat-tip">{cell.count} submission{cell.count!==1?"s":""}<br/>{formatDate(cell.date)}</div>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:10, justifyContent:"flex-end" }}>
        <span style={{ fontSize:10, color:"var(--muted)" }}>Less</span>
        {[0,1,2,3,5].map(n => <div key={n} style={{ width:10, height:10, borderRadius:2, background:getColor(n) }}/>)}
        <span style={{ fontSize:10, color:"var(--muted)" }}>More</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STREAK TRACKER
// ─────────────────────────────────────────────────────────────────────────────
function StreakTracker({ submissions, streak }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const last7 = Array.from({ length:7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (6 - i)); return d;
  });
  const activeSet = new Set();
  (submissions || []).forEach(s => {
    const d = new Date(s.createdAt); d.setHours(0,0,0,0);
    activeSet.add(d.toISOString().split("T")[0]);
  });
  const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>Streak</div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span className="streak-flame">🔥</span>
          <div>
            <span style={{ fontSize:28, fontWeight:800, color:"var(--amber)", fontFamily:"var(--mono)", lineHeight:1 }}>{streak || 0}</span>
            <span style={{ fontSize:12, color:"var(--muted)", marginLeft:4 }}>days</span>
          </div>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, justifyContent:"space-between" }}>
        {last7.map((d, i) => {
          const key = d.toISOString().split("T")[0];
          const active = activeSet.has(key);
          const isToday = i === 6;
          return (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <div style={{ fontSize:9, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.5px" }}>{DAYS_SHORT[d.getDay()]}</div>
              <div style={{ width:36, height:36, borderRadius:"50%", background: active?"linear-gradient(135deg,#22C55E,#00B4D8)":"var(--surface2)", border:`2px solid ${active?"#22C55E":"var(--border)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, boxShadow: active?"0 0 14px rgba(34,197,94,0.4)":"none", transition:"all 0.3s" }}>
                {active ? "✓" : isToday ? "·" : ""}
              </div>
              <div style={{ fontSize:9, color:"var(--muted)", fontFamily:"var(--mono)" }}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECENT TIMELINE
// ─────────────────────────────────────────────────────────────────────────────
function RecentTimeline({ submissions }) {
  const recent = [...(submissions || [])].reverse().slice(0, 8);
  const verdictCfg = v => {
    if (v === "Accepted")             return { color:"#22C55E", bg:"rgba(34,197,94,0.1)",   border:"rgba(34,197,94,0.25)",   icon:"✓" };
    if (v === "Wrong Answer")         return { color:"#EF4444", bg:"rgba(239,68,68,0.1)",   border:"rgba(239,68,68,0.25)",   icon:"✗" };
    if (v === "Time Limit Exceeded")  return { color:"#F59E0B", bg:"rgba(245,158,11,0.1)",  border:"rgba(245,158,11,0.25)",  icon:"⏱" };
    if (v === "Compilation Error")    return { color:"#8B5CF6", bg:"rgba(139,92,246,0.1)",  border:"rgba(139,92,246,0.25)",  icon:"⚙" };
    return { color:"var(--muted)", bg:"var(--surface2)", border:"var(--border)", icon:"?" };
  };
  if (!recent.length) return <div style={{ textAlign:"center", padding:"32px 0", color:"var(--muted)", fontSize:13 }}>No submissions yet</div>;
  return (
    <div style={{ display:"flex", flexDirection:"column" }}>
      {recent.map((s, i) => {
        const cfg = verdictCfg(s.status || s.verdict);
        return (
          <div key={s._id || i} className="tl-item">
            <div className={`tl-dot ${i === 0 ? "active" : ""}`} style={{ background:cfg.bg, borderColor:cfg.border, color:cfg.color, flexShrink:0 }}>{cfg.icon}</div>
            <div style={{ flex:1, paddingTop:4 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                <span style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{s.problemTitle || s.title || "Problem"}</span>
                <span style={{ fontSize:10, color:"var(--muted)", fontFamily:"var(--mono)", whiteSpace:"nowrap" }}>{timeAgo(s.createdAt)}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                <span style={{ fontSize:11, fontWeight:700, color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:5, padding:"1px 7px" }}>{s.status || s.verdict}</span>
                {s.languageId && <span style={{ fontSize:10, color:"var(--muted)", fontFamily:"var(--mono)", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:5, padding:"1px 7px" }}>{{ 54:"C++", 71:"Python", 62:"Java", 63:"JS" }[s.languageId] || `L${s.languageId}`}</span>}
                {s.runtime && <span style={{ fontSize:10, color:"var(--cyan)", fontFamily:"var(--mono)" }}>{s.runtime}ms</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCEPTANCE RATES
// ─────────────────────────────────────────────────────────────────────────────
function AcceptanceRates({ stats }) {
  const diffs = [
    { label:"Easy",   solved:stats.easy   ??0, total:stats.totalEasy   ?? null, color:"#22C55E" },
    { label:"Medium", solved:stats.medium ??0, total:stats.totalMedium ?? null, color:"#F59E0B" },
    { label:"Hard",   solved:stats.hard   ??0, total:stats.totalHard   ?? null, color:"#EF4444" },
  ];
  const totalSolved = (stats.easy??0)+(stats.medium??0)+(stats.hard??0);
  const totalAll    = (stats.totalEasy??0)+(stats.totalMedium??0)+(stats.totalHard??0);
  const overallPct  = totalAll ? Math.round(totalSolved/totalAll*100) : null;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>Acceptance Rate</div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:26, fontWeight:800, color:"var(--cyan)", fontFamily:"var(--mono)", lineHeight:1 }}>
            {overallPct !== null ? `${overallPct}%` : totalSolved}
          </div>
          <div style={{ fontSize:10, color:"var(--muted)" }}>{overallPct !== null ? "overall" : "solved"}</div>
        </div>
      </div>
      {diffs.map(({ label, solved, total, color }) => {
        const hasTotals = total !== null && total > 0;
        const pct       = hasTotals ? Math.round(solved / total * 100) : 0;
        const barWidth  = hasTotals ? pct : (solved > 0 ? 100 : 0);
        return (
          <div key={label} style={{ marginBottom:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:color }}/>
                <span style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{label}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:12, color:"var(--muted)", fontFamily:"var(--mono)" }}>{solved}{hasTotals?`/${total}`:""}</span>
                {hasTotals && <span style={{ fontSize:13, fontWeight:700, color, fontFamily:"var(--mono)", minWidth:40, textAlign:"right" }}>{pct}%</span>}
              </div>
            </div>
            <div style={{ height:6, borderRadius:99, background:"var(--border)", overflow:"hidden" }}>
              <div style={{ height:"100%", borderRadius:99, background:`linear-gradient(90deg,${color}66,${color})`, width:`${barWidth}%`, transition:"width 1.2s cubic-bezier(0.4,0,0.2,1)" }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RANK PROGRESS
// ─────────────────────────────────────────────────────────────────────────────
function RankProgress({ total }) {
  const currentRank = getRank(total);
  const nextRank    = RANKS[currentRank.index + 1];
  const prevMin     = currentRank.min;
  const nextMin     = nextRank?.min ?? prevMin + 1;
  const progress    = nextRank ? Math.min(((total - prevMin) / (nextMin - prevMin)) * 100, 100) : 100;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>Rank Progress</div>
        <span style={{ fontSize:12, fontWeight:700, color:currentRank.color, background:`${currentRank.color}15`, border:`1px solid ${currentRank.color}30`, borderRadius:20, padding:"3px 12px" }}>{currentRank.label}</span>
      </div>
      <div style={{ position:"relative", marginBottom:32 }}>
        <div style={{ height:4, borderRadius:99, background:"var(--border)", position:"absolute", top:8, left:0, right:0 }}/>
        <div style={{ height:4, borderRadius:99, position:"absolute", top:8, left:0, width:`${(currentRank.index / (RANKS.length - 1)) * 100 + (progress / 100) * (100 / (RANKS.length - 1))}%`, background:`linear-gradient(90deg,#22C55E,${currentRank.color})`, transition:"width 1.2s cubic-bezier(0.4,0,0.2,1)", boxShadow:`0 0 10px ${currentRank.color}60` }}/>
        <div style={{ display:"flex", justifyContent:"space-between", position:"relative" }}>
          {RANKS.map((r, i) => {
            const reached   = total >= r.min;
            const isCurrent = i === currentRank.index;
            return (
              <div key={r.label} className="rank-node" style={{ "--dot-color": r.color }}>
                <div className={`rank-dot ${isCurrent ? "active" : ""}`} style={{ background: reached ? r.color : "var(--surface2)", borderColor: reached ? r.color : "var(--border)", "--dot-color": r.color }}/>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        {RANKS.map((r, i) => {
          const reached   = total >= r.min;
          const isCurrent = i === currentRank.index;
          return (
            <div key={r.label} style={{ textAlign:"center", flex:1 }}>
              <div style={{ fontSize:10, fontWeight:isCurrent?800:500, color:reached?r.color:"var(--muted)", transition:"all 0.3s", letterSpacing:"0.3px" }}>{r.label}</div>
              <div style={{ fontSize:9, color:"var(--muted)", fontFamily:"var(--mono)", marginTop:2 }}>{r.min}+</div>
            </div>
          );
        })}
      </div>
      {nextRank && (
        <div style={{ marginTop:20, padding:"12px 16px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:12, color:"var(--muted)" }}>Next: <span style={{ color:nextRank.color, fontWeight:700 }}>{nextRank.label}</span></div>
          <div style={{ fontSize:12, color:"var(--text)", fontFamily:"var(--mono)" }}><span style={{ color:currentRank.color, fontWeight:700 }}>{nextMin - total}</span> more to go</div>
          <div style={{ width:100, height:4, borderRadius:99, background:"var(--border)", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${progress}%`, borderRadius:99, background:`linear-gradient(90deg,${currentRank.color},${nextRank.color})`, transition:"width 1.2s ease" }}/>
          </div>
        </div>
      )}
      {!nextRank && (
        <div style={{ marginTop:16, padding:"12px 16px", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, textAlign:"center", fontSize:13, color:"#EF4444", fontWeight:700 }}>
          🏆 Maximum Rank Achieved!
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function EditModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({
    username:   user.username || user.name || "",
    bio:        user.bio || "",
    github:     user.socials?.github     || "",
    linkedin:   user.socials?.linkedin   || "",
    codeforces: user.socials?.codeforces || "",
    leetcode:   user.socials?.leetcode   || "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSave = () => onSave({
    ...user, username: form.username, bio: form.bio,
    socials: { github:form.github, linkedin:form.linkedin, codeforces:form.codeforces, leetcode:form.leetcode }
  });
  const fields = [
    { key:"username",   label:"Username",      placeholder:"your username" },
    { key:"bio",        label:"Bio",            placeholder:"Tell the world about yourself…", textarea:true },
    { key:"github",     label:"GitHub URL",     placeholder:"https://github.com/username" },
    { key:"linkedin",   label:"LinkedIn URL",   placeholder:"https://linkedin.com/in/username" },
    { key:"codeforces", label:"Codeforces URL", placeholder:"https://codeforces.com/profile/username" },
    { key:"leetcode",   label:"LeetCode URL",   placeholder:"https://leetcode.com/username" },
  ];
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:480, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:18, overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.6)", animation:"modalIn 0.22s ease forwards" }}>
        <div style={{ padding:"18px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid var(--border)", background:"var(--surface2)" }}>
          <span style={{ fontWeight:700, fontSize:16, color:"#fff" }}>Edit Profile</span>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", background:"var(--border)", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}
            onMouseEnter={e=>{e.currentTarget.style.background="#EF4444";e.currentTarget.style.color="#fff";}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--border)";e.currentTarget.style.color="var(--muted)";}}>✕</button>
        </div>
        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:16, maxHeight:"58vh", overflowY:"auto" }}>
          {fields.map(({ key, label, placeholder, textarea }) => (
            <div key={key}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:6 }}>{label}</div>
              {textarea
                ? <textarea className="pf-input" rows={3} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={placeholder} style={{ resize:"vertical" }}/>
                : <input className="pf-input" type="text" value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={placeholder}/>}
            </div>
          ))}
        </div>
        <div style={{ padding:"16px 24px", borderTop:"1px solid var(--border)", background:"var(--surface2)", display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:8, border:"1px solid var(--border)", background:"transparent", color:"var(--muted)", fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"var(--font)" }}>Cancel</button>
          <button onClick={handleSave} style={{ padding:"9px 20px", borderRadius:8, border:"none", background:"var(--green)", color:"#0D1117", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--font)" }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, glow, icon, delay }) {
  return (
    <div className="pf-stat-card pf-fade" style={{ "--glow-color":glow, animationDelay:delay, flex:1 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <span style={{ fontSize:20 }}>{icon}</span>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", color:glow, background:`${glow}15`, border:`1px solid ${glow}30`, borderRadius:6, padding:"2px 8px", fontFamily:"var(--mono)" }}>{label}</span>
      </div>
      <div style={{ fontSize:40, fontWeight:800, color:glow, lineHeight:1, fontFamily:"var(--mono)", letterSpacing:"-1px", animation:"countUp 0.6s ease forwards" }}>{value}</div>
      <div style={{ marginTop:6, fontSize:12, color:"var(--muted)", fontWeight:500 }}>problems {label.toLowerCase()}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SOCIAL LINK
// ─────────────────────────────────────────────────────────────────────────────
function SocialLink({ platform, link }) {
  const cfg = {
    github:     { icon:<FaGithub size={14}/>,   color:"#E2E8F0", label:"GitHub" },
    linkedin:   { icon:<FaLinkedin size={14}/>,  color:"#0A84FF", label:"LinkedIn" },
    codeforces: { icon:<FaCode size={14}/>,      color:"#1F8ACB", label:"Codeforces" },
    leetcode:   { icon:<SiLeetcode size={14}/>,  color:"#FFA116", label:"LeetCode" },
  };
  const c = cfg[platform];
  return (
    <div className="pf-social" onClick={()=>link&&window.open(link.startsWith("http")?link:`https://${link}`,"_blank")}
      style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, background:"var(--surface2)", border:`1px solid ${link?`${c.color}22`:"var(--border)"}`, cursor:link?"pointer":"default", opacity:link?1:0.35 }}>
      <span style={{ color:c.color, display:"flex", flexShrink:0 }}>{c.icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{c.label}</div>
        <div style={{ fontSize:11, color:"var(--muted)", fontFamily:"var(--mono)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{link||"—"}</div>
      </div>
      {link&&<div style={{ width:6, height:6, borderRadius:"50%", background:c.color, flexShrink:0 }}/>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PROFILE
// ─────────────────────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const userId  = localStorage.getItem("userId");
  const role    = localStorage.getItem("role") || "user";
  const isAdmin = role === "admin";

  const [stats,       setStats]       = useState(null);
  const [solved,      setSolved]      = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [user,        setUser]        = useState(null);
  const [allUsers,    setAllUsers]    = useState([]);
  const [adminStats,  setAdminStats]  = useState(null);
  const [planStatus,  setPlanStatus]  = useState(null);   // ← NEW
  const [showEdit,    setShowEdit]    = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("solved");

  if (!userId) { window.location.href = "/login"; return null; }

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const calls = [
        API.get("/profile/stats"),
        API.get("/user/solved"),
        API.get(`/profile-user/${userId}`),
        API.get("/submissions/me?limit=100"),
        API.get("/payment/status"),              // ← NEW: plan + AI quota
      ];
      if (isAdmin) {
        calls.push(API.get("/admin/users"));
        calls.push(API.get("/admin/stats"));
      }
      const results = await Promise.allSettled(calls);
      if (results[0].status==="fulfilled") setStats(results[0].value.data);
      if (results[1].status==="fulfilled") setSolved([...results[1].value.data].reverse());
      if (results[2].status==="fulfilled") setUser(results[2].value.data);
      if (results[3].status==="fulfilled") {
        const data = results[3].value.data;
        setSubmissions(Array.isArray(data) ? data : data.submissions || []);
      }
      if (results[4].status==="fulfilled") setPlanStatus(results[4].value.data);   // ← NEW
      if (isAdmin) {
        if (results[5]?.status==="fulfilled") setAllUsers(results[5].value.data||[]);
        if (results[6]?.status==="fulfilled") setAdminStats(results[6].value.data);
      }
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async (updated) => {
    try {
      const res = await API.put(`/profile-user/${userId}`, updated);
      setUser(res.data); setShowEdit(false);
    } catch { alert("Failed to update profile"); }
  };

  if (loading || !user || !stats) return (
    <>
      <style>{STYLES}</style>
      <div className="pf-page" style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:16 }}>⚡</div>
          <div style={{ color:"var(--muted)", fontSize:14 }}>Loading profile…</div>
        </div>
      </div>
    </>
  );

  const total    = stats.totalSolved || 0;
  const rank     = getRank(total);
  const initials = (user.username || user.name || "?")[0].toUpperCase();
  const isPro    = planStatus?.isPro;

  const pieData = {
    labels: ["Easy","Medium","Hard"],
    datasets: [{ data:[stats.easy||0,stats.medium||0,stats.hard||0], backgroundColor:["#22C55E","#F59E0B","#EF4444"], borderWidth:0, hoverOffset:6 }],
  };

  return (
    <>
      <style>{STYLES}</style>
      {showEdit && <EditModal user={user} onSave={handleSave} onClose={()=>setShowEdit(false)}/>}
      <div className="pf-page">
        <div className="pf-grid-bg"/>
        <div style={{ maxWidth:1320, margin:"0 auto", padding:"32px 32px", position:"relative", zIndex:1 }}>

          {/* ── ADMIN BANNER ── */}
          {isAdmin && (
            <div className="pf-admin-section pf-fade" style={{ marginBottom:28 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--amber)", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:4 }}>⚡ Admin Profile</div>
                  <div style={{ fontSize:15, fontWeight:600, color:"var(--text)" }}>
                    {adminStats ? <><span style={{ color:"var(--amber)" }}>{adminStats.totalUsers??0}</span> users · <span style={{ color:"var(--green)" }}>{adminStats.activeContests??0}</span> live contests · <span style={{ color:"var(--cyan)" }}>{adminStats.totalProblems??0}</span> problems</> : "Loading platform stats…"}
                  </div>
                </div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <button className="pf-admin-btn" onClick={()=>navigate("/admin/dashboard")}>📊 Dashboard</button>
                  <button className="pf-admin-btn" onClick={()=>navigate("/admin/problems/new")}>➕ Add Problem</button>
                  <button className="pf-admin-btn" onClick={()=>navigate("/admin/contests/new")}>🎯 New Contest</button>
                </div>
              </div>
            </div>
          )}

          {/* ── MAIN GRID ── */}
          <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:24 }}>

            {/* ── SIDEBAR ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

              {/* Avatar card */}
              <div className="pf-card pf-card-glow pf-fade" style={{ padding:28, textAlign:"center", animationDelay:"0.05s" }}>
                <div style={{ position:"relative", display:"inline-block", marginBottom:16 }}>
                  <div style={{ position:"absolute", inset:-5, borderRadius:"50%", border:`2px solid ${isAdmin?"rgba(245,158,11,0.4)":isPro?"rgba(34,197,94,0.5)":"rgba(34,197,94,0.4)"}`, animation:"avatarPulse 2.5s ease-out infinite" }}/>
                  <div style={{ width:80, height:80, borderRadius:"50%", background: isAdmin?"linear-gradient(135deg,#F59E0B,#EF4444)": isPro?"linear-gradient(135deg,#22C55E,#8B5CF6)": "linear-gradient(135deg,#22C55E,#00B4D8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, fontWeight:800, color:"#0D1117", border:"3px solid var(--bg)", position:"relative", zIndex:1 }}>
                    {initials}
                  </div>
                </div>
                <div style={{ fontSize:20, fontWeight:800, color:"#fff", marginBottom:4, letterSpacing:"-0.3px" }}>{user.username||user.name}</div>
                <div style={{ fontSize:12, color:"var(--muted)", fontFamily:"var(--mono)", marginBottom:14 }}>{user.email}</div>

                {/* Badges row */}
                <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", marginBottom:14 }}>
                  {isAdmin
                    ? <span className="pf-badge" style={{ background:"rgba(245,158,11,0.12)", color:"var(--amber)", border:"1px solid rgba(245,158,11,0.3)" }}>⚡ Admin</span>
                    : isPro
                      ? <span className="pf-badge" style={{ background:"rgba(34,197,94,0.1)", color:"var(--green)", border:"1px solid rgba(34,197,94,0.3)" }}>💎 Pro</span>
                      : <span className="pf-badge" style={{ background:"rgba(34,197,94,0.10)", color:"var(--green)", border:"1px solid rgba(34,197,94,0.25)" }}>● User</span>
                  }
                  <span className="pf-badge" style={{ background:`${rank.color}15`, color:rank.color, border:`1px solid ${rank.color}30` }}>{rank.label}</span>
                </div>

                {user.bio && (
                  <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.7, marginBottom:16, padding:"12px 14px", background:"var(--surface2)", borderRadius:10, border:"1px solid var(--border)", textAlign:"left" }}>{user.bio}</div>
                )}
                <button onClick={()=>setShowEdit(true)} style={{ width:"100%", padding:"11px", borderRadius:10, border:"none", background:"var(--green)", color:"#0D1117", fontFamily:"var(--font)", fontSize:14, fontWeight:700, cursor:"pointer", transition:"all 0.2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(34,197,94,0.3)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                  ✏️ Edit Profile
                </button>
              </div>

              {/* Quick stats grid */}
              <div className="pf-card pf-fade" style={{ padding:20, animationDelay:"0.1s" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {[
                    { label:"Streak",   value:stats.streak?`${stats.streak}🔥`:"0",  color:"var(--amber)" },
                    { label:"Rating",   value:stats.rating??  "—",                   color:"var(--cyan)"  },
                    { label:"Rank",     value:`#${stats.rank??"—"}`,                 color:"var(--purple)"},
                    { label:"Contests", value:stats.contests??0,                     color:"var(--green)" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background:"var(--surface2)", borderRadius:10, padding:"12px 10px", textAlign:"center" }}>
                      <div style={{ fontSize:18, fontWeight:800, color, fontFamily:"var(--mono)" }}>{value}</div>
                      <div style={{ fontSize:11, color:"var(--muted)", marginTop:3 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── AI QUOTA CARD (NEW) ── */}
              <AiQuotaCard
                planStatus={planStatus}
                onUpgradeClick={() => navigate("/pricing")}
              />

              {/* Social links */}
              <div className="pf-card pf-fade" style={{ padding:20, animationDelay:"0.22s" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:14 }}>Social Links</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <SocialLink platform="github"     link={user.socials?.github}/>
                  <SocialLink platform="linkedin"   link={user.socials?.linkedin}/>
                  <SocialLink platform="codeforces" link={user.socials?.codeforces}/>
                  <SocialLink platform="leetcode"   link={user.socials?.leetcode}/>
                </div>
              </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

              {/* Stat cards row */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
                <StatCard label="Total"  value={total}          glow="#00B4D8" icon="⚡" delay="0.1s"/>
                <StatCard label="Easy"   value={stats.easy??0}   glow="#22C55E" icon="🟢" delay="0.15s"/>
                <StatCard label="Medium" value={stats.medium??0} glow="#F59E0B" icon="🟡" delay="0.2s"/>
                <StatCard label="Hard"   value={stats.hard??0}   glow="#EF4444" icon="🔴" delay="0.25s"/>
              </div>

              {/* Rank Progress + Acceptance Rate */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div className="pf-card pf-fade" style={{ padding:28, animationDelay:"0.28s" }}><RankProgress total={total}/></div>
                <div className="pf-card pf-fade" style={{ padding:28, animationDelay:"0.32s" }}><AcceptanceRates stats={stats}/></div>
              </div>

              {/* Streak + Pie */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div className="pf-card pf-fade" style={{ padding:28, animationDelay:"0.35s" }}><StreakTracker submissions={submissions} streak={stats.streak}/></div>
                <div className="pf-card pf-fade" style={{ padding:28, animationDelay:"0.38s" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:24 }}>Distribution</div>
                  <div style={{ display:"flex", alignItems:"center", gap:28 }}>
                    <div style={{ width:110, flexShrink:0 }}>
                      <Pie data={pieData} options={{ plugins:{ legend:{display:false}, tooltip:{backgroundColor:"#1C2333",titleColor:"#E2E8F0",bodyColor:"#94A3B8",borderColor:"var(--border)",borderWidth:1}}, cutout:"60%" }}/>
                    </div>
                    <div style={{ flex:1 }}>
                      {[{label:"Easy",value:stats.easy??0,color:"#22C55E"},{label:"Medium",value:stats.medium??0,color:"#F59E0B"},{label:"Hard",value:stats.hard??0,color:"#EF4444"}].map(({label,value,color})=>{
                        const pct = total ? Math.round(value/total*100) : 0;
                        return (
                          <div key={label} style={{ marginBottom:14 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                              <span style={{ fontSize:12, color:"var(--muted)" }}>{label}</span>
                              <span style={{ fontSize:12, color, fontWeight:600, fontFamily:"var(--mono)" }}>{value}</span>
                            </div>
                            <div style={{ height:4, borderRadius:99, background:"var(--border)", overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${pct}%`, borderRadius:99, background:`linear-gradient(90deg,${color}88,${color})`, transition:"width 1s ease" }}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Heatmap */}
              <div className="pf-card pf-fade" style={{ padding:28, animationDelay:"0.42s" }}>
                <ActivityHeatmap submissions={submissions}/>
              </div>

              {/* Tabs */}
              <div className="pf-card pf-fade" style={{ overflow:"hidden", animationDelay:"0.46s" }}>
                <div style={{ display:"flex", borderBottom:"1px solid var(--border)" }}>
                  {[
                    { id:"solved",   label:"✓ Solved",   count:solved.length,      color:"var(--green)" },
                    { id:"timeline", label:"⏱ Recent",   count:submissions.length,  color:"var(--cyan)"  },
                    ...(isAdmin ? [{ id:"users", label:"👥 All Users", count:allUsers.length, color:"var(--amber)" }] : []),
                  ].map(({ id, label, count, color }) => (
                    <button key={id} onClick={()=>setActiveTab(id)} style={{ flex:1, padding:"14px 0", border:"none", background:"transparent", fontFamily:"var(--font)", fontSize:13, fontWeight:600, color:activeTab===id ? color : "var(--muted)", borderBottom:`2px solid ${activeTab===id ? color : "transparent"}`, cursor:"pointer", transition:"all 0.15s" }}>
                      {label}
                      <span style={{ marginLeft:8, fontSize:11, background:activeTab===id?`${color}20`:"var(--surface2)", color:activeTab===id?color:"var(--muted)", padding:"2px 8px", borderRadius:10, fontFamily:"var(--mono)" }}>{count}</span>
                    </button>
                  ))}
                </div>

                {activeTab==="solved" && (
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ background:"var(--surface2)" }}>
                        {["#","Problem","Difficulty"].map(h=>(
                          <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", borderBottom:"1px solid var(--border)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {solved.length===0 ? (
                        <tr><td colSpan={3} style={{ textAlign:"center", padding:"48px 16px", color:"var(--muted)", fontSize:14 }}>No problems solved yet. <span onClick={()=>navigate("/problems")} style={{ color:"var(--green)", cursor:"pointer", fontWeight:600 }}>Start solving →</span></td></tr>
                      ) : solved.map((p,i)=>(
                        <tr key={p.problemId} className="pf-row" onClick={()=>navigate(`/submission/${p.submissionId}`)} style={{ borderBottom:"1px solid var(--border)" }}>
                          <td style={{ padding:"13px 16px", color:"var(--muted)", fontSize:12, fontFamily:"var(--mono)", width:50 }}>{String(i+1).padStart(2,"0")}</td>
                          <td style={{ padding:"13px 16px", color:"var(--text)", fontSize:14, fontWeight:500 }}>{p.title}</td>
                          <td style={{ padding:"13px 16px" }}>
                            <span style={{ fontSize:12, fontWeight:600, color:diffColor(p.difficulty), background:`${diffColor(p.difficulty)}15`, border:`1px solid ${diffColor(p.difficulty)}40`, borderRadius:6, padding:"3px 10px", display:"inline-flex", alignItems:"center", gap:5 }}>
                              <span style={{ width:5, height:5, borderRadius:"50%", background:diffColor(p.difficulty), display:"inline-block" }}/>{p.difficulty}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeTab==="timeline" && (
                  <div style={{ padding:"20px 24px" }}><RecentTimeline submissions={submissions}/></div>
                )}

                {activeTab==="users" && isAdmin && (
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ background:"var(--surface2)" }}>
                        {["#","User","Email","Role","Solved","Action"].map(h=>(
                          <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", borderBottom:"1px solid var(--border)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.length===0 ? (
                        <tr><td colSpan={6} style={{ textAlign:"center", padding:"48px 16px", color:"var(--muted)", fontSize:14 }}>No users found</td></tr>
                      ) : allUsers.map((u,i)=>(
                        <tr key={u._id} className="pf-row" style={{ borderBottom:"1px solid var(--border)" }}>
                          <td style={{ padding:"12px 16px", color:"var(--muted)", fontSize:12, fontFamily:"var(--mono)", width:40 }}>{i+1}</td>
                          <td style={{ padding:"12px 16px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div style={{ width:32, height:32, borderRadius:"50%", background:u.role==="admin"?"linear-gradient(135deg,#F59E0B,#EF4444)":"linear-gradient(135deg,#22C55E,#00B4D8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#0D1117", flexShrink:0 }}>
                                {(u.username||u.name||"?")[0].toUpperCase()}
                              </div>
                              <span style={{ fontSize:14, fontWeight:600, color:"var(--text)" }}>{u.username||u.name}</span>
                            </div>
                          </td>
                          <td style={{ padding:"12px 16px", color:"var(--muted)", fontSize:13, fontFamily:"var(--mono)" }}>{u.email}</td>
                          <td style={{ padding:"12px 16px" }}>
                            <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, color:u.role==="admin"?"var(--amber)":"var(--green)", background:u.role==="admin"?"rgba(245,158,11,0.12)":"rgba(34,197,94,0.10)", border:`1px solid ${u.role==="admin"?"rgba(245,158,11,0.3)":"rgba(34,197,94,0.25)"}` }}>
                              {u.role==="admin"?"⚡ Admin":"● User"}
                            </span>
                          </td>
                          <td style={{ padding:"12px 16px", color:"var(--text)", fontSize:13, fontFamily:"var(--mono)", fontWeight:600 }}>{u.totalSolved??0}</td>
                          <td style={{ padding:"12px 16px" }}>
                            <button onClick={()=>navigate(`/admin/users/${u._id}`)} style={{ padding:"5px 14px", borderRadius:7, border:"1px solid var(--border)", background:"transparent", color:"var(--muted)", fontSize:12, cursor:"pointer", fontFamily:"var(--font)", transition:"all 0.15s" }}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--green)";e.currentTarget.style.color="var(--green)";}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)";}}>View →</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}