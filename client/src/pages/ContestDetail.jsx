// src/pages/ContestDetail.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://import.meta.env.VITE_API_URL || "http://localhost:5000"";

const CONTEST_DETAIL_ROUTE    = (id) => `${API_BASE}/api/contests/${id}`;
const CONTEST_REGISTER_ROUTE  = (id) => `${API_BASE}/api/contests/${id}/register`;
const CONTEST_IS_REG_ROUTE    = (id) => `${API_BASE}/api/contests/${id}/is-registered`;
const LEADERBOARD_ROUTE       = (id) => `${API_BASE}/api/contests/${id}/leaderboard`;

const COLORS = {
  bg:       "#0d1117",
  surface:  "#161b22",
  card:     "#1c2333",
  border:   "#21262d",
  green:    "#22c55e",
  greenDim: "#0d2818",
  red:      "#ef4444",
  redDim:   "#2a0a0a",
  yellow:   "#f59e0b",
  blue:     "#58a6ff",
  muted:    "#64748b",
  text:     "#e2e8f0",
};

function StatusBadge({ status }) {
  const cfg = {
    live:     { color: COLORS.green,  bg: COLORS.greenDim, label: "● LIVE"     },
    upcoming: { color: COLORS.yellow, bg: "#1c1200",       label: "◷ UPCOMING" },
    ended:    { color: COLORS.muted,  bg: COLORS.card,     label: "✓ ENDED"    },
  }[status] || { color: COLORS.muted, bg: COLORS.card, label: status };
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:12,
      color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.color}33`,
      textTransform:"uppercase", letterSpacing:0.5 }}>
      {cfg.label}
    </span>
  );
}

function LeaderboardPanel({ contestId }) {
  const [lb, setLb]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!contestId) return;
    setLoading(true);
    setError(null);

    fetch(LEADERBOARD_ROUTE(contestId))
      .then(r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(data => {
        // ── Handle any shape the backend might return ──────────────────
        // { leaderboard: [...] } | { rankings: [...] } | { data: [...] } | [...]
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.leaderboard)  ? data.leaderboard
          : Array.isArray(data.rankings)     ? data.rankings
          : Array.isArray(data.data)         ? data.data
          : [];
        setLb(list);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [contestId]);

  if (loading) return (
    <div style={{ padding:"32px", textAlign:"center", color:COLORS.muted, fontSize:13 }}>
      Loading leaderboard...
    </div>
  );

  if (error) return (
    <div style={{ padding:"32px", textAlign:"center", color:COLORS.muted, fontSize:13 }}>
      Leaderboard not available yet.
    </div>
  );

  if (lb.length === 0) return (
    <div style={{ padding:"32px", textAlign:"center", color:COLORS.muted, fontSize:13 }}>
      No entries yet — be the first to submit!
    </div>
  );

  const rankColors = [COLORS.yellow, "#94a3b8", "#cd7f32"];

  return (
    <div>
      {lb.slice(0, 10).map((row, i) => (
        <div key={row.userId || row._id || i}
          style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"12px 16px", borderBottom:`1px solid ${COLORS.border}`, fontSize:13,
            transition:"background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = COLORS.card}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <span style={{ fontFamily:"monospace", fontWeight:700, minWidth:32,
              fontSize: i < 3 ? 16 : 13,
              color: i < 3 ? rankColors[i] : COLORS.muted }}>
              {i < 3 ? ["🥇","🥈","🥉"][i] : `#${i+1}`}
            </span>
            <span style={{ fontWeight:600, color:COLORS.text }}>
              {row.username || row.user?.username || row.name || "User"}
            </span>
          </div>
          <div style={{ display:"flex", gap:16, fontSize:12 }}>
            <span style={{ color:COLORS.green, fontWeight:700 }}>
              {row.score ?? row.totalScore ?? 0} pts
            </span>
            <span style={{ color:COLORS.blue }}>
              {row.solved ?? row.solvedCount ?? 0} solved
            </span>
            <span style={{ color:COLORS.muted, fontFamily:"monospace" }}>
              {row.totalTime ?? row.time ?? "—"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ContestDetail({ contest, currentUserId }) {
  const navigate = useNavigate();

  const [registered,  setRegistered]  = useState(false);
  const [checkingReg, setCheckingReg] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [regMsg,      setRegMsg]      = useState(null);
  const [activeTab,   setActiveTab]   = useState("overview");

  const token     = localStorage.getItem("token");
  const role      = localStorage.getItem("role");
  const isAdmin   = role === "admin";
  const contestId = contest?._id?.toString() || contest?.id?.toString();

  const startTime   = contest?.startTime ? new Date(contest.startTime) : null;
  const endTime     = contest?.endTime   ? new Date(contest.endTime)   : null;
  const isLive      = contest?.status === "live";
  const isUpcoming  = contest?.status === "upcoming";
  const isEnded     = contest?.status === "ended";
  const durationMin = startTime && endTime
    ? Math.floor((endTime - startTime) / 60000) : 0;

  // ── Check registration ────────────────────────────────────────────────
  const checkRegistration = useCallback(async () => {
    if (!contestId || !token) { setCheckingReg(false); return; }
    if (isAdmin) { setRegistered(true); setCheckingReg(false); return; }
    try {
      const res  = await fetch(CONTEST_IS_REG_ROUTE(contestId),
        { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRegistered(data.isRegistered || false);
    } catch {
      setRegistered(false);
    } finally {
      setCheckingReg(false);
    }
  }, [contestId, token, isAdmin]);

  useEffect(() => { checkRegistration(); }, [checkRegistration]);
  useEffect(() => { setRegMsg(null); setActiveTab("overview"); }, [contestId]);

  // ── Register ──────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!token) { setRegMsg({ ok:false, text:"Please log in to register." }); return; }
    setRegistering(true);
    setRegMsg(null);
    try {
      const res  = await fetch(CONTEST_REGISTER_ROUTE(contestId), {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setRegistered(true);
        setRegMsg({ ok:true, text:"✓ Registered successfully!" });
      } else {
        setRegMsg({ ok:false, text: data.msg || data.message || "Registration failed." });
      }
    } catch {
      setRegMsg({ ok:false, text:"Network error. Please try again." });
    } finally {
      setRegistering(false);
    }
  };

  if (!contest) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:400, color:COLORS.muted, fontSize:14, background:COLORS.surface,
      borderRadius:12, border:`1px solid ${COLORS.border}` }}>
      Select a contest to view details
    </div>
  );

  return (
    <div style={{ background:COLORS.surface, borderRadius:12, border:`1px solid ${COLORS.border}`,
      overflow:"hidden", fontFamily:"'Segoe UI',system-ui,sans-serif", color:COLORS.text }}>

      <style>{`
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 ${COLORS.green}44; }
          50%      { box-shadow: 0 0 0 6px transparent; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding:"20px 24px", borderBottom:`1px solid ${COLORS.border}`,
        background:COLORS.card }}>

        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"flex-start", gap:12 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, flexWrap:"wrap" }}>
              <StatusBadge status={contest.status} />
              {isAdmin && (
                <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10,
                  color:COLORS.yellow, background:"rgba(245,158,11,0.1)",
                  border:"1px solid rgba(245,158,11,0.25)" }}>
                  ADMIN
                </span>
              )}
            </div>
            <h2 style={{ margin:"0 0 8px", fontSize:20, fontWeight:700, color:"#fff",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {contest.title}
            </h2>
            <div style={{ display:"flex", gap:16, fontSize:12, color:COLORS.muted, flexWrap:"wrap" }}>
              {startTime && <span>▶ {startTime.toLocaleString()}</span>}
              {endTime   && <span>◼ {endTime.toLocaleString()}</span>}
              {durationMin > 0 && <span>⏱ {durationMin}m</span>}
              <span>👥 {contest.participants || 0} participants</span>
              <span>💻 {contest.problems?.length || 0} problems</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ marginTop:16, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>

          {isUpcoming && !isAdmin && (
            registered ? (
              <span style={{ fontSize:13, fontWeight:700, color:COLORS.green,
                background:COLORS.greenDim, border:`1px solid ${COLORS.green}44`,
                borderRadius:8, padding:"8px 16px" }}>
                ✓ You're registered
              </span>
            ) : (
              <button onClick={handleRegister} disabled={registering || checkingReg}
                style={{ padding:"9px 24px", borderRadius:8,
                  border:`1px solid ${COLORS.green}`, background:COLORS.greenDim,
                  color:COLORS.green, cursor: registering ? "not-allowed" : "pointer",
                  fontFamily:"inherit", fontWeight:700, fontSize:14,
                  opacity: registering ? 0.7 : 1, transition:"all 0.15s" }}>
                {registering ? "Registering..." : checkingReg ? "Checking..." : "Register →"}
              </button>
            )
          )}

          {isLive && (
            <button onClick={() => navigate(`/contest-arena/${contestId}`)}
              style={{ padding:"9px 24px", borderRadius:8, border:"none",
                background:COLORS.green, color:"#000", cursor:"pointer",
                fontFamily:"inherit", fontWeight:700, fontSize:14,
                animation:"pulse 2s ease-in-out infinite", transition:"all 0.15s" }}>
              ⚡ Enter Arena →
            </button>
          )}

          {isEnded && (
            <button onClick={() => setActiveTab("leaderboard")}
              style={{ padding:"9px 16px", borderRadius:8,
                border:`1px solid ${COLORS.border}`, background:COLORS.card,
                color:COLORS.text, cursor:"pointer",
                fontFamily:"inherit", fontSize:13, fontWeight:600 }}>
              View Results →
            </button>
          )}

          {isAdmin && (
            <>
              <button onClick={() => navigate(`/admin/contests/${contestId}/edit`)}
                style={{ padding:"8px 16px", borderRadius:8,
                  border:`1px solid ${COLORS.border}`, background:"transparent",
                  color:COLORS.muted, cursor:"pointer",
                  fontFamily:"inherit", fontSize:12, fontWeight:600 }}>
                ✏ Edit
              </button>
              <button onClick={() => navigate(`/admin/contests/${contestId}/monitor`)}
                style={{ padding:"8px 16px", borderRadius:8,
                  border:`1px solid ${COLORS.yellow}44`,
                  background:"rgba(245,158,11,0.08)", color:COLORS.yellow,
                  cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600 }}>
                📊 Monitor
              </button>
            </>
          )}
        </div>

        {regMsg && (
          <div style={{ marginTop:10, fontSize:12, fontWeight:600,
            color: regMsg.ok ? COLORS.green : COLORS.red,
            background: regMsg.ok ? COLORS.greenDim : COLORS.redDim,
            border:`1px solid ${regMsg.ok ? COLORS.green : COLORS.red}44`,
            borderRadius:6, padding:"7px 12px" }}>
            {regMsg.text}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex", borderBottom:`1px solid ${COLORS.border}`,
        background:COLORS.card }}>
        {["overview","leaderboard"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding:"11px 20px", border:"none", cursor:"pointer",
              background:"transparent", fontFamily:"inherit", fontSize:12,
              fontWeight: activeTab===t ? 700 : 400,
              color: activeTab===t ? COLORS.green : COLORS.muted,
              borderBottom:`2px solid ${activeTab===t ? COLORS.green : "transparent"}`,
              textTransform:"capitalize", transition:"all 0.15s" }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding:"20px 24px" }}>

        {activeTab === "overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Problems list */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:COLORS.muted,
                textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
                Problems
              </div>
              {(contest.problems || []).length === 0 ? (
                <div style={{ color:COLORS.muted, fontSize:13 }}>No problems added yet.</div>
              ) : (
                contest.problems.map((p, i) => {
                  const prob = p.problemId || {};
                  const diff = prob.difficulty;
                  const dCol = diff === "Easy" ? COLORS.green
                             : diff === "Medium" ? COLORS.yellow
                             : COLORS.red;
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12,
                      padding:"10px 14px", background:COLORS.bg,
                      border:`1px solid ${COLORS.border}`, borderRadius:8, marginBottom:6,
                      cursor: isLive ? "pointer" : "default", transition:"border-color 0.15s" }}
                      onMouseEnter={e => isLive && (e.currentTarget.style.borderColor = COLORS.blue)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = COLORS.border)}
                      onClick={() => isLive && navigate(`/contest-arena/${contestId}`)}
                    >
                      <span style={{ fontFamily:"monospace", fontWeight:700,
                        color:COLORS.muted, minWidth:24, fontSize:13 }}>
                        {String.fromCharCode(65+i)}
                      </span>
                      <span style={{ flex:1, fontSize:13, fontWeight:600 }}>
                        {prob.title || `Problem ${i+1}`}
                      </span>
                      {diff && (
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px",
                          borderRadius:10, color:dCol, background:dCol+"22",
                          border:`1px solid ${dCol}44` }}>
                          {diff}
                        </span>
                      )}
                      <span style={{ fontSize:12, color:COLORS.yellow,
                        fontFamily:"monospace", fontWeight:700 }}>
                        {p.points ?? 100}pts
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              {[
                { label:"Duration",     value: durationMin > 0 ? `${durationMin}m` : "—" },
                { label:"Problems",     value: contest.problems?.length || 0 },
                { label:"Participants", value: contest.participants || 0 },
              ].map(({ label, value }) => (
                <div key={label} style={{ background:COLORS.bg, border:`1px solid ${COLORS.border}`,
                  borderRadius:8, padding:"12px 14px", textAlign:"center" }}>
                  <div style={{ fontSize:18, fontWeight:700, color:COLORS.blue }}>{value}</div>
                  <div style={{ fontSize:11, color:COLORS.muted, marginTop:3,
                    textTransform:"uppercase", letterSpacing:0.5 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:COLORS.muted,
              textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
              Top 10
            </div>
            <div style={{ background:COLORS.bg, border:`1px solid ${COLORS.border}`,
              borderRadius:8, overflow:"hidden" }}>
              <LeaderboardPanel contestId={contestId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}