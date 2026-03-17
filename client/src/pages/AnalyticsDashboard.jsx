import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.an-page{min-height:100vh;background:var(--bg);color:var(--text);font-family:var(--font);position:relative}
.an-page::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
  background-image:linear-gradient(rgba(34,197,94,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.02) 1px,transparent 1px);
  background-size:48px 48px}
.an-inner{max-width:1280px;margin:0 auto;padding:36px 40px 80px;position:relative;z-index:1}
.an-fade{opacity:0;transform:translateY(16px);animation:fadeUp 0.5s ease forwards}
.an-shimmer{background:linear-gradient(90deg,#1E2530 25%,#252D3A 50%,#1E2530 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px}

/* Header */
.an-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:16px}
.an-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(0,180,216,0.1);color:var(--cyan);border:1px solid rgba(0,180,216,0.25);border-radius:20px;padding:4px 14px;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:10px}
.an-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--cyan);animation:pulse 2s ease-in-out infinite}
.an-title{font-size:32px;font-weight:900;color:#fff;letter-spacing:-1px}
.an-title span{background:linear-gradient(135deg,#00B4D8,#8B5CF6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.an-sub{font-size:14px;color:var(--muted);margin-top:4px}
.an-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;border:1px solid}

/* Range selector */
.an-range{display:flex;gap:6px;background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:4px}
.an-range-btn{padding:6px 14px;border-radius:7px;border:none;background:transparent;color:var(--muted);font-family:var(--font);font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s}
.an-range-btn.on{background:var(--cyan);color:#0D1117}

/* KPI cards */
.an-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:28px}
.an-kpi{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px;position:relative;overflow:hidden;transition:all 0.2s}
.an-kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--kpi-color,var(--cyan)),transparent)}
.an-kpi:hover{transform:translateY(-3px);border-color:var(--kpi-color,var(--cyan));box-shadow:0 10px 30px rgba(0,0,0,0.3)}
.an-kpi-icon{font-size:22px;margin-bottom:12px}
.an-kpi-val{font-size:34px;font-weight:900;font-family:var(--mono);color:var(--kpi-color,var(--cyan));line-height:1;letter-spacing:-1px;animation:countUp 0.5s ease both}
.an-kpi-lbl{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.8px;margin-top:5px}
.an-kpi-delta{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:600;margin-top:7px;padding:2px 7px;border-radius:20px}
.an-kpi-delta.up{color:#22C55E;background:rgba(34,197,94,0.1)}
.an-kpi-delta.down{color:#EF4444;background:rgba(239,68,68,0.1)}

/* Grid layouts */
.an-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
.an-grid-3{display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px}
.an-grid-full{margin-bottom:20px}

/* Card */
.an-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden}
.an-card-hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border)}
.an-card-title{font-size:14px;font-weight:700;color:#fff}
.an-card-meta{font-size:11px;color:var(--muted)}
.an-card-body{padding:20px}

/* SVG Charts */
.an-chart-wrap{position:relative;width:100%}
.an-tooltip{position:absolute;background:#1C2333;border:1px solid #21262D;border-radius:8px;padding:8px 12px;font-size:12px;pointer-events:none;z-index:100;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.4)}

/* Bar chart */
.an-bar-group{display:flex;gap:3px;align-items:flex-end;height:140px}
.an-bar-item{flex:1;border-radius:3px 3px 0 0;min-height:2px;cursor:pointer;transition:opacity 0.15s}
.an-bar-item:hover{opacity:0.75}

/* Donut */
.an-donut-wrap{display:flex;align-items:center;gap:20px}
.an-donut-legend{display:flex;flex-direction:column;gap:8px;flex:1}
.an-donut-item{display:flex;align-items:center;gap:8px;font-size:12px}
.an-donut-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}

/* Top problems table */
.an-prob-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)}
.an-prob-row:last-child{border-bottom:none}
.an-prob-rank{width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0}
.an-prob-bar{flex:1;height:5px;background:var(--border);border-radius:3px;overflow:hidden;margin:0 8px}
.an-prob-fill{height:100%;border-radius:3px}

/* Activity heatmap */
.an-hours-grid{display:grid;grid-template-columns:repeat(24,1fr);gap:3px}
.an-hour-cell{aspect-ratio:1;border-radius:3px;cursor:default;transition:transform 0.1s}
.an-hour-cell:hover{transform:scale(1.3)}

/* Section label */
.an-sec{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin:24px 0 14px;display:flex;align-items:center;gap:10px}
.an-sec::after{content:'';flex:1;height:1px;background:var(--border)}

@media(max-width:768px){.an-grid-2,.an-grid-3{grid-template-columns:1fr}}
`;

/* ─────────────── Helpers ─────────────── */
const fmtNum = n => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);

function useCountUp(target, dur = 800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!target) return;
    const s = performance.now();
    const tick = n => {
      const p = Math.min((n - s) / dur, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return v;
}

/* ─────────────── SVG Line/Area Chart ─────────────── */
function LineChart({ data, color = "#22C55E", label = "Value", height = 140, filled = true }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);
  if (!data || data.length === 0) return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>No data</div>;

  const W = 600, H = height;
  const pad = { t: 10, r: 10, b: 28, l: 36 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;

  const vals = data.map(d => d.value);
  const maxV = Math.max(...vals, 1), minV = Math.min(...vals, 0);
  const range = maxV - minV || 1;

  const px = i => pad.l + (i / (data.length - 1)) * iW;
  const py = v => pad.t + iH - ((v - minV) / range) * iH;

  const pts = data.map((d, i) => `${px(i)},${py(d.value)}`).join(" ");
  const pathD = `M ${data.map((d, i) => `${px(i)} ${py(d.value)}`).join(" L ")}`;
  const areaD = `${pathD} L ${px(data.length - 1)} ${pad.t + iH} L ${px(0)} ${pad.t + iH} Z`;

  // Y axis labels
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    v: Math.round(minV + t * range),
    y: pad.t + iH - t * iH,
  }));

  return (
    <div className="an-chart-wrap" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }} ref={svgRef}
        onMouseLeave={() => setTooltip(null)}>
        <defs>
          <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map(({ y, v }) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#21262D" strokeWidth="1" />
            <text x={pad.l - 6} y={y + 4} fill="#64748B" fontSize="9" textAnchor="end" fontFamily="monospace">{fmtNum(v)}</text>
          </g>
        ))}

        {/* Area fill */}
        {filled && <path d={areaD} fill={`url(#grad-${color.replace("#","")})`} />}

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* X axis labels — show every Nth */}
        {data.map((d, i) => {
          const step = Math.ceil(data.length / 8);
          if (i % step !== 0) return null;
          return (
            <text key={i} x={px(i)} y={H - 6} fill="#64748B" fontSize="9" textAnchor="middle" fontFamily="monospace">
              {d.label}
            </text>
          );
        })}

        {/* Hover dots */}
        {data.map((d, i) => (
          <circle key={i} cx={px(i)} cy={py(d.value)} r="14" fill="transparent"
            onMouseEnter={e => setTooltip({ x: px(i), y: py(d.value), d })}
          />
        ))}

        {/* Tooltip dot */}
        {tooltip && (
          <circle cx={tooltip.x} cy={tooltip.y} r="4" fill={color} stroke="#161B22" strokeWidth="2" />
        )}
      </svg>

      {tooltip && (
        <div className="an-tooltip" style={{
          left: `${(tooltip.x / 600) * 100}%`,
          top: tooltip.y - 10,
          transform: "translate(-50%, -100%)",
        }}>
          <div style={{ color: "var(--muted)", fontSize: 10 }}>{tooltip.d.label}</div>
          <div style={{ color, fontWeight: 700, fontSize: 14 }}>{tooltip.d.value} {label}</div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Donut Chart ─────────────── */
function DonutChart({ segments, size = 140 }) {
  const [hovered, setHovered] = useState(null);
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const cx = size / 2, cy = size / 2, r = size * 0.38, inner = size * 0.25;

  let angle = -Math.PI / 2;
  const arcs = segments.map(seg => {
    const frac = seg.value / total;
    const a1 = angle, a2 = angle + frac * 2 * Math.PI;
    angle = a2;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const large = frac > 0.5 ? 1 : 0;
    const xi1 = cx + inner * Math.cos(a1), yi1 = cy + inner * Math.sin(a1);
    const xi2 = cx + inner * Math.cos(a2), yi2 = cy + inner * Math.sin(a2);
    return { ...seg, frac, d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z` };
  });

  const hov = hovered != null ? arcs[hovered] : null;

  return (
    <div className="an-donut-wrap">
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {arcs.map((arc, i) => (
          <path key={i} d={arc.d} fill={arc.color}
            opacity={hovered === null || hovered === i ? 1 : 0.4}
            style={{ cursor: "pointer", transition: "opacity 0.15s" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#E2E8F0" fontSize="14" fontWeight="900" fontFamily="monospace">
          {hov ? Math.round(hov.frac * 100) + "%" : fmtNum(total)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#64748B" fontSize="9">
          {hov ? hov.label : "total"}
        </text>
      </svg>
      <div className="an-donut-legend">
        {arcs.map((arc, i) => (
          <div key={i} className="an-donut-item"
            style={{ opacity: hovered === null || hovered === i ? 1 : 0.4, cursor: "pointer" }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <div className="an-donut-dot" style={{ background: arc.color }} />
            <span style={{ color: "var(--text)", fontWeight: 600 }}>{arc.label}</span>
            <span style={{ color: "var(--muted)", marginLeft: "auto", fontFamily: "monospace", fontSize: 11 }}>
              {arc.value} ({Math.round(arc.frac * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Bar Chart ─────────────── */
function BarChart({ data, color = "#8B5CF6", height = 140 }) {
  const [hovered, setHovered] = useState(null);
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ position: "relative" }}>
      <div className="an-bar-group" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="an-bar-item"
            style={{ height: `${(d.value / max) * 100}%`, background: hovered === i ? color : `${color}99` }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            title={`${d.label}: ${d.value}`}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0).map((d, i) => (
          <span key={i} style={{ fontSize: 9, color: "var(--muted)", fontFamily: "monospace" }}>{d.label}</span>
        ))}
      </div>
      {hovered != null && (
        <div className="an-tooltip" style={{ bottom: "100%", left: `${(hovered / data.length) * 100}%`, transform: "translateX(-50%)" }}>
          <div style={{ color: "var(--muted)", fontSize: 10 }}>{data[hovered]?.label}</div>
          <div style={{ color, fontWeight: 700 }}>{data[hovered]?.value}</div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Main Component ─────────────── */
export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [range,   setRange]   = useState("30");
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

 const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const [statsRes, actRes, subRes, usersRes, probsRes] = await Promise.allSettled([
      API.get("/admin/stats"),
      API.get(`/admin/activity?days=${range}`),
      API.get("/admin/submissions"),
      API.get("/admin/users"),
      API.get("/admin/problems"),
    ]);

    // ✅ Safe array normalizer
    const toArr = (val, ...keys) => {
      if (Array.isArray(val)) return val;
      for (const k of keys) if (val && Array.isArray(val[k])) return val[k];
      return [];
    };

    const rawStats = statsRes.status === "fulfilled" ? statsRes.value.data : {};
    const stats    = (rawStats && typeof rawStats === "object" && !Array.isArray(rawStats)) ? rawStats : {};

    const activity    = toArr(actRes.status   === "fulfilled" ? actRes.value.data   : [], "activity",    "data");
    const submissions = toArr(subRes.status   === "fulfilled" ? subRes.value.data   : [], "submissions", "data");
    const users       = toArr(usersRes.status === "fulfilled" ? usersRes.value.data : [], "users",       "data");
    const problems    = toArr(probsRes.status === "fulfilled" ? probsRes.value.data : [], "problems",    "data");

    const subTrend   = buildDailyTrend(submissions, Number(range));
    const userGrowth = buildDailyTrend(users.map(u => ({ createdAt: u.createdAt })), Number(range));

    const langMap = {};
    for (const s of submissions) {
      const l = s.language || "Unknown";
      langMap[l] = (langMap[l] || 0) + 1;
    }
    const langColors = { "C++":"#00B4D8","Python":"#F59E0B","Java":"#22C55E","JavaScript":"#8B5CF6","C":"#EF4444","Unknown":"#64748B" };
    const langData = Object.entries(langMap).sort((a,b)=>b[1]-a[1]).slice(0,6)
      .map(([label,value])=>({ label, value, color: langColors[label]||"#64748B" }));

    const verdictMap = {};
    for (const s of submissions) {
      const v = s.verdict || s.status || "Unknown";
      verdictMap[v] = (verdictMap[v] || 0) + 1;
    }
    const verdictColors = { "Accepted":"#22C55E","Wrong Answer":"#EF4444","Time Limit Exceeded":"#F59E0B","Runtime Error":"#8B5CF6","Compilation Error":"#00B4D8" };
    const verdictData = Object.entries(verdictMap).sort((a,b)=>b[1]-a[1]).slice(0,5)
      .map(([label,value])=>({ label, value, color: verdictColors[label]||"#64748B" }));

    const probSubs = {};
    for (const s of submissions) {
      const id = s.problemId?._id || s.problemId || s.problem;
      if (id) probSubs[id] = (probSubs[id] || 0) + 1;
    }
    const topProblems = problems
      .map(p => ({ ...p, subCount: probSubs[p._id] || p.totalSubmissions || 0 }))
      .sort((a,b) => b.subCount - a.subCount).slice(0,8);

    const diffData = [
      { label:"Easy",   value: problems.filter(p=>p.difficulty==="Easy").length,   color:"#22C55E" },
      { label:"Medium", value: problems.filter(p=>p.difficulty==="Medium").length, color:"#F59E0B" },
      { label:"Hard",   value: problems.filter(p=>p.difficulty==="Hard").length,   color:"#EF4444" },
    ];

    const hourMap = new Array(24).fill(0);
    for (const s of submissions) {
      if (s.createdAt) hourMap[new Date(s.createdAt).getHours()]++;
    }
    const hourMax = Math.max(...hourMap, 1);

    const acceptTrend = buildAcceptTrend(submissions, Number(range));

    const now       = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(Date.now() - 7 * 864e5);
    const newToday   = users.filter(u => new Date(u.createdAt) >= todayStart).length;
    const newWeek    = users.filter(u => new Date(u.createdAt) >= weekStart).length;

    setData({
      stats, subTrend, userGrowth, langData, verdictData,
      topProblems, diffData, hourMap, hourMax, acceptTrend,
      totalUsers:    users.length,
      totalProblems: problems.length,
      totalSubs:     submissions.length,
      accepted:      submissions.filter(s => (s.verdict || s.status) === "Accepted").length,
      newToday, newWeek,
      activity,
    });
  } catch (e) {
    console.error(e);
  } finally {
    setLoading(false);
  }
}, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── KPI count-ups ── */
  const cu_users  = useCountUp(data?.totalUsers    || 0);
  const cu_subs   = useCountUp(data?.totalSubs     || 0);
  const cu_probs  = useCountUp(data?.totalProblems || 0);
  const cu_accept = useCountUp(data?.accepted      || 0);

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="an-page">
        <div className="an-inner">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
            {[0,1,2,3].map(i => <div key={i} className="an-shimmer" style={{ height: 120 }} />)}
          </div>
          {[180, 180, 300].map((h, i) => <div key={i} className="an-shimmer" style={{ height: h, marginBottom: 20 }} />)}
        </div>
      </div>
    </>
  );

  const { subTrend, userGrowth, langData, verdictData, topProblems, diffData, hourMap, hourMax, acceptTrend } = data || {};
  const maxProbSubs = Math.max(...(topProblems || []).map(p => p.subCount), 1);

  return (
    <>
      <style>{CSS}</style>
      <div className="an-page">
        <div className="an-inner">

          {/* Header */}
          <div className="an-hdr">
            <div>
              <div className="an-badge"><div className="an-badge-dot" /> Analytics</div>
              <div className="an-title">Platform <span>Analytics.</span></div>
              <div className="an-sub">Deep insights into users, problems, submissions and activity.</div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {/* Range selector */}
              <div className="an-range">
                {[["7","7D"],["30","30D"],["90","90D"],["365","1Y"]].map(([v, l]) => (
                  <button key={v} className={`an-range-btn ${range === v ? "on" : ""}`} onClick={() => setRange(v)}>{l}</button>
                ))}
              </div>
              <button className="an-btn" onClick={fetchData}
                style={{ background: "transparent", color: "var(--cyan)", borderColor: "rgba(0,180,216,0.3)" }}>
                ↻ Refresh
              </button>
              <button className="an-btn" onClick={() => navigate("/admin")}
                style={{ background: "transparent", color: "var(--muted)", borderColor: "var(--border)" }}>
                ← Dashboard
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="an-kpis">
            {[
  { icon:"👥", label:"Total Users",       val:cu_users,  color:"#22C55E", delta:`+${data?.newToday ?? 0} today`,   dt:"up" },
  { icon:"📬", label:"Total Submissions", val:cu_subs,   color:"#8B5CF6", delta:`${data?.totalSubs ?? 0} total`,   dt:"up" },
  { icon:"💻", label:"Total Problems",    val:cu_probs,  color:"#00B4D8", delta:null,                               dt:null },
  { icon:"✅", label:"Accepted",          val:cu_accept, color:"#22C55E",
    delta: data?.totalSubs ? `${Math.round(((data?.accepted ?? 0)/data.totalSubs)*100)}% rate` : null, dt:"up" },
  { icon:"📅", label:"New This Week",     val:data?.newWeek  ?? 0, color:"#F59E0B", delta:`+${data?.newToday ?? 0} today`, dt:"up" },
  { icon:"🔥", label:"Active Problems",   val:data?.stats?.activeContests ?? 0, color:"#EF4444", delta:"live contests", dt:"up" },
].map(({ icon, label, val, color, delta, dt }, i) => (
  <div key={label} className="an-kpi an-fade" style={{ "--kpi-color": color, animationDelay:`${i*0.06}s` }}>
    <div className="an-kpi-icon">{icon}</div>
    <div className="an-kpi-val">{typeof val === "number" ? val.toLocaleString() : val}</div>
    <div className="an-kpi-lbl">{label}</div>
    {delta && <div className={`an-kpi-delta ${dt}`}>{dt === "up" ? "↑" : "~"} {delta}</div>}
  </div>
))}
          </div>

          {/* Row 1: Submission Trend + User Growth */}
          <div className="an-sec">📈 Trends</div>
          <div className="an-grid-2 an-fade" style={{ animationDelay: "0.15s" }}>
            <div className="an-card">
              <div className="an-card-hdr">
                <div className="an-card-title">Submission Activity</div>
                <div className="an-card-meta">Last {range} days</div>
              </div>
              <div className="an-card-body">
                <LineChart data={subTrend} color="#8B5CF6" label="submissions" height={150} />
              </div>
            </div>
            <div className="an-card">
              <div className="an-card-hdr">
                <div className="an-card-title">User Growth</div>
                <div className="an-card-meta">New registrations</div>
              </div>
              <div className="an-card-body">
                <LineChart data={userGrowth} color="#22C55E" label="new users" height={150} />
              </div>
            </div>
          </div>

          {/* Row 2: Acceptance Rate Trend */}
          <div className="an-grid-full an-card an-fade" style={{ animationDelay: "0.2s" }}>
            <div className="an-card-hdr">
              <div className="an-card-title">Acceptance Rate Over Time</div>
              <div className="an-card-meta">% of accepted submissions per day</div>
            </div>
            <div className="an-card-body">
              <LineChart data={acceptTrend} color="#00B4D8" label="% accepted" height={130} filled={false} />
            </div>
          </div>

          {/* Row 3: Language + Verdict */}
          <div className="an-sec">📊 Distributions</div>
          <div className="an-grid-2 an-fade" style={{ animationDelay: "0.25s" }}>
            <div className="an-card">
              <div className="an-card-hdr">
                <div className="an-card-title">Language Distribution</div>
                <div className="an-card-meta">{data.totalSubs} total submissions</div>
              </div>
              <div className="an-card-body">
                <DonutChart segments={langData || []} size={150} />
              </div>
            </div>
            <div className="an-card">
              <div className="an-card-hdr">
                <div className="an-card-title">Verdict Breakdown</div>
                <div className="an-card-meta">All time</div>
              </div>
              <div className="an-card-body">
                <DonutChart segments={verdictData || []} size={150} />
              </div>
            </div>
          </div>

          {/* Row 4: Top Problems + Difficulty */}
          <div className="an-sec">🏆 Problems</div>
          <div className="an-grid-3 an-fade" style={{ animationDelay: "0.3s" }}>
            <div className="an-card">
              <div className="an-card-hdr">
                <div className="an-card-title">Most Attempted Problems</div>
                <div className="an-card-meta">By submission count</div>
              </div>
              <div className="an-card-body">
                {(topProblems || []).map((p, i) => {
                  const rankColors = ["#F59E0B","#94A3B8","#CD7F32"];
                  const diffC = p.difficulty === "Easy" ? "#22C55E" : p.difficulty === "Medium" ? "#F59E0B" : "#EF4444";
                  return (
                    <div key={p._id} className="an-prob-row">
                      <div className="an-prob-rank" style={{ background: i < 3 ? `${rankColors[i]}20` : "#21262D", color: i < 3 ? rankColors[i] : "var(--muted)" }}>
                        {i < 3 ? ["🥇","🥈","🥉"][i] : i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                        <div style={{ fontSize: 10, color: diffC, fontWeight: 600, marginTop: 2 }}>{p.difficulty}</div>
                      </div>
                      <div className="an-prob-bar">
                        <div className="an-prob-fill" style={{ width: `${(p.subCount / maxProbSubs) * 100}%`, background: diffC }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--muted)", width: 32, textAlign: "right" }}>{fmtNum(p.subCount)}</span>
                    </div>
                  );
                })}
                {!topProblems?.length && <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 20 }}>No data</div>}
              </div>
            </div>
            <div className="an-card">
              <div className="an-card-hdr">
                <div className="an-card-title">Difficulty Split</div>
                <div className="an-card-meta">{data.totalProblems} problems</div>
              </div>
              <div className="an-card-body">
                <DonutChart segments={diffData || []} size={130} />
                <div style={{ marginTop: 16 }}>
                  <BarChart data={diffData?.map(d => ({ label: d.label, value: d.value })) || []} color="#00B4D8" height={80} />
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: Hourly heatmap */}
          <div className="an-sec">⏰ Activity by Hour</div>
          <div className="an-card an-fade" style={{ animationDelay: "0.35s" }}>
            <div className="an-card-hdr">
              <div className="an-card-title">Peak Usage Hours</div>
              <div className="an-card-meta">Submissions by hour of day (all time)</div>
            </div>
            <div className="an-card-body">
              <div className="an-hours-grid">
                {(hourMap || []).map((count, h) => {
                  const pct = count / (hourMax || 1);
                  const bg = pct === 0 ? "#161B22" : pct < 0.25 ? "#0E4429" : pct < 0.5 ? "#006D32" : pct < 0.75 ? "#26A641" : "#39D353";
                  return (
                    <div key={h} className="an-hour-cell" style={{ background: bg }}
                      title={`${h}:00 — ${count} submissions`} />
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                {[0,3,6,9,12,15,18,21].map(h => (
                  <span key={h} style={{ fontSize: 10, color: "var(--muted)", fontFamily: "monospace" }}>{h}:00</span>
                ))}
              </div>
              {/* Legend */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>Less</span>
                {["#161B22","#0E4429","#006D32","#26A641","#39D353"].map(c => (
                  <div key={c} style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
                ))}
                <span style={{ fontSize: 10, color: "var(--muted)" }}>More</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

/* ─────────────── Data builders ─────────────── */
function buildDailyTrend(items, days) {
  const map = {};
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 864e5);
    map[d.toISOString().slice(0, 10)] = 0;
  }
  for (const item of items) {
    const k = item.createdAt?.slice(0, 10);
    if (k && map[k] !== undefined) map[k]++;
  }
  return Object.entries(map).map(([date, value]) => ({
    label: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    value,
  }));
}

function buildAcceptTrend(submissions, days) {
  const total = {}, accepted = {};
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const k = new Date(now - i * 864e5).toISOString().slice(0, 10);
    total[k] = 0; accepted[k] = 0;
  }
  for (const s of submissions) {
    const k = s.createdAt?.slice(0, 10);
    if (k && total[k] !== undefined) {
      total[k]++;
      if ((s.verdict || s.status) === "Accepted") accepted[k]++;
    }
  }
  return Object.entries(total).map(([date, t]) => ({
    label: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    value: t > 0 ? Math.round((accepted[date] / t) * 100) : 0,
  }));
}