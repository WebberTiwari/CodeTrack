import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import API from "../services/api";
import Editor from "@monaco-editor/react";
import UpgradeModal from "../components/UpgradeModal";   // ← NEW

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg:#0D1117; --surface:#161B22; --surface2:#1C2333; --border:#21262D; --border2:#2D3748;
  --green:#22C55E; --green-dim:#16A34A; --cyan:#00B4D8; --amber:#F59E0B; --red:#EF4444;
  --purple:#A855F7; --purple-dim:#9333EA;
  --text:#E2E8F0; --muted:#64748B; --font:'Outfit',sans-serif; --mono:'JetBrains Mono',monospace;
}
* { scrollbar-width:thin; scrollbar-color:#21262D transparent; }
::-webkit-scrollbar { width:4px; height:4px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:#2D3748; border-radius:4px; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.ct-shimmer { background:linear-gradient(90deg,#1E2530 25%,#252D3A 50%,#1E2530 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }
@keyframes fadeUp { to { opacity:1; transform:translateY(0); } }
.ct-fade-up { opacity:0; transform:translateY(20px); animation:fadeUp 0.5s ease forwards; }
@keyframes spin { to { transform:rotate(360deg); } }
.ct-spin { width:13px; height:13px; border:2px solid rgba(255,255,255,0.15); border-top-color:currentColor; border-radius:50%; animation:spin 0.6s linear infinite; flex-shrink:0; }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
@keyframes slideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes aiPulse { 0%,100%{box-shadow:0 0 0 0 rgba(168,85,247,0.4)} 50%{box-shadow:0 0 0 6px rgba(168,85,247,0)} }
@keyframes typing { 0%,100%{opacity:1} 50%{opacity:0} }

.pp-root { height:calc(100vh - 56px); display:flex; flex-direction:column; background:var(--bg); color:var(--text); font-family:var(--font); overflow:hidden; position:relative; }
.pp-root::before { content:''; position:absolute; inset:0; pointer-events:none; z-index:0; background-image:linear-gradient(rgba(34,197,94,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.025) 1px,transparent 1px); background-size:48px 48px; }

.pp-header { display:flex; align-items:stretch; height:52px; background:var(--surface); border-bottom:1px solid var(--border); flex-shrink:0; position:relative; z-index:2; }
.pp-header-left { display:flex; align-items:center; gap:12px; padding:0 18px; border-right:1px solid var(--border); flex:1; min-width:0; overflow:hidden; }
.pp-back { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border:1px solid var(--border); border-radius:8px; background:transparent; color:var(--muted); font-family:var(--font); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.18s; white-space:nowrap; flex-shrink:0; }
.pp-back:hover { border-color:var(--green); color:var(--green); }
.pp-diff { padding:3px 12px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:0.3px; white-space:nowrap; flex-shrink:0; }
.pp-title { font-size:15px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:-0.2px; }
.pp-tag { background:var(--surface2); border:1px solid var(--border); color:var(--muted); border-radius:6px; padding:2px 8px; font-size:11px; font-weight:500; white-space:nowrap; flex-shrink:0; }
.pp-header-right { display:flex; align-items:stretch; flex-shrink:0; }
.pp-admin-actions { display:flex; align-items:center; gap:6px; padding:0 14px; border-right:1px solid var(--border); }
.pp-admin-hbtn { display:flex; align-items:center; gap:5px; padding:5px 12px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid; font-family:var(--font); transition:all 0.15s; }
.pp-langs { display:flex; align-items:center; gap:3px; padding:0 10px; border-right:1px solid var(--border); }
.pp-lang { padding:5px 13px; border-radius:8px; border:1px solid transparent; background:transparent; color:var(--muted); font-family:var(--mono); font-size:11px; font-weight:500; cursor:pointer; transition:all 0.15s; }
.pp-lang:hover { background:var(--surface2); color:var(--text); }
.pp-lang.on { background:rgba(34,197,94,0.1); border-color:rgba(34,197,94,0.25); color:var(--green); font-weight:700; }
.pp-run { display:flex; align-items:center; gap:7px; padding:0 20px; border:none; border-left:1px solid var(--border); background:transparent; color:var(--cyan); font-family:var(--font); font-size:13px; font-weight:600; cursor:pointer; transition:all 0.15s; }
.pp-run:hover:not(:disabled) { background:rgba(0,180,216,0.08); }
.pp-run:disabled { opacity:0.45; cursor:not-allowed; }
.pp-submit { display:flex; align-items:center; gap:7px; padding:0 26px; border:none; border-left:1px solid var(--border); background:var(--green); color:#0D1117; font-family:var(--font); font-size:13px; font-weight:800; cursor:pointer; transition:all 0.18s; letter-spacing:0.2px; }
.pp-submit:hover:not(:disabled) { background:var(--green-dim); box-shadow:0 0 20px rgba(34,197,94,0.25); }
.pp-submit:disabled { opacity:0.45; cursor:not-allowed; box-shadow:none; }
.pp-ai-btn { display:flex; align-items:center; gap:7px; padding:0 18px; border:none; border-left:1px solid var(--border); background:transparent; color:var(--purple); font-family:var(--font); font-size:13px; font-weight:700; cursor:pointer; transition:all 0.18s; position:relative; }
.pp-ai-btn:hover:not(:disabled) { background:rgba(168,85,247,0.08); }
.pp-ai-btn:disabled { opacity:0.45; cursor:not-allowed; }
.pp-ai-btn.loading { animation:aiPulse 1.5s infinite; }

.pp-body { flex:1; display:flex; min-height:0; overflow:hidden; position:relative; z-index:1; }
.pp-left { display:flex; flex-direction:column; border-right:1px solid var(--border); flex-shrink:0; overflow:hidden; }
.pp-tabs { display:flex; background:var(--surface); border-bottom:1px solid var(--border); flex-shrink:0; overflow-x:auto; }
.pp-tab { padding:12px 14px; background:none; border:none; border-bottom:2px solid transparent; color:var(--muted); font-family:var(--font); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s; white-space:nowrap; }
.pp-tab:hover { color:var(--text); }
.pp-tab.on { color:var(--green); border-bottom-color:var(--green); }
.pp-tab.admin-on { color:var(--amber); border-bottom-color:var(--amber); }
.pp-tab.ai-on { color:var(--purple); border-bottom-color:var(--purple); }

.pp-scroll { flex:1; overflow-y:auto; padding:24px 22px; }
.pp-sec { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; color:var(--muted); margin-bottom:12px; display:flex; align-items:center; gap:8px; }
.pp-sec::before { content:''; width:3px; height:13px; background:var(--green); border-radius:2px; flex-shrink:0; }
.pp-sec.ai-sec::before { background:var(--purple); }
.pp-desc { font-size:14.5px; color:#CBD5E1; line-height:1.85; white-space:pre-line; margin-bottom:28px; }

.pp-example-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; margin-bottom:14px; transition:border-color 0.18s; }
.pp-example-card:hover { border-color:var(--border2); }
.pp-example-hdr { display:flex; align-items:center; justify-content:space-between; padding:9px 14px; background:var(--surface2); border-bottom:1px solid var(--border); }
.pp-example-title { font-size:12px; font-weight:800; color:var(--text); letter-spacing:0.2px; }
.pp-example-body { padding:14px; display:flex; flex-direction:column; gap:10px; }
.pp-example-row { display:flex; flex-direction:column; gap:5px; }
.pp-example-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--muted); }
.pp-example-val { font-family:var(--mono); font-size:13px; line-height:1.7; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:8px 12px; white-space:pre-wrap; word-break:break-word; }
.pp-example-explanation { background:rgba(245,158,11,0.05); border:1px solid rgba(245,158,11,0.15); border-radius:8px; padding:9px 12px; font-size:13px; color:var(--muted); line-height:1.65; }

.pp-sample { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; margin-bottom:12px; }
.pp-sample-hdr { display:flex; align-items:center; justify-content:space-between; padding:8px 14px; background:var(--surface2); border-bottom:1px solid var(--border); font-size:11px; font-weight:700; color:var(--muted); }
.pp-constraints { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px; font-family:var(--mono); font-size:12.5px; color:var(--muted); line-height:1.9; }
.pp-hint { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; margin-bottom:8px; }
.pp-hint summary { padding:12px 16px; cursor:pointer; font-size:13px; font-weight:600; color:var(--cyan); list-style:none; transition:background 0.15s; user-select:none; display:flex; align-items:center; gap:8px; }
.pp-hint summary::-webkit-details-marker { display:none; }
.pp-hint summary::before { content:'▶'; font-size:9px; color:var(--muted); transition:transform 0.15s; }
.pp-hint[open] summary::before { transform:rotate(90deg); }
.pp-hint summary:hover { background:var(--surface2); }
.pp-hint-body { padding:12px 16px; border-top:1px solid var(--border); font-size:14px; color:var(--muted); line-height:1.7; }

.pp-latest-card { border-radius:12px; overflow:hidden; margin-bottom:16px; animation:fadeIn 0.35s ease; }
.pp-latest-hdr { display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid var(--border); }
.pp-latest-stats { display:flex; gap:0; }
.pp-latest-stat { flex:1; padding:10px 16px; display:flex; flex-direction:column; gap:3px; }
.pp-latest-stat+.pp-latest-stat { border-left:1px solid var(--border); }
.pp-latest-slabel { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:var(--muted); }
.pp-latest-sval { font-family:var(--mono); font-size:16px; font-weight:800; }
.pp-latest-code { padding:10px 16px 14px; border-top:1px solid var(--border); }
.pp-latest-clabel { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:var(--muted); margin-bottom:8px; }
.pp-latest-pre { font-family:var(--mono); font-size:11.5px; color:var(--text); background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px 12px; max-height:140px; overflow:auto; white-space:pre-wrap; word-break:break-word; line-height:1.7; }

.pp-sub-row { display:grid; grid-template-columns:auto 1fr auto auto; align-items:center; gap:10px; padding:10px 14px; border-radius:10px; background:var(--surface); border:1px solid var(--border); cursor:pointer; transition:all 0.15s; margin-bottom:6px; }
.pp-sub-row:hover { border-color:var(--border2); background:var(--surface2); }
.pp-sub-badge { padding:2px 10px; border-radius:20px; font-size:11px; font-weight:700; white-space:nowrap; }
.pp-sub-meta { font-size:11px; color:var(--muted); font-family:var(--mono); }
.pp-sub-load { font-size:11px; color:var(--cyan); font-weight:600; opacity:0; transition:opacity 0.15s; }
.pp-sub-row:hover .pp-sub-load { opacity:1; }

.pp-edit-field { margin-bottom:18px; }
.pp-edit-label { font-size:11px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.8px; margin-bottom:6px; }
.pp-edit-input { width:100%; background:var(--surface2); border:1px solid var(--border); border-radius:10px; color:var(--text); font-family:var(--font); font-size:14px; padding:10px 14px; outline:none; transition:border-color 0.18s; }
.pp-edit-input:focus { border-color:rgba(245,158,11,0.45); }
.pp-edit-input::placeholder { color:var(--muted); }
.pp-edit-select { width:100%; background:var(--surface2); border:1px solid var(--border); border-radius:10px; color:var(--text); font-family:var(--font); font-size:14px; padding:10px 14px; outline:none; cursor:pointer; }
.pp-edit-save { width:100%; padding:12px; border-radius:10px; border:none; background:var(--amber); color:#0D1117; font-family:var(--font); font-size:14px; font-weight:800; cursor:pointer; transition:all 0.2s; margin-top:8px; }
.pp-edit-save:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(245,158,11,0.3); }

.pp-handle { width:4px; background:var(--border); cursor:col-resize; flex-shrink:0; transition:background 0.15s; }
.pp-handle:hover { background:var(--green-dim); }

.pp-right { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
.pp-ebar { display:flex; align-items:center; padding:0 14px; height:36px; background:var(--surface); border-bottom:1px solid var(--border); flex-shrink:0; gap:10px; }
.pp-ebar-file { display:flex; align-items:center; gap:8px; }
.pp-file-dot { width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 8px rgba(34,197,94,0.5); }
.pp-file-name { font-family:var(--mono); font-size:11px; color:var(--muted); }
.pp-ebar-meta { margin-left:auto; display:flex; gap:14px; font-family:var(--mono); font-size:11px; color:var(--muted); align-items:center; }
.pp-saved-dot { width:5px; height:5px; border-radius:50%; background:var(--green); box-shadow:0 0 5px var(--green); }
.pp-editor { flex:1; min-height:0; }

.pp-console { background:var(--surface); border-top:1px solid var(--border); display:flex; flex-direction:column; flex-shrink:0; overflow:hidden; transition:height 0.25s cubic-bezier(0.4,0,0.2,1); }
.pp-ctabs { display:flex; align-items:stretch; background:var(--bg); border-bottom:1px solid var(--border); flex-shrink:0; height:38px; }
.pp-ctab { display:flex; align-items:center; gap:6px; padding:0 16px; background:none; border:none; border-bottom:2px solid transparent; border-right:1px solid var(--border); color:var(--muted); font-family:var(--font); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s; }
.pp-ctab:hover { background:var(--surface); color:var(--text); }
.pp-ctab.on { color:var(--green); border-bottom-color:var(--green); }
.pp-ctab-end { margin-left:auto; padding:0 14px; background:none; border:none; border-left:1px solid var(--border); color:var(--muted); font-family:var(--mono); font-size:11px; cursor:pointer; transition:all 0.15s; }
.pp-ctab-end:hover { background:var(--surface); color:var(--text); }
.pp-cbody { flex:1; overflow-y:auto; padding:12px 14px; display:flex; flex-direction:column; gap:10px; }
.pp-ilabel { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:0.8px; margin-bottom:6px; display:flex; align-items:center; gap:8px; }
.pp-mod-dot { width:6px; height:6px; border-radius:50%; background:var(--amber); box-shadow:0 0 6px var(--amber); animation:pulse 2s ease-in-out infinite; }
.pp-textarea { width:100%; background:var(--bg); border:1px solid var(--border); border-radius:8px; color:var(--cyan); font-family:var(--mono); font-size:12.5px; padding:9px 12px; resize:none; outline:none; line-height:1.7; transition:border-color 0.15s; }
.pp-textarea:focus { border-color:rgba(0,180,216,0.3); }
.pp-reset { background:none; border:1px solid var(--border); border-radius:6px; color:var(--muted); font-family:var(--font); font-size:11px; padding:2px 8px; cursor:pointer; }
.pp-reset:hover { border-color:var(--border2); color:var(--text); }
.pp-ocard { background:var(--bg); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.pp-ocard-hdr { display:flex; align-items:center; justify-content:space-between; padding:7px 12px; background:var(--surface2); border-bottom:1px solid var(--border); font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; }
.pp-ocard-body { padding:10px 12px; font-family:var(--mono); font-size:12.5px; white-space:pre-wrap; word-break:break-word; line-height:1.7; max-height:100px; overflow-y:auto; }
.pp-ecard { background:rgba(239,68,68,0.05); border:1px solid rgba(239,68,68,0.25); border-radius:12px; overflow:hidden; }
.pp-ecard-hdr { padding:8px 12px; background:rgba(239,68,68,0.08); border-bottom:1px solid rgba(239,68,68,0.2); font-size:12px; font-weight:700; color:#F87171; font-family:var(--mono); }
.pp-ecard-body { padding:10px 12px; font-family:var(--mono); font-size:12px; color:#FCA5A5; white-space:pre-wrap; word-break:break-word; line-height:1.7; max-height:120px; overflow-y:auto; }
.pp-verdict { display:flex; align-items:center; gap:10px; padding:12px 16px; border-radius:12px; border:1px solid; font-family:var(--font); font-size:14px; font-weight:700; }
.pp-copy { background:none; border:1px solid var(--border); border-radius:5px; color:var(--muted); font-family:var(--font); font-size:10px; font-weight:600; padding:1px 7px; cursor:pointer; }
.pp-copy:hover { border-color:var(--border2); color:var(--text); }
.pp-vdot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.pp-tc-summary { font-size:11px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.8px; margin-bottom:6px; display:flex; align-items:center; gap:8px; }
.pp-tc-row { border-radius:10px; overflow:hidden; border:1px solid; margin-bottom:4px; }
.pp-tc-hdr { display:flex; align-items:center; gap:8px; padding:8px 12px; font-size:12px; font-weight:700; }
.pp-tc-grid { display:grid; grid-template-columns:1fr 1fr 1fr; }
.pp-tc-cell { padding:8px 10px; background:var(--bg); }
.pp-tc-cell+.pp-tc-cell { border-left:1px solid var(--border); }
.pp-tc-clabel { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; color:var(--muted); margin-bottom:4px; }
.pp-tc-val { font-family:var(--mono); font-size:12px; white-space:pre-wrap; word-break:break-word; line-height:1.6; }

/* ── AI Review Panel ── */
.pp-ai-panel { display:flex; flex-direction:column; gap:0; animation:fadeIn 0.3s ease; }
.pp-ai-trigger { display:flex; align-items:center; justify-content:center; gap:10px; padding:14px; border-radius:12px; border:1px dashed rgba(168,85,247,0.35); background:rgba(168,85,247,0.04); cursor:pointer; transition:all 0.2s; font-family:var(--font); font-size:13px; font-weight:700; color:var(--purple); width:100%; }
.pp-ai-trigger:hover:not(:disabled) { border-color:rgba(168,85,247,0.6); background:rgba(168,85,247,0.08); box-shadow:0 0 20px rgba(168,85,247,0.1); }
.pp-ai-trigger:disabled { opacity:0.5; cursor:not-allowed; }
.pp-ai-loading { display:flex; align-items:center; gap:12px; padding:20px 16px; border-radius:12px; background:rgba(168,85,247,0.06); border:1px solid rgba(168,85,247,0.2); }
.pp-ai-loading-dots { display:flex; gap:5px; }
.pp-ai-loading-dot { width:6px; height:6px; border-radius:50%; background:var(--purple); animation:pulse 1.2s ease-in-out infinite; }
.pp-ai-loading-dot:nth-child(2) { animation-delay:0.2s; }
.pp-ai-loading-dot:nth-child(3) { animation-delay:0.4s; }
.pp-ai-result { background:var(--surface); border:1px solid rgba(168,85,247,0.25); border-radius:12px; overflow:hidden; }
.pp-ai-result-hdr { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; background:rgba(168,85,247,0.08); border-bottom:1px solid rgba(168,85,247,0.15); }
.pp-ai-result-hdr-left { display:flex; align-items:center; gap:8px; }
.pp-ai-result-body { padding:16px; display:flex; flex-direction:column; gap:14px; }
.pp-ai-section { display:flex; flex-direction:column; gap:6px; }
.pp-ai-section-title { font-size:12px; font-weight:800; color:var(--purple); display:flex; align-items:center; gap:6px; letter-spacing:0.2px; }
.pp-ai-section-body { font-size:13px; color:#CBD5E1; line-height:1.75; }
.pp-ai-section-body code { font-family:var(--mono); font-size:12px; background:var(--surface2); border:1px solid var(--border); border-radius:4px; padding:1px 5px; color:var(--cyan); }
.pp-ai-divider { height:1px; background:var(--border); }
.pp-ai-refresh { background:none; border:1px solid rgba(168,85,247,0.3); border-radius:6px; color:var(--purple); font-family:var(--font); font-size:11px; font-weight:600; padding:3px 10px; cursor:pointer; transition:all 0.15s; }
.pp-ai-refresh:hover:not(:disabled) { background:rgba(168,85,247,0.1); }
.pp-ai-refresh:disabled { opacity:0.45; cursor:not-allowed; }

/* ReactMarkdown overrides */
.pp-ai-markdown p { margin:4px 0; line-height:1.75; }
.pp-ai-markdown ul { padding-left:18px; margin:4px 0; display:flex; flex-direction:column; gap:3px; }
.pp-ai-markdown ol { padding-left:18px; margin:4px 0; display:flex; flex-direction:column; gap:3px; }
.pp-ai-markdown li { font-size:13px; color:#CBD5E1; line-height:1.7; }
.pp-ai-markdown strong { color:#E2E8F0; font-weight:700; }
.pp-ai-markdown pre { font-family:var(--mono); font-size:12px; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px 12px; overflow-x:auto; margin:6px 0; color:var(--text); line-height:1.7; }
.pp-ai-markdown pre code { background:none; border:none; padding:0; color:inherit; }
`;

const LANGS = {
  cpp:    { id:54, label:"C++",    monaco:"cpp",    tmpl:`#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    long long a, b;\n    cin >> a >> b;\n    cout << a + b;\n    return 0;\n}` },
  python: { id:71, label:"Python", monaco:"python", tmpl:`a, b = map(int, input().split())\nprint(a + b)` },
  java:   { id:62, label:"Java",   monaco:"java",   tmpl:`import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}` },
};
const LANG_NAMES = { 54:"C++", 71:"Python", 62:"Java" };
const ERR_SET    = new Set(["Compilation Error","Runtime Error","Time Limit Exceeded","Judge Timeout","Server Error"]);
const isErrV     = v => ERR_SET.has(v) || v?.startsWith("Runtime Error");

const storageKey = (slug, lang) => `pp_code_${slug}_${lang}`;
const loadSaved  = (slug, lang, fb) => { try { return localStorage.getItem(storageKey(slug,lang))||fb; } catch { return fb; } };
const persist    = (slug, lang, c)  => { try { localStorage.setItem(storageKey(slug,lang),c); } catch {} };

function statusStyle(s) {
  if (s==="Accepted") return { color:"var(--green)", bg:"rgba(34,197,94,0.12)", border:"rgba(34,197,94,0.25)" };
  if (s==="Wrong Answer"||s?.includes("Failed")) return { color:"var(--red)", bg:"rgba(239,68,68,0.12)", border:"rgba(239,68,68,0.25)" };
  if (["Compilation Error","Runtime Error","Time Limit Exceeded"].includes(s)) return { color:"var(--amber)", bg:"rgba(245,158,11,0.12)", border:"rgba(245,158,11,0.25)" };
  return { color:"var(--muted)", bg:"rgba(100,116,139,0.12)", border:"rgba(100,116,139,0.25)" };
}

function timeAgo(d) {
  const m = Math.floor((Date.now()-new Date(d))/60000);
  if (m<1) return "just now"; if (m<60) return `${m}m ago`;
  const h = Math.floor(m/60); if (h<24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

function CopyBtn({ text }) {
  const [ok, setOk] = useState(false);
  return <button className="pp-copy" onClick={()=>{ navigator.clipboard.writeText(text); setOk(true); setTimeout(()=>setOk(false),1500); }}>{ok?"✓":"Copy"}</button>;
}

function TestCaseResults({ results }) {
  const [expanded, setExpanded] = useState(null);
  if (!results?.length) return null;
  const passed = results.filter(t=>t.passed).length;
  const total  = results.length;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <div className="pp-tc-summary">
        <span style={{ color:passed===total?"var(--green)":"var(--red)" }}>{passed===total?"✓":"✗"}</span>
        Test Cases —&nbsp;<span style={{ color:passed===total?"var(--green)":"var(--red)", fontWeight:800 }}>{passed}/{total} Passed</span>
      </div>
      {results.map((tc,i)=>{
        const isOpen=expanded===i;
        const c  = tc.passed?"var(--green)":"var(--red)";
        const bd = tc.passed?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)";
        return (
          <div key={i} className="pp-tc-row" style={{ borderColor:bd, background:tc.passed?"rgba(34,197,94,0.04)":"rgba(239,68,68,0.04)" }}>
            <div className="pp-tc-hdr" style={{ background:tc.passed?"rgba(34,197,94,0.08)":"rgba(239,68,68,0.08)", cursor:tc.passed?"default":"pointer" }}
              onClick={()=>!tc.passed&&setExpanded(isOpen?null:i)}>
              <span style={{ color:c, fontSize:14 }}>{tc.passed?"✓":"✗"}</span>
              <span style={{ color:c, flex:1 }}>Test Case {i+1}</span>
              <span style={{ fontSize:11, color:c, fontWeight:600 }}>{tc.passed?"Passed":"Failed"}</span>
              {!tc.passed&&<span style={{ fontSize:10, color:"var(--muted)", marginLeft:6 }}>{isOpen?"▲ hide":"▼ details"}</span>}
            </div>
            {!tc.passed&&isOpen&&(
              <div className="pp-tc-grid">
                {[["Input",tc.input,"var(--cyan)"],["Expected",tc.expected,"var(--green)"],["Your Output",tc.got,"var(--red)"]].map(([lbl,val,col])=>(
                  <div key={lbl} className="pp-tc-cell">
                    <div className="pp-tc-clabel">{lbl}</div>
                    <div className="pp-tc-val" style={{ color:col }}>{val||"—"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LatestResultCard({ result, submittedCode }) {
  const isAcc     = result.verdict==="accepted";
  const color     = isAcc?"var(--green)":"var(--red)";
  const borderCol = isAcc?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)";
  const bgCol     = isAcc?"rgba(34,197,94,0.06)":"rgba(239,68,68,0.06)";
  const hdrBg     = isAcc?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)";
  return (
    <div className="pp-latest-card" style={{ border:`1px solid ${borderCol}`, background:bgCol }}>
      <div className="pp-latest-hdr" style={{ background:hdrBg, borderBottomColor:borderCol }}>
        <span style={{ fontSize:20 }}>{isAcc?"✓":"✗"}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:14, color }}>{isAcc?"Accepted":result.verdictLabel||"Failed"}</div>
          <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>just submitted</div>
        </div>
        {isAcc&&<span style={{ fontSize:11, color:"var(--muted)", fontWeight:500 }}>All test cases passed 🎉</span>}
      </div>
      {(result.runtime||result.memory)&&(
        <div className="pp-latest-stats" style={{ borderBottom:`1px solid ${borderCol}` }}>
          {result.runtime&&<div className="pp-latest-stat"><span className="pp-latest-slabel">⏱ Runtime</span><span className="pp-latest-sval" style={{ color:"var(--cyan)" }}>{result.runtime}ms</span></div>}
          {result.runtime&&result.memory&&<div style={{ width:1, background:"var(--border)" }}/>}
          {result.memory&&<div className="pp-latest-stat"><span className="pp-latest-slabel">💾 Memory</span><span className="pp-latest-sval" style={{ color:"var(--cyan)" }}>{result.memory}KB</span></div>}
        </div>
      )}
      {!isAcc&&result.testResults?.length>0&&<div style={{ padding:"10px 14px 14px" }}><TestCaseResults results={result.testResults}/></div>}
      {submittedCode&&<div className="pp-latest-code"><div className="pp-latest-clabel">Code Submitted</div><pre className="pp-latest-pre">{submittedCode}</pre></div>}
    </div>
  );
}

function SubmissionHistory({ slug, onLoadCode, latestResult, submittedCode }) {
  const [subs,    setSubs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);

  const load = useCallback(async (p=1) => {
    setLoading(true);
    try {
      const r = await API.get(`/submissions/problem/${slug}/me?page=${p}&limit=10`);
      setSubs(r.data.submissions||[]); setTotal(r.data.pagination?.total||0); setPage(p);
    } catch { setSubs([]); } finally { setLoading(false); }
  }, [slug]);

  useEffect(()=>{ load(1); },[load, latestResult]);

  const loadCode = async (sub) => {
    if (sub.code) { onLoadCode(sub.code, sub.languageId); return; }
    try {
      const r = await API.get(`/submissions/${sub._id}`);
      const s = r.data.submission||r.data;
      if (s.code) onLoadCode(s.code, s.languageId);
    } catch {}
  };

  return (
    <div>
      {latestResult && <LatestResultCard result={latestResult} submittedCode={submittedCode}/>}
      {latestResult && <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:10, paddingTop:12, borderTop:"1px solid var(--border)" }}>All Submissions</div>}
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>{[1,2,3].map(i=><div key={i} className="ct-shimmer" style={{ height:48, borderRadius:10 }}/>)}</div>
      ) : !subs.length ? (
        <div style={{ color:"var(--muted)", fontSize:13, textAlign:"center", padding:"32px 0" }}>{latestResult?"No previous submissions.":"No submissions yet.\nSubmit your first solution!"}</div>
      ) : (
        <>
          <div style={{ fontSize:12, color:"var(--muted)", marginBottom:10 }}>{total} submission{total!==1?"s":""}</div>
          {subs.map((s,i)=>{
            const sc = statusStyle(s.status);
            return (
              <div key={s._id||i} className="pp-sub-row" onClick={()=>loadCode(s)}>
                <span className="pp-sub-badge" style={{ color:sc.color, background:sc.bg, border:`1px solid ${sc.border}` }}>{s.status}</span>
                <span className="pp-sub-meta">{LANG_NAMES[s.languageId]||`Lang ${s.languageId}`}</span>
                <span className="pp-sub-meta">{s.runtime?`${s.runtime}ms`:"—"}</span>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2 }}>
                  <span className="pp-sub-meta">{timeAgo(s.createdAt)}</span>
                  <span className="pp-sub-load">↩ Load code</span>
                </div>
              </div>
            );
          })}
          {total>10&&(
            <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:12 }}>
              <button onClick={()=>load(page-1)} disabled={page===1} style={{ padding:"4px 12px", borderRadius:6, border:"1px solid var(--border)", background:"transparent", color:"var(--muted)", cursor:"pointer", fontFamily:"var(--font)", fontSize:12 }}>← Prev</button>
              <span style={{ fontSize:12, color:"var(--muted)", alignSelf:"center" }}>Page {page}</span>
              <button onClick={()=>load(page+1)} disabled={page*10>=total} style={{ padding:"4px 12px", borderRadius:6, border:"1px solid var(--border)", background:"transparent", color:"var(--muted)", cursor:"pointer", fontFamily:"var(--font)", fontSize:12 }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Usage Badge ───────────────────────────────────────────────────────────────
function UsageBadge({ used, limit, isPro }) {
  // Pro users — show unlimited badge instead
  if (isPro) return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", borderRadius:8, background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.2)", marginBottom:12 }}>
      <span style={{ fontSize:12, color:"var(--green)", fontWeight:700 }}>✨ Unlimited reviews · Pro plan</span>
    </div>
  );

  if (used == null || limit == null) return null;
  const remaining = limit - used;
  const pct       = used / limit;
  const color     = pct >= 1 ? "var(--red)" : pct >= 0.6 ? "var(--amber)" : "var(--green)";
  const bg        = pct >= 1 ? "rgba(239,68,68,0.08)"  : pct >= 0.6 ? "rgba(245,158,11,0.08)"  : "rgba(34,197,94,0.08)";
  const border    = pct >= 1 ? "rgba(239,68,68,0.2)"   : pct >= 0.6 ? "rgba(245,158,11,0.2)"   : "rgba(34,197,94,0.2)";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", borderRadius:8, background:bg, border:`1px solid ${border}`, marginBottom:12 }}>
      <div style={{ flex:1, height:4, background:"var(--border)", borderRadius:4, overflow:"hidden" }}>
        <div style={{ width:`${(used/limit)*100}%`, height:"100%", background:color, borderRadius:4, transition:"width 0.4s ease" }}/>
      </div>
      <span style={{ fontSize:11, fontWeight:700, color, whiteSpace:"nowrap" }}>
        {remaining > 0 ? `${remaining} review${remaining!==1?"s":""} left today` : "Limit reached"}
      </span>
      <span style={{ fontSize:10, color:"var(--muted)", whiteSpace:"nowrap" }}>{used}/{limit}</span>
    </div>
  );
}

// ── AI Review Panel ───────────────────────────────────────────────────────────
function AIReviewPanel({ code, languageId, problem, verdict, testResults }) {
  const navigate = useNavigate();                         // ← NEW

  const [review,       setReview]       = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [usage,        setUsage]        = useState(null);
  const [limited,      setLimited]      = useState(false);
  const [resetTime,    setResetTime]    = useState(null); // ← NEW
  const [showUpgrade,  setShowUpgrade]  = useState(false); // ← NEW

  const parseSections = (text) => {
    const sections = [];
    const lines    = text.split("\n");
    let current    = null;
    for (const line of lines) {
      const m = line.match(/^##\s+(.+)/);
      if (m) {
        if (current) sections.push(current);
        current = { title: m[1].trim(), body: "" };
      } else if (current) {
        current.body += (current.body ? "\n" : "") + line;
      }
    }
    if (current) sections.push(current);
    if (!sections.length) sections.push({ title:"Review", body: text });
    return sections.map(s=>({ ...s, body: s.body.trim() }));
  };

  const fetchReview = async () => {
    setLoading(true); setError(null); setReview(null); setLimited(false);
    try {
      const r = await API.post("/ai/review", {
        code, languageId,
        problemTitle:       problem?.title,
        problemDescription: problem?.description,
        verdict,
        testResults,
      });
      if (r.data.usage) setUsage(r.data.usage);
      setReview(parseSections(r.data.review));
    } catch (e) {
      const status = e.response?.status;
      const data   = e.response?.data;
      if (status === 429) {
        setLimited(true);
        setResetTime(data.resetsAt || null);             // ← NEW: capture reset time
        setUsage({ limit: data.limit, used: data.used, remaining: 0 });
        setError(data.message || "Daily limit reached. Come back tomorrow!");
        setShowUpgrade(true);                            // ← NEW: open upgrade modal
      } else {
        setError(data?.message || data?.msg || "Failed to get AI review. Try again.");
      }
    } finally { setLoading(false); }
  };

  const mdComponents = {
    code({ inline, children, ...props }) {
      return inline
        ? <code style={{ fontFamily:"var(--mono)", fontSize:12, background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:4, padding:"1px 5px", color:"var(--cyan)" }} {...props}>{children}</code>
        : <pre style={{ fontFamily:"var(--mono)", fontSize:12, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, padding:"10px 12px", overflowX:"auto", margin:"6px 0", color:"var(--text)", lineHeight:1.7 }}><code {...props}>{children}</code></pre>;
    },
    strong({ children }) { return <strong style={{ color:"#E2E8F0", fontWeight:700 }}>{children}</strong>; },
    ul({ children })     { return <ul style={{ paddingLeft:18, margin:"4px 0", display:"flex", flexDirection:"column", gap:3 }}>{children}</ul>; },
    ol({ children })     { return <ol style={{ paddingLeft:18, margin:"4px 0", display:"flex", flexDirection:"column", gap:3 }}>{children}</ol>; },
    li({ children })     { return <li style={{ fontSize:13, color:"#CBD5E1", lineHeight:1.7 }}>{children}</li>; },
    p({ children })      { return <p style={{ margin:"4px 0", lineHeight:1.75 }}>{children}</p>; },
  };

  // ── Trigger screen ──────────────────────────────────────────────────────────
  if (!review && !loading && !error && !limited) return (
    <>
      {/* UpgradeModal — renders outside the panel so it's full-screen */}
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        resetsAt={resetTime}
        used={usage?.used ?? 5}
        limit={usage?.limit ?? 5}
      />
      <div className="pp-ai-panel">
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12, padding:"12px 14px", background:"rgba(168,85,247,0.04)", border:"1px solid rgba(168,85,247,0.15)", borderRadius:12 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--purple)" }}>🤖 AI Code Review</div>
          <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.6 }}>
            Get instant feedback — complexity, bugs, improvements &amp; approach. Powered by Llama 3.3.
          </div>
        </div>
        {usage && <UsageBadge used={usage.used} limit={usage.limit} isPro={usage.isPro}/>}
        <button className="pp-ai-trigger" onClick={fetchReview} disabled={usage?.remaining === 0}>
          <span style={{ fontSize:16 }}>✨</span>
          {usage?.remaining === 0 ? "No Reviews Left Today" : "Review My Code with AI"}
        </button>
        {usage?.remaining === 0 && (
          <button
            onClick={() => setShowUpgrade(true)}
            style={{ marginTop:10, width:"100%", padding:"11px", borderRadius:10, border:"none", background:"var(--green)", color:"#0D1117", fontFamily:"var(--font)", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(34,197,94,0.3)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
            ⚡ Upgrade to Pro — ₹99/mo
          </button>
        )}
      </div>
    </>
  );

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="pp-ai-loading">
      <div className="pp-ai-loading-dots">
        <div className="pp-ai-loading-dot"/>
        <div className="pp-ai-loading-dot"/>
        <div className="pp-ai-loading-dot"/>
      </div>
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:"var(--purple)" }}>Analyzing your code…</div>
        <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>Reviewing complexity, bugs &amp; improvements</div>
      </div>
    </div>
  );

  // ── Rate limit screen ───────────────────────────────────────────────────────
  if (limited) return (
    <>
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        resetsAt={resetTime}
        used={usage?.used ?? 5}
        limit={usage?.limit ?? 5}
      />
      <div className="pp-ai-panel">
        {usage && <UsageBadge used={usage.used} limit={usage.limit}/>}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:"28px 20px", background:"rgba(239,68,68,0.04)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:12, textAlign:"center" }}>
          <span style={{ fontSize:32 }}>🔒</span>
          <div style={{ fontSize:14, fontWeight:800, color:"var(--text)" }}>Daily Limit Reached</div>
          <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.65, maxWidth:260 }}>{error}</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
            <button
              onClick={() => setShowUpgrade(true)}
              style={{ padding:"9px 20px", borderRadius:8, border:"none", background:"var(--green)", color:"#0D1117", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--font)" }}>
              ⚡ Upgrade to Pro
            </button>
            <div style={{ fontSize:11, color:"var(--muted)", padding:"5px 14px", background:"var(--surface2)", borderRadius:20, border:"1px solid var(--border)", display:"flex", alignItems:"center" }}>
              🔄 Resets at midnight
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // ── Generic error screen ────────────────────────────────────────────────────
  if (error) return (
    <div className="pp-ai-panel">
      {usage && <UsageBadge used={usage.used} limit={usage.limit}/>}
      <div style={{ padding:"12px 14px", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, fontSize:13, color:"var(--red)", marginBottom:10 }}>
        ⚠ {error}
      </div>
      <button className="pp-ai-trigger" onClick={fetchReview}>↺ Try Again</button>
    </div>
  );

  // ── Review result ───────────────────────────────────────────────────────────
  return (
    <>
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        resetsAt={resetTime}
        used={usage?.used ?? 5}
        limit={usage?.limit ?? 5}
      />
      <div className="pp-ai-panel">
        {usage && <UsageBadge used={usage.used} limit={usage.limit} isPro={usage.isPro}/>}
        <div className="pp-ai-result">
          <div className="pp-ai-result-hdr">
            <div className="pp-ai-result-hdr-left">
              <span style={{ fontSize:15 }}>✨</span>
              <span style={{ fontSize:12, fontWeight:800, color:"var(--purple)" }}>AI Code Review</span>
              <span style={{ fontSize:10, color:"var(--muted)", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:4, padding:"1px 6px" }}>Llama 3.3 70B</span>
            </div>
            <button
              className="pp-ai-refresh"
              onClick={fetchReview}
              disabled={usage?.remaining === 0 && !usage?.isPro}
              title={usage?.remaining === 0 && !usage?.isPro ? "No reviews left today" : "Get a fresh review"}
            >
              {usage?.remaining === 0 && !usage?.isPro ? "Limit reached" : "↺ Re-review"}
            </button>
          </div>
          <div className="pp-ai-result-body">
            {review.map((sec, i) => (
              <div key={i}>
                {i > 0 && <div className="pp-ai-divider" style={{ marginBottom:14 }}/>}
                <div className="pp-ai-section">
                  <div className="pp-ai-section-title">{sec.title}</div>
                  <div className="pp-ai-section-body pp-ai-markdown">
                    <ReactMarkdown components={mdComponents}>{sec.body}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {(usage?.remaining > 0 || usage?.isPro) && (
          <div style={{ marginTop:10, textAlign:"center" }}>
            <button className="pp-ai-trigger" onClick={fetchReview} style={{ fontSize:12, padding:"10px 14px" }}>
              ↺ Get Fresh Review
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProblemPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const role     = localStorage.getItem("role")||"user";
  const isAdmin  = role==="admin";

  const [problem,       setProblem]       = useState(null);
  const [leftTab,       setLeftTab]       = useState("problem");
  const [ctab,          setCtab]          = useState("input");
  const [lang,          setLang]          = useState("cpp");
  const [code,          setCode]          = useState(LANGS.cpp.tmpl);
  const [codeSaved,     setCodeSaved]     = useState(false);
  const [inp,           setInp]           = useState("");
  const [defInp,        setDefInp]        = useState("");
  const [isCustom,      setIsCustom]      = useState(false);
  const [output,        setOutput]        = useState("");
  const [expected,      setExpected]      = useState("");
  const [verdict,       setVerdict]       = useState("");
  const [mode,          setMode]          = useState("idle");
  const [running,       setRunning]       = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [cOpen,         setCOpen]         = useState(true);
  const [leftW,         setLeftW]         = useState(43);
  const [lines,         setLines]         = useState(0);
  const [saving,        setSaving]        = useState(false);
  const [testResults,   setTestResults]   = useState([]);
  const [runStats,      setRunStats]      = useState(null);
  const [latestResult,  setLatestResult]  = useState(null);
  const [submittedCode, setSubmittedCode] = useState("");
  const [editForm,      setEditForm]      = useState(null);

  const drag      = useRef(false);
  const saveTimer = useRef(null);

  useEffect(()=>{
    API.get(`/problems/slug/${slug}`).then(r=>{
      const data = r.data.problem||r.data;
      setProblem(data);
      const s = data.samples?.[0];
      if (s) { setDefInp(s.input); setInp(s.input); }
      const saved = loadSaved(slug,"cpp",LANGS.cpp.tmpl);
      setCode(saved);
      if (isAdmin) setEditForm({
        title:       data.title||"",
        difficulty:  data.difficulty||"Easy",
        description: data.description||"",
        constraints: data.constraints||"",
        tags:        data.topics?.join(", ")||data.tags?.join(", ")||"",
        companies:   data.companies?.join(", ")||"",
      });
    });
  },[slug]);

  useEffect(()=>{
    const mv=e=>{ if(!drag.current) return; setLeftW(Math.min(Math.max((e.clientX/window.innerWidth)*100,22),62)); };
    const up=()=>{ drag.current=false; };
    window.addEventListener("mousemove",mv); window.addEventListener("mouseup",up);
    return ()=>{ window.removeEventListener("mousemove",mv); window.removeEventListener("mouseup",up); };
  },[]);

  const handleCodeChange = val=>{
    setCode(val||""); setCodeSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(()=>{ persist(slug,lang,val||""); setCodeSaved(true); setTimeout(()=>setCodeSaved(false),2000); },1000);
  };

  const changeLang = k=>{ setLang(k); setCode(loadSaved(slug,k,LANGS[k].tmpl)); };

  const handleLoadCode=(submCode,langId)=>{
    const k=Object.keys(LANGS).find(k=>LANGS[k].id===langId)||"cpp";
    setLang(k); setCode(submCode); persist(slug,k,submCode);
  };

  const handleInp=v=>{ setInp(v); setIsCustom(v.trim()!==defInp.trim()); setMode("idle"); setVerdict(""); setOutput(""); setExpected(""); };
  const resetInp =()=>{ setInp(defInp); setIsCustom(false); setMode("idle"); setVerdict(""); setOutput(""); setExpected(""); };

  const runCode=async()=>{
    setMode("run"); setRunning(true); setVerdict("running");
    setOutput(""); setExpected(""); setTestResults([]); setRunStats(null);
    setCOpen(true); setCtab("output");
    try {
      const r=await API.post("/run",{ code, slug, customInput:inp.trim(), languageId:LANGS[lang].id });
      setOutput(r.data.userOutput||""); setExpected(r.data.expectedOutput||"");
      if (r.data.runtime!=null||r.data.memory!=null)
        setRunStats({ runtime:r.data.runtime?Math.round(r.data.runtime*1000):null, memory:r.data.memory||null });
      const s=r.data.status;
      setVerdict(s==="Correct"?"correct":s==="Wrong Answer"?"wrong":s==="Compilation Error"?"Compilation Error":s==="Runtime Error"?"Runtime Error":s==="Time Limit Exceeded"?"Time Limit Exceeded":s==="Executed"?"done":s||"done");
    } catch(e){ setVerdict("Server Error"); setOutput(e.response?.data?.msg||e.message); }
    finally { setRunning(false); }
  };

  const submit=async()=>{
    setMode("submit"); setSubmitting(true); setVerdict("submitting");
    setOutput(""); setExpected(""); setTestResults([]); setRunStats(null);
    setCOpen(true); setCtab("output");
    const codeAtSubmit = code;
    try {
      const r=await API.post("/submissions",{ problemSlug:slug, code, languageId:LANGS[lang].id });
      let attempts=0;
      const iv=setInterval(async()=>{
        attempts++;
        try {
          const s=await API.get(`/submissions/${r.data.submissionId}`);
          const status=s.data.submission?.status;
          if (["Queued","Running"].includes(status)){
            if(attempts>=30){ clearInterval(iv); setVerdict("Judge Timeout"); setOutput("Judging took too long."); setSubmitting(false); }
            return;
          }
          clearInterval(iv);
          const sub      = s.data.submission;
          const tr       = sub?.testResults||[];
          const rt       = sub?.runtime||null;
          const mem      = sub?.memory||null;
          const verdictV = status==="Accepted"?"accepted":status==="Wrong Answer"?"Failed on hidden tests":status==="Compilation Error"?"Compilation Error":status==="Runtime Error"?"Runtime Error":status==="Time Limit Exceeded"?"Time Limit Exceeded":status||"Unknown";
          setTestResults(tr); setOutput(sub?.output||"");
          if (rt!=null||mem!=null) setRunStats({ runtime:rt, memory:mem });
          setVerdict(verdictV); setSubmitting(false);
          setLatestResult({ verdict:status==="Accepted"?"accepted":"failed", verdictLabel:verdictV, runtime:rt, memory:mem, testResults:tr });
          setSubmittedCode(codeAtSubmit);
          setLeftTab("submissions");
        } catch { clearInterval(iv); setVerdict("Connection Error"); setSubmitting(false); }
      },2000);
    } catch(e){ setVerdict("Submission Failed"); setOutput(e.response?.data?.msg||e.message||""); setSubmitting(false); }
  };

  const handleSaveEdit=async()=>{
    setSaving(true);
    try {
      const payload={ ...editForm, topics:editForm.tags.split(",").map(t=>t.trim()).filter(Boolean), companies:editForm.companies.split(",").map(c=>c.trim()).filter(Boolean) };
      await API.put(`/problems/${problem._id}`,payload);
      setProblem(prev=>({...prev,...payload})); alert("Problem updated successfully!");
    } catch { alert("Failed to save changes"); } finally { setSaving(false); }
  };

  const handleDelete=async()=>{
    if(!window.confirm(`Delete "${problem.title}"?`)) return;
    try { await API.delete(`/problems/${problem._id}`); navigate("/problems"); } catch { alert("Failed to delete problem"); }
  };

  const getVCfg=()=>{
    const v=verdict;
    if(!v||v==="running"||v==="submitting"||isErrV(v)) return null;
    if(v==="accepted"||v==="correct") return { label:v==="accepted"?"Accepted":"Correct Answer", color:"var(--green)", border:"rgba(34,197,94,0.3)", bg:"rgba(34,197,94,0.08)", icon:"✓" };
    if(v==="wrong"||v?.toLowerCase().includes("wrong")||v?.toLowerCase().includes("failed")) return { label:v==="wrong"?"Wrong Answer":v, color:"var(--red)", border:"rgba(239,68,68,0.3)", bg:"rgba(239,68,68,0.08)", icon:"✗" };
    if(v?.toLowerCase().includes("time")) return { label:"Time Limit Exceeded", color:"var(--amber)", border:"rgba(245,158,11,0.3)", bg:"rgba(245,158,11,0.08)", icon:"⏱" };
    return { label:v, color:"var(--amber)", border:"rgba(245,158,11,0.3)", bg:"rgba(245,158,11,0.08)", icon:"⚠" };
  };

  const isPend    = verdict==="running"||verdict==="submitting";
  const isErr     = isErrV(verdict)&&!isPend;
  const vcfg      = getVCfg();
  const panelOn   = mode!=="idle";
  const vdotColor = (verdict==="accepted"||verdict==="correct")?"var(--green)":(verdict==="wrong"||verdict?.toLowerCase().includes("wrong")||verdict?.toLowerCase().includes("failed"))?"var(--red)":verdict&&!isPend?"var(--amber)":null;
  const consH     = cOpen?(panelOn?"44%":"148px"):"38px";
  const diffColor = !problem?"#64748B":problem.difficulty==="Easy"?"#22C55E":problem.difficulty==="Medium"?"#F59E0B":"#EF4444";
  const diffBg    = !problem?"transparent":problem.difficulty==="Easy"?"rgba(34,197,94,0.12)":problem.difficulty==="Medium"?"rgba(245,158,11,0.12)":"rgba(239,68,68,0.12)";

  const leftTabs=[
    {id:"problem",     label:"Problem"},
    {id:"hints",       label:"Hints"},
    {id:"submissions", label:"Submissions"},
    {id:"ai-review",   label:"✨ AI Review"},
    ...(isAdmin?[{id:"edit",label:"⚡ Edit"}]:[]),
  ];

  if(!problem) return(<><style>{CSS}</style><div className="pp-root" style={{ padding:36,gap:14,display:"flex",flexDirection:"column" }}>{[320,520,180,420,240].map((w,i)=><div key={i} className="ct-shimmer" style={{ height:14,width:w }}/>)}</div></>);

  return (
    <><style>{CSS}</style>
    <div className="pp-root">

      {/* HEADER */}
      <div className="pp-header">
        <div className="pp-header-left">
          <button className="pp-back" onClick={()=>navigate("/problems")}>← Problems</button>
          <span className="pp-diff" style={{ color:diffColor,background:diffBg,border:`1px solid ${diffColor}33` }}>{problem.difficulty}</span>
          <span className="pp-title">{problem.title}</span>
          <div style={{ display:"flex",gap:6,flexShrink:0 }}>
            {(problem.topics||problem.tags)?.slice(0,3).map(t=><span key={t} className="pp-tag">{t}</span>)}
          </div>
        </div>
        <div className="pp-header-right">
          {isAdmin&&(
            <div className="pp-admin-actions">
              <button className="pp-admin-hbtn" style={{ borderColor:"rgba(245,158,11,0.3)",color:"var(--amber)",background:"rgba(245,158,11,0.08)" }} onClick={()=>setLeftTab("edit")}>✏️ Edit</button>
              <button className="pp-admin-hbtn" style={{ borderColor:"rgba(239,68,68,0.3)",color:"var(--red)",background:"rgba(239,68,68,0.08)" }} onClick={handleDelete}>🗑 Delete</button>
            </div>
          )}
          <div className="pp-langs">{Object.keys(LANGS).map(k=><button key={k} className={`pp-lang ${lang===k?"on":""}`} onClick={()=>changeLang(k)}>{LANGS[k].label}</button>)}</div>
          <button className="pp-run" onClick={runCode} disabled={running||submitting}>{running?<><div className="ct-spin" style={{ borderTopColor:"var(--cyan)"}}/> Running…</>:<>▶ Run</>}</button>
          <button className="pp-submit" onClick={submit} disabled={running||submitting}>{submitting?<><div className="ct-spin" style={{ borderTopColor:"#0D1117"}}/> Submitting…</>:<>↑ Submit</>}</button>
          <button className="pp-ai-btn" onClick={()=>setLeftTab("ai-review")} disabled={running||submitting} title="AI Code Review">
            ✨ AI Review
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="pp-body">

        {/* LEFT */}
        <div className="pp-left" style={{ width:`${leftW}%` }}>
          <div className="pp-tabs">
            {leftTabs.map(t=>(
              <button key={t.id}
                className={`pp-tab ${leftTab===t.id?(t.id==="edit"?"admin-on":t.id==="ai-review"?"ai-on":"on"):""}`}
                onClick={()=>setLeftTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="pp-scroll">

            {leftTab==="problem"&&(<>
              <div className="pp-sec">Description</div>
              <p className="pp-desc">{problem.description}</p>
              {problem.samples?.length>0&&(<>
                <div className="pp-sec" style={{ marginTop:4 }}>Examples</div>
                {problem.samples.map((s,i)=>(
                  <div key={i} className="pp-example-card ct-fade-up" style={{ animationDelay:`${i*0.07}s` }}>
                    <div className="pp-example-hdr">
                      <span className="pp-example-title">Example {i+1}</span>
                      <CopyBtn text={`Input:\n${s.input}\n\nOutput:\n${s.output}${s.explanation?`\n\nExplanation:\n${s.explanation}`:""}`}/>
                    </div>
                    <div className="pp-example-body">
                      <div className="pp-example-row"><div className="pp-example-label">Input</div><div className="pp-example-val" style={{ color:"var(--cyan)" }}>{s.input}</div></div>
                      <div className="pp-example-row"><div className="pp-example-label">Output</div><div className="pp-example-val" style={{ color:"var(--green)" }}>{s.output}</div></div>
                      {s.explanation&&(<div className="pp-example-explanation"><span style={{ fontWeight:700, color:"var(--amber)" }}>Explanation: </span>{s.explanation}</div>)}
                    </div>
                  </div>
                ))}
              </>)}
              {problem.constraints&&(<div style={{ marginTop:20 }}><div className="pp-sec">Constraints</div><div className="pp-constraints">{problem.constraints}</div></div>)}
            </>)}

            {leftTab==="hints"&&(<>
              <div className="pp-sec">Hints</div>
              {problem.hints?.length>0?problem.hints.map((h,i)=>(
                <details key={i} className="pp-hint"><summary>Hint {i+1}</summary><div className="pp-hint-body">{h}</div></details>
              )):<div style={{ color:"var(--muted)",fontSize:13 }}>No hints available.</div>}
            </>)}

            {leftTab==="submissions"&&(<>
              <div className="pp-sec">Submissions</div>
              <SubmissionHistory slug={slug} onLoadCode={handleLoadCode} latestResult={latestResult} submittedCode={submittedCode}/>
            </>)}

            {leftTab==="ai-review"&&(<>
              <div className="pp-sec ai-sec">AI Code Review</div>
              <AIReviewPanel
                code={code}
                languageId={LANGS[lang].id}
                problem={problem}
                verdict={verdict}
                testResults={testResults}
              />
            </>)}

            {leftTab==="edit"&&isAdmin&&editForm&&(<>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:20,padding:"10px 14px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:10 }}>
                <span style={{ fontSize:13,fontWeight:700,color:"var(--amber)" }}>⚡ Admin — Editing Problem</span>
              </div>
              {[{key:"title",label:"Title",type:"input"},{key:"description",label:"Description",type:"textarea",rows:6},{key:"constraints",label:"Constraints",type:"textarea",rows:3},{key:"tags",label:"Tags (comma-separated)",type:"input"},{key:"companies",label:"Companies (comma-separated)",type:"input"}].map(({key,label,type,rows})=>(
                <div key={key} className="pp-edit-field">
                  <div className="pp-edit-label">{label}</div>
                  {type==="textarea"?<textarea className="pp-edit-input" rows={rows} value={editForm[key]} onChange={e=>setEditForm(f=>({...f,[key]:e.target.value}))} style={{ resize:"vertical" }}/>:<input className="pp-edit-input" type="text" value={editForm[key]} onChange={e=>setEditForm(f=>({...f,[key]:e.target.value}))}/>}
                </div>
              ))}
              <div className="pp-edit-field">
                <div className="pp-edit-label">Difficulty</div>
                <select className="pp-edit-select pp-edit-input" value={editForm.difficulty} onChange={e=>setEditForm(f=>({...f,difficulty:e.target.value}))}>
                  <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                </select>
              </div>
              <button className="pp-edit-save" onClick={handleSaveEdit} disabled={saving}>{saving?"Saving…":"💾 Save Changes"}</button>
            </>)}

          </div>
        </div>

        <div className="pp-handle" onMouseDown={()=>{ drag.current=true; }}/>

        {/* RIGHT */}
        <div className="pp-right">
          <div className="pp-ebar">
            <div className="pp-ebar-file"><div className="pp-file-dot"/><span className="pp-file-name">solution.{lang==="python"?"py":lang==="java"?"java":"cpp"}</span></div>
            <div className="pp-ebar-meta">
              {lines>0&&<span>{lines} lines</span>}
              <span style={{ color:"var(--green)" }}>{LANGS[lang].label}</span>
              <span>UTF-8</span>
              {codeSaved&&<><div className="pp-saved-dot"/><span style={{ color:"var(--green)",fontSize:10 }}>saved</span></>}
              {isAdmin&&<span style={{ color:"var(--amber)" }}>⚡ Admin</span>}
            </div>
          </div>

          <div className="pp-editor">
            <Editor height="100%" width="100%" language={LANGS[lang].monaco} value={code}
              onChange={handleCodeChange}
              onMount={ed=>{ setLines(ed.getModel()?.getLineCount()||0); ed.onDidChangeModelContent(()=>setLines(ed.getModel()?.getLineCount()||0)); }}
              theme="vs-dark"
              options={{ automaticLayout:true,fontSize:13.5,fontFamily:"'JetBrains Mono',monospace",fontLigatures:true,minimap:{enabled:false},scrollBeyondLastLine:false,lineNumbersMinChars:3,padding:{top:14,bottom:14},scrollbar:{verticalScrollbarSize:4,horizontalScrollbarSize:4},renderLineHighlight:"line",cursorBlinking:"smooth",smoothScrolling:true,bracketPairColorization:{enabled:true} }}
            />
          </div>

          {/* CONSOLE */}
          <div className="pp-console" style={{ height:consH }}>
            <div className="pp-ctabs">
              <button className={`pp-ctab ${ctab==="input"?"on":""}`} onClick={()=>{ setCtab("input"); setCOpen(true); }}>
                Input {isCustom&&<div className="pp-vdot" style={{ background:"var(--amber)",boxShadow:"0 0 5px var(--amber)" }}/>}
              </button>
              {panelOn&&<button className={`pp-ctab ${ctab==="output"?"on":""}`} onClick={()=>{ setCtab("output"); setCOpen(true); }}>
                Output {vdotColor&&!isPend&&<div className="pp-vdot" style={{ background:vdotColor,boxShadow:`0 0 5px ${vdotColor}` }}/>}
              </button>}
              <button className="pp-ctab-end" onClick={()=>setCOpen(o=>!o)}>{cOpen?"▾":"▸"} Console</button>
            </div>

            {cOpen&&(
              <div className="pp-cbody">
                {ctab==="input"&&(<>
                  <div className="pp-ilabel">Test Input {isCustom&&<div className="pp-mod-dot"/>}{isCustom&&<button className="pp-reset" onClick={resetInp}>↺ Reset</button>}</div>
                  <textarea className="pp-textarea" rows={3} value={inp} onChange={e=>handleInp(e.target.value)} spellCheck={false}/>
                </>)}
                {ctab==="output"&&panelOn&&(<>
                  {isPend&&<div style={{ display:"flex",alignItems:"center",gap:10,color:"var(--amber)",fontSize:13,fontWeight:600 }}><div className="ct-spin" style={{ borderTopColor:"var(--amber)"}}/>{verdict==="running"?"Running your code…":"Judging submission…"}</div>}
                  {isErr&&!isPend&&<div className="pp-ecard"><div className="pp-ecard-hdr">{verdict==="Compilation Error"?"⚙ Compilation Error":verdict==="Time Limit Exceeded"?"⏱ Time Limit Exceeded":"⚠ Runtime Error"}</div><div className="pp-ecard-body">{output||"No details available."}</div></div>}
                  {vcfg&&!isPend&&(
                    <div className="pp-verdict" style={{ color:vcfg.color,borderColor:vcfg.border,background:vcfg.bg }}>
                      <span style={{ fontSize:20 }}>{vcfg.icon}</span>
                      <span>{vcfg.label}</span>
                      {mode==="submit"&&verdict==="accepted"&&<span style={{ marginLeft:"auto",fontSize:12,color:"var(--muted)",fontWeight:500 }}>All test cases passed</span>}
                    </div>
                  )}
                  {!isPend&&mode==="submit"&&testResults.length>0&&<TestCaseResults results={testResults}/>}
                  {!isErr&&output&&mode==="run"&&<div className="pp-ocard"><div className="pp-ocard-hdr"><span style={{ color:"var(--muted)" }}>Your Output</span><CopyBtn text={output}/></div><div className="pp-ocard-body" style={{ color:"var(--cyan)" }}>{output}</div></div>}
                  {!isErr&&expected&&mode==="run"&&<div className="pp-ocard"><div className="pp-ocard-hdr"><span style={{ color:"var(--amber)" }}>Expected Output</span><span style={{ fontSize:10,color:"var(--muted)" }}>{isCustom?"model solution":"from test case"}</span></div><div className="pp-ocard-body" style={{ color:"var(--amber)" }}>{expected}</div></div>}
                </>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div></>
  );
}