import { useEffect, useState, useRef } from "react";
import API from "../services/api";

/* ─────────────────────────── CSS ─────────────────────────── */
const DRAWER_CSS = `
@keyframes drawerIn  { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes drawerOut { from { transform: translateX(0);    opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
@keyframes fadeUp2   { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes shimmer2  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

.uad-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(3px);
  animation: fadeIn 0.2s ease;
}
.uad-drawer {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: min(580px, 100vw);
  background: #161B22;
  border-left: 1px solid #21262D;
  z-index: 10001;
  display: flex; flex-direction: column;
  animation: drawerIn 0.3s cubic-bezier(0.16,1,0.3,1);
  box-shadow: -20px 0 60px rgba(0,0,0,0.5);
}
.uad-drawer.closing { animation: drawerOut 0.25s ease forwards; }

.uad-header {
  display: flex; align-items: center; gap: 14px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid #21262D;
  flex-shrink: 0;
}
.uad-avatar {
  width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 900; color: #0D1117;
}
.uad-name  { font-size: 18px; font-weight: 800; color: #E2E8F0; letter-spacing: -0.3px; }
.uad-email { font-size: 12px; color: #64748B; margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
.uad-close {
  margin-left: auto; width: 32px; height: 32px; border-radius: 8px;
  background: rgba(255,255,255,0.05); border: 1px solid #21262D;
  color: #64748B; font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0;
}
.uad-close:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #EF4444; }

.uad-tabs {
  display: flex; border-bottom: 1px solid #21262D;
  background: #1C2333; flex-shrink: 0; overflow-x: auto;
}
.uad-tab {
  padding: 11px 18px; background: none; border: none;
  border-bottom: 2px solid transparent; color: #64748B;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.uad-tab:hover { color: #E2E8F0; }
.uad-tab.on { color: #22C55E; border-bottom-color: #22C55E; }

.uad-body { flex: 1; overflow-y: auto; padding: 20px 24px; }
.uad-body::-webkit-scrollbar { width: 4px; }
.uad-body::-webkit-scrollbar-thumb { background: #2D3748; border-radius: 4px; }

/* Stat pills row */
.uad-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
.uad-stat {
  background: #0D1117; border: 1px solid #21262D; border-radius: 12px;
  padding: 14px 12px; text-align: center; animation: fadeUp2 0.4s ease both;
}
.uad-stat-val { font-size: 24px; font-weight: 900; font-family: 'JetBrains Mono', monospace; line-height: 1; }
.uad-stat-lbl { font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 5px; }

/* Section label */
.uad-sec { font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1.5px; color: #64748B; margin: 18px 0 10px;
  display: flex; align-items: center; gap: 8px; }
.uad-sec::after { content:''; flex:1; height:1px; background:#21262D; }

/* Heatmap */
.uad-heatmap { display: flex; gap: 3px; flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4px; }
.uad-heatmap::-webkit-scrollbar { height: 3px; }
.uad-heatmap::-webkit-scrollbar-thumb { background: #2D3748; }
.uad-hm-col { display: flex; flex-direction: column; gap: 3px; }
.uad-hm-cell {
  width: 12px; height: 12px; border-radius: 2px; flex-shrink: 0;
  transition: transform 0.1s;
}
.uad-hm-cell:hover { transform: scale(1.4); cursor: default; }
.uad-hm-months { display: flex; gap: 3px; margin-bottom: 4px; font-size: 9px;
  color: #64748B; font-family: 'JetBrains Mono', monospace; padding-left: 2px; }

/* Difficulty bars */
.uad-diff-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.uad-diff-label { width: 52px; font-size: 12px; font-weight: 600; }
.uad-diff-bar { flex: 1; height: 8px; background: #21262D; border-radius: 4px; overflow: hidden; }
.uad-diff-fill { height: 100%; border-radius: 4px; transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1); }
.uad-diff-count { font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; width: 28px; text-align: right; }

/* Submission list */
.uad-sub-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0; border-bottom: 1px solid #21262D;
  animation: fadeUp2 0.3s ease both;
}
.uad-sub-row:last-child { border-bottom: none; }
.uad-verdict { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; flex-shrink: 0; }
.uad-sub-prob { font-size: 13px; font-weight: 600; color: #E2E8F0; flex: 1;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.uad-sub-lang { font-size: 11px; color: #00B4D8; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; }
.uad-sub-time { font-size: 11px; color: #64748B; flex-shrink: 0; }

/* Contest list */
.uad-contest-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; background: #0D1117; border: 1px solid #21262D;
  border-radius: 10px; margin-bottom: 8px; animation: fadeUp2 0.35s ease both;
}
.uad-contest-icon { font-size: 22px; flex-shrink: 0; }
.uad-contest-title { font-size: 13px; font-weight: 700; color: #E2E8F0; }
.uad-contest-meta  { font-size: 11px; color: #64748B; margin-top: 2px; }
.uad-rank { margin-left: auto; text-align: right; flex-shrink: 0; }
.uad-rank-num  { font-size: 18px; font-weight: 900; font-family: 'JetBrains Mono', monospace; color: #F59E0B; }
.uad-rank-lbl  { font-size: 10px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }

/* Shimmer */
.uad-shimmer {
  background: linear-gradient(90deg,#1E2530 25%,#252D3A 50%,#1E2530 75%);
  background-size: 200% 100%; animation: shimmer2 1.4s infinite; border-radius: 8px;
}

/* Empty state */
.uad-empty { text-align: center; padding: 40px 20px; color: #64748B; font-size: 13px; }
.uad-empty-icon { font-size: 32px; margin-bottom: 10px; }
`;

/* ─────────────────────────── Helpers ─────────────────────────── */
const timeAgo = iso => {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

const verdictColor = v =>
  v === "Accepted"        ? { color: "#22C55E", bg: "rgba(34,197,94,0.12)"  } :
  v === "Wrong Answer"    ? { color: "#EF4444", bg: "rgba(239,68,68,0.12)"  } :
                            { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" };

/* Build a 52-week × 7-day heatmap grid from a submissions array */
function buildHeatmap(submissions) {
  const counts = {};
  for (const s of submissions) {
    const d = new Date(s.createdAt);
    const key = d.toISOString().slice(0, 10);
    counts[key] = (counts[key] || 0) + 1;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // align to Sunday
  const startDay = new Date(today);
  startDay.setDate(startDay.getDate() - 364 - startDay.getDay());

  const weeks = [];
  let monthLabels = [];
  let cur = new Date(startDay);
  let lastMonth = -1;

  for (let w = 0; w < 53; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const key = cur.toISOString().slice(0, 10);
      const mn  = cur.getMonth();
      if (d === 0 && mn !== lastMonth) {
        monthLabels.push({ week: w, label: cur.toLocaleString("en", { month: "short" }) });
        lastMonth = mn;
      }
      col.push({ date: key, count: counts[key] || 0 });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(col);
  }
  return { weeks, monthLabels };
}

function heatColor(count) {
  if (count === 0) return "#161B22";
  if (count <= 2)  return "#0E4429";
  if (count <= 5)  return "#006D32";
  if (count <= 9)  return "#26A641";
  return "#39D353";
}

/* ─────────────────────────── Component ─────────────────────────── */
export default function UserActivityDrawer({ user, onClose }) {
  const [tab,     setTab]     = useState("overview");
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const drawerRef = useRef(null);

  /* close animation */
  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 240);
  };

  /* close on overlay click */
  const onOverlay = e => { if (e.target === e.currentTarget) handleClose(); };

  /* ESC key */
  useEffect(() => {
    const fn = e => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  /* fetch all user data in parallel */
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setData(null);

    Promise.allSettled([
      API.get(`/admin/users/${user._id}/submissions`),
      API.get(`/admin/users/${user._id}/contests`),
      API.get(`/admin/users/${user._id}/stats`),
    ]).then(([subRes, contRes, statRes]) => {
      setData({
        submissions: subRes.status  === "fulfilled" ? subRes.value.data  : [],
        contests:    contRes.status === "fulfilled" ? contRes.value.data : [],
        stats:       statRes.status === "fulfilled" ? statRes.value.data : {},
      });
      setLoading(false);
    });
  }, [user?._id]);

  if (!user) return null;

  const subs     = data?.submissions || [];
  const contests = data?.contests    || [];
  const stats    = data?.stats       || {};

  const totalSolved  = user.totalSolved  || stats.totalSolved  || 0;
  const totalSubs    = stats.totalSubs   || subs.length;
  const acceptRate   = totalSubs ? Math.round((totalSolved / totalSubs) * 100) : 0;
  const streak       = stats.streak || 0;

  const easyCount  = stats.easy   || subs.filter(s => s.difficulty === "Easy"   && s.verdict === "Accepted").length;
  const medCount   = stats.medium || subs.filter(s => s.difficulty === "Medium" && s.verdict === "Accepted").length;
  const hardCount  = stats.hard   || subs.filter(s => s.difficulty === "Hard"   && s.verdict === "Accepted").length;
  const maxDiff    = Math.max(easyCount, medCount, hardCount, 1);

  const { weeks, monthLabels } = buildHeatmap(subs);

  const totalOnHeatmap = subs.length;
  const activeDays = new Set(subs.map(s => s.createdAt?.slice(0, 10))).size;

  return (
    <>
      <style>{DRAWER_CSS}</style>

      <div className="uad-overlay" onClick={onOverlay}>
        <div className={`uad-drawer ${closing ? "closing" : ""}`} ref={drawerRef}>

          {/* ── Header ── */}
          <div className="uad-header">
            <div className="uad-avatar" style={{
              background: user.role === "admin"
                ? "linear-gradient(135deg,#F59E0B,#EF4444)"
                : "linear-gradient(135deg,#22C55E,#00B4D8)"
            }}>
              {(user.username || user.name || "?")[0].toUpperCase()}
            </div>
            <div>
              <div className="uad-name">{user.username || user.name}</div>
              <div className="uad-email">{user.email}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700,
                  color: user.role === "admin" ? "#F59E0B" : "#22C55E",
                  background: user.role === "admin" ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.1)",
                  border: `1px solid ${user.role === "admin" ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.25)"}` }}>
                  {user.role === "admin" ? "⚡ Admin" : "● User"}
                </span>
                {user.status === "banned" && (
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700,
                    color: "#EF4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                    🚫 Banned
                  </span>
                )}
                <span style={{ fontSize: 10, color: "#64748B" }}>
                  Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
            <button className="uad-close" onClick={handleClose}>✕</button>
          </div>

          {/* ── Tabs ── */}
          <div className="uad-tabs">
            {[
              { id: "overview",     label: "📊 Overview"    },
              { id: "submissions",  label: "📬 Submissions" },
              { id: "contests",     label: "🏆 Contests"    },
              { id: "heatmap",      label: "🔥 Activity"    },
            ].map(t => (
              <button key={t.id} className={`uad-tab ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Body ── */}
          <div className="uad-body">
            {loading ? <LoadingSkeleton /> : (
              <>
                {/* ══ OVERVIEW ══ */}
                {tab === "overview" && (
                  <>
                    {/* Stat cards */}
                    <div className="uad-stats">
                      {[
                        { val: totalSolved,           label: "Solved",      color: "#22C55E", delay: "0s"    },
                        { val: totalSubs,              label: "Submissions", color: "#8B5CF6", delay: "0.06s" },
                        { val: `${acceptRate}%`,       label: "Accept Rate", color: "#00B4D8", delay: "0.12s" },
                        { val: `${streak}d`,           label: "Streak",      color: "#F59E0B", delay: "0.18s" },
                      ].map(({ val, label, color, delay }) => (
                        <div key={label} className="uad-stat" style={{ animationDelay: delay }}>
                          <div className="uad-stat-val" style={{ color }}>{val}</div>
                          <div className="uad-stat-lbl">{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Difficulty breakdown */}
                    <div className="uad-sec">Difficulty Breakdown</div>
                    {[
                      { label: "Easy",   count: easyCount, total: totalSolved, color: "#22C55E" },
                      { label: "Medium", count: medCount,  total: totalSolved, color: "#F59E0B" },
                      { label: "Hard",   count: hardCount, total: totalSolved, color: "#EF4444" },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="uad-diff-row">
                        <span className="uad-diff-label" style={{ color }}>{label}</span>
                        <div className="uad-diff-bar">
                          <div className="uad-diff-fill" style={{ width: `${(count / maxDiff) * 100}%`, background: color }} />
                        </div>
                        <span className="uad-diff-count" style={{ color }}>{count}</span>
                      </div>
                    ))}

                    {/* Mini heatmap preview */}
                    <div className="uad-sec">Submission Heatmap (last year)</div>
                    <MiniHeatmap weeks={weeks} monthLabels={monthLabels} />
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 8, display: "flex", gap: 16 }}>
                      <span>🟩 {totalOnHeatmap} total submissions</span>
                      <span>📅 {activeDays} active days</span>
                    </div>

                    {/* Recent submissions preview */}
                    <div className="uad-sec">Recent Submissions</div>
                    {subs.length === 0
                      ? <Empty icon="📭" text="No submissions yet" />
                      : subs.slice(0, 5).map((s, i) => <SubRow key={i} s={s} delay={i * 0.05} />)
                    }
                  </>
                )}

                {/* ══ SUBMISSIONS ══ */}
                {tab === "submissions" && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <span style={{ fontSize: 13, color: "#64748B" }}>{subs.length} total submissions</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        {["All","Accepted","Wrong Answer"].map(v => (
                          <FilterChip key={v} label={v} />
                        ))}
                      </div>
                    </div>
                    {subs.length === 0
                      ? <Empty icon="📭" text="No submissions yet" />
                      : subs.map((s, i) => <SubRow key={i} s={s} delay={Math.min(i, 10) * 0.03} />)
                    }
                  </>
                )}

                {/* ══ CONTESTS ══ */}
                {tab === "contests" && (
                  <>
                    <div style={{ fontSize: 13, color: "#64748B", marginBottom: 14 }}>
                      {contests.length} contest{contests.length !== 1 ? "s" : ""} participated
                    </div>
                    {contests.length === 0
                      ? <Empty icon="🏆" text="No contest participations yet" />
                      : contests.map((c, i) => (
                        <div key={i} className="uad-contest-row" style={{ animationDelay: `${i * 0.06}s` }}>
                          <div className="uad-contest-icon">🏆</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="uad-contest-title">{c.title || "Contest"}</div>
                            <div className="uad-contest-meta">
                              {c.startTime ? new Date(c.startTime).toLocaleDateString() : "—"}
                              {" · "}Solved {c.solved ?? 0}/{c.totalProblems ?? "?"} problems
                              {c.score != null && ` · ${c.score} pts`}
                            </div>
                          </div>
                          {c.rank && (
                            <div className="uad-rank">
                              <div className="uad-rank-num">#{c.rank}</div>
                              <div className="uad-rank-lbl">Rank</div>
                            </div>
                          )}
                        </div>
                      ))
                    }
                  </>
                )}

                {/* ══ ACTIVITY HEATMAP ══ */}
                {tab === "heatmap" && (
                  <>
                    <div style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>
                      Submission activity over the last 365 days
                    </div>

                    {/* Full heatmap */}
                    <div style={{ background: "#0D1117", border: "1px solid #21262D", borderRadius: 12, padding: "16px 14px" }}>
                      <MiniHeatmap weeks={weeks} monthLabels={monthLabels} />

                      {/* Legend */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
                        <span style={{ fontSize: 10, color: "#64748B" }}>Less</span>
                        {["#161B22","#0E4429","#006D32","#26A641","#39D353"].map(c => (
                          <div key={c} style={{ width: 11, height: 11, borderRadius: 2, background: c }} />
                        ))}
                        <span style={{ fontSize: 10, color: "#64748B" }}>More</span>
                      </div>
                    </div>

                    {/* Monthly breakdown */}
                    <div className="uad-sec" style={{ marginTop: 20 }}>Monthly Breakdown</div>
                    <MonthlyBreakdown submissions={subs} />

                    {/* Stats row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
                      {[
                        { label: "Total Submissions", val: totalOnHeatmap, color: "#8B5CF6" },
                        { label: "Active Days",        val: activeDays,     color: "#22C55E" },
                        { label: "Daily Streak",       val: `${streak}d`,   color: "#F59E0B" },
                      ].map(({ label, val, color }) => (
                        <div key={label} style={{ background: "#0D1117", border: "1px solid #21262D", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                          <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: "JetBrains Mono, monospace" }}>{val}</div>
                          <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 4 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Sub-components ── */

function MiniHeatmap({ weeks, monthLabels }) {
  return (
    <div>
      {/* Month labels */}
      <div style={{ display: "flex", gap: 3, marginBottom: 4, paddingLeft: 2 }}>
        {(() => {
          const labels = new Array(53).fill("");
          monthLabels.forEach(({ week, label }) => { labels[week] = label; });
          return labels.map((l, i) => (
            <div key={i} style={{ width: 12, fontSize: 9, color: "#64748B", fontFamily: "monospace", flexShrink: 0, overflow: "visible", whiteSpace: "nowrap" }}>
              {l}
            </div>
          ));
        })()}
      </div>
      <div className="uad-heatmap">
        {weeks.map((col, wi) => (
          <div key={wi} className="uad-hm-col">
            {col.map((cell, di) => (
              <div key={di} className="uad-hm-cell"
                style={{ background: heatColor(cell.count) }}
                title={`${cell.date}: ${cell.count} submission${cell.count !== 1 ? "s" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyBreakdown({ submissions }) {
  const monthly = {};
  for (const s of submissions) {
    const key = new Date(s.createdAt).toLocaleString("en", { month: "short", year: "2-digit" });
    monthly[key] = (monthly[key] || 0) + 1;
  }
  const entries = Object.entries(monthly).slice(-6).reverse();
  const max = Math.max(...entries.map(([, v]) => v), 1);

  if (entries.length === 0) return <Empty icon="📅" text="No activity data" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {entries.map(([month, count]) => (
        <div key={month} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 48, fontSize: 11, color: "#64748B", fontFamily: "monospace", flexShrink: 0 }}>{month}</span>
          <div style={{ flex: 1, height: 8, background: "#21262D", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(count / max) * 100}%`, background: "linear-gradient(90deg,#22C55E88,#22C55E)", borderRadius: 4, transition: "width 0.6s ease" }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#22C55E", fontFamily: "monospace", width: 28, textAlign: "right" }}>{count}</span>
        </div>
      ))}
    </div>
  );
}

function SubRow({ s, delay }) {
  const vc = verdictColor(s.verdict);
  return (
    <div className="uad-sub-row" style={{ animationDelay: `${delay}s` }}>
      <span className="uad-verdict" style={{ color: vc.color, background: vc.bg, border: `1px solid ${vc.color}30` }}>
        {s.verdict === "Accepted" ? "✓" : "✗"} {s.verdict || "—"}
      </span>
      <span className="uad-sub-prob">{s.problemTitle || s.problem?.title || "—"}</span>
      <span className="uad-sub-lang">{s.language || "—"}</span>
      <span className="uad-sub-time">{s.createdAt ? timeAgo(s.createdAt) : "—"}</span>
    </div>
  );
}

function FilterChip({ label }) {
  const [on, setOn] = useState(false);
  return (
    <button onClick={() => setOn(v => !v)} style={{
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      cursor: "pointer", border: "1px solid",
      color:       on ? "#0D1117"              : "#64748B",
      background:  on ? "#22C55E"              : "transparent",
      borderColor: on ? "#22C55E"              : "#21262D",
      fontFamily: "Outfit, sans-serif", transition: "all 0.15s",
    }}>
      {label}
    </button>
  );
}

function Empty({ icon, text }) {
  return (
    <div className="uad-empty">
      <div className="uad-empty-icon">{icon}</div>
      <div>{text}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[0,1,2,3].map(i => <div key={i} className="uad-shimmer" style={{ height: 72 }} />)}
      </div>
      <div className="uad-shimmer" style={{ height: 14, width: 120, marginBottom: 16 }} />
      <div className="uad-shimmer" style={{ height: 80, marginBottom: 20 }} />
      {[0,1,2,3,4].map(i => <div key={i} className="uad-shimmer" style={{ height: 44, marginBottom: 8 }} />)}
    </>
  );
}