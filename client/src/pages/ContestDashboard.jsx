// src/pages/ContestDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://import.meta.env.VITE_API_URL || "http://localhost:5000"";

const C = {
  bg: "#080c10", surface: "#0d1117", panel: "#111720", card: "#161d28",
  border: "#1e2836", border2: "#2a3a52",
  green: "#00d26a", greenDim: "#0a2a18",
  red: "#ff4757", redDim: "#2a0a0a",
  yellow: "#f0a500", blue: "#58a6ff",
  text: "#e2edf8", muted: "#5a7080",
};

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{label}</div>
          <div style={{ color: color || C.text, fontSize: 26, fontWeight: 800, fontFamily: "monospace", letterSpacing: -1 }}>{value ?? "—"}</div>
          {sub && <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{sub}</div>}
        </div>
        <span style={{ fontSize: 22, opacity: 0.7 }}>{icon}</span>
      </div>
    </div>
  );
}

function MiniBar({ label, value, max, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: C.text, fontSize: 13 }}>{label}</span>
        <span style={{ color: color, fontFamily: "monospace", fontSize: 13, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 5, background: C.border, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100, (value / (max || 1)) * 100)}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

export default function ContestDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchAll = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [profileRes, historyRes, subsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/users/profile`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/api/contests/internal/history?userId=${userId}`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/api/submissions?userId=${userId}&limit=20`, { headers }).then(r => r.ok ? r.json() : []),
      ]);

      if (profileRes.status === "fulfilled" && profileRes.value) setProfile(profileRes.value);
      if (historyRes.status === "fulfilled") {
        const raw = historyRes.value;
        setHistory(Array.isArray(raw) ? raw : raw.contests || raw.history || []);
      }
      if (subsRes.status === "fulfilled") {
        const raw = subsRes.value;
        setSubmissions(Array.isArray(raw) ? raw : raw.submissions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Login required</div>
          <div style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Sign in to view your contest dashboard.</div>
          <button onClick={() => navigate("/login")} style={{ background: C.green, color: "#000", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Derived stats
  const totalContests = history.length;
  const bestRank = history.length ? Math.min(...history.map(h => h.rank || h.finalRank || Infinity).filter(r => isFinite(r))) : null;
  const totalSolved = submissions.filter(s => s.status === "Accepted").length;
  const acceptanceRate = submissions.length ? Math.round((totalSolved / submissions.length) * 100) : 0;

  const diffBreakdown = { Easy: 0, Medium: 0, Hard: 0 };
  submissions.filter(s => s.status === "Accepted").forEach(s => {
    const d = s.problem?.difficulty || s.difficulty;
    if (d && diffBreakdown[d] !== undefined) diffBreakdown[d]++;
  });
  const maxDiff = Math.max(...Object.values(diffBreakdown), 1);

  const langBreakdown = {};
  submissions.forEach(s => {
    const l = s.language || "unknown";
    langBreakdown[l] = (langBreakdown[l] || 0) + 1;
  });

  const recentSubs = submissions.slice(0, 8);

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "history", label: `Contest History${totalContests ? ` (${totalContests})` : ""}` },
    { key: "submissions", label: "Recent Submissions" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}} *{box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:2px}`}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* Profile header */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 28px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${C.green}, #0084ff)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#000", flexShrink: 0 }}>
              {(profile?.username || profile?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: C.text }}>{profile?.username || profile?.name || "Contestant"}</div>
              <div style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{profile?.email || ""}</div>
            </div>
          </div>
          <button onClick={() => navigate("/contests-list")} style={{ background: C.green, color: "#000", border: "none", borderRadius: 8, padding: "9px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            Browse Contests →
          </button>
        </div>

        {/* Stats grid */}
        {loading ? (
          <div style={{ textAlign: "center", color: C.muted, padding: "60px 0", fontSize: 14 }}>Loading your stats...</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
              <StatCard icon="🏆" label="Contests Entered" value={totalContests} sub="All time" color={C.yellow} />
              <StatCard icon="✅" label="Problems Solved" value={totalSolved} sub={`${acceptanceRate}% acceptance`} color={C.green} />
              <StatCard icon="📊" label="Total Submissions" value={submissions.length} color={C.blue} />
              <StatCard icon="🎯" label="Best Rank" value={bestRank && isFinite(bestRank) ? `#${bestRank}` : "—"} sub={bestRank ? "Personal best" : "No ranked contests yet"} color={C.green} />
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.surface, borderRadius: 10, padding: 4, width: "fit-content", border: `1px solid ${C.border}` }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                  background: activeTab === t.key ? C.card : "transparent",
                  color: activeTab === t.key ? C.text : C.muted,
                  border: activeTab === t.key ? `1px solid ${C.border}` : "1px solid transparent",
                  borderRadius: 7, padding: "7px 16px", fontWeight: 600, fontSize: 12,
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                }}>{t.label}</button>
              ))}
            </div>

            {/* Overview tab */}
            {activeTab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "slideIn 0.2s ease" }}>
                {/* Difficulty breakdown */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: C.text }}>Solved by Difficulty</div>
                  <MiniBar label="Easy" value={diffBreakdown.Easy} max={maxDiff} color={C.green} />
                  <MiniBar label="Medium" value={diffBreakdown.Medium} max={maxDiff} color={C.yellow} />
                  <MiniBar label="Hard" value={diffBreakdown.Hard} max={maxDiff} color={C.red} />
                </div>

                {/* Language breakdown */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: C.text }}>Language Usage</div>
                  {Object.entries(langBreakdown).length === 0
                    ? <div style={{ color: C.muted, fontSize: 13 }}>No submissions yet</div>
                    : Object.entries(langBreakdown)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([lang, count]) => (
                          <MiniBar key={lang} label={lang} value={count} max={submissions.length} color={C.blue} />
                        ))
                  }
                </div>
              </div>
            )}

            {/* Contest history tab */}
            {activeTab === "history" && (
              <div style={{ animation: "slideIn 0.2s ease" }}>
                {history.length === 0 ? (
                  <div style={{ textAlign: "center", color: C.muted, padding: "60px 0", fontSize: 14 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🏁</div>
                    You haven't participated in any contests yet.
                    <div style={{ marginTop: 16 }}>
                      <button onClick={() => navigate("/contests-list")} style={{ background: C.green, color: "#000", border: "none", borderRadius: 8, padding: "9px 24px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                        Find a Contest →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: C.panel, borderBottom: `1px solid ${C.border}` }}>
                          {["Contest", "Date", "Rank", "Score", "Solved", ""].map(h => (
                            <th key={h} style={{ padding: "11px 16px", textAlign: "left", color: C.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h, i) => {
                          const rank = h.rank || h.finalRank;
                          const rankColor = rank === 1 ? "#fbbf24" : rank <= 3 ? "#94a3b8" : rank <= 10 ? C.green : C.text;
                          return (
                            <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "background 0.15s" }}
                              onMouseEnter={e => e.currentTarget.style.background = C.panel}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <td style={{ padding: "12px 16px", fontWeight: 600, color: C.text, fontSize: 13 }}>{h.contestTitle || h.contest?.title || "Contest"}</td>
                              <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>
                                {h.startTime || h.contest?.startTime ? new Date(h.startTime || h.contest?.startTime).toLocaleDateString() : "—"}
                              </td>
                              <td style={{ padding: "12px 16px", fontWeight: 700, color: rankColor, fontFamily: "monospace" }}>
                                {rank ? `#${rank}` : "—"}
                              </td>
                              <td style={{ padding: "12px 16px", color: C.yellow, fontFamily: "monospace", fontWeight: 700 }}>{h.score ?? h.totalScore ?? "—"}</td>
                              <td style={{ padding: "12px 16px", color: C.text, fontFamily: "monospace" }}>{h.solved ?? h.solvedCount ?? "—"}</td>
                              <td style={{ padding: "12px 16px" }}>
                                <button onClick={() => navigate(`/contests-list`)} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, padding: "3px 10px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Submissions tab */}
            {activeTab === "submissions" && (
              <div style={{ animation: "slideIn 0.2s ease" }}>
                {recentSubs.length === 0 ? (
                  <div style={{ textAlign: "center", color: C.muted, padding: "60px 0", fontSize: 14 }}>No submissions yet.</div>
                ) : (
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: C.panel, borderBottom: `1px solid ${C.border}` }}>
                          {["Problem", "Status", "Language", "Runtime", "Memory", "When"].map(h => (
                            <th key={h} style={{ padding: "11px 16px", textAlign: "left", color: C.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recentSubs.map((s, i) => {
                          const ac = s.status === "Accepted";
                          return (
                            <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}
                              onMouseEnter={e => e.currentTarget.style.background = C.panel}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <td style={{ padding: "12px 16px", color: C.text, fontWeight: 600, fontSize: 13 }}>
                                {s.problem?.title || s.problemTitle || "Problem"}
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: ac ? C.green : C.red, background: ac ? C.greenDim : C.redDim, padding: "2px 8px", borderRadius: 5, border: `1px solid ${ac ? C.green : C.red}44` }}>
                                  {s.status}
                                </span>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <span style={{ fontSize: 11, color: C.blue, background: C.blue + "11", border: `1px solid ${C.blue}33`, padding: "2px 7px", borderRadius: 4, fontWeight: 600 }}>
                                  {s.language || "—"}
                                </span>
                              </td>
                              <td style={{ padding: "12px 16px", color: C.muted, fontFamily: "monospace", fontSize: 12 }}>{s.runtime || s.executionTime || "—"}</td>
                              <td style={{ padding: "12px 16px", color: C.muted, fontFamily: "monospace", fontSize: 12 }}>{s.memory || s.memoryUsed || "—"}</td>
                              <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>
                                {s.createdAt ? new Date(s.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}