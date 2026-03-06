import { useEffect, useState, useMemo } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg:#0D1117; --surface:#161B22; --s2:#1C2333; --border:#21262D; --border2:#2D3748;
  --green:#22C55E; --cyan:#00B4D8; --amber:#F59E0B; --red:#EF4444;
  --text:#E2E8F0; --muted:#64748B; --font:'Outfit',sans-serif; --mono:'JetBrains Mono',monospace;
}
* { scrollbar-width:thin; scrollbar-color:#21262D transparent; }
::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:#2D3748; border-radius:4px; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
@keyframes fadeUp  { to { opacity:1; transform:translateY(0); } }
@keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
@keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

.pr-page { min-height:100vh; background:var(--bg); color:var(--text); font-family:var(--font); position:relative; }
.pr-page::before {
  content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
  background-image: linear-gradient(rgba(34,197,94,0.025) 1px,transparent 1px), linear-gradient(90deg,rgba(34,197,94,0.025) 1px,transparent 1px);
  background-size:48px 48px;
}
.pr-inner { max-width:1200px; margin:0 auto; padding:40px 40px 80px; position:relative; z-index:1; }

/* header */
.pr-hdr { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:32px; flex-wrap:wrap; gap:16px; }
.pr-hdr-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(34,197,94,0.1); color:var(--green); border:1px solid rgba(34,197,94,0.25); border-radius:20px; padding:4px 14px; font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:12px; }
.pr-hdr-badge-dot { width:6px; height:6px; border-radius:50%; background:var(--green); animation:pulse 2s ease-in-out infinite; }
.pr-hdr-title { font-size:32px; font-weight:800; color:#fff; letter-spacing:-0.8px; line-height:1.1; }
.pr-hdr-title span { background:linear-gradient(135deg,#22C55E,#00B4D8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.pr-hdr-sub { color:var(--muted); font-size:14px; margin-top:6px; }

/* stats pills */
.pr-stats { display:flex; gap:10px; flex-wrap:wrap; }
.pr-stat-pill { background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:10px 18px; text-align:center; min-width:80px; transition:all 0.2s; }
.pr-stat-pill:hover { border-color:var(--border2); transform:translateY(-1px); }
.pr-stat-num { font-size:20px; font-weight:800; font-family:var(--mono); letter-spacing:-0.5px; }
.pr-stat-lbl { font-size:11px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px; }

/* admin action bar */
.pr-admin-bar { display:flex; align-items:center; gap:10px; padding:14px 20px; background:linear-gradient(135deg,rgba(245,158,11,0.06),rgba(245,158,11,0.02)); border:1px solid rgba(245,158,11,0.2); border-radius:12px; margin-bottom:20px; flex-wrap:wrap; animation:slideIn 0.3s ease; }
.pr-admin-label { font-size:11px; font-weight:700; color:var(--amber); letter-spacing:1.5px; text-transform:uppercase; margin-right:4px; }
.pr-admin-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 16px; border-radius:8px; border:1px solid rgba(245,158,11,0.3); background:rgba(245,158,11,0.10); color:var(--amber); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:var(--font); }
.pr-admin-btn:hover { background:rgba(245,158,11,0.2); transform:translateY(-1px); }
.pr-admin-btn.danger { border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.08); color:var(--red); }
.pr-admin-btn.danger:hover { background:rgba(239,68,68,0.18); }

/* filters */
.pr-filters { display:flex; align-items:center; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
.pr-search { display:flex; align-items:center; gap:8px; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:9px 14px; transition:border-color 0.15s; flex:1; min-width:200px; max-width:320px; }
.pr-search:focus-within { border-color:rgba(34,197,94,0.35); }
.pr-search input { background:none; border:none; outline:none; color:var(--text); font-family:var(--font); font-size:13px; width:100%; }
.pr-search input::placeholder { color:var(--muted); }
.pr-filter-group { display:flex; background:var(--surface); border:1px solid var(--border); border-radius:10px; overflow:hidden; }
.pr-filter-btn { padding:9px 14px; background:none; border:none; border-right:1px solid var(--border); color:var(--muted); font-family:var(--font); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s; white-space:nowrap; }
.pr-filter-btn:last-child { border-right:none; }
.pr-filter-btn:hover { background:var(--s2); color:var(--text); }
.pr-filter-btn.on { background:rgba(34,197,94,0.1); color:var(--green); }
.pr-select { background:var(--surface); border:1px solid var(--border); border-radius:10px; color:var(--text); font-family:var(--font); font-size:12px; font-weight:600; padding:9px 28px 9px 14px; outline:none; cursor:pointer; transition:border-color 0.15s; appearance:none; background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748B' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; background-color:var(--surface); }
.pr-select:hover { border-color:var(--border2); } .pr-select:focus { border-color:rgba(34,197,94,0.35); } .pr-select option { background:#161B22; }
.pr-result-count { margin-left:auto; font-size:12px; color:var(--muted); border:1px solid var(--border); border-radius:20px; padding:4px 12px; white-space:nowrap; }

/* table */
.pr-table-wrap { background:var(--surface); border:1px solid var(--border); border-radius:16px; overflow:hidden; opacity:0; transform:translateY(20px); animation:fadeUp 0.5s ease 0.1s forwards; }
.pr-table { width:100%; border-collapse:collapse; }
.pr-thead tr { border-bottom:1px solid var(--border); }
.pr-th { padding:13px 16px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--muted); background:var(--s2); white-space:nowrap; }
.pr-th:first-child { padding-left:20px; }
.pr-tr { border-bottom:1px solid var(--border); cursor:pointer; transition:all 0.15s; position:relative; }
.pr-tr:last-child { border-bottom:none; }
.pr-tr:hover { background:rgba(34,197,94,0.03); }
.pr-tr:hover .pr-title-text { color:var(--green); }
.pr-tr::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--green); transform:scaleY(0); transition:transform 0.15s; transform-origin:center; }
.pr-tr:hover::before { transform:scaleY(1); }
.pr-td { padding:14px 16px; font-size:13.5px; vertical-align:middle; }
.pr-td:first-child { padding-left:20px; }
.pr-status-solved { display:inline-flex; align-items:center; gap:5px; color:var(--green); font-size:12px; font-weight:600; }
.pr-status-unsolved { display:inline-flex; align-items:center; gap:5px; color:var(--muted); font-size:12px; font-weight:500; }
.pr-status-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.pr-idx { font-family:var(--mono); font-size:12px; color:var(--muted); }
.pr-title-text { font-size:14px; font-weight:600; color:var(--text); transition:color 0.15s; display:block; }
.pr-diff { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:0.3px; }
.pr-tag { display:inline-block; background:var(--s2); border:1px solid var(--border); color:var(--muted); border-radius:5px; padding:2px 8px; font-size:11px; font-weight:500; margin:2px 3px 2px 0; }
.pr-company { display:inline-block; border-radius:5px; padding:2px 8px; font-size:11px; font-weight:600; margin:2px 3px 2px 0; background:rgba(0,180,216,0.1); color:var(--cyan); border:1px solid rgba(0,180,216,0.2); }
.pr-empty { text-align:center; padding:64px 24px; color:var(--muted); font-size:14px; }
.pr-skel { background:linear-gradient(90deg,#161B22 25%,#1C2333 50%,#161B22 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:5px; }

/* admin row actions */
.pr-row-actions { display:flex; gap:6px; opacity:0; transition:opacity 0.15s; }
.pr-tr:hover .pr-row-actions { opacity:1; }
.pr-row-btn { padding:4px 10px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; border:1px solid; font-family:var(--font); transition:all 0.15s; }

/* ── PAGINATION ── */
.pr-pagination {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-top: 1px solid var(--border);
  background: var(--s2); flex-wrap: wrap; gap: 12px;
}
.pr-page-info { font-size: 12px; color: var(--muted); font-family: var(--mono); }
.pr-page-btns { display: flex; align-items: center; gap: 6px; }
.pr-page-btn {
  min-width: 34px; height: 34px; border-radius: 8px;
  border: 1px solid var(--border); background: transparent;
  color: var(--muted); font-family: var(--font); font-size: 13px;
  font-weight: 600; cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center; padding: 0 10px;
}
.pr-page-btn:hover:not(:disabled) { border-color: var(--green); color: var(--green); background: rgba(34,197,94,0.08); }
.pr-page-btn.active { border-color: var(--green); color: var(--green); background: rgba(34,197,94,0.12); }
.pr-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pr-page-dots { color: var(--muted); font-size: 13px; padding: 0 4px; }
`;

const TOPICS    = ["Math","Implementation","String","Sliding Window","Array","DP","Graph","Tree","Binary Search","Greedy","Recursion","Hashing"];
const COMPANIES = ["TCS","Infosys","Accenture","Amazon","Google","Microsoft","Meta","Flipkart","Adobe","Uber"];
const LIMIT     = 20; // problems per page

function SkeletonRow() {
  return (
    <tr style={{ borderBottom:"1px solid #21262D" }}>
      {[40,16,260,80,160,100].map((w,i)=>(
        <td key={i} style={{ padding:"16px", verticalAlign:"middle" }}>
          <div className="pr-skel" style={{ height:"13px", width:`${w}px` }}/>
        </td>
      ))}
    </tr>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background:"var(--surface)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:16, padding:"28px 32px", maxWidth:400, width:"90%", boxShadow:"0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize:20, fontWeight:800, color:"#fff", marginBottom:10 }}>{title}</div>
        <div style={{ fontSize:14, color:"var(--muted)", lineHeight:1.7, marginBottom:24 }}>{message}</div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onCancel} style={{ padding:"9px 20px", borderRadius:8, border:"1px solid var(--border)", background:"transparent", color:"var(--muted)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"var(--font)" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding:"9px 20px", borderRadius:8, border:"none", background:"var(--red)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--font)" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Pagination bar component ──────────────────────────────────────────────────
function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total, limit } = pagination;
  const start = (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);

  // Build page number array with dots
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="pr-pagination">
      <div className="pr-page-info">
        Showing {start}–{end} of {total} problems
      </div>
      <div className="pr-page-btns">
        <button
          className="pr-page-btn"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
        >← Prev</button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="pr-page-dots">…</span>
          ) : (
            <button
              key={p}
              className={`pr-page-btn ${p === page ? "active" : ""}`}
              onClick={() => onPage(p)}
            >{p}</button>
          )
        )}

        <button
          className="pr-page-btn"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
        >Next →</button>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Problems() {
  const navigate = useNavigate();

  const role    = localStorage.getItem("role") || "user";
  const isAdmin = role === "admin";

  const [problems,     setProblems]     = useState([]);
  const [pagination,   setPagination]   = useState(null);
  const [solved,       setSolved]       = useState(new Set());
  const [difficulty,   setDifficulty]   = useState("");
  const [topic,        setTopic]        = useState("");
  const [company,      setCompany]      = useState("");
  const [search,       setSearch]       = useState("");
  const [searchInput,  setSearchInput]  = useState(""); // debounced
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Debounce search input by 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // reset to page 1 on new search
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [difficulty, topic, company]);

  // Fetch problems whenever filters or page change
  useEffect(() => { fetchProblems(); }, [difficulty, topic, company, search, page]);

  const fetchProblems = async () => {
    try {
      setLoading(true);

      // Build query string
      const params = new URLSearchParams();
      if (difficulty) params.set("difficulty", difficulty);
      if (topic)      params.set("topic",      topic);
      if (company)    params.set("company",     company);
      if (search)     params.set("search",      search);
      params.set("page",  page);
      params.set("limit", LIMIT);

      const calls = [API.get(`/problems?${params.toString()}`)];
      if (!isAdmin) calls.push(API.get("/users/solved").catch(() => ({ data: [] })));

      const [res, solvedRes] = await Promise.all(calls);

      // ── NEW: response is now { problems, pagination } ──
      setProblems(res.data.problems || res.data); // fallback if old API
      setPagination(res.data.pagination || null);

      if (solvedRes) {
        setSolved(new Set(solvedRes.data.map(id => id.toString())));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (problemId) => {
    try {
      await API.delete(`/problems/${problemId}`);
      setProblems(prev => prev.filter(p => p._id !== problemId));
      setDeleteTarget(null);
      // Refresh to update pagination counts
      fetchProblems();
    } catch { alert("Failed to delete problem"); }
  };

  const easy        = problems.filter(p => p.difficulty === "Easy").length;
  const medium      = problems.filter(p => p.difficulty === "Medium").length;
  const hard        = problems.filter(p => p.difficulty === "Hard").length;
  const solvedCount = problems.filter(p => solved.has(p._id?.toString())).length;
  const total       = pagination?.total ?? problems.length;

  const diffStyle = d =>
    d === "Easy"   ? { color:"#22C55E", background:"rgba(34,197,94,0.12)",  border:"1px solid rgba(34,197,94,0.25)"  } :
    d === "Medium" ? { color:"#F59E0B", background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.25)" } :
                     { color:"#EF4444", background:"rgba(239,68,68,0.12)",  border:"1px solid rgba(239,68,68,0.25)"  };

  const columns = isAdmin
    ? ["#", "Problem", "Difficulty", "Tags", "Companies", "Actions"]
    : ["Status", "#", "Problem", "Difficulty", "Tags", "Companies"];

  return (
    <>
      <style>{CSS}</style>
      {deleteTarget && (
        <ConfirmModal
          title="Delete Problem"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`}
          onConfirm={() => handleDelete(deleteTarget._id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <div className="pr-page">
        <div className="pr-inner">

          {/* ── HEADER ── */}
          <div className="pr-hdr">
            <div className="pr-hdr-left">
              <div className="pr-hdr-badge">
                <div className="pr-hdr-badge-dot"/>
                {isAdmin ? "Problem Management" : "Problem Bank"}
              </div>
              <div className="pr-hdr-title">
                {isAdmin
                  ? <>Manage. <span>Problems.</span></>
                  : <>Solve. Learn. <span>Level Up.</span></>
                }
              </div>
              <div className="pr-hdr-sub">
                {loading ? "Loading problems…" : `${total} problems curated for competitive programmers`}
              </div>
            </div>

            {/* Stats pills */}
            <div className="pr-stats">
              {!isAdmin && (
                <div className="pr-stat-pill">
                  <div className="pr-stat-num" style={{ color:"#22C55E" }}>{loading ? "–" : solvedCount}</div>
                  <div className="pr-stat-lbl">Solved</div>
                </div>
              )}
              <div className="pr-stat-pill">
                <div className="pr-stat-num" style={{ color:"#22C55E" }}>{loading ? "–" : easy}</div>
                <div className="pr-stat-lbl">Easy</div>
              </div>
              <div className="pr-stat-pill">
                <div className="pr-stat-num" style={{ color:"#F59E0B" }}>{loading ? "–" : medium}</div>
                <div className="pr-stat-lbl">Medium</div>
              </div>
              <div className="pr-stat-pill">
                <div className="pr-stat-num" style={{ color:"#EF4444" }}>{loading ? "–" : hard}</div>
                <div className="pr-stat-lbl">Hard</div>
              </div>
              {isAdmin && (
                <div className="pr-stat-pill">
                  <div className="pr-stat-num" style={{ color:"var(--cyan)" }}>{loading ? "–" : total}</div>
                  <div className="pr-stat-lbl">Total</div>
                </div>
              )}
            </div>
          </div>

          {/* ── ADMIN ACTION BAR ── */}
          {isAdmin && (
            <div className="pr-admin-bar">
              <span className="pr-admin-label">⚡ Admin</span>
              <button className="pr-admin-btn" onClick={() => navigate("/admin/problems/new")}>➕ Add Problem</button>
              <button className="pr-admin-btn" onClick={() => navigate("/admin/problems/bulk")}>📥 Bulk Import</button>
              <button className="pr-admin-btn" onClick={() => navigate("/admin/dashboard")} style={{ marginLeft:"auto" }}>📊 Dashboard</button>
            </div>
          )}

          {/* ── FILTERS ── */}
          <div className="pr-filters">
            <div className="pr-search">
              <svg width="14" height="14" fill="none" stroke="#64748B" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder="Search problems or tags…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>

            <div className="pr-filter-group">
              {["","Easy","Medium","Hard"].map(d => (
                <button key={d} className={`pr-filter-btn ${difficulty===d?"on":""}`}
                  onClick={() => setDifficulty(d)}
                  style={difficulty===d && d ? { color:diffStyle(d).color, background:diffStyle(d).background } : {}}>
                  {d||"All"}
                </button>
              ))}
            </div>

            <select className="pr-select" value={topic} onChange={e => setTopic(e.target.value)}>
              <option value="">All Topics</option>
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select className="pr-select" value={company} onChange={e => setCompany(e.target.value)}>
              <option value="">All Companies</option>
              {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="pr-result-count">
              {loading ? "…" : `${total} result${total !== 1 ? "s" : ""}`}
            </div>
          </div>

          {/* ── TABLE ── */}
          <div className="pr-table-wrap">
            <table className="pr-table">
              <thead className="pr-thead">
                <tr>
                  {columns.map(c => <th key={c} className="pr-th">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i}/>)
                ) : problems.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="pr-empty">
                      <div style={{ fontSize:"32px", marginBottom:"10px" }}>🔍</div>
                      No problems match your filters
                    </td>
                  </tr>
                ) : problems.map((p, i) => {
                  const isSolved = solved.has(p._id?.toString());
                  const ds       = diffStyle(p.difficulty);
                  const rowNum   = ((page - 1) * LIMIT) + i + 1; // global row number
                  return (
                    <tr key={p._id} className="pr-tr"
                      onClick={e => {
                        if (e.target.closest(".pr-row-actions")) return;
                        if (!isAdmin) navigate(`/problems/slug/${p.slug}`);
                      }}>

                      {!isAdmin && (
                        <td className="pr-td">
                          {isSolved ? (
                            <span className="pr-status-solved">
                              <span className="pr-status-dot" style={{ background:"#22C55E", boxShadow:"0 0 5px #22C55E" }}/>Solved
                            </span>
                          ) : (
                            <span className="pr-status-unsolved">
                              <span className="pr-status-dot" style={{ background:"#374151" }}/>Unsolved
                            </span>
                          )}
                        </td>
                      )}

                      <td className="pr-td"><span className="pr-idx">{String(rowNum).padStart(2,"0")}</span></td>
                      <td className="pr-td"><span className="pr-title-text">{p.title}</span></td>
                      <td className="pr-td"><span className="pr-diff" style={ds}>{p.difficulty}</span></td>

                      <td className="pr-td">
                        {p.tags?.length
                          ? p.tags.slice(0,3).map(t => <span key={t} className="pr-tag">{t}</span>)
                          : <span style={{ color:"var(--muted)", fontSize:"12px" }}>—</span>}
                        {p.tags?.length > 3 && <span className="pr-tag">+{p.tags.length-3}</span>}
                      </td>

                      <td className="pr-td">
                        {p.companies?.length
                          ? p.companies.slice(0,2).map(c => <span key={c} className="pr-company">{c}</span>)
                          : <span style={{ color:"var(--muted)", fontSize:"12px" }}>—</span>}
                        {p.companies?.length > 2 && <span className="pr-company" style={{ opacity:0.6 }}>+{p.companies.length-2}</span>}
                      </td>

                      {isAdmin && (
                        <td className="pr-td">
                          <div className="pr-row-actions">
                            <button className="pr-row-btn" onClick={() => navigate(`/problems/slug/${p.slug}`)}
                              style={{ borderColor:"rgba(34,197,94,0.3)", color:"var(--green)", background:"rgba(34,197,94,0.08)" }}>View</button>
                            <button className="pr-row-btn" onClick={() => navigate(`/admin/problems/edit/${p._id}`)}
                              style={{ borderColor:"rgba(245,158,11,0.3)", color:"var(--amber)", background:"rgba(245,158,11,0.08)" }}>Edit</button>
                            <button className="pr-row-btn" onClick={() => setDeleteTarget(p)}
                              style={{ borderColor:"rgba(239,68,68,0.3)", color:"var(--red)", background:"rgba(239,68,68,0.08)" }}>Delete</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ── PAGINATION BAR ── */}
            <Pagination pagination={pagination} onPage={setPage} />

          </div>

        </div>
      </div>
    </>
  );
}