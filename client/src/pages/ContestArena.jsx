// src/pages/ContestArena.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const API_BASE = "http://import.meta.env.VITE_API_URL || "http://localhost:5000"";

const MAX_POLL_ATTEMPTS   = 30;
const POLL_INTERVAL_MS    = 2000;
const POLL_INITIAL_MS     = 1500;
const DEFAULT_SPLIT_PCT   = 42;
const WARN_THRESHOLD_MS   = 900_000;
const DANGER_THRESHOLD_MS = 300_000;
const MIN_SPLIT_PCT       = 25;
const MAX_SPLIT_PCT       = 70;

const TERMINAL_STATUSES = new Set([
  "Accepted", "Wrong Answer", "Time Limit Exceeded",
  "Runtime Error", "Compilation Error", "Memory Limit Exceeded",
]);

const C = {
  bg: "#080c10", surface: "#0d1117", panel: "#111720", card: "#161d28",
  border: "#1e2836", border2: "#2a3a52", green: "#00d26a", greenDim: "#0a2a18",
  red: "#ff4757", redDim: "#2a0a0a", yellow: "#f0a500", blue: "#58a6ff",
  text: "#e2edf8", muted: "#5a7080",
  // Editor theme colors (Tokyo Night inspired)
  editorBg: "#0d1117",
  editorGutter: "#0a0f16",
  editorActiveLine: "#161d28",
  editorCursor: "#00d26a",
  // Syntax tokens
  tkKeyword: "#bb9af7",   // purple - keywords
  tkType:    "#2ac3de",   // cyan - types
  tkString:  "#9ece6a",   // green - strings
  tkNumber:  "#ff9e64",   // orange - numbers
  tkComment: "#565f89",   // gray-blue - comments
  tkFunc:    "#7aa2f7",   // blue - functions
  tkPunct:   "#89ddff",   // light blue - punctuation/operators
  tkPre:     "#ff9e64",   // orange - preprocessor
  tkPlain:   "#c0caf5",   // lavender - plain text
};

const LANGS = [
  { id: "cpp",    label: "C++",    icon: "⚙", languageId: 54, default: '#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    \n    return 0;\n}' },
  { id: "python", label: "Python", icon: "🐍", languageId: 71, default: '# your solution\n' },
  { id: "java",   label: "Java",   icon: "☕", languageId: 62, default: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}' },
  { id: "js",     label: "JS",     icon: "✦", languageId: 63, default: '// your solution\n' },
];

// ── Syntax Highlighter ───────────────────────────────────────────────────────
const CPP_KEYWORDS = new Set([
  "auto","break","case","catch","class","const","constexpr","continue","default",
  "delete","do","else","enum","explicit","extern","false","for","friend","goto",
  "if","inline","mutable","namespace","new","noexcept","nullptr","operator",
  "private","protected","public","register","return","sizeof","static","struct",
  "switch","template","this","throw","true","try","typedef","typename","union",
  "using","virtual","volatile","while","override","final",
]);
const CPP_TYPES = new Set([
  "int","long","short","char","bool","float","double","void","unsigned","signed",
  "string","vector","map","set","pair","queue","stack","deque","list","array",
  "unordered_map","unordered_set","size_t","auto","wchar_t","int64_t","uint64_t",
  "int32_t","uint32_t","cout","cin","endl","string","ifstream","ofstream",
]);
const PY_KEYWORDS = new Set([
  "False","None","True","and","as","assert","async","await","break","class",
  "continue","def","del","elif","else","except","finally","for","from","global",
  "if","import","in","is","lambda","nonlocal","not","or","pass","raise","return",
  "try","while","with","yield","print","len","range","input","type","str","int",
  "float","list","dict","set","tuple","bool","enumerate","zip","map","filter",
]);
const JAVA_KEYWORDS = new Set([
  "abstract","assert","boolean","break","byte","case","catch","char","class",
  "const","continue","default","do","double","else","enum","extends","final",
  "finally","float","for","goto","if","implements","import","instanceof","int",
  "interface","long","native","new","null","package","private","protected",
  "public","return","short","static","strictfp","super","switch","synchronized",
  "this","throw","throws","transient","try","var","void","volatile","while",
  "String","System","out","println","print","Integer","Boolean","Double","Long",
]);
const JS_KEYWORDS = new Set([
  "break","case","catch","class","const","continue","debugger","default","delete",
  "do","else","export","extends","false","finally","for","function","if","import",
  "in","instanceof","let","new","null","of","return","static","super","switch",
  "this","throw","true","try","typeof","undefined","var","void","while","with",
  "yield","async","await","console","log","from","as",
]);

function getKeywordSet(langId) {
  if (langId === "cpp")    return { kw: CPP_KEYWORDS, ty: CPP_TYPES };
  if (langId === "python") return { kw: PY_KEYWORDS,  ty: new Set() };
  if (langId === "java")   return { kw: JAVA_KEYWORDS, ty: new Set() };
  if (langId === "js")     return { kw: JS_KEYWORDS,  ty: new Set() };
  return { kw: new Set(), ty: new Set() };
}

function tokenizeLine(line, langId) {
  const { kw, ty } = getKeywordSet(langId);
  const tokens = [];
  let i = 0;

  // C++ preprocessor
  if (langId === "cpp" && /^\s*#/.test(line)) {
    tokens.push({ type: "pre", text: line });
    return tokens;
  }

  while (i < line.length) {
    // Single-line comment //
    if ((langId === "cpp" || langId === "js" || langId === "java") && line[i] === "/" && line[i+1] === "/") {
      tokens.push({ type: "comment", text: line.slice(i) });
      break;
    }
    // Python comment #
    if (langId === "python" && line[i] === "#") {
      tokens.push({ type: "comment", text: line.slice(i) });
      break;
    }
    // String " or '
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i]; let j = i + 1;
      while (j < line.length && !(line[j] === q && line[j-1] !== "\\")) j++;
      tokens.push({ type: "string", text: line.slice(i, j + 1) });
      i = j + 1; continue;
    }
    // Number
    if (/[0-9]/.test(line[i]) && (i === 0 || /\W/.test(line[i-1]))) {
      let j = i;
      while (j < line.length && /[0-9.xXa-fA-FuUlL]/.test(line[j])) j++;
      tokens.push({ type: "number", text: line.slice(i, j) });
      i = j; continue;
    }
    // Identifier / keyword
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      // Check if followed by ( → function call
      const afterSpace = line.slice(j).trimStart();
      if (afterSpace.startsWith("(")) {
        tokens.push({ type: "func", text: word });
      } else if (kw.has(word)) {
        tokens.push({ type: "keyword", text: word });
      } else if (ty.has(word)) {
        tokens.push({ type: "type", text: word });
      } else {
        tokens.push({ type: "plain", text: word });
      }
      i = j; continue;
    }
    // Punctuation/operators
    if (/[{}()\[\];,.<>!&|=+\-*/%^~?:]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[{}()\[\];,.<>!&|=+\-*/%^~?:]/.test(line[j])) j++;
      tokens.push({ type: "punct", text: line.slice(i, j) });
      i = j; continue;
    }
    // whitespace / other
    let j = i;
    while (j < line.length && !/[a-zA-Z0-9_$"'#/{}()\[\];,.<>!&|=+\-*/%^~?:]/.test(line[j])) j++;
    if (j > i) { tokens.push({ type: "plain", text: line.slice(i, j) }); i = j; }
    else { tokens.push({ type: "plain", text: line[i] }); i++; }
  }
  return tokens;
}

function tokenColor(type) {
  return {
    keyword: C.tkKeyword, type: C.tkType, string: C.tkString,
    number: C.tkNumber, comment: C.tkComment, func: C.tkFunc,
    punct: C.tkPunct, pre: C.tkPre, plain: C.tkPlain,
  }[type] || C.tkPlain;
}

// ── Syntax Highlighted Display ───────────────────────────────────────────────
function SyntaxLine({ line, langId }) {
  const tokens = tokenizeLine(line || "", langId);
  return (
    <span>
      {tokens.map((tok, i) => (
        <span key={i} style={{ color: tokenColor(tok.type) }}>{tok.text}</span>
      ))}
    </span>
  );
}

// ── Code Editor with overlay highlighting ────────────────────────────────────
function CodeEditor({ value, onChange, lang, activeLine, onCursorChange }) {
  const textareaRef = useRef(null);
  const overlayRef  = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s  = textareaRef.current.selectionStart;
      const en = textareaRef.current.selectionEnd;
      const next = value.substring(0, s) + "  " + value.substring(en);
      onChange(next);
      requestAnimationFrame(() => {
        if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = s + 2;
      });
    }
  };

  const syncScroll = () => {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop  = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleSelect = () => {
    if (!textareaRef.current || !onCursorChange) return;
    const pos = textareaRef.current.selectionStart;
    const before = value.slice(0, pos);
    const line = before.split("\n").length;
    const col  = pos - before.lastIndexOf("\n");
    onCursorChange({ line, col });
  };

  const lines = value.split("\n");

  const fontStyle = {
    fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code','Courier New',monospace",
    fontSize: 13.5,
    lineHeight: "22px",
    letterSpacing: "0.3px",
  };

  return (
    <div style={{ position:"relative", flex:1, overflow:"hidden" }}>
      {/* Syntax highlight overlay */}
      <div ref={overlayRef} style={{
        position:"absolute", top:0, left:0, right:0, bottom:0,
        overflow:"hidden", pointerEvents:"none",
        padding:"16px 20px",
        ...fontStyle,
        whiteSpace:"pre",
        color: C.tkPlain,
        zIndex: 1,
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            lineHeight: "22px",
            background: i + 1 === activeLine ? C.editorActiveLine : "transparent",
            borderLeft: i + 1 === activeLine ? `2px solid ${C.green}44` : "2px solid transparent",
            paddingLeft: i + 1 === activeLine ? 2 : 4,
            marginLeft: -4,
            minHeight: 22,
          }}>
            <SyntaxLine line={line} langId={lang.id} />
            {/* Invisible placeholder for empty lines */}
            {line === "" && <span style={{ opacity:0 }}>{"‎"}</span>}
          </div>
        ))}
      </div>

      {/* Actual textarea (transparent text, on top) */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={syncScroll}
        onClick={handleSelect}
        onKeyUp={handleSelect}
        spellCheck={false}
        style={{
          position:"absolute", top:0, left:0, right:0, bottom:0,
          width:"100%", height:"100%",
          resize:"none", background:"transparent",
          border:"none", outline:"none",
          color:"transparent",
          caretColor: C.green,
          ...fontStyle,
          padding:"16px 20px",
          zIndex: 2,
          whiteSpace:"pre",
          overflowWrap:"normal",
          overflow:"auto",
        }}
      />
    </div>
  );
}

function useTimer(endTime) {
  const [ms, setMs] = useState(() => Math.max(0, endTime - Date.now()));
  useEffect(() => {
    setMs(Math.max(0, endTime - Date.now()));
    const i = setInterval(() => setMs(Math.max(0, endTime - Date.now())), 1000);
    return () => clearInterval(i);
  }, [endTime]);
  return ms;
}

function fmt(ms) {
  const s  = Math.floor(ms / 1000);
  const h  = Math.floor(s / 3600);
  const m  = Math.floor((s % 3600) / 60);
  const sc = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;
}

function DiffBadge({ d }) {
  if (!d) return null;
  const col = d === "Easy" ? C.green : d === "Medium" ? C.yellow : C.red;
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4,
      color:col, background:col+"22", border:`1px solid ${col}44` }}>
      {d}
    </span>
  );
}

function StatusPill({ status }) {
  const cfg = {
    Accepted:               { color: C.green,  bg: C.greenDim,  label: "✓ Accepted" },
    "Wrong Answer":         { color: C.red,    bg: C.redDim,    label: "✗ Wrong Answer" },
    "Time Limit Exceeded":  { color: C.yellow, bg: "#1c1200",   label: "⏱ TLE" },
    "Runtime Error":        { color: C.red,    bg: C.redDim,    label: "💥 Runtime Error" },
    "Compilation Error":    { color: C.red,    bg: C.redDim,    label: "⚙ Compile Error" },
    "Memory Limit Exceeded":{ color: C.yellow, bg: "#1c1200",   label: "🧠 MLE" },
    Queued:                 { color: C.muted,  bg: C.card,      label: "⏳ Queued" },
    Running:                { color: C.blue,   bg: "#0a1a2e",   label: "⚡ Running" },
    Judging:                { color: C.blue,   bg: "#0a1a2e",   label: "⚡ Judging..." },
  }[status] || { color: C.muted, bg: C.card, label: status || "—" };
  return (
    <span style={{ fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:6,
      color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.color}44` }}>
      {cfg.label}
    </span>
  );
}

function NotRegisteredScreen({ navigate, contestEnded }) {
  return (
    <div style={{ background:C.bg, height:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      fontFamily:"'Segoe UI',system-ui,sans-serif", gap:16, padding:24 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <div style={{ fontSize:64 }}>🔒</div>
      <div style={{ fontSize:22, fontWeight:700, color:C.text }}>Registration Required</div>
      <div style={{ fontSize:14, color:C.muted, textAlign:"center", maxWidth:420, lineHeight:1.8 }}>
        {contestEnded
          ? "This contest has ended. You can view the leaderboard but cannot participate."
          : "You must register for this contest before it starts."}
      </div>
      <button onClick={() => navigate("/contests-list")}
        style={{ marginTop:8, padding:"10px 28px", borderRadius:8,
          border:`1px solid ${C.green}`, background:C.greenDim,
          color:C.green, cursor:"pointer", fontFamily:"inherit",
          fontWeight:700, fontSize:14 }}>
        ← Go to Contests
      </button>
    </div>
  );
}

export default function ContestArena() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const tokenRef = useRef(localStorage.getItem("token"));
  useEffect(() => { tokenRef.current = localStorage.getItem("token"); }, []);

  const [contest,       setContest]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [notRegistered, setNotRegistered] = useState(false);
  const [contestEnded,  setContestEnded]  = useState(false);
  const [probIdx,       setProbIdx]       = useState(0);
  const [lang,          setLang]          = useState(LANGS[0]);
  const [codes,         setCodes]         = useState({});
  const [localSubs,     setLocalSubs]     = useState({});
  const [allSubs,       setAllSubs]       = useState([]);
  const [submitting,    setSubmitting]    = useState(false);
  const [polling,       setPolling]       = useState(false);
  const [leaderboard,   setLeaderboard]   = useState([]);
  const [msg,           setMsg]           = useState(null);
  const [tab,           setTab]           = useState("problem");
  const [leftW,         setLeftW]         = useState(DEFAULT_SPLIT_PCT);
  const [dragging,      setDragging]      = useState(false);
  const [cursor,        setCursor]        = useState({ line: 1, col: 1 });

  const containerRef  = useRef(null);
  const pollTimerRef  = useRef(null);
  const pollCancelRef = useRef(false);
  const socketRef     = useRef(null);

  const endTime  = contest?.endTime ?? (Date.now() + 99 * 3600000);
  const timeLeft = useTimer(endTime);

  useEffect(() => {
    setLoading(true);
    const token = tokenRef.current;
    const role  = localStorage.getItem("role");

    fetch(`${API_BASE}/api/contests/${id}`)
      .then(r => { if (!r.ok) throw new Error("Contest not found"); return r.json(); })
      .then(async data => {
        const startTime = new Date(data.startTime).getTime();
        const endTime   = new Date(data.endTime).getTime();
        const contestId = data._id?.toString();
        const hasEnded  = Date.now() >= endTime;
        const isLive    = Date.now() >= startTime && !hasEnded;

        setContestEnded(hasEnded);

        if (role !== "admin") {
          try {
            const regRes  = await fetch(
              `${API_BASE}/api/contests/${contestId}/is-registered`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const regData = await regRes.json();

            if (!regData.isRegistered) {
              if (isLive) {
                await fetch(`${API_BASE}/api/contests/${contestId}/register`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                });
              } else if (hasEnded) {
                setNotRegistered(true); setLoading(false); return;
              } else {
                setNotRegistered(true); setLoading(false); return;
              }
            }
          } catch {
            setNotRegistered(true); setLoading(false); return;
          }
        }

        setContest({ ...data, startTime, endTime, id: contestId });
        const init = {};
        (data.problems || []).forEach(p => {
          const slug = p.problemId?.slug;
          if (slug) init[slug] = LANGS[0].default;
        });
        setCodes(init);
        fetch(`${API_BASE}/api/contests/${contestId}/leaderboard`)
          .then(res => res.json()).then(setLeaderboard).catch(console.error);
      })
      .catch(err => { console.error("Failed to load contest:", err); setContest(null); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!contest) return;
    if (!socketRef.current) {
      socketRef.current = io(API_BASE, { transports: ["websocket"] });
    }
    const socket = socketRef.current;
    socket.emit("joinContest", contest.id);
    const handleLeaderboard = (data) => setLeaderboard(data);
    socket.on("leaderboardUpdate", handleLeaderboard);
    return () => {
      socket.off("leaderboardUpdate", handleLeaderboard);
      socket.emit("leaveContest", contest.id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [contest]);

  const pollSubmission = useCallback((submissionId, slug) => {
    setPolling(true);
    pollCancelRef.current = false;
    let attempts = 0;
    const tick = async () => {
      if (pollCancelRef.current) return;
      if (attempts++ > MAX_POLL_ATTEMPTS) {
        setPolling(false);
        setMsg({ ok: false, text: "Judge timed out. Please try again." });
        return;
      }
      try {
        const r = await fetch(`${API_BASE}/api/submissions/${submissionId}`,
          { headers: { Authorization: `Bearer ${tokenRef.current}` } });
        if (!r.ok) { pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS); return; }
        const data   = await r.json();
        const status = data.status || "Running";
        setLocalSubs(prev => ({ ...prev, [slug]: { status, submissionId, runtime: data.runtime, output: data.output } }));
        setAllSubs(prev => prev.map(s => s._id === submissionId ? { ...s, status } : s));
        if (TERMINAL_STATUSES.has(status)) {
          setPolling(false);
          const ac = status === "Accepted";
          setMsg({ ok: ac, text: ac
            ? `✓ Accepted! Runtime: ${data.runtime ?? "—"}ms`
            : `✗ ${status}${data.output ? ` — ${String(data.output).slice(0,120)}` : ""}` });
        } else {
          pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
        }
      } catch { if (!pollCancelRef.current) pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS); }
    };
    pollTimerRef.current = setTimeout(tick, POLL_INITIAL_MS);
  }, []);

  useEffect(() => () => { pollCancelRef.current = true; clearTimeout(pollTimerRef.current); }, []);

  const onMouseDown = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      if (!containerRef.current) return;
      const r   = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - r.left) / r.width) * 100;
      setLeftW(Math.min(MAX_SPLIT_PCT, Math.max(MIN_SPLIT_PCT, pct)));
    };
    const up = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [dragging]);

  const problems      = contest?.problems || [];
  const activeProb    = problems[probIdx];
  const prob          = activeProb?.problemId || {};
  const slug          = prob.slug || "";
  const code          = codes[slug] || lang.default;
  const setCode       = useCallback(v => setCodes(p => ({ ...p, [slug]: v })), [slug]);
  const isContestNotStarted = contest ? Date.now() < contest.startTime : false;
  const isOver        = contest ? (timeLeft === 0 || Date.now() >= contest.endTime) : false;
  const timerColor    = timeLeft < DANGER_THRESHOLD_MS ? C.red : timeLeft < WARN_THRESHOLD_MS ? C.yellow : C.green;
  const solvedCount   = useMemo(() => problems.filter(p => localSubs[p.problemId?.slug]?.status === "Accepted").length, [problems, localSubs]);
  const lineCount     = useMemo(() => code.split("\n").length, [code]);
  const charCount     = code.length;
  const activeSubInfo = localSubs[slug];
  const isSolved      = activeSubInfo?.status === "Accepted";
  const isJudging     = ["Queued","Running","Judging"].includes(activeSubInfo?.status);
  const isWrong       = activeSubInfo && !isSolved && !isJudging;
  const canSubmit     = !submitting && !polling && !isOver && !!code.trim() && !!slug && !!tokenRef.current;

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    pollCancelRef.current = true;
    clearTimeout(pollTimerRef.current);
    setSubmitting(true);
    setMsg(null);
    setLocalSubs(prev => ({ ...prev, [slug]: { status: "Queued", submissionId: null } }));
    try {
      const r = await fetch(`${API_BASE}/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ problemSlug: slug, code, languageId: lang.languageId }),
      });
      const data = await r.json();
      if (!r.ok) {
        setSubmitting(false);
        setLocalSubs(prev => ({ ...prev, [slug]: undefined }));
        setMsg({ ok: false, text: data.msg || "Submission failed." });
        return;
      }
      const subId = data.submissionId;
      setSubmitting(false);
      setLocalSubs(prev => ({ ...prev, [slug]: { status: "Judging", submissionId: subId } }));
      setAllSubs(prev => [{ _id: subId, problemSlug: slug, problemTitle: prob.title,
        language: lang.label, languageId: lang.languageId,
        status: "Judging", createdAt: new Date().toISOString() }, ...prev]);
      pollSubmission(subId, slug);
    } catch {
      setSubmitting(false);
      setLocalSubs(prev => ({ ...prev, [slug]: undefined }));
      setMsg({ ok: false, text: "Network error. Please try again." });
    }
  }, [canSubmit, slug, code, lang, prob.title, pollSubmission]);

  // ── Early returns ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ background:C.bg, height:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", color:C.muted, fontFamily:"monospace", fontSize:14 }}>
      Loading contest...
    </div>
  );

  if (notRegistered) return <NotRegisteredScreen navigate={navigate} contestEnded={contestEnded} />;

  if (!contest) return (
    <div style={{ background:C.bg, height:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", color:C.red, fontFamily:"monospace", fontSize:14 }}>
      Contest not found.
    </div>
  );

  if (isContestNotStarted) return (
    <div style={{ background:C.bg, height:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", fontFamily:"monospace", gap:16 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <div style={{ fontSize:18, fontWeight:700, color:C.text }}>Contest hasn't started yet</div>
      <div style={{ fontSize:14, color:C.muted }}>Starts in {fmt(contest.startTime - Date.now())}</div>
      <button onClick={() => navigate("/contests-list")}
        style={{ marginTop:8, padding:"8px 20px", borderRadius:8, border:`1px solid ${C.border}`,
          background:C.card, color:C.text, cursor:"pointer", fontFamily:"inherit" }}>
        ← Back to Contests
      </button>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div style={{ background:C.bg, height:"100vh", display:"flex", flexDirection:"column",
      fontFamily:"'Segoe UI',system-ui,sans-serif", color:C.text, overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
        * { box-sizing:border-box }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-track { background: #080c10 }
        ::-webkit-scrollbar-thumb { background:${C.border2}; border-radius:2px }
        ::-webkit-scrollbar-thumb:hover { background: #3a5070 }
        textarea::selection { background: rgba(88,166,255,0.25) !important }
      `}</style>

      {/* TOPBAR */}
      <div style={{ height:48, background:C.surface, borderBottom:`1px solid ${C.border}`,
        display:"flex", alignItems:"center", padding:"0 16px", gap:12, flexShrink:0 }}>
        <button onClick={() => navigate("/contests-list")}
          style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted,
            padding:"4px 12px", borderRadius:6, cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>
          ← Exit
        </button>
        <span style={{ fontWeight:700, fontSize:14 }}>{contest.title}</span>
        <span style={{ fontSize:11, color:C.muted, background:C.card, padding:"2px 8px",
          borderRadius:4, border:`1px solid ${C.border}` }}>
          {solvedCount}/{problems.length} solved
        </span>
        <div style={{ flex:1 }} />
        {isOver
          ? <span style={{ fontFamily:"monospace", fontSize:15, fontWeight:700, color:C.red }}>CONTEST ENDED</span>
          : <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:timerColor,
                animation:"pulse 1.5s ease-in-out infinite" }} />
              <span style={{ fontFamily:"monospace", fontSize:18, fontWeight:700,
                color:timerColor, letterSpacing:2, minWidth:80 }}>
                {fmt(timeLeft)}
              </span>
            </div>
        }
        <button onClick={submit} disabled={!canSubmit}
          style={{ padding:"7px 20px", borderRadius:8, border:"none",
            cursor: canSubmit ? "pointer" : "not-allowed",
            background: isOver ? C.border : (submitting||polling) ? C.greenDim : C.green,
            color:       isOver ? C.muted  : (submitting||polling) ? C.green    : "#000",
            fontWeight:700, fontSize:13, fontFamily:"inherit",
            opacity:(submitting||polling) ? 0.9 : 1, transition:"all 0.15s" }}>
          {submitting ? "Submitting..." : polling ? "Judging..." : "Submit"}
        </button>
      </div>

      {/* Toast */}
      {msg && (
        <div style={{ background: msg.ok ? C.greenDim : C.redDim,
          borderBottom:`1px solid ${msg.ok ? C.green : C.red}44`,
          padding:"8px 20px", fontSize:12, fontFamily:"monospace",
          color: msg.ok ? C.green : C.red, animation:"slideIn 0.2s ease",
          display:"flex", justifyContent:"space-between" }}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)}
            style={{ background:"transparent", border:"none", color:"inherit", cursor:"pointer", fontSize:14 }}>×</button>
        </div>
      )}

      {/* SPLIT PANE */}
      <div ref={containerRef} style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* LEFT */}
        <div style={{ width:`${leftW}%`, display:"flex", flexDirection:"column",
          borderRight:`1px solid ${C.border}`, overflow:"hidden" }}>

          {/* Problem tabs */}
          <div style={{ background:C.panel, borderBottom:`1px solid ${C.border}`,
            display:"flex", overflowX:"auto", flexShrink:0 }}>
            {problems.map((p, i) => {
              const s       = localSubs[p.problemId?.slug];
              const solved  = s?.status === "Accepted";
              const wrong   = s && !solved && !["Queued","Running","Judging"].includes(s.status);
              const judging = s && ["Queued","Running","Judging"].includes(s.status);
              const active  = i === probIdx;
              return (
                <button key={i} onClick={() => { setProbIdx(i); setTab("problem"); setMsg(null); }}
                  style={{ padding:"10px 16px", border:"none", cursor:"pointer", fontFamily:"inherit",
                    background: active ? C.surface : "transparent",
                    borderBottom: active ? `2px solid ${C.green}` : "2px solid transparent",
                    color: solved ? C.green : wrong ? C.red : judging ? C.yellow : active ? C.text : C.muted,
                    fontSize:12, fontWeight: active ? 600 : 400,
                    display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                  <span>{solved ? "✓" : judging ? "⚡" : String.fromCharCode(65 + i)}</span>
                  <span style={{ maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {p.problemId?.title || `P${i+1}`}
                  </span>
                  <span style={{ fontSize:10, color:C.yellow }}>{p.points}pts</span>
                </button>
              );
            })}
          </div>

          {/* Sub-tabs */}
          <div style={{ background:C.panel, borderBottom:`1px solid ${C.border}`, display:"flex", flexShrink:0 }}>
            {["problem","submissions","leaderboard"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding:"8px 16px", border:"none", cursor:"pointer", fontFamily:"inherit",
                  background:"transparent", fontSize:12, fontWeight: tab===t ? 600 : 400,
                  color: tab===t ? C.green : C.muted,
                  borderBottom:`2px solid ${tab===t ? C.green : "transparent"}`,
                  textTransform:"capitalize" }}>
                {t}
                {t === "submissions" && allSubs.length > 0 &&
                  <span style={{ marginLeft:6, fontSize:10, background:C.border2,
                    padding:"1px 5px", borderRadius:10, color:C.muted }}>
                    {allSubs.length}
                  </span>
                }
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
            {tab === "problem" && (
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <h2 style={{ margin:0, fontSize:18 }}>{prob.title || "Untitled Problem"}</h2>
                  <DiffBadge d={prob.difficulty} />
                </div>
                {prob.description
                  ? <div style={{ lineHeight:1.7, fontSize:14 }} dangerouslySetInnerHTML={{ __html: prob.description }} />
                  : <p style={{ color:C.muted }}>No description available.</p>
                }
              </div>
            )}

            {tab === "submissions" && (
              <div>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>My Submissions</div>
                {allSubs.length === 0
                  ? <div style={{ color:C.muted, fontSize:13 }}>No submissions yet this session.</div>
                  : allSubs.map((s, i) => {
                      const liveStatus = localSubs[s.problemSlug]?.status || s.status;
                      return (
                        <div key={s._id || i} style={{ background:C.card, border:`1px solid ${C.border}`,
                          borderRadius:8, padding:"12px 16px", marginBottom:8,
                          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                            <span style={{ fontSize:13, fontWeight:600 }}>{s.problemTitle}</span>
                            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                              <StatusPill status={liveStatus} />
                              <span style={{ fontSize:11, color:C.muted }}>{s.language}</span>
                            </div>
                          </div>
                          <span style={{ fontSize:11, color:C.muted }}>
                            {new Date(s.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      );
                    })
                }
              </div>
            )}

            {tab === "leaderboard" && (
              <div>
                <div style={{ fontWeight:700, marginBottom:16 }}>Contest Leaderboard</div>
                {leaderboard.length === 0
                  ? <div style={{ color:C.muted, fontSize:13 }}>No submissions yet.</div>
                  : leaderboard.map((row, i) => (
                      <div key={row.username || i} style={{ background:C.card,
                        border:`1px solid ${i===0 ? C.yellow+"55" : C.border}`,
                        borderRadius:8, padding:"10px 14px", marginBottom:8,
                        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                          <span style={{ fontFamily:"monospace", fontWeight:700,
                            color: i===0 ? C.yellow : i===1 ? C.muted : i===2 ? "#cd7f32" : C.muted,
                            minWidth:24 }}>#{i+1}</span>
                          <span style={{ fontWeight:600 }}>{row.username}</span>
                        </div>
                        <div style={{ display:"flex", gap:16, fontSize:12 }}>
                          <span style={{ color:C.green, fontWeight:700 }}>{row.score} pts</span>
                          <span style={{ color:C.blue }}>{row.solved} solved</span>
                          <span style={{ color:C.muted, fontFamily:"monospace" }}>{row.totalTime}</span>
                        </div>
                      </div>
                    ))
                }
              </div>
            )}
          </div>
        </div>

        {/* DRAG HANDLE */}
        <div onMouseDown={onMouseDown}
          style={{ width:4, background: dragging ? C.green : C.border,
            cursor:"col-resize", flexShrink:0, transition:"background 0.15s", userSelect:"none" }} />

        {/* ═══════════════════════════════════════════════════════════════
            RIGHT: Beautiful Syntax-Highlighted Editor
        ═══════════════════════════════════════════════════════════════ */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden",
          background: C.editorBg }}>

          {/* Editor Toolbar */}
          <div style={{
            background: "#0a0f16",
            borderBottom: `1px solid ${C.border}`,
            padding: "0 12px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 42,
            flexShrink: 0,
          }}>
            {/* Language tabs */}
            <div style={{ display:"flex", gap:4, alignItems:"center" }}>
              {LANGS.map(l => {
                const active = lang.id === l.id;
                return (
                  <button key={l.id}
                    onClick={() => {
                      const isDefault = code === lang.default;
                      setLang(l);
                      if (isDefault) setCode(l.default);
                    }}
                    style={{
                      padding: "5px 13px",
                      borderRadius: 6,
                      border: active ? `1px solid ${C.green}55` : `1px solid ${C.border}`,
                      background: active
                        ? `linear-gradient(135deg, ${C.greenDim}, #081e10)`
                        : "transparent",
                      color: active ? C.green : C.muted,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'JetBrains Mono', monospace",
                      transition: "all 0.15s",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      boxShadow: active ? `0 0 8px ${C.green}22` : "none",
                    }}>
                    <span style={{ fontSize:11 }}>{l.icon}</span>
                    {l.label}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ width:1, height:20, background:C.border, margin:"0 4px" }} />

            {/* File name indicator */}
            <span style={{
              fontSize:11, color:C.muted,
              fontFamily:"'JetBrains Mono', monospace",
              display:"flex", alignItems:"center", gap:5,
            }}>
              <span style={{ width:6, height:6, borderRadius:"50%",
                background: isSolved ? C.green : isJudging ? C.blue : isWrong ? C.red : C.muted,
                flexShrink:0 }} />
              solution.{lang.id === "cpp" ? "cpp" : lang.id === "python" ? "py" : lang.id === "java" ? "java" : "js"}
            </span>

            <div style={{ flex:1 }} />

            {/* Action buttons */}
            <button onClick={() => { setCode(lang.default); setMsg(null); }}
              style={{
                background: "transparent",
                border: `1px solid ${C.border}`,
                color: C.muted,
                padding: "4px 11px",
                borderRadius: 5,
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.target.style.borderColor = C.red+"88"; e.target.style.color = C.red; }}
              onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.muted; }}>
              ↺ Reset
            </button>
          </div>

          {/* Editor body */}
          <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative" }}>

            {/* Gutter (line numbers) */}
            <div style={{
              width: 52,
              background: C.editorGutter,
              borderRight: `1px solid ${C.border}`,
              padding: "16px 0",
              flexShrink: 0,
              overflowY: "hidden",
              userSelect: "none",
            }}>
              {Array.from({ length: lineCount }, (_, i) => {
                const active = i + 1 === cursor.line;
                return (
                  <div key={i} style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: active ? C.green : C.muted,
                    textAlign: "right",
                    paddingRight: 10,
                    lineHeight: "22px",
                    fontWeight: active ? 700 : 400,
                    background: active ? C.editorActiveLine : "transparent",
                    transition: "color 0.1s",
                  }}>
                    {i + 1}
                  </div>
                );
              })}
            </div>

            {/* Code area */}
            <CodeEditor
              value={code}
              onChange={setCode}
              lang={lang}
              activeLine={cursor.line}
              onCursorChange={setCursor}
            />

            {/* Solved overlay glow */}
            {isSolved && (
              <div style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background: `linear-gradient(135deg, ${C.green}08 0%, transparent 50%)`,
                borderLeft: `3px solid ${C.green}55`,
              }} />
            )}
          </div>

          {/* Status Bar */}
          <div style={{
            background: "#070b10",
            borderTop: `1px solid ${C.border}`,
            padding: "0 16px",
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {/* Left: status info */}
            <div style={{ display:"flex", gap:16, alignItems:"center" }}>
              {/* Language indicator */}
              <span style={{
                color: C.green,
                display:"flex", alignItems:"center", gap:4,
              }}>
                <span style={{ fontSize:9 }}>●</span>
                {lang.label}
              </span>

              {/* Cursor position */}
              <span style={{ color: C.muted }}>
                Ln {cursor.line}, Col {cursor.col}
              </span>

              {/* Line count */}
              <span style={{ color: C.muted }}>
                {lineCount} lines
              </span>

              {/* Char count */}
              <span style={{ color: C.muted }}>
                {charCount} chars
              </span>

              {/* Encoding */}
              <span style={{ color: C.muted }}>UTF-8</span>
            </div>

            {/* Right: judge status + submit */}
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              {polling && (
                <span style={{ color:C.blue, display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ animation:"pulse 0.8s infinite" }}>⚡</span>
                  Judging...
                </span>
              )}
              {isSolved && (
                <span style={{ color:C.green, display:"flex", alignItems:"center", gap:4 }}>
                  <span>✓</span> Accepted
                </span>
              )}
              {isWrong && activeSubInfo?.status && (
                <StatusPill status={activeSubInfo.status} />
              )}

              <button onClick={submit} disabled={!canSubmit}
                style={{
                  padding: "3px 16px",
                  borderRadius: 5,
                  border: `1px solid ${isOver ? C.border : canSubmit ? C.green+"88" : C.border}`,
                  background: isOver
                    ? "transparent"
                    : canSubmit
                    ? `linear-gradient(135deg, ${C.green}, #00b85a)`
                    : C.greenDim,
                  color: isOver ? C.muted : canSubmit ? "#000" : C.green,
                  fontWeight: 700,
                  fontSize: 11,
                  fontFamily: "inherit",
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                  boxShadow: canSubmit && !isOver ? `0 0 10px ${C.green}44` : "none",
                }}>
                {submitting ? "Submitting..." : polling ? "⏳ Judging..." : isOver ? "Ended" : "▶ Run & Submit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}