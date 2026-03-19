import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────── CSS ─────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg:#0D1117; --surf:#161B22; --s2:#1C2333; --bord:#30363D;
  --txt:#E6EDF3; --mut:#7D8590; --hint:#484F58;
  --green:#22C55E; --green-d:#052E16; --green-l:#86EFAC;
  --teal:#0D9488;  --teal-d:#042F2E;  --teal-l:#99F6E4;
  --purp:#7C3AED;  --purp-d:#2E1065;  --purp-l:#C4B5FD;
  --amber:#D97706; --amber-d:#451A03; --amber-l:#FCD34D;
  --coral:#DC2626; --coral-d:#450A0A; --coral-l:#FCA5A5;
  --pink:#DB2777;  --pink-d:#500724;  --pink-l:#F9A8D4;
  --font:'Outfit',sans-serif; --mono:'JetBrains Mono',monospace;
}
* { scrollbar-width:thin; scrollbar-color:#30363D transparent; }
::-webkit-scrollbar { width:5px; }
::-webkit-scrollbar-thumb { background:#30363D; border-radius:4px; }

/* ── page shell ── */
.rp-page { min-height:100vh; background:var(--bg); color:var(--txt); font-family:var(--font); }
.rp-page::before {
  content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
  background-image:linear-gradient(rgba(34,197,94,.015) 1px,transparent 1px),
    linear-gradient(90deg,rgba(34,197,94,.015) 1px,transparent 1px);
  background-size:40px 40px;
}

/* ── layout ── */
.rp-layout { display:grid; grid-template-columns:240px 1fr 320px; height:calc(100vh - 0px); position:relative; z-index:1; }

/* ── sidebar ── */
.rp-sidebar {
  background:var(--surf); border-right:1px solid var(--bord);
  display:flex; flex-direction:column; overflow:hidden;
}
.rp-sidebar-top { padding:20px 16px 12px; border-bottom:1px solid var(--bord); }
.rp-sidebar-brand { font-size:11px; font-weight:700; text-transform:uppercase;
  letter-spacing:1.5px; color:var(--mut); margin-bottom:10px; }
.rp-sidebar-score { background:var(--s2); border-radius:10px; padding:14px;
  border:1px solid var(--bord); }
.rp-score-label { font-size:11px; color:var(--mut); margin-bottom:8px;
  display:flex; justify-content:space-between; align-items:center; }
.rp-score-val { font-size:28px; font-weight:900; color:var(--green);
  font-family:var(--mono); letter-spacing:-1px; }
.rp-progress { height:6px; background:var(--bord); border-radius:3px;
  overflow:hidden; margin-top:8px; }
.rp-progress-fill { height:100%; border-radius:3px; transition:width .6s ease;
  background:linear-gradient(90deg,var(--teal),var(--green)); }

.rp-nav { flex:1; overflow-y:auto; padding:12px 8px; }
.rp-nav-section { font-size:10px; font-weight:700; text-transform:uppercase;
  letter-spacing:1.2px; color:var(--hint); padding:10px 8px 6px; }
.rp-nav-item {
  display:flex; align-items:center; gap:10px; width:100%; padding:9px 10px;
  border-radius:8px; cursor:pointer; font-size:13px; color:var(--mut);
  background:none; border:none; font-family:var(--font); transition:all .15s;
  margin-bottom:2px; text-align:left;
}
.rp-nav-item:hover { background:var(--s2); color:var(--txt); }
.rp-nav-item.on { background:var(--green-d); color:var(--green-l);
  border:1px solid rgba(34,197,94,.25); }
.rp-nav-dot { width:7px; height:7px; border-radius:50%; background:var(--hint); flex-shrink:0; }
.rp-nav-item.on .rp-nav-dot { background:var(--green); }
.rp-nav-item:hover .rp-nav-dot { background:var(--mut); }
.rp-nav-check { font-size:13px; margin-left:auto; }
.rp-nav-item.done .rp-nav-dot { background:var(--teal); }

/* ── main editor ── */
.rp-main { overflow-y:auto; padding:28px 32px; }
.rp-section-hdr { margin-bottom:22px; }
.rp-section-badge {
  display:inline-flex; align-items:center; gap:6px; padding:4px 12px;
  background:rgba(34,197,94,.1); color:var(--green-l); border:1px solid rgba(34,197,94,.25);
  border-radius:20px; font-size:11px; font-weight:700; letter-spacing:.5px;
  text-transform:uppercase; margin-bottom:10px;
}
.rp-section-title { font-size:22px; font-weight:900; color:#fff; letter-spacing:-.5px; }
.rp-section-sub { font-size:13px; color:var(--mut); margin-top:4px; }

.rp-card { background:var(--surf); border:1px solid var(--bord); border-radius:14px;
  padding:20px; margin-bottom:16px; }
.rp-card-title { font-size:13px; font-weight:700; color:var(--txt);
  margin-bottom:16px; display:flex; align-items:center; gap:8px; }
.rp-card-accent { display:inline-block; width:3px; height:16px; border-radius:2px;
  background:var(--green); flex-shrink:0; }

/* form */
.rp-field { margin-bottom:14px; }
.rp-label { font-size:11px; font-weight:700; text-transform:uppercase;
  letter-spacing:.8px; color:var(--mut); margin-bottom:6px; display:block; }
.rp-input {
  width:100%; background:var(--s2); border:1px solid var(--bord); border-radius:8px;
  padding:10px 14px; color:var(--txt); font-family:var(--font); font-size:13px;
  outline:none; transition:border-color .15s;
}
.rp-input:focus { border-color:var(--green); box-shadow:0 0 0 3px rgba(34,197,94,.1); }
.rp-input::placeholder { color:var(--hint); }
.rp-textarea { min-height:80px; resize:vertical; }
.rp-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.rp-row3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }

/* skills */
.rp-tags { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
.rp-tag {
  display:inline-flex; align-items:center; gap:5px; padding:4px 10px;
  border-radius:20px; font-size:12px; font-weight:600;
  background:var(--teal-d); color:var(--teal-l); border:1px solid rgba(13,148,136,.3);
}
.rp-tag-x { cursor:pointer; opacity:.6; font-size:14px; }
.rp-tag-x:hover { opacity:1; color:var(--coral-l); }
.rp-tag-input-row { display:flex; gap:8px; margin-top:8px; }

/* entry cards */
.rp-entry { background:var(--s2); border:1px solid var(--bord); border-radius:10px;
  padding:14px; margin-bottom:10px; position:relative; }
.rp-entry-head { display:flex; justify-content:space-between; align-items:flex-start;
  margin-bottom:10px; }
.rp-entry-title { font-size:14px; font-weight:700; color:var(--txt); }
.rp-entry-sub { font-size:12px; color:var(--mut); margin-top:2px; }
.rp-entry-del { background:none; border:none; cursor:pointer; color:var(--hint);
  font-size:16px; padding:2px 6px; border-radius:4px; font-family:var(--font); }
.rp-entry-del:hover { color:var(--coral-l); background:var(--coral-d); }

/* buttons */
.rp-btn { display:inline-flex; align-items:center; gap:7px; padding:9px 18px;
  border-radius:9px; font-family:var(--font); font-size:13px; font-weight:700;
  cursor:pointer; transition:all .18s; border:1px solid; }
.rp-btn:hover { transform:translateY(-1px); }
.rp-btn-primary { background:var(--green); color:#052e16; border-color:var(--green); }
.rp-btn-primary:hover { box-shadow:0 6px 20px rgba(34,197,94,.3); }
.rp-btn-ghost { background:transparent; color:var(--mut); border-color:var(--bord); }
.rp-btn-ghost:hover { color:var(--txt); border-color:var(--mut); }
.rp-btn-teal { background:var(--teal-d); color:var(--teal-l); border-color:var(--teal); }
.rp-btn-purp { background:var(--purp-d); color:var(--purp-l); border-color:var(--purp); }
.rp-btn-amber { background:var(--amber-d); color:var(--amber-l); border-color:var(--amber); }
.rp-btn-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:4px; }
.rp-btn-add { width:100%; margin-top:8px; justify-content:center;
  background:transparent; color:var(--mut); border-color:var(--bord);
  border-style:dashed; }
.rp-btn-add:hover { color:var(--green); border-color:var(--green);
  background:rgba(34,197,94,.05); }

/* ── ANALYZER PANEL ── */
.rp-panel {
  background:var(--surf); border-left:1px solid var(--bord);
  overflow-y:auto; padding:20px 18px;
}
.rp-panel-title { font-size:14px; font-weight:800; color:#fff; margin-bottom:16px;
  display:flex; align-items:center; justify-content:space-between; }
.rp-panel-badge { font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px;
  background:var(--purp-d); color:var(--purp-l); border:1px solid rgba(124,58,237,.3); }

/* score ring */
.rp-ring-wrap { text-align:center; margin-bottom:20px; }
.rp-ring-svg { display:block; margin:0 auto; }
.rp-ring-num { font-size:28px; font-weight:900; font-family:var(--mono);
  letter-spacing:-1px; }
.rp-ring-label { font-size:11px; color:var(--mut); margin-top:4px; }

/* criteria */
.rp-criterion { margin-bottom:12px; }
.rp-crit-row { display:flex; justify-content:space-between; align-items:center;
  margin-bottom:5px; }
.rp-crit-name { font-size:12px; font-weight:600; color:var(--txt); }
.rp-crit-score { font-size:12px; font-weight:700; font-family:var(--mono); }
.rp-crit-bar { height:5px; background:var(--bord); border-radius:3px; overflow:hidden; }
.rp-crit-fill { height:100%; border-radius:3px; transition:width .7s ease; }

/* suggestions */
.rp-suggestion {
  display:flex; gap:10px; padding:10px 12px; border-radius:8px;
  background:var(--s2); border-left:3px solid; margin-bottom:8px; font-size:12px;
}
.rp-sug-icon { font-size:14px; flex-shrink:0; margin-top:1px; }
.rp-sug-text { color:var(--mut); line-height:1.5; }
.rp-sug-text strong { font-weight:700; display:block; margin-bottom:2px; }

/* keywords */
.rp-kw-grid { display:flex; flex-wrap:wrap; gap:5px; margin-top:8px; }
.rp-kw { font-size:11px; font-weight:600; padding:3px 8px; border-radius:4px;
  font-family:var(--mono); }
.rp-kw-found { background:rgba(34,197,94,.12); color:var(--green-l);
  border:1px solid rgba(34,197,94,.2); }
.rp-kw-missing { background:rgba(220,38,38,.1); color:var(--coral-l);
  border:1px solid rgba(220,38,38,.2); }

/* divider */
.rp-divider { height:1px; background:var(--bord); margin:16px 0; }

/* toast */
.rp-toast-wrap { position:fixed; bottom:24px; right:24px; z-index:9999;
  display:flex; flex-direction:column; gap:8px; pointer-events:none; }
.rp-toast { display:flex; align-items:center; gap:10px; padding:12px 18px;
  border-radius:10px; font-size:13px; font-weight:600; box-shadow:0 4px 20px rgba(0,0,0,.5); }
.rp-toast.success { background:#052e16; color:var(--green); border:1px solid #166534; }
.rp-toast.info    { background:#0a1628; color:#60a5fa; border:1px solid #1d4ed8; }

@keyframes fadeUp { to { opacity:1; transform:translateY(0); } }
.rp-fade { opacity:0; transform:translateY(12px); animation:fadeUp .45s ease forwards; }

/* Preview */
.rp-preview-wrap { background:#fff; color:#111; border-radius:10px; padding:32px 36px;
  font-family:'Outfit',sans-serif; font-size:12px; line-height:1.6; max-width:680px;
  margin:0 auto; }
.rp-preview-name { font-size:22px; font-weight:900; color:#111; margin-bottom:2px; }
.rp-preview-contact { font-size:11px; color:#555; margin-bottom:14px;
  display:flex; flex-wrap:wrap; gap:8px; }
.rp-preview-contact span { display:flex; align-items:center; gap:4px; }
.rp-preview-section { margin-bottom:14px; }
.rp-preview-section-title { font-size:12px; font-weight:800; text-transform:uppercase;
  letter-spacing:1px; color:#333; border-bottom:1.5px solid #111;
  padding-bottom:3px; margin-bottom:8px; }
.rp-preview-entry { margin-bottom:8px; }
.rp-preview-entry-head { display:flex; justify-content:space-between; }
.rp-preview-entry-title { font-weight:700; font-size:12px; color:#111; }
.rp-preview-entry-date { font-size:11px; color:#666; }
.rp-preview-entry-sub { font-size:11px; color:#444; font-style:italic; margin-bottom:3px; }
.rp-preview-bullet { font-size:11px; color:#333; padding-left:12px; position:relative; }
.rp-preview-bullet::before { content:'•'; position:absolute; left:0; }
.rp-preview-skills { display:flex; flex-wrap:wrap; gap:6px; margin-top:4px; }
.rp-preview-skill-tag { font-size:10px; padding:2px 8px; border-radius:3px;
  background:#f0f0f0; color:#333; font-weight:600; }
`;

/* ─── helpers ─── */
const uid = () => Math.random().toString(36).slice(2, 8);

const SECTIONS = [
  { id: "basics",      label: "Personal info",   dot: true  },
  { id: "summary",     label: "Summary",          dot: false },
  { id: "education",   label: "Education",        dot: false },
  { id: "experience",  label: "Experience",       dot: false },
  { id: "projects",    label: "Projects",         dot: false },
  { id: "skills",      label: "Skills",           dot: false },
  { id: "achievements",label: "Achievements",     dot: false },
  { id: "preview",     label: "Preview & Export", dot: false },
];

const TECH_KEYWORDS = [
  "React","Node.js","Python","JavaScript","TypeScript","MongoDB","SQL","REST API",
  "Git","Docker","AWS","Machine Learning","Data Structures","Algorithms","C++","Java",
  "Express","Flask","TailwindCSS","Redux","GraphQL","Linux","Agile","CI/CD","Firebase",
];

function computeScore(data) {
  let score = 0;
  const criteria = {};

  // Contact completeness (20pts)
  let contact = 0;
  if (data.basics.name?.trim())     contact += 5;
  if (data.basics.email?.trim())    contact += 5;
  if (data.basics.phone?.trim())    contact += 4;
  if (data.basics.linkedin?.trim()) contact += 3;
  if (data.basics.github?.trim())   contact += 3;
  criteria.contact = contact;
  score += contact;

  // Summary (10pts)
  const sumLen = data.summary?.trim().length || 0;
  const sumScore = sumLen > 150 ? 10 : sumLen > 80 ? 7 : sumLen > 20 ? 4 : 0;
  criteria.summary = sumScore; score += sumScore;

  // Education (15pts)
  const eduScore = data.education.length > 0 ? Math.min(15, data.education.length * 10) : 0;
  criteria.education = eduScore; score += eduScore;

  // Experience (20pts)
  let expScore = 0;
  data.experience.forEach(e => {
    expScore += 6;
    if (e.bullets?.some(b => b.trim())) expScore += 4;
  });
  expScore = Math.min(20, expScore);
  criteria.experience = expScore; score += expScore;

  // Projects (15pts)
  const projScore = Math.min(15, data.projects.length * 5);
  criteria.projects = projScore; score += projScore;

  // Skills (10pts)
  const skillScore = Math.min(10, data.skills.length * 2);
  criteria.skills = skillScore; score += skillScore;

  // Achievements (10pts)
  const achScore = Math.min(10, data.achievements.length * 5);
  criteria.achievements = achScore; score += achScore;

  return { total: Math.min(100, score), criteria };
}

function getSuggestions(data, score) {
  const suggestions = [];
  if (!data.basics.linkedin?.trim())
    suggestions.push({ type:"warn", title:"Add LinkedIn URL", body:"Recruiters check LinkedIn for 95% of candidates." });
  if (!data.basics.github?.trim())
    suggestions.push({ type:"warn", title:"Add GitHub profile", body:"Essential for CS students — shows real work." });
  if ((data.summary?.trim().length || 0) < 80)
    suggestions.push({ type:"warn", title:"Expand your summary", body:"Write 2–3 sentences. Target the role you want." });
  if (data.experience.length === 0)
    suggestions.push({ type:"info", title:"Add internships or part-time work", body:"Even small roles matter. Add freelance or college projects as experience." });
  if (data.experience.some(e => !e.bullets?.some(b => b.trim())))
    suggestions.push({ type:"warn", title:"Add bullet points to experience", body:"Use action verbs: Built, Improved, Reduced, Designed, Led." });
  if (data.projects.length < 2)
    suggestions.push({ type:"info", title:"Add more projects", body:"Aim for 3 strong projects with GitHub links and tech stack." });
  if (data.skills.length < 6)
    suggestions.push({ type:"info", title:"List more skills", body:"Include languages, frameworks, tools, databases." });
  if (data.achievements.length === 0)
    suggestions.push({ type:"info", title:"Add achievements", body:"Hackathon wins, scholarships, coding ranks, certifications." });
  if (score.total >= 80)
    suggestions.push({ type:"ok", title:"Strong resume!", body:"Score above 80. Keep content concise and ATS-friendly." });
  return suggestions.slice(0, 5);
}

/* ─── sub-components ─── */
function ScoreRing({ score }) {
  const r = 44; const circ = 2 * Math.PI * r;
  const dash = circ - (score / 100) * circ;
  const col = score >= 75 ? "#22C55E" : score >= 50 ? "#D97706" : "#DC2626";
  return (
    <div className="rp-ring-wrap">
      <svg className="rp-ring-svg" width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#30363D" strokeWidth="8"/>
        <circle cx="55" cy="55" r={r} fill="none" stroke={col} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={dash}
          strokeLinecap="round" transform="rotate(-90 55 55)"
          style={{transition:"stroke-dashoffset .8s ease"}}/>
        <text x="55" y="50" textAnchor="middle" dominantBaseline="central"
          fontSize="22" fontWeight="900" fill={col} fontFamily="JetBrains Mono,monospace">{score}</text>
        <text x="55" y="68" textAnchor="middle" fontSize="9" fill="#7D8590">/ 100</text>
      </svg>
      <div className="rp-ring-label">Resume strength score</div>
    </div>
  );
}

function CriterionBar({ name, value, max, color }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="rp-criterion">
      <div className="rp-crit-row">
        <span className="rp-crit-name">{name}</span>
        <span className="rp-crit-score" style={{color}}>{value}/{max}</span>
      </div>
      <div className="rp-crit-bar">
        <div className="rp-crit-fill" style={{width:`${pct}%`, background:color}}/>
      </div>
    </div>
  );
}

function Suggestion({ type, title, body }) {
  const map = { ok:["#22C55E","✓"], warn:["#D97706","!"], info:["#60a5fa","→"] };
  const [col, icon] = map[type] || map.info;
  return (
    <div className="rp-suggestion" style={{borderLeftColor:col}}>
      <span className="rp-sug-icon" style={{color:col}}>{icon}</span>
      <div className="rp-sug-text"><strong>{title}</strong>{body}</div>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function ResumePage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("basics");
  const [toasts, setToasts] = useState([]);
  const [skillInput, setSkillInput] = useState("");

  const [data, setData] = useState({
    basics: { name:"", email:"", phone:"", location:"", linkedin:"", github:"", portfolio:"" },
    summary: "",
    education: [],
    experience: [],
    projects: [],
    skills: [],
    achievements: [],
  });

  const showToast = (msg, type="success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

  const setBasics = (k, v) => setData(d => ({ ...d, basics: { ...d.basics, [k]: v } }));
  const setSummary = v => setData(d => ({ ...d, summary: v }));

  /* education */
  const addEdu = () => setData(d => ({ ...d, education: [...d.education,
    { id: uid(), school:"", degree:"", field:"", start:"", end:"", gpa:"", location:"" }] }));
  const setEdu = (id, k, v) => setData(d => ({ ...d,
    education: d.education.map(e => e.id===id ? {...e,[k]:v} : e) }));
  const delEdu = id => setData(d => ({ ...d, education: d.education.filter(e => e.id!==id) }));

  /* experience */
  const addExp = () => setData(d => ({ ...d, experience: [...d.experience,
    { id:uid(), company:"", role:"", start:"", end:"", location:"", bullets:["",""] }] }));
  const setExp = (id, k, v) => setData(d => ({ ...d,
    experience: d.experience.map(e => e.id===id ? {...e,[k]:v} : e) }));
  const setExpBullet = (id, i, v) => setData(d => ({ ...d,
    experience: d.experience.map(e => e.id===id
      ? {...e, bullets: e.bullets.map((b,j)=>j===i?v:b)} : e) }));
  const delExp = id => setData(d => ({ ...d, experience: d.experience.filter(e=>e.id!==id) }));
  const addBullet = id => setData(d => ({ ...d,
    experience: d.experience.map(e => e.id===id ? {...e, bullets:[...e.bullets,""]} : e) }));

  /* projects */
  const addProj = () => setData(d => ({ ...d, projects: [...d.projects,
    { id:uid(), name:"", desc:"", tech:"", link:"", github:"" }] }));
  const setProj = (id, k, v) => setData(d => ({ ...d,
    projects: d.projects.map(p => p.id===id ? {...p,[k]:v} : p) }));
  const delProj = id => setData(d => ({ ...d, projects: d.projects.filter(p=>p.id!==id) }));

  /* skills */
  const addSkill = (s) => {
    const t = s.trim();
    if (t && !data.skills.includes(t))
      setData(d => ({ ...d, skills: [...d.skills, t] }));
    setSkillInput("");
  };
  const delSkill = s => setData(d => ({ ...d, skills: d.skills.filter(x=>x!==s) }));

  /* achievements */
  const addAch = () => setData(d => ({ ...d, achievements: [...d.achievements,
    { id:uid(), title:"", org:"", year:"", desc:"" }] }));
  const setAch = (id, k, v) => setData(d => ({ ...d,
    achievements: d.achievements.map(a => a.id===id ? {...a,[k]:v} : a) }));
  const delAch = id => setData(d => ({ ...d, achievements: d.achievements.filter(a=>a.id!==id) }));

  /* score */
  const { total: score, criteria } = computeScore(data);
  const suggestions = getSuggestions(data, { total: score });
  const foundKw = TECH_KEYWORDS.filter(k =>
    data.skills.includes(k) ||
    data.projects.some(p => p.tech?.includes(k)) ||
    data.summary?.includes(k));
  const missingKw = TECH_KEYWORDS.filter(k => !foundKw.includes(k)).slice(0, 8);

  /* section completion */
  const isDone = {
    basics: data.basics.name && data.basics.email,
    summary: data.summary?.trim().length > 20,
    education: data.education.length > 0,
    experience: data.experience.length > 0,
    projects: data.projects.length > 0,
    skills: data.skills.length > 3,
    achievements: data.achievements.length > 0,
  };

  /* download helper (print) */
  const handleDownload = () => {
    const prev = document.getElementById("rp-preview-content");
    if (!prev) return;
    const win = window.open("","_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>${data.basics.name||"Resume"}</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Outfit',sans-serif;font-size:12px;color:#111;padding:32px 40px}
      .section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;border-bottom:1.5px solid #111;padding-bottom:3px;margin:14px 0 8px}
      .flex-sb{display:flex;justify-content:space-between}.bold{font-weight:700}.muted{color:#555;font-size:11px}.italic{font-style:italic}
      .tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px}.tag{padding:2px 8px;background:#f0f0f0;border-radius:3px;font-size:10px;font-weight:600}
      .bullet{padding-left:12px;position:relative;margin-bottom:2px}.bullet::before{content:'•';position:absolute;left:0}
      @media print{body{padding:20px}}</style></head><body>${prev.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  };

  const sections = {
    basics: (
      <div className="rp-fade">
        <div className="rp-section-hdr">
          <div className="rp-section-badge">Step 1</div>
          <div className="rp-section-title">Personal Information</div>
          <div className="rp-section-sub">Your contact details — what appears at the top of your resume</div>
        </div>
        <div className="rp-card">
          <div className="rp-card-title"><div className="rp-card-accent"/> Basic details</div>
          <div className="rp-row">
            <div className="rp-field">
              <label className="rp-label">Full name *</label>
              <input className="rp-input" placeholder="Priyanshu Sharma" value={data.basics.name} onChange={e=>setBasics("name",e.target.value)}/>
            </div>
            <div className="rp-field">
              <label className="rp-label">Email *</label>
              <input className="rp-input" type="email" placeholder="you@college.edu" value={data.basics.email} onChange={e=>setBasics("email",e.target.value)}/>
            </div>
          </div>
          <div className="rp-row">
            <div className="rp-field">
              <label className="rp-label">Phone</label>
              <input className="rp-input" placeholder="+91 98765 43210" value={data.basics.phone} onChange={e=>setBasics("phone",e.target.value)}/>
            </div>
            <div className="rp-field">
              <label className="rp-label">Location</label>
              <input className="rp-input" placeholder="Bengaluru, India" value={data.basics.location} onChange={e=>setBasics("location",e.target.value)}/>
            </div>
          </div>
        </div>
        <div className="rp-card">
          <div className="rp-card-title"><div className="rp-card-accent"/> Online profiles</div>
          <div className="rp-field">
            <label className="rp-label">LinkedIn URL</label>
            <input className="rp-input" placeholder="linkedin.com/in/yourname" value={data.basics.linkedin} onChange={e=>setBasics("linkedin",e.target.value)}/>
          </div>
          <div className="rp-field">
            <label className="rp-label">GitHub URL</label>
            <input className="rp-input" placeholder="github.com/yourname" value={data.basics.github} onChange={e=>setBasics("github",e.target.value)}/>
          </div>
          <div className="rp-field">
            <label className="rp-label">Portfolio / Website</label>
            <input className="rp-input" placeholder="yoursite.com" value={data.basics.portfolio} onChange={e=>setBasics("portfolio",e.target.value)}/>
          </div>
        </div>
        <div className="rp-btn-row">
          <button className="rp-btn rp-btn-primary" onClick={()=>setActiveSection("summary")}>Next: Summary →</button>
        </div>
      </div>
    ),

    summary: (
      <div className="rp-fade">
        <div className="rp-section-hdr">
          <div className="rp-section-badge">Step 2</div>
          <div className="rp-section-title">Professional Summary</div>
          <div className="rp-section-sub">2–3 sentences about who you are and what you bring</div>
        </div>
        <div className="rp-card">
          <div className="rp-card-title"><div className="rp-card-accent"/> Summary statement</div>
          <div className="rp-field">
            <label className="rp-label">Summary ({data.summary?.length || 0} chars — aim for 120–200)</label>
            <textarea className="rp-input rp-textarea" rows={5}
              placeholder="Final-year B.Tech CS student at XYZ University with strong DSA fundamentals and 2 internships in full-stack development. Passionate about building scalable web applications and competitive programming. Seeking a software engineering role to contribute to impactful products."
              value={data.summary} onChange={e=>setSummary(e.target.value)}/>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
            {["Final-year student at","with experience in","Passionate about","Seeking a role to"].map(t=>(
              <button key={t} className="rp-btn rp-btn-ghost" style={{fontSize:11,padding:"4px 10px"}}
                onClick={()=>setSummary(s => s ? s+" "+t : t)}>{t}…</button>
            ))}
          </div>
        </div>
        <div className="rp-btn-row">
          <button className="rp-btn rp-btn-ghost" onClick={()=>setActiveSection("basics")}>← Back</button>
          <button className="rp-btn rp-btn-primary" onClick={()=>setActiveSection("education")}>Next: Education →</button>
        </div>
      </div>
    ),

    education: (
      <div className="rp-fade">
        <div className="rp-section-hdr">
          <div className="rp-section-badge">Step 3</div>
          <div className="rp-section-title">Education</div>
          <div className="rp-section-sub">Add your degrees — most recent first</div>
        </div>
        {data.education.map((e,i) => (
          <div key={e.id} className="rp-entry">
            <div className="rp-entry-head">
              <div>
                <div className="rp-entry-title">{e.school||`Education ${i+1}`}</div>
                <div className="rp-entry-sub">{e.degree} {e.field}</div>
              </div>
              <button className="rp-entry-del" onClick={()=>delEdu(e.id)}>✕</button>
            </div>
            <div className="rp-row">
              <div className="rp-field"><label className="rp-label">College / University</label>
                <input className="rp-input" placeholder="IIT Bombay" value={e.school} onChange={v=>setEdu(e.id,"school",v.target.value)}/></div>
              <div className="rp-field"><label className="rp-label">Location</label>
                <input className="rp-input" placeholder="Mumbai, India" value={e.location} onChange={v=>setEdu(e.id,"location",v.target.value)}/></div>
            </div>
            <div className="rp-row">
              <div className="rp-field"><label className="rp-label">Degree</label>
                <input className="rp-input" placeholder="B.Tech" value={e.degree} onChange={v=>setEdu(e.id,"degree",v.target.value)}/></div>
              <div className="rp-field"><label className="rp-label">Field of Study</label>
                <input className="rp-input" placeholder="Computer Science" value={e.field} onChange={v=>setEdu(e.id,"field",v.target.value)}/></div>
            </div>
            <div className="rp-row3">
              <div className="rp-field"><label className="rp-label">Start year</label>
                <input className="rp-input" placeholder="2021" value={e.start} onChange={v=>setEdu(e.id,"start",v.target.value)}/></div>
              <div className="rp-field"><label className="rp-label">End year</label>
                <input className="rp-input" placeholder="2025 / Present" value={e.end} onChange={v=>setEdu(e.id,"end",v.target.value)}/></div>
              <div className="rp-field"><label className="rp-label">CGPA / %</label>
                <input className="rp-input" placeholder="8.5 / 10" value={e.gpa} onChange={v=>setEdu(e.id,"gpa",v.target.value)}/></div>
            </div>
          </div>
        ))}
        <button className="rp-btn rp-btn-add" onClick={addEdu}>＋ Add Education</button>
        <div className="rp-btn-row" style={{marginTop:16}}>
          <button className="rp-btn rp-btn-ghost" onClick={()=>setActiveSection("summary")}>← Back</button>
          <button className="rp-btn rp-btn-primary" onClick={()=>setActiveSection("experience")}>Next: Experience →</button>
        </div>
      </div>
    ),

    experience: (
      <div className="rp-fade">
        <div className="rp-section-hdr">
          <div className="rp-section-badge">Step 4</div>
          <div className="rp-section-title">Work Experience</div>
          <div className="rp-section-sub">Internships, part-time jobs, freelance work</div>
        </div>
        {data.experience.map((e,i) => (
          <div key={e.id} className="rp-entry">
            <div className="rp-entry-head">
              <div>
                <div className="rp-entry-title">{e.role||`Experience ${i+1}`}</div>
                <div className="rp-entry-sub">{e.company}</div>
              </div>
              <button className="rp-entry-del" onClick={()=>delExp(e.id)}>✕</button>
            </div>
            <div className="rp-row">
              <div className="rp-field"><label className="rp-label">Company / Org</label>
                <input className="rp-input" placeholder="Google" value={e.company} onChange={v=>setExp(e.id,"company",v.target.value)}/></div>
              <div className="rp-field"><label className="rp-label">Role / Title</label>
                <input className="rp-input" placeholder="SWE Intern" value={e.role} onChange={v=>setExp(e.id,"role",v.target.value)}/></div>
            </div>
            <div className="rp-row3">
              <div className="rp-field"><label className="rp-label">Start</label>
                <input className="rp-input" placeholder="Jun 2024" value={e.start} onChange={v=>setExp(e.id,"start",v.target.value)}/></div>
              <div className="rp-field"><label className="rp-label">End</label>
                <input className="rp-input" placeholder="Aug 2024" value={e.end} onChange={v=>setExp(e.id,"end",v.target.value)}/></div>
              <div className="rp-field"><label className="rp-label">Location</label>
                <input className="rp-input" placeholder="Remote / Bengaluru" value={e.location} onChange={v=>setExp(e.id,"location",v.target.value)}/></div>
            </div>
            <div className="rp-field">
              <label className="rp-label">Bullet points (start with action verbs)</label>
              {e.bullets.map((b,j) => (
                <input key={j} className="rp-input" style={{marginBottom:6}}
                  placeholder={`Built / Reduced / Improved / Designed…`}
                  value={b} onChange={v=>setExpBullet(e.id,j,v.target.value)}/>
              ))}
              <button className="rp-btn rp-btn-ghost" style={{fontSize:11,padding:"4px 12px",marginTop:4}}
                onClick={()=>addBullet(e.id)}>＋ Add bullet</button>
            </div>
          </div>
        ))}
        <button className="rp-btn rp-btn-add" onClick={addExp}>＋ Add Experience</button>
        <div className="rp-btn-row" style={{marginTop:16}}>
          <button className="rp-btn rp-btn-ghost" onClick={()=>setActiveSection("education")}>← Back</button>
          <button className="rp-btn rp-btn-primary" onClick={()=>setActiveSection("projects")}>Next: Projects →</button>
        </div>
      </div>
    ),

    projects: (
      <div className="rp-fade">
        <div className="rp-section-hdr">
          <div className="rp-section-badge">Step 5</div>
          <div className="rp-section-title">Projects</div>
          <div className="rp-section-sub">Personal, college, or open-source projects — your strongest proof of work</div>
        </div>
        {data.projects.map((p,i) => (
          <div key={p.id} className="rp-entry">
            <div className="rp-entry-head">
              <div>
                <div className="rp-entry-title">{p.name||`Project ${i+1}`}</div>
                <div className="rp-entry-sub">{p.tech}</div>
              </div>
              <button className="rp-entry-del" onClick={()=>delProj(p.id)}>✕</button>
            </div>
            <div className="rp-row">
              <div className="rp-field"><label className="rp-label">Project name</label>
                <input className="rp-input" placeholder="CodeTrack" value={p.name} onChange={v=>setProj(p.id,"name",v.target.value)}/></div>
              <div className="rp-field"><label className="rp-label">Tech stack</label>
                <input className="rp-input" placeholder="React, Node.js, MongoDB" value={p.tech} onChange={v=>setProj(p.id,"tech",v.target.value)}/></div>
            </div>
            <div className="rp-field"><label className="rp-label">Description (1–2 lines)</label>
              <textarea className="rp-input rp-textarea" rows={2}
                placeholder="Built a full-stack competitive programming platform with real-time contest system, plagiarism detection, and ELO-based rating system serving 500+ users."
                value={p.desc} onChange={v=>setProj(p.id,"desc",v.target.value)}/></div>
            <div className="rp-row">
              <div className="rp-field"><label className="rp-label">GitHub link</label>
                <input className="rp-input" placeholder="github.com/you/project" value={p.github} onChange={v=>setProj(p.id,"github",v.target.value)}/></div>
              <div className="rp-field"><label className="rp-label">Live link</label>
                <input className="rp-input" placeholder="yourproject.vercel.app" value={p.link} onChange={v=>setProj(p.id,"link",v.target.value)}/></div>
            </div>
          </div>
        ))}
        <button className="rp-btn rp-btn-add" onClick={addProj}>＋ Add Project</button>
        <div className="rp-btn-row" style={{marginTop:16}}>
          <button className="rp-btn rp-btn-ghost" onClick={()=>setActiveSection("experience")}>← Back</button>
          <button className="rp-btn rp-btn-primary" onClick={()=>setActiveSection("skills")}>Next: Skills →</button>
        </div>
      </div>
    ),

    skills: (
      <div className="rp-fade">
        <div className="rp-section-hdr">
          <div className="rp-section-badge">Step 6</div>
          <div className="rp-section-title">Skills</div>
          <div className="rp-section-sub">Languages, frameworks, tools, databases — add everything relevant</div>
        </div>
        <div className="rp-card">
          <div className="rp-card-title"><div className="rp-card-accent"/> Your skills</div>
          <div className="rp-tags">
            {data.skills.map(s => (
              <span key={s} className="rp-tag">{s}<span className="rp-tag-x" onClick={()=>delSkill(s)}>×</span></span>
            ))}
          </div>
          <div className="rp-tag-input-row">
            <input className="rp-input" placeholder="Type a skill and press Enter…"
              value={skillInput} onChange={e=>setSkillInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"||e.key===","){ e.preventDefault(); addSkill(skillInput); }}}
              style={{flex:1}}/>
            <button className="rp-btn rp-btn-teal" onClick={()=>addSkill(skillInput)}>Add</button>
          </div>
        </div>
        <div className="rp-card">
          <div className="rp-card-title"><div className="rp-card-accent" style={{background:"var(--amber)"}}/> Quick add — common CS skills</div>
          <div className="rp-tags">
            {TECH_KEYWORDS.filter(k=>!data.skills.includes(k)).map(k=>(
              <button key={k} className="rp-btn rp-btn-ghost" style={{fontSize:11,padding:"4px 10px",borderStyle:"dashed"}}
                onClick={()=>setData(d=>({...d,skills:[...d.skills,k]}))}>+ {k}</button>
            ))}
          </div>
        </div>
        <div className="rp-btn-row">
          <button className="rp-btn rp-btn-ghost" onClick={()=>setActiveSection("projects")}>← Back</button>
          <button className="rp-btn rp-btn-primary" onClick={()=>setActiveSection("achievements")}>Next: Achievements →</button>
        </div>
      </div>
    ),

    achievements: (
      <div className="rp-fade">
        <div className="rp-section-hdr">
          <div className="rp-section-badge">Step 7</div>
          <div className="rp-section-title">Achievements</div>
          <div className="rp-section-sub">Hackathons, scholarships, competitive programming ranks, certifications</div>
        </div>
        {data.achievements.map((a,i) => (
          <div key={a.id} className="rp-entry">
            <div className="rp-entry-head">
              <div>
                <div className="rp-entry-title">{a.title||`Achievement ${i+1}`}</div>
                <div className="rp-entry-sub">{a.org} {a.year&&`· ${a.year}`}</div>
              </div>
              <button className="rp-entry-del" onClick={()=>delAch(a.id)}>✕</button>
            </div>
            <div className="rp-row">
              <div className="rp-field"><label className="rp-label">Title</label>
                <input className="rp-input" placeholder="1st Place — Smart India Hackathon" value={a.title} onChange={v=>setAch(a.id,"title",v.target.value)}/></div>
              <div className="rp-field"><label className="rp-label">Organisation</label>
                <input className="rp-input" placeholder="MoE / LeetCode / Coursera" value={a.org} onChange={v=>setAch(a.id,"org",v.target.value)}/></div>
            </div>
            <div className="rp-row">
              <div className="rp-field"><label className="rp-label">Year</label>
                <input className="rp-input" placeholder="2024" value={a.year} onChange={v=>setAch(a.id,"year",v.target.value)}/></div>
              <div className="rp-field"><label className="rp-label">Short description</label>
                <input className="rp-input" placeholder="Top 10 out of 5000 teams nationally" value={a.desc} onChange={v=>setAch(a.id,"desc",v.target.value)}/></div>
            </div>
          </div>
        ))}
        <button className="rp-btn rp-btn-add" onClick={addAch}>＋ Add Achievement</button>
        <div className="rp-btn-row" style={{marginTop:16}}>
          <button className="rp-btn rp-btn-ghost" onClick={()=>setActiveSection("skills")}>← Back</button>
          <button className="rp-btn rp-btn-primary" onClick={()=>setActiveSection("preview")}>Preview &amp; Export →</button>
        </div>
      </div>
    ),

    preview: (
      <div className="rp-fade">
        <div className="rp-section-hdr">
          <div className="rp-section-badge">Final</div>
          <div className="rp-section-title">Preview &amp; Export</div>
          <div className="rp-section-sub">Your resume — ready to download as PDF</div>
        </div>
        <div className="rp-btn-row" style={{marginBottom:16}}>
          <button className="rp-btn rp-btn-primary" onClick={handleDownload}>⬇ Download PDF</button>
          <button className="rp-btn rp-btn-ghost" onClick={()=>setActiveSection("achievements")}>← Edit</button>
        </div>
        <div id="rp-preview-content" className="rp-preview-wrap">
          <div className="rp-preview-name">{data.basics.name||"Your Name"}</div>
          <div className="rp-preview-contact">
            {data.basics.email&&<span>✉ {data.basics.email}</span>}
            {data.basics.phone&&<span>☏ {data.basics.phone}</span>}
            {data.basics.location&&<span>⌖ {data.basics.location}</span>}
            {data.basics.linkedin&&<span>in {data.basics.linkedin}</span>}
            {data.basics.github&&<span>gh {data.basics.github}</span>}
            {data.basics.portfolio&&<span>⎋ {data.basics.portfolio}</span>}
          </div>
          {data.summary&&(
            <div className="rp-preview-section">
              <div className="rp-preview-section-title">Summary</div>
              <div style={{fontSize:11,color:"#333",lineHeight:1.6}}>{data.summary}</div>
            </div>
          )}
          {data.education.length>0&&(
            <div className="rp-preview-section">
              <div className="rp-preview-section-title">Education</div>
              {data.education.map(e=>(
                <div key={e.id} className="rp-preview-entry">
                  <div className="rp-preview-entry-head">
                    <span className="rp-preview-entry-title">{e.school}</span>
                    <span className="rp-preview-entry-date">{e.start}{e.end&&` – ${e.end}`}</span>
                  </div>
                  <div className="rp-preview-entry-sub">{e.degree} in {e.field}{e.gpa&&` · CGPA: ${e.gpa}`}{e.location&&` · ${e.location}`}</div>
                </div>
              ))}
            </div>
          )}
          {data.experience.length>0&&(
            <div className="rp-preview-section">
              <div className="rp-preview-section-title">Experience</div>
              {data.experience.map(e=>(
                <div key={e.id} className="rp-preview-entry">
                  <div className="rp-preview-entry-head">
                    <span className="rp-preview-entry-title">{e.role} — {e.company}</span>
                    <span className="rp-preview-entry-date">{e.start}{e.end&&` – ${e.end}`}{e.location&&` · ${e.location}`}</span>
                  </div>
                  {e.bullets?.filter(b=>b.trim()).map((b,j)=>(
                    <div key={j} className="rp-preview-bullet">{b}</div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {data.projects.length>0&&(
            <div className="rp-preview-section">
              <div className="rp-preview-section-title">Projects</div>
              {data.projects.map(p=>(
                <div key={p.id} className="rp-preview-entry">
                  <div className="rp-preview-entry-head">
                    <span className="rp-preview-entry-title">{p.name}</span>
                    <span className="rp-preview-entry-date">{p.github||p.link}</span>
                  </div>
                  <div className="rp-preview-entry-sub">{p.tech}</div>
                  {p.desc&&<div className="rp-preview-bullet">{p.desc}</div>}
                </div>
              ))}
            </div>
          )}
          {data.skills.length>0&&(
            <div className="rp-preview-section">
              <div className="rp-preview-section-title">Skills</div>
              <div className="rp-preview-skills">
                {data.skills.map(s=><span key={s} className="rp-preview-skill-tag">{s}</span>)}
              </div>
            </div>
          )}
          {data.achievements.length>0&&(
            <div className="rp-preview-section">
              <div className="rp-preview-section-title">Achievements</div>
              {data.achievements.map(a=>(
                <div key={a.id} className="rp-preview-bullet">
                  <strong>{a.title}</strong>{a.org&&` — ${a.org}`}{a.year&&` (${a.year})`}{a.desc&&` · ${a.desc}`}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="rp-toast-wrap">
        {toasts.map(t=>(
          <div key={t.id} className={`rp-toast ${t.type}`}>
            {t.type==="success"?"✓":"ℹ"} {t.msg}
          </div>
        ))}
      </div>

      <div className="rp-page">
        <div className="rp-layout">

          {/* ── Sidebar ── */}
          <aside className="rp-sidebar">
            <div className="rp-sidebar-top">
              <div className="rp-sidebar-brand">Resume Builder</div>
              <div className="rp-sidebar-score">
                <div className="rp-score-label">
                  <span>Resume strength</span>
                  <span style={{color:score>=75?"var(--green)":score>=50?"var(--amber)":"var(--coral)",fontWeight:700,fontFamily:"var(--mono)"}}>{score}%</span>
                </div>
                <div className="rp-progress"><div className="rp-progress-fill" style={{width:`${score}%`}}/></div>
              </div>
            </div>

            <nav className="rp-nav">
              <div className="rp-nav-section">Sections</div>
              {SECTIONS.map(s => (
                <button key={s.id} className={`rp-nav-item${activeSection===s.id?" on":""}${isDone[s.id]?" done":""}`}
                  onClick={()=>setActiveSection(s.id)}>
                  <div className="rp-nav-dot"/>
                  {s.label}
                  {isDone[s.id]&&<span className="rp-nav-check" style={{color:"var(--teal)",marginLeft:"auto"}}>✓</span>}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Main editor ── */}
          <main className="rp-main">
            {sections[activeSection]}
          </main>

          {/* ── Analyzer panel ── */}
          <aside className="rp-panel">
            <div className="rp-panel-title">
              Live analyzer
              <span className="rp-panel-badge">AI</span>
            </div>

            <ScoreRing score={score}/>

            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",color:"var(--mut)",marginBottom:10}}>Score breakdown</div>
              <CriterionBar name="Contact info"  value={criteria.contact||0}     max={20} color="#22C55E"/>
              <CriterionBar name="Summary"       value={criteria.summary||0}     max={10} color="#0D9488"/>
              <CriterionBar name="Education"     value={criteria.education||0}   max={15} color="#7C3AED"/>
              <CriterionBar name="Experience"    value={criteria.experience||0}  max={20} color="#D97706"/>
              <CriterionBar name="Projects"      value={criteria.projects||0}    max={15} color="#DB2777"/>
              <CriterionBar name="Skills"        value={criteria.skills||0}      max={10} color="#60a5fa"/>
              <CriterionBar name="Achievements"  value={criteria.achievements||0}max={10} color="#F59E0B"/>
            </div>

            <div className="rp-divider"/>

            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",color:"var(--mut)",marginBottom:10}}>Suggestions</div>
              {suggestions.map((s,i)=><Suggestion key={i} {...s}/>)}
              {suggestions.length===0&&(
                <div style={{fontSize:12,color:"var(--mut)",textAlign:"center",padding:"16px 0"}}>
                  Fill in sections to get suggestions
                </div>
              )}
            </div>

            <div className="rp-divider"/>

            <div>
              <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",color:"var(--mut)",marginBottom:6}}>ATS Keywords</div>
              <div style={{fontSize:11,color:"var(--hint)",marginBottom:8}}>Found in your resume vs. missing</div>
              <div className="rp-kw-grid">
                {foundKw.slice(0,8).map(k=><span key={k} className="rp-kw rp-kw-found">✓ {k}</span>)}
                {missingKw.slice(0,6).map(k=><span key={k} className="rp-kw rp-kw-missing">✕ {k}</span>)}
              </div>
            </div>

            <div className="rp-divider"/>

            <button className="rp-btn rp-btn-primary" style={{width:"100%",justifyContent:"center",marginBottom:8}}
              onClick={()=>{ setActiveSection("preview"); showToast("Resume preview ready!"); }}>
              Preview Resume
            </button>
            <button className="rp-btn rp-btn-ghost" style={{width:"100%",justifyContent:"center",fontSize:12}}
              onClick={()=>showToast("Use Preview → Download PDF to export","info")}>
              ⬇ Export PDF
            </button>
          </aside>

        </div>
      </div>
    </>
  );
}