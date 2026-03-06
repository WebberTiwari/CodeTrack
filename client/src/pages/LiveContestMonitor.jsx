import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

/* ─────────────────────────── CSS ─────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0D1117;--surface:#161B22;--s2:#1C2333;--border:#21262D;
  --green:#22C55E;--cyan:#00B4D8;--amber:#F59E0B;--red:#EF4444;--purple:#8B5CF6;
  --text:#E2E8F0;--muted:#64748B;--font:'Outfit',sans-serif;--mono:'JetBrains Mono',monospace;
}
*{scrollbar-width:thin;scrollbar-color:#21262D transparent}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#2D3748;border-radius:4px}
@keyframes fadeUp{to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}
@keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
@keyframes newRow{0%{background:rgba(34,197,94,0.15)}100%{background:transparent}}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes countUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

.lc-page{min-height:100vh;background:var(--bg);color:var(--text);font-family:var(--font)}
.lc-page::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
  background-image:linear-gradient(rgba(34,197,94,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.02) 1px,transparent 1px);
  background-size:48px 48px}
.lc-inner{max-width:1280px;margin:0 auto;padding:28px 32px 80px;position:relative;z-index:1}
.lc-fade{opacity:0;transform:translateY(14px);animation:fadeUp 0.45s ease forwards}
.lc-shimmer{background:linear-gradient(90deg,#1E2530 25%,#252D3A 50%,#1E2530 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px}

/* Live ticker */
.lc-ticker{background:#0a1628;border-bottom:1px solid rgba(0,180,216,0.2);padding:8px 0;overflow:hidden;position:relative}
.lc-ticker-track{display:flex;gap:0;white-space:nowrap;animation:ticker 30s linear infinite}
.lc-ticker-item{display:inline-flex;align-items:center;gap:8px;padding:0 32px;font-size:12px;font-weight:600;color:var(--cyan)}
.lc-ticker-sep{color:#21262D;margin:0 4px}

/* Header */
.lc-hdr{display:flex;align-items:flex-start;justify-content:space-between;margin:24px 0 20px;flex-wrap:wrap;gap:16px}
.lc-live-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(239,68,68,0.12);color:#EF4444;border:1px solid rgba(239,68,68,0.3);border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:10px}
.lc-live-dot{width:8px;height:8px;border-radius:50%;background:#EF4444;animation:pulse 1.5s ease-in-out infinite}
.lc-title{font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.8px;line-height:1.1}
.lc-sub{font-size:13px;color:var(--muted);margin-top:5px}
.lc-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:10px;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;border:1px solid}

/* Timer */
.lc-timer-wrap{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px 24px;display:flex;align-items:center;gap:20px}
.lc-timer-block{text-align:center}
.lc-timer-val{font-size:32px;font-weight:900;font-family:var(--mono);line-height:1;color:var(--amber)}
.lc-timer-lbl{font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.8px;margin-top:3px}
.lc-timer-sep{font-size:28px;font-weight:900;color:var(--border);margin-bottom:16px}

/* Stats row */
.lc-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:24px}
.lc-stat{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px;position:relative;overflow:hidden}
.lc-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--sc,var(--cyan)),transparent)}
.lc-stat-val{font-size:28px;font-weight:900;font-family:var(--mono);color:var(--sc,var(--cyan));line-height:1;animation:countUp 0.5s ease both}
.lc-stat-lbl{font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.8px;margin-top:5px}

/* Main grid */
.lc-grid{display:grid;grid-template-columns:1fr 380px;gap:20px;align-items:start}
.lc-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden}
.lc-card-hdr{display:flex;align-items:center;justify-content:space-between;padding:15px 20px;border-bottom:1px solid var(--border)}
.lc-card-title{font-size:14px;font-weight:700;color:#fff;display:flex;align-items:center;gap:8px}
.lc-card-meta{font-size:11px;color:var(--muted)}

/* Leaderboard */
.lc-lb-row{display:grid;grid-template-columns:44px 1fr repeat(3,80px);align-items:center;gap:8px;padding:11px 16px;border-bottom:1px solid var(--border);transition:background 0.15s;font-size:13px}
.lc-lb-row:last-child{border-bottom:none}
.lc-lb-row:hover{background:rgba(255,255,255,0.02)}
.lc-lb-row.new-row{animation:newRow 2s ease}
.lc-lb-row.header{background:var(--s2);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--muted);padding:9px 16px}
.lc-rank{font-weight:900;font-family:var(--mono);font-size:14px;text-align:center}
.lc-avatar-sm{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#0D1117;flex-shrink:0}
.lc-username{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lc-score{font-family:var(--mono);font-weight:700;color:var(--amber);text-align:center}
.lc-solved{font-family:var(--mono);font-weight:700;color:var(--green);text-align:center}
.lc-time{font-family:var(--mono);font-size:11px;color:var(--muted);text-align:center}
.lc-delta{font-size:10px;font-weight:700;padding:1px 5px;border-radius:10px;margin-left:6px}
.lc-delta.up{color:var(--green);background:rgba(34,197,94,0.1)}
.lc-delta.down{color:var(--red);background:rgba(239,68,68,0.1)}

/* Problems panel */
.lc-prob-row{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border)}
.lc-prob-row:last-child{border-bottom:none}
.lc-prob-letter{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;flex-shrink:0}
.lc-prob-bar{flex:1;height:5px;background:var(--border);border-radius:3px;overflow:hidden;margin-top:4px}
.lc-prob-fill{height:100%;border-radius:3px;transition:width 0.5s ease}

/* Live feed */
.lc-feed-row{display:flex;align-items:center;gap:10px;padding:9px 16px;border-bottom:1px solid var(--border);animation:slideIn 0.3s ease;font-size:12px}
.lc-feed-row:last-child{border-bottom:none}
.lc-feed-verdict{font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;flex-shrink:0}
.lc-feed-prob{font-weight:600;color:var(--text);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lc-feed-user{color:var(--muted);flex-shrink:0}
.lc-feed-time{color:var(--muted);font-size:10px;font-family:var(--mono);flex-shrink:0}

/* Progress bar for time */
.lc-progress-wrap{height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-top:16px}
.lc-progress-fill{height:100%;border-radius:2px;transition:width 1s linear}

/* Section label */
.lc-sec{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin:20px 0 12px;display:flex;align-items:center;gap:10px}
.lc-sec::after{content:'';flex:1;height:1px;background:var(--border)}

@media(max-width:900px){.lc-grid{grid-template-columns:1fr}}
`;

/* ─────── Helpers ─────── */
const pad2 = n => String(n).padStart(2, "0");
const timeAgo = iso => {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.floor(s/60)}m`;
  return `${Math.floor(s/3600)}h`;
};

function verdictStyle(v) {
  if (v === "Accepted")     return { color: "#22C55E", bg: "rgba(34,197,94,0.12)"  };
  if (v === "Wrong Answer") return { color: "#EF4444", bg: "rgba(239,68,68,0.12)"  };
  return                           { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" };
}

/* Countdown hook */
function useCountdown(endTime) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, new Date(endTime) - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return { h, m, s, remaining };
}

/* ─────────────────────────── Component ─────────────────────────── */
export default function LiveContestMonitor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contest,     setContest]     = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [feed,        setFeed]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdate,  setLastUpdate]  = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const prevLbRef = useRef({});
  const intervalRef = useRef(null);

  const fetchContest = useCallback(async () => {
    try {
      const res = await API.get(`/contests/${id}`);
      setContest(res.data);
    } catch (e) { console.error(e); }
  }, [id]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await API.get(`/contests/${id}/leaderboard`);
      const lb  = res.data || [];

      // compute rank deltas vs previous fetch
      const prev = prevLbRef.current;
      const enriched = lb.map((entry, i) => {
        const rank = i + 1;
        const prevRank = prev[entry.userId];
        const delta = prevRank != null ? prevRank - rank : 0;
        return { ...entry, rank, delta };
      });

      prevLbRef.current = Object.fromEntries(enriched.map(e => [e.userId, e.rank]));
      setLeaderboard(enriched);
      setLastUpdate(new Date());
    } catch (e) { console.error(e); }
  }, [id]);

  const fetchFeed = useCallback(async () => {
    try {
      // Try a dedicated endpoint, fall back gracefully
      const res = await API.get(`/admin/contests/${id}/feed`).catch(() =>
        API.get(`/admin/submissions?contestId=${id}&limit=20`)
      );
      const items = Array.isArray(res.data) ? res.data : res.data?.submissions || [];
      setFeed(items.slice(0, 20));
    } catch (e) { /* feed is optional */ }
  }, [id]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchLeaderboard(), fetchFeed()]);
  }, [fetchLeaderboard, fetchFeed]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchContest();
      await refresh();
      setLoading(false);
    };
    init();
  }, [fetchContest, refresh]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refresh, 15000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, refresh]);

  const { h, m, s, remaining } = useCountdown(contest?.endTime || Date.now());

  const totalDuration = contest
    ? new Date(contest.endTime) - new Date(contest.startTime)
    : 1;
  const elapsed = contest ? Date.now() - new Date(contest.startTime) : 0;
  const progressPct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  const isLive = contest && Date.now() > new Date(contest.startTime) && remaining > 0;
  const isEnded = remaining === 0 && contest;

  // Problem solve stats
  const probStats = {};
  for (const entry of leaderboard) {
    // count per-problem if data available
  }

  // Ticker items
  const tickerItems = feed.filter(f => f.verdict === "Accepted").slice(0, 8);

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="lc-page">
        <div className="lc-inner">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, margin: "24px 0" }}>
            {[0,1,2,3].map(i => <div key={i} className="lc-shimmer" style={{ height: 90 }} />)}
          </div>
          <div className="lc-shimmer" style={{ height: 400 }} />
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="lc-page">

        {/* Live ticker */}
        {tickerItems.length > 0 && (
          <div className="lc-ticker">
            <div className="lc-ticker-track">
              {[...tickerItems, ...tickerItems].map((f, i) => (
                <span key={i} className="lc-ticker-item">
                  ✅ <strong>{f.username || "User"}</strong> solved <strong>{f.problemTitle || "a problem"}</strong>
                  <span className="lc-ticker-sep">•</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="lc-inner">

          {/* Header */}
          <div className="lc-hdr">
            <div>
              <div className="lc-live-badge">
                <div className="lc-live-dot" />
                {isEnded ? "Contest Ended" : isLive ? "Live Now" : "Upcoming"}
              </div>
              <div className="lc-title">{contest?.title || "Contest Monitor"}</div>
              <div className="lc-sub">
                {leaderboard.length} participants · {contest?.problems?.length || 0} problems ·
                {lastUpdate && ` Updated ${timeAgo(lastUpdate)} ago`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {/* Timer */}
              {!isEnded && (
                <div className="lc-timer-wrap">
                  {[{v: h, l: "Hours"}, {v: m, l: "Mins"}, {v: s, l: "Secs"}].map(({v, l}, i) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: i < 2 ? 0 : 0 }}>
                      <div className="lc-timer-block">
                        <div className="lc-timer-val">{pad2(v)}</div>
                        <div className="lc-timer-lbl">{l}</div>
                      </div>
                      {i < 2 && <div className="lc-timer-sep" style={{ margin: "0 6px", marginBottom: 16 }}>:</div>}
                    </div>
                  ))}
                </div>
              )}
              <button className="lc-btn" onClick={() => setAutoRefresh(v => !v)}
                style={{ background: autoRefresh ? "rgba(34,197,94,0.1)" : "transparent", color: autoRefresh ? "var(--green)" : "var(--muted)", borderColor: autoRefresh ? "rgba(34,197,94,0.3)" : "var(--border)" }}>
                {autoRefresh ? "⏸ Auto-Refresh ON" : "▶ Auto-Refresh OFF"}
              </button>
              <button className="lc-btn" onClick={refresh}
                style={{ background: "transparent", color: "var(--cyan)", borderColor: "rgba(0,180,216,0.3)" }}>
                ↻ Refresh
              </button>
              <button className="lc-btn" onClick={() => navigate("/admin")}
                style={{ background: "transparent", color: "var(--muted)", borderColor: "var(--border)" }}>
                ← Admin
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {isLive && (
            <div className="lc-progress-wrap" style={{ marginBottom: 20 }}>
              <div className="lc-progress-fill" style={{
                width: `${progressPct}%`,
                background: progressPct > 80 ? "var(--red)" : progressPct > 50 ? "var(--amber)" : "var(--green)",
              }} />
            </div>
          )}

          {/* Stats */}
          <div className="lc-stats">
            {[
              { icon: "👥", label: "Participants",     val: leaderboard.length,                                color: "#22C55E" },
              { icon: "✅", label: "Solves",           val: feed.filter(f => f.verdict === "Accepted").length, color: "#00B4D8" },
              { icon: "📬", label: "Submissions",      val: feed.length,                                       color: "#8B5CF6" },
              { icon: "🎯", label: "Top Score",        val: leaderboard[0]?.score ?? 0,                        color: "#F59E0B" },
              { icon: "⏱",  label: "Time Elapsed",     val: `${Math.floor(progressPct)}%`,                    color: "#EF4444" },
              { icon: "🏆", label: "Problems",         val: contest?.problems?.length || 0,                    color: "#00B4D8" },
            ].map(({ icon, label, val, color }, i) => (
              <div key={label} className="lc-stat lc-fade" style={{ "--sc": color, animationDelay: `${i*0.06}s` }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
                <div className="lc-stat-val">{val}</div>
                <div className="lc-stat-lbl">{label}</div>
              </div>
            ))}
          </div>

          {/* Main grid: Leaderboard + Feed */}
          <div className="lc-grid">

            {/* Leaderboard */}
            <div className="lc-card lc-fade" style={{ animationDelay: "0.2s" }}>
              <div className="lc-card-hdr">
                <div className="lc-card-title">🏆 Live Leaderboard</div>
                <div className="lc-card-meta">{leaderboard.length} participants</div>
              </div>

              {/* Table header */}
              <div className="lc-lb-row header">
                <div>Rank</div>
                <div>User</div>
                <div style={{ textAlign: "center" }}>Score</div>
                <div style={{ textAlign: "center" }}>Solved</div>
                <div style={{ textAlign: "center" }}>Time</div>
              </div>

              {leaderboard.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🏆</div>
                  No participants yet
                </div>
              ) : (
                leaderboard.map((entry, i) => {
                  const rankColors = ["#F59E0B", "#94A3B8", "#CD7F32"];
                  const avatarBg = `hsl(${(entry.userId?.charCodeAt(0) || i) * 47 % 360}, 60%, 50%)`;
                  return (
                    <div key={entry.userId} className={`lc-lb-row ${entry._new ? "new-row" : ""}`}>
                      <div className="lc-rank" style={{ color: i < 3 ? rankColors[i] : "var(--muted)" }}>
                        {i < 3 ? ["🥇","🥈","🥉"][i] : `#${entry.rank}`}
                        {entry.delta > 0 && <span className="lc-delta up">↑{entry.delta}</span>}
                        {entry.delta < 0 && <span className="lc-delta down">↓{Math.abs(entry.delta)}</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <div className="lc-avatar-sm" style={{ background: avatarBg }}>
                          {(entry.username || "?")[0].toUpperCase()}
                        </div>
                        <span className="lc-username">{entry.username || "—"}</span>
                      </div>
                      <div className="lc-score">{entry.score ?? 0}</div>
                      <div className="lc-solved">{entry.solved ?? 0}</div>
                      <div className="lc-time">{entry.totalTime || "—"}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right column: Feed + Problems */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Problems panel */}
              <div className="lc-card lc-fade" style={{ animationDelay: "0.25s" }}>
                <div className="lc-card-hdr">
                  <div className="lc-card-title">💻 Problems</div>
                  <div className="lc-card-meta">{contest?.problems?.length || 0} total</div>
                </div>
                {(contest?.problems || []).length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 12 }}>No problems</div>
                ) : (
                  contest.problems.map((p, i) => {
                    const prob = p.problemId || p;
                    const letter = String.fromCharCode(65 + i);
                    const letterColors = ["#22C55E","#00B4D8","#8B5CF6","#F59E0B","#EF4444","#EC4899"];
                    const color = letterColors[i % letterColors.length];
                    // count solves for this problem from leaderboard
                    const solveCount = leaderboard.filter(e => e.solved > i).length;
                    const solveRate  = leaderboard.length ? (solveCount / leaderboard.length) * 100 : 0;
                    return (
                      <div key={i} className="lc-prob-row">
                        <div className="lc-prob-letter" style={{ background: `${color}20`, color }}>
                          {letter}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {prob.title || `Problem ${letter}`}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <div className="lc-prob-bar">
                              <div className="lc-prob-fill" style={{ width: `${solveRate}%`, background: color }} />
                            </div>
                            <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "monospace", flexShrink: 0 }}>
                              {solveCount} solved
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--amber)", fontFamily: "var(--mono)", flexShrink: 0 }}>
                          {p.points ?? 100}pts
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Live Feed */}
              <div className="lc-card lc-fade" style={{ animationDelay: "0.3s" }}>
                <div className="lc-card-hdr">
                  <div className="lc-card-title">
                    <div className="lc-live-dot" style={{ display: "inline-block" }} />
                    Live Feed
                  </div>
                  <div className="lc-card-meta">{feed.length} events</div>
                </div>
                {feed.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 12 }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📡</div>
                    Waiting for submissions...
                  </div>
                ) : (
                  feed.slice(0, 15).map((f, i) => {
                    const vs = verdictStyle(f.verdict || f.status);
                    return (
                      <div key={i} className="lc-feed-row">
                        <span className="lc-feed-verdict" style={{ color: vs.color, background: vs.bg, border: `1px solid ${vs.color}30` }}>
                          {(f.verdict || f.status) === "Accepted" ? "✓ AC" : "✗"}
                        </span>
                        <span className="lc-feed-user">{f.username || "—"}</span>
                        <span className="lc-feed-prob">{f.problemTitle || "—"}</span>
                        <span className="lc-feed-time">{f.createdAt ? timeAgo(f.createdAt) : "—"}</span>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}