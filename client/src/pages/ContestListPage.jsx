import { useState, useEffect, useCallback } from "react";
import { COLORS, deriveStatus, StatusBadge } from "../contestData";
import ContestDetail from "./ContestDetail";

const API_BASE = "http://localhost:5000";

function ContestCard({ contest, onClick, active }) {
  const durationMin = Math.floor(((contest.endTime - contest.startTime) || 0) / 60000);
  return (
    <div onClick={() => onClick(contest)} style={{
      background: active ? COLORS.greenDim : COLORS.card,
      border: active ? `1px solid ${COLORS.green}55` : `1px solid ${COLORS.border}`,
      borderRadius: 10, padding: "14px 16px", cursor: "pointer",
      transition: "all 0.2s",
      borderLeft: active ? `3px solid ${COLORS.green}` : "3px solid transparent",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.text,
          lineHeight: 1.3 }}>{contest.title}</span>
        <StatusBadge status={contest.status} />
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 12, color: COLORS.muted }}>
        <span>👥 {contest.participants || 0}</span>
        <span>⏱ {durationMin}m</span>
        <span style={{ color: COLORS.blue }}>{contest.difficulty || "Mixed"}</span>
      </div>
    </div>
  );
}

export default function ContestListPage() {
  const [contests, setContests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter,   setFilter]   = useState("all");
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchContests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ FIXED: was /api/contests/internal
      const res = await fetch(`${API_BASE}/api/contests`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      const raw  = Array.isArray(data)
        ? data
        : (data.contests || data.data || data.results || []);

      const normalized = raw.map(c => {
        const startTime = new Date(c.startTime).getTime();
        const endTime   = new Date(c.endTime).getTime();
        return {
          ...c,
          // ✅ always expose both .id and ._id so downstream code works either way
          id:           c._id?.toString() || c.id,
          _id:          c._id?.toString() || c.id,
          startTime,
          endTime,
          duration:     endTime - startTime,
          status:       c.status || deriveStatus(startTime, endTime),
          participants: c.participants || c.participantCount || 0,
        };
      });

      setContests(normalized);
      setSelected(prev => {
        if (prev) return normalized.find(c => c.id === prev.id) || prev;
        return (
          normalized.find(c => c.status === "live")     ||
          normalized.find(c => c.status === "upcoming") ||
          normalized[0]                                 ||
          null
        );
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContests(); }, [fetchContests]);

  const filters  = ["all", "live", "upcoming", "ended"];
  const filtered = filter === "all"
    ? contests
    : contests.filter(c => c.status === filter);

  const currentUserId = localStorage.getItem("userId");

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh",
      fontFamily: "'Segoe UI', system-ui, sans-serif", color: COLORS.text }}>
      <style>{`
        @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Filter bar ─────────────────────────────────────────────── */}
      <div style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`,
        padding: "0 32px", display: "flex", gap: 4 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "14px 24px", border: "none", cursor: "pointer",
            background: "transparent", fontFamily: "inherit",
            fontSize: 13, fontWeight: filter === f ? 600 : 400,
            color: filter === f ? COLORS.green : COLORS.muted,
            borderBottom: `2px solid ${filter === f ? COLORS.green : "transparent"}`,
            textTransform: "capitalize", transition: "all 0.15s",
          }}>
            {f}
          </button>
        ))}
      </div>

      {/* ── Main layout ────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr",
        gap: 20, padding: "20px 32px", maxWidth: 1400, margin: "0 auto" }}>

        {/* Left: contest list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

          {loading && (
            <div style={{ textAlign: "center", color: COLORS.muted,
              padding: "40px 0", fontSize: 13 }}>
              Loading contests...
            </div>
          )}

          {error && !loading && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ color: COLORS.red, fontSize: 13, marginBottom: 12 }}>
                {error}
              </div>
              <button onClick={fetchContests} style={{
                padding: "6px 16px", borderRadius: 6,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.card, color: COLORS.text, cursor: "pointer",
              }}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ textAlign: "center", color: COLORS.muted,
              fontSize: 13, padding: "40px 0" }}>
              No {filter === "all" ? "" : filter} contests yet
            </div>
          )}

          {!loading && !error && filtered.map(c => (
            <ContestCard
              key={c.id}
              contest={c}
              onClick={setSelected}
              active={selected?.id === c.id}
            />
          ))}
        </div>

        {/* Right: contest detail */}
        <div>
          {!selected && !loading && (
            <div style={{ display: "flex", alignItems: "center",
              justifyContent: "center", height: 400, color: COLORS.muted,
              fontSize: 14, background: COLORS.surface, borderRadius: 12,
              border: `1px solid ${COLORS.border}` }}>
              Select a contest to view details
            </div>
          )}
          {selected && (
            <ContestDetail
              contest={selected}
              currentUserId={currentUserId}
            />
          )}
        </div>
      </div>
    </div>
  );
}