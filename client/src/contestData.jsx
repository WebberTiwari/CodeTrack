// src/contestData.js
import { useState, useEffect } from "react";

export const COLORS = {
  bg: "#0d1117",
  surface: "#161b22",
  card: "#1a2130",
  border: "#21262d",
  green: "#00d26a",
  greenDim: "#1a3a2a",
  yellow: "#f0a500",
  red: "#e05252",
  blue: "#58a6ff",
  text: "#e6edf3",
  muted: "#8b949e",
  live: "#ff4757",
};

export function useCountdown(targetTime) {
  const [timeLeft, setTimeLeft] = useState(targetTime - Date.now());
  useEffect(() => {
    const i = setInterval(() => setTimeLeft(targetTime - Date.now()), 1000);
    return () => clearInterval(i);
  }, [targetTime]);
  return Math.max(0, timeLeft);
}

export function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// FIX: uses endTime (not startTime + duration) to match your MongoDB schema
export function deriveStatus(startTime, endTime) {
  const now = Date.now();
  if (now < startTime) return "upcoming";
  if (now < endTime)   return "live";
  return "ended";
}

export function DifficultyBadge({ d }) {
  const map = { Easy: COLORS.green, Medium: COLORS.yellow, Hard: COLORS.red };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
      color: map[d] || COLORS.muted,
      background: (map[d] || COLORS.muted) + "22",
      border: `1px solid ${(map[d] || COLORS.muted)}44`,
    }}>{d}</span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    live:     { color: "#ff4757", label: "● LIVE",     pulse: true  },
    upcoming: { color: "#f0a500", label: "◷ UPCOMING", pulse: false },
    ended:    { color: "#8b949e", label: "✓ ENDED",    pulse: false },
  };
  const s = map[status] || map.ended;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
      color: s.color, background: s.color + "22",
      border: `1px solid ${s.color}55`, letterSpacing: 1,
      animation: s.pulse ? "livePulse 2s ease-in-out infinite" : "none",
      display: "inline-block",
    }}>{s.label}</span>
  );
}