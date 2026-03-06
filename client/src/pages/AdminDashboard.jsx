import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import UserActivityDrawer from "./UserActivityDrawer";

/* ─────────────────────────── CSS ─────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
:root {
  --bg:#0D1117; --surface:#161B22; --s2:#1C2333; --border:#21262D;
  --green:#22C55E; --cyan:#00B4D8; --amber:#F59E0B; --red:#EF4444; --purple:#8B5CF6;
  --pink:#EC4899;
  --text:#E2E8F0; --muted:#64748B; --font:'Outfit',sans-serif; --mono:'JetBrains Mono',monospace;
}
* { scrollbar-width:thin; scrollbar-color:#21262D transparent; }
::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:#2D3748; border-radius:4px; }
@keyframes shimmer   { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
@keyframes fadeUp    { to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn    { to{opacity:1} }
@keyframes pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
@keyframes countUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes slideIn   { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
@keyframes spin      { to{transform:rotate(360deg)} }
@keyframes modalIn   { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes popIn     { 0%{transform:scale(0.7);opacity:0} 100%{transform:scale(1);opacity:1} }
@keyframes progShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
.ad-page { min-height:100vh; background:var(--bg); color:var(--text); font-family:var(--font); position:relative; overflow-x:hidden; }
.ad-page::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0; background-image:linear-gradient(rgba(34,197,94,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.025) 1px,transparent 1px); background-size:48px 48px; }
.ad-inner { max-width:1400px; margin:0 auto; padding:36px 40px 80px; position:relative; z-index:1; }
.ad-shimmer { background:linear-gradient(90deg,#1E2530 25%,#252D3A 50%,#1E2530 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }
.ad-fade { opacity:0; transform:translateY(18px); animation:fadeUp 0.55s ease forwards; }
.ad-fade-in { opacity:0; animation:fadeIn 0.5s ease forwards; }
.ad-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:36px; flex-wrap:wrap; gap:16px; }
.ad-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(245,158,11,0.1); color:var(--amber); border:1px solid rgba(245,158,11,0.25); border-radius:20px; padding:4px 14px; font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:12px; }
.ad-badge-dot { width:6px; height:6px; border-radius:50%; background:var(--amber); animation:pulse 2s ease-in-out infinite; }
.ad-title { font-size:34px; font-weight:900; color:#fff; letter-spacing:-1px; line-height:1.05; }
.ad-title span { background:linear-gradient(135deg,#F59E0B,#EF4444); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.ad-sub { font-size:14px; color:var(--muted); margin-top:6px; }
.ad-hdr-right { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
.ad-btn { display:inline-flex; align-items:center; gap:7px; padding:10px 20px; border-radius:10px; font-family:var(--font); font-size:13px; font-weight:700; cursor:pointer; transition:all 0.2s; border:1px solid; text-decoration:none; }
.ad-btn-primary { background:var(--green); color:#0D1117; border-color:var(--green); }
.ad-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(34,197,94,0.3); }
.ad-btn-ghost { background:transparent; color:var(--amber); border-color:rgba(245,158,11,0.3); }
.ad-btn-ghost:hover { background:rgba(245,158,11,0.08); transform:translateY(-1px); }
.ad-metrics { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; margin-bottom:28px; }
.ad-metric { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:22px 22px 18px; position:relative; overflow:hidden; transition:all 0.22s; }
.ad-metric::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,var(--accent,var(--green)),transparent); }
.ad-metric:hover { transform:translateY(-4px); border-color:var(--accent,var(--green)); box-shadow:0 12px 40px rgba(0,0,0,0.3); }
.ad-metric-icon { font-size:24px; margin-bottom:14px; }
.ad-metric-val { font-size:38px; font-weight:900; line-height:1; letter-spacing:-1.5px; font-family:var(--mono); color:var(--accent,var(--green)); animation:countUp 0.6s ease both; }
.ad-metric-label { font-size:12px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:0.8px; margin-top:6px; }
.ad-metric-delta { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; margin-top:8px; padding:2px 8px; border-radius:20px; }
.ad-metric-delta.up { color:#22C55E; background:rgba(34,197,94,0.1); }
.ad-metric-delta.down { color:var(--red); background:rgba(239,68,68,0.1); }
.ad-metric-delta.neutral { color:var(--muted); background:rgba(100,116,139,0.1); }
.ad-section-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:var(--muted); margin-bottom:16px; display:flex; align-items:center; gap:10px; }
.ad-section-label::after { content:''; flex:1; height:1px; background:var(--border); }
.ad-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; overflow:hidden; }
.ad-card-header { display:flex; align-items:center; justify-content:space-between; padding:18px 22px; border-bottom:1px solid var(--border); }
.ad-card-title { font-size:15px; font-weight:700; color:#fff; }
.ad-card-meta { font-size:12px; color:var(--muted); }
.ad-tabs { display:flex; background:var(--s2); border-bottom:1px solid var(--border); overflow-x:auto; }
.ad-tab { padding:12px 20px; background:none; border:none; border-bottom:2px solid transparent; color:var(--muted); font-family:var(--font); font-size:13px; font-weight:600; cursor:pointer; transition:all 0.15s; white-space:nowrap; flex-shrink:0; }
.ad-tab:hover { color:var(--text); }
.ad-tab.on { color:var(--amber); border-bottom-color:var(--amber); }
.ad-table { width:100%; border-collapse:collapse; }
.ad-th { padding:11px 16px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--muted); background:var(--s2); white-space:nowrap; border-bottom:1px solid var(--border); cursor:pointer; user-select:none; }
.ad-th:first-child { padding-left:20px; }
.ad-th:hover { color:var(--text); }
.ad-tr { border-bottom:1px solid var(--border); transition:background 0.12s; }
.ad-tr:last-child { border-bottom:none; }
.ad-tr:hover { background:rgba(255,255,255,0.02); }
.ad-tr.selected { background:rgba(34,197,94,0.04); }
.ad-td { padding:13px 16px; font-size:13px; vertical-align:middle; color:var(--text); }
.ad-td:first-child { padding-left:20px; }
.ad-pill { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
.ad-row-btn { padding:4px 10px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; border:1px solid; font-family:var(--font); transition:all 0.15s; margin-right:4px; white-space:nowrap; }
.ad-row-btn:hover { opacity:0.8; transform:translateY(-1px); }
.ad-row-btn:disabled { opacity:0.4; cursor:not-allowed; transform:none; }
.ad-bar-chart { display:flex; gap:4px; align-items:flex-end; height:72px; padding:0 4px; }
.ad-bar-col { flex:1; display:flex; flex-direction:column; align-items:center; }
.ad-bar-fill { width:100%; border-radius:3px 3px 0 0; min-height:3px; transition:height 0.3s ease; }
.ad-progress { height:6px; background:var(--border); border-radius:3px; overflow:hidden; margin-top:8px; }
.ad-progress-fill { height:100%; border-radius:3px; }
.ad-quick-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; }
.ad-quick-card { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:20px 18px; cursor:pointer; transition:all 0.22s; text-align:center; position:relative; overflow:hidden; }
.ad-quick-card:hover { transform:translateY(-4px); border-color:var(--qc-color,var(--green)); box-shadow:0 12px 36px rgba(0,0,0,0.4); }
.ad-quick-card-glow { position:absolute; top:-20px; left:50%; transform:translateX(-50%); width:80px; height:80px; border-radius:50%; opacity:0; transition:opacity 0.22s; pointer-events:none; }
.ad-quick-card:hover .ad-quick-card-glow { opacity:1; }
.ad-quick-card-icon { font-size:26px; margin-bottom:10px; transition:transform 0.22s; }
.ad-quick-card:hover .ad-quick-card-icon { transform:scale(1.12); }
.ad-quick-card-label { font-size:13px; font-weight:700; color:var(--text); }
.ad-quick-card-sub { font-size:11px; color:var(--muted); margin-top:3px; }
.ad-quick-card-badge { position:absolute; top:8px; right:8px; font-size:9px; font-weight:700; padding:2px 6px; border-radius:3px; }
.ad-alert { display:flex; align-items:center; gap:12px; padding:14px 20px; border-radius:12px; margin-bottom:20px; border:1px solid; }
.ad-alert.warning { background:rgba(245,158,11,0.07); border-color:rgba(245,158,11,0.25); color:var(--amber); }
.ad-alert.info    { background:rgba(0,180,216,0.07); border-color:rgba(0,180,216,0.25); color:var(--cyan); }
.ad-alert.success { background:rgba(34,197,94,0.07); border-color:rgba(34,197,94,0.25); color:var(--green); }
.ad-alert-text { font-size:13px; font-weight:600; flex:1; }
.ad-alert-close { background:none; border:none; color:inherit; cursor:pointer; font-size:14px; opacity:0.6; padding:0 4px; }
.ad-alert-close:hover { opacity:1; }
.ad-toast-wrap { position:fixed; bottom:24px; right:24px; z-index:9999; display:flex; flex-direction:column; gap:8px; pointer-events:none; }
.ad-toast { display:flex; align-items:center; gap:10px; padding:12px 18px; border-radius:10px; font-size:13px; font-weight:600; animation:fadeIn 0.3s ease; box-shadow:0 4px 20px rgba(0,0,0,0.5); }
.ad-toast.success { background:#052e16; color:#22C55E; border:1px solid #166534; }
.ad-toast.error   { background:#2a0a0a; color:#EF4444; border:1px solid #7f1d1d; }
.ad-toast.info    { background:#0a1628; color:#00B4D8; border:1px solid #0e4d6b; }
.ad-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.82); z-index:9998; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
.ad-modal { background:#161B22; border:1px solid #21262D; border-radius:16px; padding:32px; max-width:380px; width:90%; text-align:center; }
.ad-toolbar { display:flex; align-items:center; gap:10px; padding:14px 20px; border-bottom:1px solid var(--border); background:var(--s2); flex-wrap:wrap; }
.ad-search { display:flex; align-items:center; gap:8px; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:7px 12px; flex:1; min-width:180px; max-width:320px; }
.ad-search input { background:none; border:none; outline:none; color:var(--text); font-family:var(--font); font-size:13px; width:100%; }
.ad-search input::placeholder { color:var(--muted); }
.ad-filter-select { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:7px 12px; color:var(--text); font-family:var(--font); font-size:12px; cursor:pointer; outline:none; }
.ad-filter-select option { background:var(--surface); }
.ad-toolbar-right { display:flex; gap:8px; margin-left:auto; }
.ad-export-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid; font-family:var(--font); transition:all 0.15s; }
.ad-export-btn:hover { transform:translateY(-1px); }
.ad-pagination { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-top:1px solid var(--border); flex-wrap:wrap; gap:10px; }
.ad-pagination-info { font-size:12px; color:var(--muted); }
.ad-pagination-btns { display:flex; gap:4px; }
.ad-page-btn { width:32px; height:32px; border-radius:6px; border:1px solid var(--border); background:transparent; color:var(--muted); font-size:12px; font-weight:600; cursor:pointer; font-family:var(--font); transition:all 0.15s; display:flex; align-items:center; justify-content:center; }
.ad-page-btn:hover { border-color:var(--amber); color:var(--amber); }
.ad-page-btn.on { background:var(--amber); border-color:var(--amber); color:#0D1117; }
.ad-page-btn:disabled { opacity:0.3; cursor:not-allowed; }
.ad-bulk-bar { display:flex; align-items:center; gap:12px; padding:10px 20px; background:rgba(139,92,246,0.08); border-bottom:1px solid rgba(139,92,246,0.2); }
.ad-bulk-text { font-size:13px; font-weight:600; color:var(--purple); }
.ad-bulk-btn { padding:5px 14px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid; font-family:var(--font); transition:all 0.15s; }
.ad-refresh-dot { width:8px; height:8px; border-radius:50%; background:var(--green); animation:pulse 2s ease-in-out infinite; display:inline-block; }
.sort-asc::after  { content:' ↑'; color:var(--amber); }
.sort-desc::after { content:' ↓'; color:var(--amber); }
.ad-approve-btn { padding:4px 12px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; border:1px solid rgba(34,197,94,0.3); color:var(--green); background:rgba(34,197,94,0.06); font-family:var(--font); transition:all 0.15s; margin-right:5px; }
.ad-approve-btn:hover { background:rgba(34,197,94,0.15); transform:translateY(-1px); }
.ad-checkbox { width:15px; height:15px; accent-color:var(--purple); cursor:pointer; }

/* ── Bulk Import Modal ── */
.bi-modal { background:#0f1520; border:1px solid #1e2d42; border-radius:18px; width:min(800px,95vw); max-height:88vh; display:flex; flex-direction:column; animation:modalIn 0.3s cubic-bezier(0.16,1,0.3,1); box-shadow:0 40px 100px rgba(0,0,0,0.8),0 0 0 1px #1a2535; overflow:hidden; }
.bi-header { padding:22px 26px 20px; border-bottom:1px solid #1e2d42; display:flex; align-items:center; justify-content:space-between; background:linear-gradient(135deg,#0a1220 0%,#0f1520 100%); flex-shrink:0; }
.bi-body { flex:1; overflow-y:auto; padding:24px 26px; }
.bi-dropzone { border:2px dashed #1e2d42; border-radius:14px; padding:52px 24px; text-align:center; cursor:pointer; transition:all 0.22s; background:#0a1018; }
.bi-dropzone:hover,.bi-dropzone.drag { border-color:#00B4D8; background:rgba(0,180,216,0.05); }
.bi-dropzone.drag { transform:scale(1.01); }
.bi-col-tag { font-size:11px; padding:3px 9px; border-radius:5px; font-family:var(--mono); }
.bi-preview-table { width:100%; border-collapse:collapse; font-size:12px; }
.bi-preview-table th { padding:8px 12px; text-align:left; color:var(--muted); font-weight:600; font-size:10px; text-transform:uppercase; letter-spacing:0.5px; background:#070c12; border-bottom:1px solid #1e2d42; }
.bi-preview-table tr:hover td { background:#121d2a; }
.bi-preview-table td { padding:8px 12px; color:var(--text); border-bottom:1px solid #111b27; }
.bi-log-row { padding:7px 16px; font-size:12px; display:flex; align-items:center; gap:10px; font-family:var(--mono); animation:popIn 0.2s ease; border-bottom:1px solid #0d1520; }
.bi-log-row:last-child { border-bottom:none; }
.bi-stat-card { background:#0a1018; border:1px solid #1e2d42; border-radius:10px; padding:14px; text-align:center; }
.bi-action-btn { padding:11px 20px; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; font-family:var(--font); transition:all 0.18s; border:1px solid; }
.bi-action-btn:hover:not(:disabled) { transform:translateY(-2px); }
.bi-action-btn:disabled { opacity:0.45; cursor:not-allowed; }
.bi-progress-bar { height:8px; background:#1a2535; border-radius:4px; overflow:hidden; }
.bi-progress-fill { height:100%; border-radius:4px; background:linear-gradient(90deg,#00B4D8,#22C55E,#00B4D8); background-size:200% 100%; animation:progShimmer 1.8s linear infinite; transition:width 0.35s ease; }
`;


function parseCSV(text) {
  // ── Proper CSV parser that handles quoted multiline fields ──
  function parseRow(text, start) {
    const cols = [];
    let cur = "", inQ = false, i = start;
    while (i < text.length) {
      const c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i+1] === '"') { cur += '"'; i += 2; continue; } // escaped quote
          inQ = false; i++; continue;
        }
        cur += c; i++; continue;
      }
      if (c === '"') { inQ = true; i++; continue; }
      if (c === ',') { cols.push(cur); cur = ""; i++; continue; }
      if (c === '\n') { cols.push(cur); return { cols, next: i + 1 }; }
      if (c === '\r') {
        cols.push(cur);
        return { cols, next: text[i+1] === '\n' ? i + 2 : i + 1 };
      }
      cur += c; i++;
    }
    if (cur || cols.length) cols.push(cur);
    return { cols, next: i };
  }

  const errors = [];
  const REQUIRED = ["title", "difficulty", "description"];

  // Parse header
  const firstRow = parseRow(text, 0);
  const headers = firstRow.cols.map(h => h.trim().toLowerCase());
  const missing = REQUIRED.filter(r => !headers.includes(r));
  if (missing.length) errors.push(`Missing required columns: ${missing.join(", ")}`);

  // Parse all rows
  const rows = [];
  let pos = firstRow.next;
  let rowIndex = 2;
  while (pos < text.length) {
    const { cols, next } = parseRow(text, pos);
    pos = next;
    if (cols.every(c => !c.trim())) continue; // skip blank rows
    const row = {};
    headers.forEach((h, j) => row[h] = (cols[j] || "").trim());
    row._row = rowIndex++;
    row._valid = true;
    if (!row.title) { errors.push(`Row ${row._row}: missing title`); row._valid = false; }
    const validDiff = ["easy", "medium", "hard"];
    if (row.difficulty && !validDiff.includes(row.difficulty.toLowerCase())) {
      errors.push(`Row ${row._row}: invalid difficulty "${row.difficulty}"`); row._valid = false;
    }
    if (row.difficulty) row.difficulty = row.difficulty.charAt(0).toUpperCase() + row.difficulty.slice(1).toLowerCase();
    rows.push(row);
  }

  return { headers, rows, errors };
}

/* ─────────────────── Bulk Import Modal ─────────────────── */
function BulkImportModal({ onClose, onImported, showToast }) {
  const [stage,       setStage]       = useState("upload");
  const [dragging,    setDragging]    = useState(false);
  const [parsed,      setParsed]      = useState(null);
  const [progress,    setProgress]    = useState(0);
  const [importLog,   setImportLog]   = useState([]);
  const [successCount,setSuccessCount]= useState(0);
  const fileRef = useRef(null);
  const logRef  = useRef(null);

  // Auto-scroll log
  useEffect(() => { if(logRef.current) logRef.current.scrollTop=logRef.current.scrollHeight; }, [importLog]);

  const processFile = (f) => {
    if (!f || !f.name.endsWith(".csv")) {
      setParsed({ headers:[], rows:[], errors:["Please upload a .csv file"] });
      setStage("preview"); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => { setParsed(parseCSV(e.target.result)); setStage("preview"); };
    reader.readAsText(f);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if(f) processFile(f);
  };

  const startImport = async () => {
    if (!parsed) return;
    const valid = parsed.rows.filter(r => r._valid);
    setStage("importing"); setProgress(0);
    const log = [];
    for (let i = 0; i < valid.length; i++) {
      const row = valid[i];
      try {
        await API.post("/admin/problems/bulk-single", {
  title:           row.title,
  difficulty:      row.difficulty,
  description:     row.description,
  topics:          row.topics ? row.topics.split(";").map(t => t.trim()) : [],
  constraints:     row.constraints     || "",
  sample_input_1:  row.sample_input_1  || "",
  sample_output_1: row.sample_output_1 || "",
  sample_input_2:  row.sample_input_2  || "",
  sample_output_2: row.sample_output_2 || "",
  hidden_input_1:  row.hidden_input_1  || "",
  hidden_output_1: row.hidden_output_1 || "",
  hidden_input_2:  row.hidden_input_2  || "",
  hidden_output_2: row.hidden_output_2 || "",
  hidden_input_3:  row.hidden_input_3  || "",
  hidden_output_3: row.hidden_output_3 || "",
  modelSolution:   row.modelsolution   || "",
});
        log.push({ title:row.title, ok:true, msg:"Imported" });
      } catch(err) {
        const msg = err?.response?.data?.msg || err?.message || "Failed";
        log.push({ title:row.title, ok:false, msg });
      }
      setImportLog([...log]);
      setProgress(Math.round(((i+1)/valid.length)*100));
      await new Promise(r=>setTimeout(r,120)); // small delay so UI updates
    }
    const sc = log.filter(l=>l.ok).length;
    setSuccessCount(sc);
    setStage("done");
    if (sc > 0 && onImported) onImported(sc);
  };

  const downloadTemplate = () => {
    const csv = `title,difficulty,description,tags,points,timeLimit,memoryLimit\nTwo Sum,Easy,"Given an array of integers return indices of the two numbers that add to target.",array;hash-table,100,1000,256\nValid Parentheses,Easy,"Given a string determine if the input string is valid.",stack;string,100,1000,256\nMerge K Sorted Lists,Hard,"Merge k sorted linked-lists into one sorted list.",linked-list;heap,300,2000,256`;
    const blob = new Blob([csv],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="problems_template.csv"; a.click();
  };

  const validRows   = parsed?.rows.filter(r=>r._valid)||[];
  const invalidRows = parsed?.rows.filter(r=>!r._valid)||[];
  const diffColor   = d => d==="Easy"?"#22C55E":d==="Medium"?"#F59E0B":"#EF4444";

  return (
    <div className="ad-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="bi-modal">

        {/* Header */}
        <div className="bi-header">
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,rgba(0,180,216,0.18),rgba(139,92,246,0.18))",border:"1px solid rgba(0,180,216,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>📥</div>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:"#e8f0ff",letterSpacing:"-0.3px"}}>Bulk Import Problems</div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>Upload a CSV to import multiple problems at once</div>
            </div>
          </div>
          {/* Stage breadcrumb */}
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"var(--muted)"}}>
            {["upload","preview","importing","done"].map((s,i,arr)=>(
              <span key={s} style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{padding:"3px 10px",borderRadius:20,background:stage===s?"rgba(0,180,216,0.15)":"transparent",color:stage===s?"var(--cyan)":arr.indexOf(stage)>i?"var(--green)":"var(--muted)",fontWeight:stage===s?700:400,border:stage===s?"1px solid rgba(0,180,216,0.3)":"1px solid transparent",transition:"all 0.2s",textTransform:"capitalize"}}>
                  {arr.indexOf(stage)>i?"✓ ":""}{s}
                </span>
                {i<arr.length-1&&<span style={{color:"#1e2d42"}}>›</span>}
              </span>
            ))}
          </div>
          <button onClick={onClose} style={{width:34,height:34,borderRadius:8,border:"1px solid #1e2d42",background:"transparent",color:"var(--muted)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",marginLeft:8}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(239,68,68,0.5)";e.currentTarget.style.color="var(--red)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e2d42";e.currentTarget.style.color="var(--muted)";}}>×</button>
        </div>

        {/* ── STAGE: Upload ── */}
        {stage==="upload"&&(
          <div className="bi-body">
            <div className={`bi-dropzone${dragging?" drag":""}`}
              onDragOver={e=>{e.preventDefault();setDragging(true);}}
              onDragLeave={()=>setDragging(false)}
              onDrop={handleDrop}
              onClick={()=>fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept=".csv" onChange={e=>{if(e.target.files[0])processFile(e.target.files[0]);}} style={{display:"none"}}/>
              <div style={{fontSize:48,marginBottom:14}}>{dragging?"📂":"📄"}</div>
              <div style={{fontSize:16,fontWeight:700,color:"#c8d8f0",marginBottom:6}}>
                {dragging?"Release to upload":"Drop your CSV file here"}
              </div>
              <div style={{fontSize:13,color:"var(--muted)",marginBottom:16}}>or click to browse · max 10MB</div>
              <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 20px",borderRadius:8,background:"rgba(0,180,216,0.1)",border:"1px solid rgba(0,180,216,0.25)",color:"var(--cyan)",fontSize:13,fontWeight:600}}>
                📎 Select CSV File
              </div>
            </div>

            {/* Format guide */}
            <div style={{background:"#0a1018",border:"1px solid #1a2535",borderRadius:12,padding:18,marginTop:18}}>
              <div style={{fontSize:12,fontWeight:700,color:"#c8d8f0",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
                📋 Required CSV Format
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                {[{c:"title",req:true},{c:"difficulty",req:true},{c:"description",req:true},{c:"tags",req:false},{c:"points",req:false},{c:"timeLimit",req:false},{c:"memoryLimit",req:false}].map(({c,req})=>(
                  <span key={c} className="bi-col-tag" style={{color:req?"var(--cyan)":"var(--muted)",background:req?"rgba(0,180,216,0.1)":"#0d1520",border:`1px solid ${req?"rgba(0,180,216,0.3)":"#1a2535"}`}}>
                    {c}{req&&<span style={{color:"var(--red)",marginLeft:2}}>*</span>}
                  </span>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}>
                {[["difficulty","Easy, Medium, or Hard"],["tags","semicolon-separated: array;dp"],["points","default: 100"],["timeLimit","in ms, default: 1000"]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",gap:6,color:"var(--muted)"}}>
                    <span style={{color:"var(--cyan)",fontFamily:"var(--mono)",flexShrink:0}}>{k}:</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={downloadTemplate} style={{width:"100%",marginTop:14,padding:"12px",borderRadius:10,border:"1px solid rgba(34,197,94,0.3)",background:"rgba(34,197,94,0.07)",color:"var(--green)",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(34,197,94,0.14)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(34,197,94,0.07)";}}>
              ⬇ Download Sample Template CSV
            </button>
          </div>
        )}

        {/* ── STAGE: Preview ── */}
        {stage==="preview"&&parsed&&(
          <div className="bi-body" style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Stats row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {[{l:"Total Rows",v:parsed.rows.length,c:"var(--cyan)"},{l:"✓ Valid",v:validRows.length,c:"var(--green)"},{l:"✗ Errors",v:invalidRows.length+(parsed.errors.filter(e=>e.startsWith("Missing")).length),c:invalidRows.length?"var(--red)":"var(--muted)"}].map(({l,v,c})=>(
                <div key={l} className="bi-stat-card">
                  <div style={{fontSize:26,fontWeight:900,color:c,fontFamily:"var(--mono)",letterSpacing:"-1px"}}>{v}</div>
                  <div style={{fontSize:11,color:"var(--muted)",marginTop:3}}>{l}</div>
                </div>
              ))}
            </div>

            {/* Errors */}
            {parsed.errors.length>0&&(
              <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"12px 16px"}}>
                <div style={{fontSize:12,fontWeight:700,color:"var(--red)",marginBottom:8,display:"flex",gap:6,alignItems:"center"}}>⚠ Validation Issues ({parsed.errors.length})</div>
                <div style={{maxHeight:100,overflowY:"auto",display:"flex",flexDirection:"column",gap:3}}>
                  {parsed.errors.map((e,i)=>(
                    <div key={i} style={{fontSize:11,color:"rgba(239,68,68,0.8)",fontFamily:"var(--mono)",paddingTop:i>0?3:0,borderTop:i>0?"1px solid rgba(239,68,68,0.12)":"none"}}>{e}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview table */}
            {validRows.length>0&&(
              <div style={{background:"#080e16",border:"1px solid #1a2535",borderRadius:10,overflow:"hidden"}}>
                <div style={{padding:"10px 14px",borderBottom:"1px solid #1a2535",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:12,fontWeight:700,color:"var(--green)"}}>✓ Preview ({validRows.length} valid)</span>
                  {invalidRows.length>0&&<span style={{fontSize:11,color:"var(--red)"}}>⚠ {invalidRows.length} rows will be skipped</span>}
                </div>
                <div style={{maxHeight:260,overflowY:"auto"}}>
                  <table className="bi-preview-table">
                    <thead><tr><th>#</th><th>Title</th><th>Difficulty</th><th>Tags</th><th>Points</th></tr></thead>
                    <tbody>
                      {validRows.map((row,i)=>(
                        <tr key={i}>
                          <td style={{color:"var(--muted)",fontFamily:"var(--mono)"}}>{i+1}</td>
                          <td style={{fontWeight:600,maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.title}</td>
                          <td><span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4,color:diffColor(row.difficulty),background:`${diffColor(row.difficulty)}18`,border:`1px solid ${diffColor(row.difficulty)}33`}}>{row.difficulty||"—"}</span></td>
                          <td style={{color:"var(--muted)",fontSize:11}}>
                            {row.tags?row.tags.split(";").slice(0,2).map((t,j)=>(
                              <span key={j} style={{marginRight:4,padding:"1px 6px",borderRadius:3,background:"#1a2535",color:"var(--muted)",fontSize:10}}>{t.trim()}</span>
                            )):"—"}
                          </td>
                          <td style={{fontFamily:"var(--mono)",color:"var(--amber)"}}>{row.points||"100"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={{display:"flex",gap:10,paddingTop:4}}>
              <button className="bi-action-btn" onClick={()=>{setParsed(null);setStage("upload");}} style={{flex:1,background:"transparent",color:"var(--muted)",borderColor:"#1e2d42"}}>← Change File</button>
              <button className="bi-action-btn" onClick={startImport} disabled={validRows.length===0}
                style={{flex:2,background:validRows.length>0?"linear-gradient(135deg,#0284c7,#1d4ed8)":"#1a2535",color:validRows.length>0?"#fff":"var(--muted)",borderColor:validRows.length>0?"#0369a1":"#1a2535",boxShadow:validRows.length>0?"0 4px 20px rgba(2,132,199,0.35)":"none"}}>
                📥 Import {validRows.length} Problem{validRows.length!==1?"s":""}
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE: Importing ── */}
        {stage==="importing"&&(
          <div className="bi-body" style={{display:"flex",flexDirection:"column",gap:18}}>
            <div style={{textAlign:"center",padding:"8px 0 4px"}}>
              <div style={{fontSize:15,fontWeight:700,color:"#c8d8f0",marginBottom:4}}>Importing problems…</div>
              <div style={{fontSize:28,fontWeight:900,fontFamily:"var(--mono)",color:"var(--cyan)"}}>{progress}%</div>
            </div>
            <div className="bi-progress-bar">
              <div className="bi-progress-fill" style={{width:`${progress}%`}}/>
            </div>
            <div ref={logRef} style={{background:"#070c12",border:"1px solid #1a2535",borderRadius:10,maxHeight:300,overflowY:"auto"}}>
              {importLog.length===0&&(
                <div style={{padding:"20px",textAlign:"center",color:"var(--muted)",fontSize:12}}>Starting…</div>
              )}
              {importLog.map((entry,i)=>(
                <div key={i} className="bi-log-row">
                  <span style={{color:entry.ok?"var(--green)":"var(--red)",flexShrink:0,fontSize:14}}>{entry.ok?"✓":"✗"}</span>
                  <span style={{color:"#c8d8f0",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{entry.title}</span>
                  <span style={{color:"var(--muted)",fontSize:10,flexShrink:0}}>{entry.msg}</span>
                </div>
              ))}
              {importLog.length<validRows.length&&(
                <div className="bi-log-row" style={{color:"var(--muted)"}}>
                  <span style={{display:"inline-block",animation:"spin 1s linear infinite",fontSize:14}}>⟳</span>
                  <span>Processing…</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STAGE: Done ── */}
        {stage==="done"&&(
          <div className="bi-body" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,textAlign:"center",padding:"40px 26px"}}>
            <div style={{width:76,height:76,borderRadius:"50%",background:"linear-gradient(135deg,rgba(34,197,94,0.15),rgba(34,197,94,0.05))",border:"2px solid rgba(34,197,94,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,animation:"popIn 0.45s cubic-bezier(0.175,0.885,0.32,1.275)"}}>✓</div>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:"#e8f0ff",marginBottom:6,letterSpacing:"-0.5px"}}>Import Complete!</div>
              <div style={{fontSize:14,color:"var(--muted)"}}>
                <span style={{color:"var(--green)",fontWeight:700}}>{successCount}</span> problem{successCount!==1?"s":""} imported successfully
                {(importLog.length-successCount)>0&&<>, <span style={{color:"var(--red)",fontWeight:700}}>{importLog.length-successCount}</span> failed</>}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,width:"100%",maxWidth:340}}>
              {[{l:"Imported",v:successCount,c:"var(--green)"},{l:"Failed",v:importLog.length-successCount,c:"var(--red)"},{l:"Skipped",v:parsed?.rows.filter(r=>!r._valid).length||0,c:"var(--amber)"},{l:"Total Rows",v:parsed?.rows.length||0,c:"var(--cyan)"}].map(({l,v,c})=>(
                <div key={l} className="bi-stat-card">
                  <div style={{fontSize:22,fontWeight:900,color:c,fontFamily:"var(--mono)"}}>{v}</div>
                  <div style={{fontSize:11,color:"var(--muted)",marginTop:3}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button className="bi-action-btn" onClick={()=>{setParsed(null);setImportLog([]);setProgress(0);setStage("upload");}} style={{background:"transparent",color:"var(--muted)",borderColor:"#1e2d42"}}>Import More</button>
              <button className="bi-action-btn" onClick={onClose} style={{background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",borderColor:"#166534",boxShadow:"0 4px 16px rgba(22,163,74,0.35)"}}>Done ✓</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Helpers ─────────────────── */
function useCountUp(target, dur = 1000) {
  const [v, setV] = useState(0);
  const r = useRef(false);
  useEffect(() => { r.current = false; setV(0); }, [target]);
  useEffect(() => {
    if (!target || r.current) return;
    r.current = true;
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

const timeAgo = iso => {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return `${Math.floor(d)}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
};

const diffColor = d => d === "Easy" ? "#22C55E" : d === "Medium" ? "#F59E0B" : "#EF4444";

const deriveStatus = (s, e) => {
  const now = Date.now();
  if (now < new Date(s).getTime()) return "upcoming";
  if (now < new Date(e).getTime()) return "live";
  return "ended";
};

function exportCSV(rows, cols, filename) {
  const header = cols.join(",");
  const body = rows.map(r => cols.map(c => `"${(r[c] ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}
function exportJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}

/* ─────────────────── Sub-components ─────────────────── */
function MetricCard({ icon, label, value, accent, delta, deltaType, delay }) {
  const anim = useCountUp(value || 0);
  return (
    <div className="ad-metric ad-fade" style={{ "--accent": accent, animationDelay: delay }}>
      <div className="ad-metric-icon">{icon}</div>
      <div className="ad-metric-val">{anim.toLocaleString()}</div>
      <div className="ad-metric-label">{label}</div>
      {delta != null && (
        <div className={`ad-metric-delta ${deltaType || "neutral"}`}>
          {deltaType === "up" ? "↑" : deltaType === "down" ? "↓" : "~"} {delta}
        </div>
      )}
    </div>
  );
}

function ProgressRow({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, color, fontWeight: 700, fontFamily: "var(--mono)" }}>
          {value} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({pct}%)</span>
        </span>
      </div>
      <div className="ad-progress">
        <div className="ad-progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color}88,${color})` }} />
      </div>
    </div>
  );
}

function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [items.length]);
  const total = Math.max(1, Math.ceil(items.length / pageSize));
  const slice = items.slice((page - 1) * pageSize, page * pageSize);
  return { page, setPage, total, slice };
}

function useSort(items) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const toggle = key => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };
  const sorted = sortKey
    ? [...items].sort((a, b) => {
        const av = a[sortKey] ?? "", bv = b[sortKey] ?? "";
        const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      })
    : items;
  return { sorted, sortKey, sortDir, toggle };
}

const PAGE_SIZE = 10;

/* ─────────────────── Main Component ─────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate();

  const role = localStorage.getItem("role") || "user";
  if (role !== "admin") { window.location.href = "/"; return null; }

  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState("users");
  const [alerts,        setAlerts]        = useState([]);
  const [actionLoad,    setActionLoad]    = useState(null);
  const [toasts,        setToasts]        = useState([]);
  const [confirm,       setConfirm]       = useState(null);
  const [autoRefresh,   setAutoRefresh]   = useState(false);
  const [lastRefresh,   setLastRefresh]   = useState(null);
  const [selected,      setSelected]      = useState(new Set());
  const [drawerUser,    setDrawerUser]    = useState(null);
  const [debugLog,      setDebugLog]      = useState([]);
  const [showDebug,     setShowDebug]     = useState(false);
  const [plagLoad,      setPlagLoad]      = useState(null);
  const [showBulkImport,setShowBulkImport]= useState(false); // ← NEW

  // Per-tab search/filter
  const [userSearch,  setUserSearch]  = useState("");
  const [userRole,    setUserRole]    = useState("all");
  const [userStatus,  setUserStatus]  = useState("all");
  const [probSearch,  setProbSearch]  = useState("");
  const [probDiff,    setProbDiff]    = useState("all");
  const [contSearch,  setContSearch]  = useState("");
  const [contStatus,  setContStatus]  = useState("all");
  const [subSearch,   setSubSearch]   = useState("");
  const [subVerdict,  setSubVerdict]  = useState("all");

  const intervalRef = useRef(null);

  const showToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  const handlePlagCheck = async (contestId, contestTitle) => {
    setConfirm({
      msg: `Run plagiarism check for "${contestTitle}"? Flagged users will have their scores set to 0 and will be emailed.`,
      confirmLabel: "Run Check", confirmColor: "#8B5CF6",
      onConfirm: async () => {
        setConfirm(null); setPlagLoad(contestId);
        try {
          await API.post(`/plagiarism/contests/${contestId}/check-plagiarism`);
          showToast(`Plag check started for "${contestTitle}" ✓`);
        } catch { showToast("Failed to start plagiarism check", "error"); }
        finally { setPlagLoad(null); }
      },
    });
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, problemsRes, contestsRes, submissionsRes, activityRes] =
        await Promise.allSettled([
          API.get("/admin/stats"),
          API.get("/admin/users"),
          API.get("/admin/problems"),
          API.get("/contests"),
          API.get("/admin/submissions"),
          API.get("/admin/activity"),
        ]);

      const log = [
        ["/admin/stats", statsRes],["/admin/users", usersRes],["/admin/problems", problemsRes],
        ["/contests", contestsRes],["/admin/submissions", submissionsRes],["/admin/activity", activityRes],
      ].map(([ep,res])=>({ep,status:res.status==="fulfilled"?"✅ OK":"❌ ERR",type:res.status==="fulfilled"?(Array.isArray(res.value.data)?`Array(${res.value.data.length})`:typeof res.value.data):"—",preview:res.status==="fulfilled"?JSON.stringify(res.value.data).slice(0,120):res.reason?.message||String(res.reason)}));
      setDebugLog(log);

      const rawContests = contestsRes.status === "fulfilled" ? contestsRes.value.data : [];
      const normalizedContests = Array.isArray(rawContests) ? rawContests : rawContests?.contests ?? rawContests?.data ?? [];

      setData({
        stats:       statsRes.status       === "fulfilled" ? statsRes.value.data      : {},
        users:       usersRes.status       === "fulfilled" ? usersRes.value.data       : [],
        problems:    problemsRes.status    === "fulfilled" ? problemsRes.value.data    : [],
        contests:    normalizedContests,
        submissions: submissionsRes.status === "fulfilled" ? submissionsRes.value.data : [],
        activity:    activityRes.status    === "fulfilled" ? activityRes.value.data    : [],
      });

      const s = statsRes.status === "fulfilled" ? statsRes.value.data : {};
      const newAlerts = [];
      if (s.pendingProblems > 0) newAlerts.push({ type: "warning", msg: `${s.pendingProblems} problem(s) pending review.`,  id: "pending"  });
      if (s.activeContests  > 0) newAlerts.push({ type: "success", msg: `${s.activeContests} contest(s) currently live.`,   id: "live"     });
      if (s.newUsersToday   > 0) newAlerts.push({ type: "info",    msg: `${s.newUsersToday} new user(s) registered today.`, id: "newusers" });
      setAlerts(newAlerts);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err); showToast("Failed to load dashboard data", "error");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => { fetchAll(); showToast("Data refreshed", "info"); }, 30000);
    } else { clearInterval(intervalRef.current); }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, fetchAll]);

  useEffect(() => setSelected(new Set()), [activeTab]);

  /* ── Actions ── */
  const promoteUser = async (userId) => {
    setActionLoad(userId);
    try {
      await API.put(`/admin/users/${userId}/promote`);
      setData(d => ({ ...d, users: d.users.map(u => u._id === userId ? { ...u, role: "admin" } : u) }));
      showToast("User promoted to admin ✓");
    } catch { showToast("Failed to promote user", "error"); }
    finally { setActionLoad(null); }
  };

  const banUser = async (userId, username) => {
    setConfirm({
      msg: `Ban "${username}"? They will lose platform access.`,
      confirmLabel: "Ban", confirmColor: "#EF4444",
      onConfirm: async () => {
        setConfirm(null); setActionLoad(userId);
        try {
          await API.put(`/admin/users/${userId}/ban`);
          setData(d => ({ ...d, users: d.users.map(u => u._id === userId ? { ...u, status: "banned" } : u) }));
          showToast("User banned ✓");
        } catch { showToast("Failed to ban user", "error"); }
        finally { setActionLoad(null); }
      },
    });
  };

  const unbanUser = async (userId, username) => {
    setConfirm({
      msg: `Unban "${username}"? They will regain platform access.`,
      confirmLabel: "Unban", confirmColor: "#22C55E",
      onConfirm: async () => {
        setConfirm(null); setActionLoad(userId);
        try {
          await API.put(`/admin/users/${userId}/unban`);
          setData(d => ({ ...d, users: d.users.map(u => u._id === userId ? { ...u, status: "active" } : u) }));
          showToast("User unbanned ✓");
        } catch { showToast("Failed to unban user", "error"); }
        finally { setActionLoad(null); }
      },
    });
  };

  const approveProblem = async (pid, title) => {
    try {
      await API.put(`/admin/problems/${pid}/approve`);
      setData(d => ({ ...d, problems: d.problems.map(p => p._id === pid ? { ...p, status: "approved" } : p) }));
      showToast(`"${title}" approved ✓`);
    } catch { showToast("Failed to approve problem", "error"); }
  };

  const deleteProblem = async (pid, title) => {
    setConfirm({
      msg: `Delete problem "${title}"? This cannot be undone.`,
      confirmLabel: "Delete", confirmColor: "#EF4444",
      onConfirm: async () => {
        setConfirm(null);
        try {
          await API.delete(`/problems/${pid}`);
          setData(d => ({ ...d, problems: d.problems.filter(p => p._id !== pid) }));
          showToast("Problem deleted ✓");
        } catch { showToast("Failed to delete problem", "error"); }
      },
    });
  };

  const deleteContest = async (cid, title) => {
    setConfirm({
      msg: `Delete contest "${title}"? This cannot be undone.`,
      confirmLabel: "Delete", confirmColor: "#EF4444",
      onConfirm: async () => {
        setConfirm(null);
        try {
          await API.delete(`/contests/${cid}`);
          setData(d => ({ ...d, contests: d.contests.filter(c => c._id !== cid) }));
          showToast("Contest deleted ✓");
        } catch { showToast("Failed to delete contest", "error"); }
      },
    });
  };

  const bulkDelete = async () => {
    const ids = [...selected];
    setConfirm({
      msg: `Delete ${ids.length} selected item(s)? This cannot be undone.`,
      confirmLabel: "Delete All", confirmColor: "#EF4444",
      onConfirm: async () => {
        setConfirm(null);
        try {
          if (activeTab==="users")    await Promise.all(ids.map(id=>API.delete(`/admin/users/${id}`)));
          if (activeTab==="problems") await Promise.all(ids.map(id=>API.delete(`/problems/${id}`)));
          if (activeTab==="contests") await Promise.all(ids.map(id=>API.delete(`/contests/internal/${id}`)));
          setData(d=>({...d,users:activeTab==="users"?d.users.filter(u=>!ids.includes(u._id)):d.users,problems:activeTab==="problems"?d.problems.filter(p=>!ids.includes(p._id)):d.problems,contests:activeTab==="contests"?d.contests.filter(c=>!ids.includes(c._id)):d.contests}));
          setSelected(new Set()); showToast(`Deleted ${ids.length} items ✓`);
        } catch { showToast("Bulk delete partially failed","error"); }
      },
    });
  };

  /* ── Derived ── */
  const st          = data?.stats       || {};
  const users       = data?.users       || [];
  const problems    = data?.problems    || [];
  const contests    = data?.contests    || [];
  const submissions = data?.submissions || [];
  const activity    = data?.activity    || [];

  const easyCount   = problems.filter(p => p.difficulty === "Easy").length;
  const mediumCount = problems.filter(p => p.difficulty === "Medium").length;
  const hardCount   = problems.filter(p => p.difficulty === "Hard").length;
  const maxAct      = Math.max(...activity.map(a => a.count), 1);

  /* ── Filtered ── */
  const filteredUsers    = users.filter(u => {const q=userSearch.toLowerCase();return(!q||(u.username||u.name||"").toLowerCase().includes(q)||(u.email||"").toLowerCase().includes(q))&&(userRole==="all"||u.role===userRole)&&(userStatus==="all"||(u.status||"active")===userStatus);});
  const filteredProblems = problems.filter(p => {const q=probSearch.toLowerCase();return(!q||(p.title||"").toLowerCase().includes(q)||(p.slug||"").toLowerCase().includes(q))&&(probDiff==="all"||p.difficulty===probDiff);});
  const filteredContests = contests.filter(c => {const status=c.status||deriveStatus(c.startTime,c.endTime);return(!contSearch||(c.title||"").toLowerCase().includes(contSearch.toLowerCase()))&&(contStatus==="all"||status===contStatus);});
  const filteredSubs     = submissions.filter(s => {const q=subSearch.toLowerCase();return(!q||(s.username||"").toLowerCase().includes(q)||(s.problemTitle||"").toLowerCase().includes(q))&&(subVerdict==="all"||s.verdict===subVerdict);});

  /* ── Sort ── */
  const {sorted:sortedUsers,    sortKey:skU,sortDir:sdU,toggle:toggleU}=useSort(filteredUsers);
  const {sorted:sortedProblems, sortKey:skP,sortDir:sdP,toggle:toggleP}=useSort(filteredProblems);
  const {sorted:sortedContests, sortKey:skC,sortDir:sdC,toggle:toggleC}=useSort(filteredContests);
  const {sorted:sortedSubs,     sortKey:skS,sortDir:sdS,toggle:toggleS}=useSort(filteredSubs);

  /* ── Pagination ── */
  const userPag=usePagination(sortedUsers,    PAGE_SIZE);
  const probPag=usePagination(sortedProblems, PAGE_SIZE);
  const contPag=usePagination(sortedContests, PAGE_SIZE);
  const subPag =usePagination(sortedSubs,     PAGE_SIZE);

  /* ── Selection ── */
  const toggleSelect=id=>setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll=items=>{const ids=items.map(i=>i._id);const allSel=ids.every(id=>selected.has(id));setSelected(s=>{const n=new Set(s);allSel?ids.forEach(id=>n.delete(id)):ids.forEach(id=>n.add(id));return n;});};

  /* ── Paginator ── */
  const Paginator=({pag,label})=>{if(pag.total<=1)return null;return(<div className="ad-pagination"><span className="ad-pagination-info">Showing {((pag.page-1)*PAGE_SIZE)+1}–{Math.min(pag.page*PAGE_SIZE,label)} of {label}</span><div className="ad-pagination-btns"><button className="ad-page-btn" onClick={()=>pag.setPage(1)} disabled={pag.page===1}>«</button><button className="ad-page-btn" onClick={()=>pag.setPage(p=>p-1)} disabled={pag.page===1}>‹</button>{Array.from({length:Math.min(pag.total,5)},(_,i)=>{const start=Math.max(1,Math.min(pag.page-2,pag.total-4));const pg=start+i;return pg<=pag.total?<button key={pg} className={`ad-page-btn ${pag.page===pg?"on":""}`} onClick={()=>pag.setPage(pg)}>{pg}</button>:null;})}<button className="ad-page-btn" onClick={()=>pag.setPage(p=>p+1)} disabled={pag.page===pag.total}>›</button><button className="ad-page-btn" onClick={()=>pag.setPage(pag.total)} disabled={pag.page===pag.total}>»</button></div></div>);};

  /* ── Sortable TH ── */
  const SortTh=({label,k,sortKey,sortDir,toggle})=>(<th className={`ad-th ${sortKey===k?(sortDir==="asc"?"sort-asc":"sort-desc"):""}`} onClick={()=>toggle(k)}>{label}</th>);

  /* ── Toolbar ── */
  const Toolbar=({search,setSearch,placeholder,filters,exportCols,exportData,exportName})=>(<div className="ad-toolbar"><div className="ad-search"><span style={{color:"var(--muted)",fontSize:14}}>🔍</span><input placeholder={placeholder} value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:14}}>✕</button>}</div>{filters}<div className="ad-toolbar-right"><button className="ad-export-btn" onClick={()=>exportCSV(exportData,exportCols,`${exportName}.csv`)} style={{color:"var(--green)",borderColor:"rgba(34,197,94,0.3)",background:"rgba(34,197,94,0.06)"}}>⬇ CSV</button><button className="ad-export-btn" onClick={()=>exportJSON(exportData,`${exportName}.json`)} style={{color:"var(--cyan)",borderColor:"rgba(0,180,216,0.3)",background:"rgba(0,180,216,0.06)"}}>⬇ JSON</button></div></div>);

  /* ── Bulk bar ── */
  const BulkBar=()=>selected.size>0?(<div className="ad-bulk-bar"><span className="ad-bulk-text">✓ {selected.size} selected</span><button className="ad-bulk-btn" onClick={bulkDelete} style={{color:"var(--red)",borderColor:"rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.06)"}}>Delete Selected</button><button className="ad-bulk-btn" onClick={()=>setSelected(new Set())} style={{color:"var(--muted)",borderColor:"var(--border)",background:"transparent"}}>Clear</button></div>):null;

  /* ── Quick Actions config ── */
  const quickActions = [
    { icon:"➕", label:"Add Problem",  sub:"Create new DSA problem",    color:"#22C55E", badge:null,  onClick:()=>navigate("/admin/problems/new") },
    { icon:"🎯", label:"New Contest",  sub:"Set up a timed contest",     color:"#F59E0B", badge:null,  onClick:()=>navigate("/admin/contests/new") },
    { icon:"👥", label:"All Users",    sub:"View & manage accounts",     color:"#00B4D8", badge:null,  onClick:()=>navigate("/admin/users") },
    { icon:"📊", label:"Analytics",    sub:"Charts & deep insights",     color:"#8B5CF6", badge:null,  onClick:()=>navigate("/admin/analytics") },
    { icon:"📥", label:"Bulk Import",  sub:"Import problems via CSV",    color:"#EC4899", badge:"CSV", onClick:()=>setShowBulkImport(true) },  // ← opens modal
    { icon:"⚙️", label:"Settings",     sub:"Platform configuration",     color:"#64748B", badge:null,  onClick:()=>navigate("/admin/settings") },
  ];

  return (
    <>
      <style>{CSS}</style>

      {/* Toasts */}
      <div className="ad-toast-wrap">
        {toasts.map(t=>(
          <div key={t.id} className={`ad-toast ${t.type}`}>
            {t.type==="success"?"✓":t.type==="error"?"✗":"ℹ"} {t.msg}
          </div>
        ))}
      </div>

      {/* Confirm modal */}
      {confirm&&(
        <div className="ad-overlay">
          <div className="ad-modal">
            <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
            <div style={{color:"#E2E8F0",fontWeight:700,fontSize:16,marginBottom:8}}>Are you sure?</div>
            <div style={{color:"#64748B",fontSize:13,marginBottom:24}}>{confirm.msg}</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setConfirm(null)} style={{padding:"9px 24px",borderRadius:8,border:"1px solid #21262D",background:"transparent",color:"#64748B",cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Cancel</button>
              <button onClick={confirm.onConfirm} style={{padding:"9px 24px",borderRadius:8,border:"none",background:confirm.confirmColor||"#EF4444",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700}}>{confirm.confirmLabel||"Confirm"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Import Modal ── */}
      {showBulkImport&&(
        <BulkImportModal
          onClose={()=>setShowBulkImport(false)}
          showToast={showToast}
          onImported={(count)=>{
            showToast(`${count} problem${count!==1?"s":""} imported successfully ✓`);
            fetchAll(); // refresh dashboard data
          }}
        />
      )}

      <div className="ad-page">
        <div className="ad-inner">

          {/* Alerts */}
          {alerts.map((a,i)=>(
            <div key={a.id} className={`ad-alert ${a.type} ad-fade-in`} style={{animationDelay:`${i*0.1}s`}}>
              <span style={{fontSize:16}}>{a.type==="warning"?"⚠️":a.type==="success"?"✅":"ℹ️"}</span>
              <span className="ad-alert-text">{a.msg}</span>
              <button className="ad-alert-close" onClick={()=>setAlerts(p=>p.filter(x=>x.id!==a.id))}>✕</button>
            </div>
          ))}

          {/* Header */}
          <div className="ad-hdr">
            <div>
              <div className="ad-badge"><div className="ad-badge-dot"/> Admin Dashboard</div>
              <div className="ad-title">Platform <span>Control.</span></div>
              <div className="ad-sub">
                Manage users, problems, contests and monitor platform health.
                {lastRefresh&&<span style={{marginLeft:12,color:"var(--green)"}}>Last updated: {lastRefresh.toLocaleTimeString()}</span>}
              </div>
            </div>
            <div className="ad-hdr-right">
              <button className="ad-btn" onClick={()=>setAutoRefresh(v=>!v)} style={{background:"transparent",color:autoRefresh?"var(--green)":"var(--muted)",borderColor:autoRefresh?"rgba(34,197,94,0.4)":"var(--border)",gap:8}}>
                {autoRefresh&&<div className="ad-refresh-dot"/>} Auto-Refresh {autoRefresh?"ON":"OFF"}
              </button>
              <button className="ad-btn" onClick={()=>navigate("/admin/analytics")} style={{background:"transparent",color:"var(--purple)",borderColor:"rgba(139,92,246,0.3)"}}>📊 Analytics</button>
              <button className="ad-btn ad-btn-primary" onClick={()=>navigate("/admin/problems/new")}>➕ Add Problem</button>
              <button className="ad-btn ad-btn-ghost"   onClick={()=>navigate("/admin/contests/new")}>🎯 New Contest</button>
              <button className="ad-btn" onClick={fetchAll} style={{background:"transparent",color:"var(--cyan)",borderColor:"rgba(0,180,216,0.3)"}}>↻ Refresh</button>
            </div>
          </div>

          {/* Metrics */}
          {loading?(
            <div className="ad-metrics">{Array.from({length:6}).map((_,i)=><div key={i} className="ad-shimmer" style={{height:130}}/>)}</div>
          ):(
            <div className="ad-metrics">
              <MetricCard icon="👥" label="Total Users"       value={st.totalUsers       ||users.length}       accent="#22C55E" delta={st.newUsersToday?`+${st.newUsersToday} today`:null} deltaType="up"      delay="0s"/>
              <MetricCard icon="💻" label="Total Problems"    value={st.totalProblems    ||problems.length}    accent="#00B4D8" delta={st.pendingProblems?`${st.pendingProblems} pending`:null} deltaType="neutral" delay="0.07s"/>
              <MetricCard icon="🏆" label="Total Contests"    value={st.totalContests    ||contests.length}    accent="#F59E0B" delta={st.activeContests?`${st.activeContests} live`:null} deltaType="up"      delay="0.14s"/>
              <MetricCard icon="📬" label="Total Submissions" value={st.totalSubmissions ||submissions.length} accent="#8B5CF6" delay="0.21s"/>
              <MetricCard icon="✅" label="Acceptance Rate"   value={Math.round(st.acceptanceRate||0)}          accent="#22C55E" delta="%" deltaType="neutral" delay="0.28s"/>
              <MetricCard icon="🔥" label="Active Today"      value={st.activeToday||0}                         accent="#EF4444" delay="0.35s"/>
            </div>
          )}

          {/* Mid row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20,marginBottom:28}}>
            <div className="ad-card ad-fade" style={{animationDelay:"0.2s"}}>
              <div className="ad-card-header"><div className="ad-card-title">Submission Activity</div><div className="ad-card-meta">Last 30 days</div></div>
              <div style={{padding:"20px 22px 16px"}}>
                {loading?<div className="ad-shimmer" style={{height:88}}/>:(
                  <>
                    <div className="ad-bar-chart">
                      {activity.slice(-30).map((a,i)=>{const pct=(a.count/maxAct)*100;const color=pct>66?"#22C55E":pct>33?"#16A34A":pct>0?"#15803D":"#1E2530";return <div key={i} className="ad-bar-col" title={`${a.count} submissions`}><div className="ad-bar-fill" style={{height:`${Math.max(pct,3)}%`,background:color}}/></div>;})}
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:10,color:"var(--muted)",fontFamily:"var(--mono)"}}>
                      {activity.length>0&&<><span>{new Date(activity[Math.max(0,activity.length-30)]?.date).toLocaleDateString("en",{month:"short",day:"numeric"})}</span><span>Today</span></>}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="ad-card ad-fade" style={{animationDelay:"0.25s"}}>
              <div className="ad-card-header"><div className="ad-card-title">Problem Split</div><div className="ad-card-meta">{problems.length} total</div></div>
              <div style={{padding:"20px 22px"}}>
                {loading?[0,1,2].map(i=><div key={i} className="ad-shimmer" style={{height:32,marginBottom:12}}/>):(
                  <><ProgressRow label="Easy" value={easyCount} total={problems.length} color="#22C55E"/><ProgressRow label="Medium" value={mediumCount} total={problems.length} color="#F59E0B"/><ProgressRow label="Hard" value={hardCount} total={problems.length} color="#EF4444"/></>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{marginBottom:28}}>
            <div className="ad-section-label">⚡ Quick Actions</div>
            <div className="ad-quick-grid">
              {quickActions.map(({icon,label,sub,color,badge,onClick})=>(
                <div key={label} className="ad-quick-card" style={{"--qc-color":color}} onClick={onClick}>
                  <div className="ad-quick-card-glow" style={{background:`radial-gradient(circle,${color}22 0%,transparent 70%)`}}/>
                  {badge&&<span className="ad-quick-card-badge" style={{color,background:`${color}18`,border:`1px solid ${color}33`}}>{badge}</span>}
                  <div className="ad-quick-card-icon">{icon}</div>
                  <div className="ad-quick-card-label">{label}</div>
                  <div className="ad-quick-card-sub">{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Debug panel */}
          {debugLog.length>0&&(
            <div style={{marginBottom:20}}>
              <button onClick={()=>setShowDebug(v=>!v)} style={{background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.25)",color:"var(--purple)",borderRadius:8,padding:"7px 16px",fontFamily:"var(--font)",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                🛠 {showDebug?"Hide":"Show"} API Debug Panel
                {debugLog.some(l=>l.status.startsWith("❌"))&&<span style={{background:"var(--red)",color:"#fff",borderRadius:20,padding:"1px 8px",fontSize:10}}>ERRORS</span>}
              </button>
              {showDebug&&(
                <div style={{marginTop:10,background:"#0D1117",border:"1px solid rgba(139,92,246,0.25)",borderRadius:12,overflow:"hidden"}}>
                  <div style={{padding:"10px 16px",background:"rgba(139,92,246,0.07)",borderBottom:"1px solid rgba(139,92,246,0.15)",fontSize:11,fontWeight:700,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1}}>API Response Inspector</div>
                  <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"var(--mono)",fontSize:12}}>
                    <thead><tr style={{background:"rgba(255,255,255,0.02)"}}>{["Endpoint","Status","Type","Preview"].map(h=><th key={h} style={{padding:"8px 14px",textAlign:"left",color:"var(--muted)",fontWeight:600,fontSize:11,borderBottom:"1px solid var(--border)"}}>{h}</th>)}</tr></thead>
                    <tbody>{debugLog.map(({ep,status,type,preview})=>(<tr key={ep} style={{borderBottom:"1px solid var(--border)"}}><td style={{padding:"8px 14px",color:"var(--cyan)"}}>{ep}</td><td style={{padding:"8px 14px",color:status.startsWith("✅")?"var(--green)":"var(--red)",fontWeight:700}}>{status}</td><td style={{padding:"8px 14px",color:"var(--amber)"}}>{type}</td><td style={{padding:"8px 14px",color:"var(--muted)",maxWidth:500,whiteSpace:"pre-wrap",wordBreak:"break-all"}}>{preview}</td></tr>))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tables */}
          <div className="ad-section-label">📋 Management Tables</div>
          <div className="ad-card ad-fade" style={{animationDelay:"0.35s"}}>
            <div className="ad-tabs">
              {[{id:"users",label:`👥 Users (${filteredUsers.length})`},{id:"problems",label:`💻 Problems (${filteredProblems.length})`},{id:"contests",label:`🏆 Contests (${filteredContests.length})`},{id:"submissions",label:`📬 Submissions (${filteredSubs.length})`}].map(t=>(
                <button key={t.id} className={`ad-tab ${activeTab===t.id?"on":""}`} onClick={()=>setActiveTab(t.id)}>{t.label}</button>
              ))}
            </div>

            {loading?(
              <div style={{padding:24}}>{Array.from({length:5}).map((_,i)=><div key={i} className="ad-shimmer" style={{height:44,marginBottom:8}}/>)}</div>
            ):(
              <>
                {activeTab==="users"&&(
                  <><Toolbar search={userSearch} setSearch={setUserSearch} placeholder="Search by name or email…" exportCols={["username","email","role","totalSolved","status","createdAt"]} exportData={filteredUsers} exportName="users" filters={<><select className="ad-filter-select" value={userRole} onChange={e=>setUserRole(e.target.value)}><option value="all">All Roles</option><option value="admin">Admin</option><option value="user">User</option></select><select className="ad-filter-select" value={userStatus} onChange={e=>setUserStatus(e.target.value)}><option value="all">All Status</option><option value="active">Active</option><option value="banned">Banned</option></select></>}/><BulkBar/><div style={{overflowX:"auto"}}><table className="ad-table"><thead><tr><th className="ad-th" style={{width:40}}><input type="checkbox" className="ad-checkbox" checked={userPag.slice.length>0&&userPag.slice.every(u=>selected.has(u._id))} onChange={()=>toggleAll(userPag.slice)}/></th><th className="ad-th">#</th><SortTh label="User" k="username" sortKey={skU} sortDir={sdU} toggle={toggleU}/><SortTh label="Email" k="email" sortKey={skU} sortDir={sdU} toggle={toggleU}/><SortTh label="Role" k="role" sortKey={skU} sortDir={sdU} toggle={toggleU}/><SortTh label="Solved" k="totalSolved" sortKey={skU} sortDir={sdU} toggle={toggleU}/><SortTh label="Joined" k="createdAt" sortKey={skU} sortDir={sdU} toggle={toggleU}/><th className="ad-th">Status</th><th className="ad-th">Actions</th></tr></thead><tbody>{userPag.slice.length===0?<tr><td colSpan={9} style={{padding:"40px",textAlign:"center",color:"var(--muted)"}}>No users found</td></tr>:userPag.slice.map((u,i)=>(<tr key={u._id} className={`ad-tr ${selected.has(u._id)?"selected":""}`}><td className="ad-td"><input type="checkbox" className="ad-checkbox" checked={selected.has(u._id)} onChange={()=>toggleSelect(u._id)}/></td><td className="ad-td" style={{color:"var(--muted)",fontFamily:"var(--mono)",fontSize:11}}>{String((userPag.page-1)*PAGE_SIZE+i+1).padStart(2,"0")}</td><td className="ad-td"><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:u.role==="admin"?"linear-gradient(135deg,#F59E0B,#EF4444)":"linear-gradient(135deg,#22C55E,#00B4D8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#0D1117"}}>{(u.username||u.name||"?")[0].toUpperCase()}</div><span style={{fontWeight:600}}>{u.username||u.name}</span></div></td><td className="ad-td" style={{color:"var(--muted)",fontFamily:"var(--mono)",fontSize:12}}>{u.email}</td><td className="ad-td"><span className="ad-pill" style={{color:u.role==="admin"?"var(--amber)":"var(--green)",background:u.role==="admin"?"rgba(245,158,11,0.12)":"rgba(34,197,94,0.10)",border:`1px solid ${u.role==="admin"?"rgba(245,158,11,0.3)":"rgba(34,197,94,0.25)"}`}}>{u.role==="admin"?"⚡ Admin":"● User"}</span></td><td className="ad-td" style={{fontFamily:"var(--mono)",fontWeight:700}}>{u.totalSolved??0}</td><td className="ad-td" style={{color:"var(--muted)",fontSize:12}}>{u.createdAt?new Date(u.createdAt).toLocaleDateString():"—"}</td><td className="ad-td"><span className="ad-pill" style={{color:u.status==="banned"?"var(--red)":"var(--green)",background:u.status==="banned"?"rgba(239,68,68,0.1)":"rgba(34,197,94,0.1)",border:`1px solid ${u.status==="banned"?"rgba(239,68,68,0.25)":"rgba(34,197,94,0.2)"}`}}>{u.status==="banned"?"Banned":"Active"}</span></td><td className="ad-td"><button className="ad-row-btn" onClick={()=>setDrawerUser(u)} style={{borderColor:"rgba(34,197,94,0.3)",color:"var(--green)",background:"rgba(34,197,94,0.06)"}}>View</button>{u.role!=="admin"&&<button className="ad-row-btn" onClick={()=>promoteUser(u._id)} disabled={actionLoad===u._id} style={{borderColor:"rgba(245,158,11,0.3)",color:"var(--amber)",background:"rgba(245,158,11,0.06)"}}>{actionLoad===u._id?"…":"Promote"}</button>}{u.status==="banned"?<button className="ad-row-btn" onClick={()=>unbanUser(u._id,u.username||u.name)} disabled={actionLoad===u._id} style={{borderColor:"rgba(34,197,94,0.3)",color:"var(--green)",background:"rgba(34,197,94,0.06)"}}>Unban</button>:<button className="ad-row-btn" onClick={()=>banUser(u._id,u.username||u.name)} disabled={actionLoad===u._id} style={{borderColor:"rgba(239,68,68,0.3)",color:"var(--red)",background:"rgba(239,68,68,0.06)"}}>Ban</button>}</td></tr>))}</tbody></table></div><Paginator pag={userPag} label={filteredUsers.length}/></>
                )}

                {activeTab==="problems"&&(
                  <><Toolbar search={probSearch} setSearch={setProbSearch} placeholder="Search problems…" exportCols={["title","difficulty","totalSubmissions","acceptanceRate","createdAt"]} exportData={filteredProblems} exportName="problems" filters={<select className="ad-filter-select" value={probDiff} onChange={e=>setProbDiff(e.target.value)}><option value="all">All Difficulties</option><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select>}/><BulkBar/><div style={{overflowX:"auto"}}><table className="ad-table"><thead><tr><th className="ad-th" style={{width:40}}><input type="checkbox" className="ad-checkbox" checked={probPag.slice.length>0&&probPag.slice.every(p=>selected.has(p._id))} onChange={()=>toggleAll(probPag.slice)}/></th><th className="ad-th">#</th><SortTh label="Title" k="title" sortKey={skP} sortDir={sdP} toggle={toggleP}/><SortTh label="Difficulty" k="difficulty" sortKey={skP} sortDir={sdP} toggle={toggleP}/><SortTh label="Submissions" k="totalSubmissions" sortKey={skP} sortDir={sdP} toggle={toggleP}/><SortTh label="Acceptance" k="acceptanceRate" sortKey={skP} sortDir={sdP} toggle={toggleP}/><SortTh label="Created" k="createdAt" sortKey={skP} sortDir={sdP} toggle={toggleP}/><th className="ad-th">Actions</th></tr></thead><tbody>{probPag.slice.length===0?<tr><td colSpan={8} style={{padding:"40px",textAlign:"center",color:"var(--muted)"}}>No problems found</td></tr>:probPag.slice.map((p,i)=>(<tr key={p._id} className={`ad-tr ${selected.has(p._id)?"selected":""}`}><td className="ad-td"><input type="checkbox" className="ad-checkbox" checked={selected.has(p._id)} onChange={()=>toggleSelect(p._id)}/></td><td className="ad-td" style={{color:"var(--muted)",fontFamily:"var(--mono)",fontSize:11}}>{String((probPag.page-1)*PAGE_SIZE+i+1).padStart(2,"0")}</td><td className="ad-td" style={{fontWeight:600,maxWidth:260}}>{p.status==="pending"&&<span style={{fontSize:10,background:"rgba(245,158,11,0.15)",color:"var(--amber)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:4,padding:"1px 6px",marginRight:6,fontWeight:700}}>PENDING</span>}{p.title}</td><td className="ad-td"><span className="ad-pill" style={{color:diffColor(p.difficulty),background:`${diffColor(p.difficulty)}15`,border:`1px solid ${diffColor(p.difficulty)}30`}}>{p.difficulty}</span></td><td className="ad-td" style={{fontFamily:"var(--mono)"}}>{p.totalSubmissions??0}</td><td className="ad-td"><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:4,background:"var(--border)",borderRadius:2,overflow:"hidden",maxWidth:60}}><div style={{height:"100%",width:`${p.acceptanceRate||0}%`,background:"var(--green)",borderRadius:2}}/></div><span style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--green)"}}>{p.acceptanceRate??0}%</span></div></td><td className="ad-td" style={{color:"var(--muted)",fontSize:12}}>{p.createdAt?new Date(p.createdAt).toLocaleDateString():"—"}</td><td className="ad-td">{p.status==="pending"&&<button className="ad-approve-btn" onClick={()=>approveProblem(p._id,p.title)}>✓ Approve</button>}<button className="ad-row-btn" onClick={()=>navigate(`/problems/slug/${p.slug||p._id}`)} style={{borderColor:"rgba(34,197,94,0.3)",color:"var(--green)",background:"rgba(34,197,94,0.06)"}}>View</button><button className="ad-row-btn" onClick={()=>navigate(`/admin/problems/edit/${p._id}`)} style={{borderColor:"rgba(245,158,11,0.3)",color:"var(--amber)",background:"rgba(245,158,11,0.06)"}}>Edit</button><button className="ad-row-btn" onClick={()=>deleteProblem(p._id,p.title)} style={{borderColor:"rgba(239,68,68,0.3)",color:"var(--red)",background:"rgba(239,68,68,0.06)"}}>Delete</button></td></tr>))}</tbody></table></div><Paginator pag={probPag} label={filteredProblems.length}/></>
                )}

                {activeTab==="contests"&&(
                  <><Toolbar search={contSearch} setSearch={setContSearch} placeholder="Search contests…" exportCols={["title","startTime","endTime","participants"]} exportData={filteredContests} exportName="contests" filters={<select className="ad-filter-select" value={contStatus} onChange={e=>setContStatus(e.target.value)}><option value="all">All Status</option><option value="live">Live</option><option value="upcoming">Upcoming</option><option value="ended">Ended</option></select>}/><BulkBar/><div style={{overflowX:"auto"}}><table className="ad-table"><thead><tr><th className="ad-th" style={{width:40}}><input type="checkbox" className="ad-checkbox" checked={contPag.slice.length>0&&contPag.slice.every(c=>selected.has(c._id))} onChange={()=>toggleAll(contPag.slice)}/></th><th className="ad-th">#</th><SortTh label="Title" k="title" sortKey={skC} sortDir={sdC} toggle={toggleC}/><th className="ad-th">Status</th><SortTh label="Problems" k="problems" sortKey={skC} sortDir={sdC} toggle={toggleC}/><SortTh label="Participants" k="participants" sortKey={skC} sortDir={sdC} toggle={toggleC}/><SortTh label="Start" k="startTime" sortKey={skC} sortDir={sdC} toggle={toggleC}/><SortTh label="End" k="endTime" sortKey={skC} sortDir={sdC} toggle={toggleC}/><th className="ad-th" style={{minWidth:360}}>Actions</th></tr></thead><tbody>{contPag.slice.length===0?<tr><td colSpan={9} style={{padding:"40px",textAlign:"center",color:"var(--muted)"}}>No contests found</td></tr>:contPag.slice.map((c,i)=>{const status=c.status||deriveStatus(c.startTime,c.endTime);const sColor=status==="live"?"var(--green)":status==="upcoming"?"var(--cyan)":"var(--muted)";const sBg=status==="live"?"rgba(34,197,94,0.1)":status==="upcoming"?"rgba(0,180,216,0.1)":"rgba(100,116,139,0.1)";return(<tr key={c._id} className={`ad-tr ${selected.has(c._id)?"selected":""}`}><td className="ad-td"><input type="checkbox" className="ad-checkbox" checked={selected.has(c._id)} onChange={()=>toggleSelect(c._id)}/></td><td className="ad-td" style={{color:"var(--muted)",fontFamily:"var(--mono)",fontSize:11}}>{String((contPag.page-1)*PAGE_SIZE+i+1).padStart(2,"0")}</td><td className="ad-td" style={{fontWeight:600}}>{c.title}</td><td className="ad-td"><span className="ad-pill" style={{color:sColor,background:sBg,border:`1px solid ${sColor}30`,textTransform:"capitalize"}}>{status==="live"?"● ":""}{status}</span></td><td className="ad-td" style={{fontFamily:"var(--mono)"}}>{c.problems?.length??0}</td><td className="ad-td" style={{fontFamily:"var(--mono)"}}>{c.participants??0}</td><td className="ad-td" style={{color:"var(--muted)",fontSize:12}}>{c.startTime?new Date(c.startTime).toLocaleString():"—"}</td><td className="ad-td" style={{color:"var(--muted)",fontSize:12}}>{c.endTime?new Date(c.endTime).toLocaleString():"—"}</td><td className="ad-td" style={{whiteSpace:"nowrap"}}>{status==="live"?<button className="ad-row-btn" onClick={()=>navigate(`/admin/contests/live/${c._id}`)} style={{borderColor:"rgba(239,68,68,0.3)",color:"var(--red)",background:"rgba(239,68,68,0.06)"}}>🔴 Monitor</button>:<button className="ad-row-btn" onClick={()=>navigate("/contests-list")} style={{borderColor:"rgba(34,197,94,0.3)",color:"var(--green)",background:"rgba(34,197,94,0.06)"}}>View</button>}{status==="ended"&&<button className="ad-row-btn" onClick={()=>handlePlagCheck(c._id,c.title)} disabled={plagLoad===c._id} style={{borderColor:"rgba(139,92,246,0.3)",color:"var(--purple)",background:"rgba(139,92,246,0.06)"}}>{plagLoad===c._id?"⏳ Checking…":"🔍 Plag Check"}</button>}{status==="ended"&&<button className="ad-row-btn" onClick={()=>navigate(`/admin/plagiarism-review/${c._id}`)} style={{borderColor:"rgba(239,68,68,0.3)",color:"var(--red)",background:"rgba(239,68,68,0.06)"}}>👁 Review</button>}<button className="ad-row-btn" onClick={()=>navigate(`/admin/contests/edit/${c._id}`)} style={{borderColor:"rgba(245,158,11,0.3)",color:"var(--amber)",background:"rgba(245,158,11,0.06)"}}>Edit</button><button className="ad-row-btn" onClick={()=>deleteContest(c._id,c.title)} style={{borderColor:"rgba(239,68,68,0.3)",color:"var(--red)",background:"rgba(239,68,68,0.06)"}}>Delete</button></td></tr>);})}</tbody></table></div><Paginator pag={contPag} label={filteredContests.length}/></>
                )}

                {activeTab==="submissions"&&(
                  <><Toolbar search={subSearch} setSearch={setSubSearch} placeholder="Search by user or problem…" exportCols={["username","problemTitle","verdict","language","createdAt"]} exportData={filteredSubs} exportName="submissions" filters={<select className="ad-filter-select" value={subVerdict} onChange={e=>setSubVerdict(e.target.value)}><option value="all">All Verdicts</option><option value="Accepted">Accepted</option><option value="Wrong Answer">Wrong Answer</option><option value="Time Limit Exceeded">TLE</option><option value="Runtime Error">Runtime Error</option><option value="Compilation Error">Compilation Error</option></select>}/><div style={{overflowX:"auto"}}><table className="ad-table"><thead><tr><th className="ad-th">#</th><SortTh label="User" k="username" sortKey={skS} sortDir={sdS} toggle={toggleS}/><SortTh label="Problem" k="problemTitle" sortKey={skS} sortDir={sdS} toggle={toggleS}/><SortTh label="Verdict" k="verdict" sortKey={skS} sortDir={sdS} toggle={toggleS}/><SortTh label="Language" k="language" sortKey={skS} sortDir={sdS} toggle={toggleS}/><SortTh label="Time" k="createdAt" sortKey={skS} sortDir={sdS} toggle={toggleS}/><th className="ad-th">View</th></tr></thead><tbody>{subPag.slice.length===0?<tr><td colSpan={7} style={{padding:"40px",textAlign:"center",color:"var(--muted)"}}>No submissions found</td></tr>:subPag.slice.map((s,i)=>{const vColor=s.verdict==="Accepted"?"var(--green)":s.verdict==="Wrong Answer"?"var(--red)":"var(--amber)";return(<tr key={s._id} className="ad-tr"><td className="ad-td" style={{color:"var(--muted)",fontFamily:"var(--mono)",fontSize:11}}>{String((subPag.page-1)*PAGE_SIZE+i+1).padStart(2,"0")}</td><td className="ad-td" style={{fontWeight:600}}>{s.username||"—"}</td><td className="ad-td" style={{maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.problemTitle||"—"}</td><td className="ad-td"><span className="ad-pill" style={{color:vColor,background:`${vColor}15`,border:`1px solid ${vColor}30`,fontSize:11}}>{s.verdict||"—"}</span></td><td className="ad-td" style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--cyan)"}}>{s.language||"—"}</td><td className="ad-td" style={{color:"var(--muted)",fontSize:12}}>{s.createdAt?timeAgo(s.createdAt):"—"}</td><td className="ad-td"><button className="ad-row-btn" onClick={()=>navigate(`/submission/${s._id}`)} style={{borderColor:"rgba(34,197,94,0.3)",color:"var(--green)",background:"rgba(34,197,94,0.06)"}}>View</button></td></tr>);})}</tbody></table></div><Paginator pag={subPag} label={filteredSubs.length}/></>
                )}
              </>
            )}
          </div>

        </div>
      </div>

      {drawerUser&&<UserActivityDrawer user={drawerUser} onClose={()=>setDrawerUser(null)}/>}
    </>
  );
}