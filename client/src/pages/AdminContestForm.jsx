import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
:root {
  --bg:#0D1117; --surface:#161B22; --s2:#1C2333; --border:#21262D; --border2:#2D3748;
  --green:#22C55E; --cyan:#00B4D8; --amber:#F59E0B; --red:#EF4444;
  --text:#E2E8F0; --muted:#64748B; --font:'Outfit',sans-serif; --mono:'JetBrains Mono',monospace;
}
* { scrollbar-width:thin; scrollbar-color:#21262D transparent; }
::-webkit-scrollbar { width:5px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:#2D3748; border-radius:4px; }
@keyframes fadeUp { to{opacity:1;transform:translateY(0);} }
.acf-fade { opacity:0; transform:translateY(16px); animation:fadeUp 0.45s ease forwards; }
@keyframes spin { to{transform:rotate(360deg);} }
.acf-root { min-height:100vh; background:var(--bg); color:var(--text); font-family:var(--font); }
.acf-root::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
  background-image:linear-gradient(rgba(34,197,94,0.02) 1px,transparent 1px),
  linear-gradient(90deg,rgba(34,197,94,0.02) 1px,transparent 1px);
  background-size:48px 48px; }
.acf-inner { max-width:900px; margin:0 auto; padding:36px 28px 100px; position:relative; z-index:1; }
.acf-topbar { display:flex; align-items:center; gap:12px; margin-bottom:32px; }
.acf-back { display:inline-flex; align-items:center; gap:5px; padding:6px 14px; border:1px solid var(--border);
  border-radius:8px; background:transparent; color:var(--muted); font-family:var(--font); font-size:12px;
  font-weight:600; cursor:pointer; transition:all 0.18s; }
.acf-back:hover { border-color:var(--green); color:var(--green); }
.acf-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(245,158,11,0.1);
  color:var(--amber); border:1px solid rgba(245,158,11,0.25); border-radius:20px; padding:4px 14px;
  font-size:12px; font-weight:700; }
.acf-title { font-size:28px; font-weight:900; color:#fff; letter-spacing:-0.5px; margin-bottom:6px; }
.acf-sub { font-size:13px; color:var(--muted); margin-bottom:32px; }
.acf-section { background:var(--surface); border:1px solid var(--border); border-radius:16px;
  overflow:visible; margin-bottom:20px; }
.acf-section-hdr { display:flex; align-items:center; gap:10px; padding:16px 22px;
  background:var(--s2); border-bottom:1px solid var(--border); border-radius:16px 16px 0 0; }
.acf-section-title { font-size:13px; font-weight:700; color:#fff; }
.acf-section-sub { font-size:12px; color:var(--muted); margin-left:auto; }
.acf-section-body { padding:22px; display:flex; flex-direction:column; gap:18px; }
.acf-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.acf-field { display:flex; flex-direction:column; gap:6px; }
.acf-label { font-size:11px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.8px; }
.acf-input { width:100%; background:var(--s2); border:1px solid var(--border); border-radius:10px;
  color:var(--text); font-family:var(--font); font-size:14px; padding:10px 14px; outline:none;
  transition:border-color 0.18s; }
.acf-input:focus { border-color:rgba(245,158,11,0.45); box-shadow:0 0 0 3px rgba(245,158,11,0.08); }
.acf-input::placeholder { color:var(--muted); }
.acf-search-wrap { position:relative; }
.acf-search-results { position:absolute; top:calc(100% + 6px); left:0; right:0;
  background:#161B22; border:1px solid #21262D; border-radius:10px;
  z-index:9999; max-height:320px; overflow-y:auto;
  box-shadow:0 16px 48px rgba(0,0,0,0.8); }
.acf-search-item { display:flex; align-items:center; justify-content:space-between; padding:12px 16px;
  cursor:pointer; transition:background 0.12s; border-bottom:1px solid #21262D; }
.acf-search-item:last-child { border-bottom:none; }
.acf-search-item:hover { background:#1C2333; }
.acf-search-name { font-size:13px; font-weight:600; color:#E2E8F0; }
.acf-search-diff { font-size:11px; font-weight:700; padding:2px 8px; border-radius:20px; flex-shrink:0; }
.acf-no-results { padding:16px; text-align:center; font-size:13px; color:#64748B; }
.acf-search-hint { padding:10px 16px; font-size:11px; color:#64748B;
  border-bottom:1px solid #21262D; font-style:italic; }
.acf-prob-card { display:flex; align-items:center; gap:12px; padding:12px 16px; background:var(--bg);
  border:1px solid var(--border); border-radius:10px; transition:border-color 0.2s; }
.acf-prob-card:hover { border-color:var(--border2); }
.acf-prob-num { font-family:var(--mono); font-size:11px; color:var(--muted); width:24px; flex-shrink:0; }
.acf-prob-title { flex:1; font-size:13px; font-weight:600; color:var(--text); }
.acf-prob-diff { font-size:11px; font-weight:700; padding:2px 8px; border-radius:20px; }
.acf-prob-points { width:80px; background:var(--s2); border:1px solid var(--border); border-radius:7px;
  color:var(--text); font-family:var(--mono); font-size:13px; padding:5px 8px; outline:none; text-align:center; }
.acf-prob-points:focus { border-color:rgba(245,158,11,0.45); }
.acf-prob-remove { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:6px;
  color:var(--red); font-size:11px; font-weight:600; padding:3px 9px; cursor:pointer;
  font-family:var(--font); transition:all 0.15s; flex-shrink:0; }
.acf-prob-remove:hover { background:rgba(239,68,68,0.2); }
.acf-empty { text-align:center; padding:28px; color:var(--muted); font-size:13px;
  border:1px dashed var(--border2); border-radius:10px; }
.acf-bar { position:sticky; bottom:0; z-index:10; background:rgba(13,17,23,0.95);
  backdrop-filter:blur(12px); border-top:1px solid var(--border); padding:16px 28px;
  display:flex; align-items:center; justify-content:space-between; gap:16px; margin:0 -28px; }
.acf-bar-info { font-size:13px; color:var(--muted); }
.acf-bar-info span { color:var(--amber); font-weight:700; }
.acf-bar-btns { display:flex; gap:10px; }
.acf-cancel { padding:10px 22px; border:1px solid var(--border); border-radius:10px; background:transparent;
  color:var(--muted); font-family:var(--font); font-size:13px; font-weight:600; cursor:pointer; transition:all 0.15s; }
.acf-cancel:hover { border-color:var(--red); color:var(--red); }
.acf-save { padding:10px 28px; border:none; border-radius:10px; background:var(--amber); color:#0D1117;
  font-family:var(--font); font-size:14px; font-weight:800; cursor:pointer; transition:all 0.2s;
  display:flex; align-items:center; gap:8px; }
.acf-save:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(245,158,11,0.35); }
.acf-save:disabled { opacity:0.55; cursor:not-allowed; transform:none; }
.acf-spin { width:14px; height:14px; border:2px solid rgba(0,0,0,0.2); border-top-color:#0D1117;
  border-radius:50%; animation:spin 0.6s linear infinite; }
.acf-err { background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:10px;
  padding:12px 16px; font-size:13px; color:var(--red); font-weight:600; margin-bottom:16px; }
.acf-success { background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.25); border-radius:10px;
  padding:12px 16px; font-size:13px; color:var(--green); font-weight:600; margin-bottom:16px; }
`;

function diffColor(d) {
  if (d === "Easy")   return { color: "#22C55E", bg: "rgba(34,197,94,0.12)"  };
  if (d === "Medium") return { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" };
  return                     { color: "#EF4444", bg: "rgba(239,68,68,0.12)"  };
}

function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d   = new Date(iso);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const toArr = (val, ...keys) => {
  if (Array.isArray(val)) return val;
  for (const k of keys) if (val && Array.isArray(val[k])) return val[k];
  return [];
};

export default function AdminContestForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = Boolean(id);

  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState(null);
  const [form,        setForm]        = useState({ title: "", startTime: "", endTime: "" });
  const [problems,    setProblems]    = useState([]);
  const [search,      setSearch]      = useState("");
  const [allProblems, setAllProblems] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // ✅ Load all problems — fetch all pages
  useEffect(() => {
    const fetchAllProblems = async () => {
      try {
        let page = 1;
        let all  = [];
        while (true) {
          const r    = await API.get(`/problems?page=${page}&limit=100`);
          const d    = r.data;
          const list = toArr(d, "problems", "data");
          if (list.length === 0) break;
          all = [...all, ...list];
          if (list.length < 100) break;
          page++;
        }
        setAllProblems(all);
      } catch {
        try {
          const r = await API.get("/problems?limit=1000");
          setAllProblems(toArr(r.data, "problems", "data"));
        } catch {}
      }
    };
    fetchAllProblems();
  }, []);

  // ✅ Load contest if editing
  useEffect(() => {
    if (!isEdit) return;
    API.get(`/contests/${id}`)
      .then(r => {
        const c = r.data?.contest || r.data;
        if (!c) return;
        setForm({
          title:     c.title     || "",
          startTime: toDatetimeLocal(c.startTime),
          endTime:   toDatetimeLocal(c.endTime),
        });
        const probs = toArr(c.problems, "problems");
        if (probs.length > 0) {
          setProblems(probs.map(p => ({
            problemId:  p.problemId?._id || p.problemId,
            title:      p.problemId?.title      || "Unknown",
            difficulty: p.problemId?.difficulty || "Easy",
            points:     p.points || 100,
          })));
        }
      })
      .catch(() => setMsg({ type: "error", text: "Failed to load contest." }));
  }, [id, isEdit]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ✅ Show ALL problems when search empty, filter when typing
  const filtered = allProblems.filter(p =>
    (!search.trim() || (p.title || "").toLowerCase().includes(search.toLowerCase())) &&
    !problems.find(sel => sel.problemId === p._id)
  );

  const addProblem = p => {
    setProblems(prev => [...prev, {
      problemId:  p._id,
      title:      p.title,
      difficulty: p.difficulty,
      points:     100,
    }]);
    setSearch("");
    setShowResults(false);
  };

  const removeProblem = i      => setProblems(p => p.filter((_, j) => j !== i));
  const setPoints     = (i, v) => setProblems(p => p.map((x, j) => j === i ? { ...x, points: Number(v) } : x));

  const handleSubmit = async () => {
    if (!form.title.trim()) return setMsg({ type: "error", text: "Title is required." });
    if (!form.startTime)    return setMsg({ type: "error", text: "Start time is required." });
    if (!form.endTime)      return setMsg({ type: "error", text: "End time is required." });
    if (new Date(form.startTime) >= new Date(form.endTime))
      return setMsg({ type: "error", text: "End time must be after start time." });
    if (problems.length === 0)
      return setMsg({ type: "error", text: "Add at least one problem to the contest." });

    setSaving(true);
    setMsg(null);

    try {
      const payload = {
        title:     form.title.trim(),
        startTime: new Date(form.startTime).toISOString(),
        endTime:   new Date(form.endTime).toISOString(),
        problems:  problems.map(p => ({ problemId: p.problemId, points: p.points })),
      };

      if (isEdit) {
        await API.put(`/contests/${id}`, payload);
        setMsg({ type: "success", text: "Contest updated successfully!" });
      } else {
        await API.post("/contests", payload);
        setMsg({ type: "success", text: "Contest created! Redirecting..." });
        setTimeout(() => navigate("/admin/dashboard"), 1200);
      }
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.msg || err.response?.data?.message || "Failed to save contest.",
      });
    } finally {
      setSaving(false);
    }
  };

  const totalPoints = problems.reduce((a, p) => a + p.points, 0);

  return (
    <>
      <style>{CSS}</style>
      <div className="acf-root">
        <div className="acf-inner">

          <div className="acf-topbar acf-fade">
            <button className="acf-back" onClick={() => navigate("/admin/dashboard")}>← Dashboard</button>
            <span className="acf-badge">⚡ Admin</span>
          </div>

          <div className="acf-title acf-fade" style={{ animationDelay: "0.05s" }}>
            {isEdit ? "Edit Contest" : "Create New Contest"}
          </div>
          <div className="acf-sub acf-fade" style={{ animationDelay: "0.08s" }}>
            {isEdit ? "Update contest details and problems." : "Set up a timed contest with problems and points."}
          </div>

          {msg && (
            <div className={`acf-fade ${msg.type === "success" ? "acf-success" : "acf-err"}`}>
              {msg.text}
            </div>
          )}

          {/* Contest Details */}
          <div className="acf-section acf-fade" style={{ animationDelay: "0.1s" }}>
            <div className="acf-section-hdr">
              <span style={{ fontSize: 16 }}>🏆</span>
              <span className="acf-section-title">Contest Details</span>
            </div>
            <div className="acf-section-body">
              <div className="acf-field">
                <label className="acf-label">Contest Title *</label>
                <input
                  className="acf-input"
                  placeholder="e.g. Weekly Challenge #1"
                  value={form.title}
                  onChange={e => set("title", e.target.value)}
                />
              </div>
              <div className="acf-row-2">
                <div className="acf-field">
                  <label className="acf-label">Start Time *</label>
                  <input
                    className="acf-input"
                    type="datetime-local"
                    value={form.startTime}
                    onChange={e => set("startTime", e.target.value)}
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                <div className="acf-field">
                  <label className="acf-label">End Time *</label>
                  <input
                    className="acf-input"
                    type="datetime-local"
                    value={form.endTime}
                    onChange={e => set("endTime", e.target.value)}
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              </div>
              {form.startTime && form.endTime && new Date(form.endTime) > new Date(form.startTime) && (
                <div style={{ fontSize: 12, color: "var(--cyan)", background: "rgba(0,180,216,0.08)", border: "1px solid rgba(0,180,216,0.2)", borderRadius: 8, padding: "8px 14px", fontFamily: "var(--mono)" }}>
                  ⏱ Duration: {Math.round((new Date(form.endTime) - new Date(form.startTime)) / 60000)} minutes
                </div>
              )}
            </div>
          </div>

          {/* Problems */}
          <div className="acf-section acf-fade" style={{ animationDelay: "0.14s" }}>
            <div className="acf-section-hdr">
              <span style={{ fontSize: 16 }}>💻</span>
              <span className="acf-section-title">Problems</span>
              <span className="acf-section-sub">{problems.length} selected</span>
            </div>
            <div className="acf-section-body">
              <div className="acf-field">
                <label className="acf-label">Search & Add Problems</label>

                {/* ✅ Simple relative wrap — dropdown is absolute below input */}
                <div className="acf-search-wrap">
                  <input
                    className="acf-input"
                    placeholder="Click or type to search all problems..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setShowResults(true); }}
                    onFocus={() => setShowResults(true)}
                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                  />

                  {showResults && (
                    <div className="acf-search-results">
                      {!search.trim() && (
                        <div className="acf-search-hint">
                          {allProblems.length} problems available — type to filter
                        </div>
                      )}
                      {filtered.length === 0 ? (
                        <div className="acf-no-results">
                          {search.trim() ? "No matching problems found" : "All problems already added"}
                        </div>
                      ) : (
                        filtered.map(p => {
                          const dc = diffColor(p.difficulty);
                          return (
                            <div key={p._id} className="acf-search-item" onMouseDown={() => addProblem(p)}>
                              <span className="acf-search-name">{p.title}</span>
                              <span className="acf-search-diff" style={{ color: dc.color, background: dc.bg }}>
                                {p.difficulty}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {problems.length === 0 ? (
                <div className="acf-empty">
                  No problems added yet. Click the search box above to browse all problems.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {problems.map((p, i) => {
                    const dc = diffColor(p.difficulty);
                    return (
                      <div key={p.problemId} className="acf-prob-card">
                        <span className="acf-prob-num">{String(i + 1).padStart(2, "0")}</span>
                        <span className="acf-prob-title">{p.title}</span>
                        <span className="acf-prob-diff" style={{ color: dc.color, background: dc.bg }}>
                          {p.difficulty}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>pts</span>
                          <input
                            className="acf-prob-points"
                            type="number" min={10} max={1000} step={10}
                            value={p.points}
                            onChange={e => setPoints(i, e.target.value)}
                          />
                        </div>
                        <button className="acf-prob-remove" onClick={() => removeProblem(i)}>
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sticky bottom bar */}
          <div className="acf-bar">
            <div className="acf-bar-info">
              <span>{problems.length}</span> problems &middot; total <span>{totalPoints}</span> pts
            </div>
            <div className="acf-bar-btns">
              <button className="acf-cancel" onClick={() => navigate("/admin/dashboard")}>
                Cancel
              </button>
              <button className="acf-save" onClick={handleSubmit} disabled={saving}>
                {saving
                  ? <><div className="acf-spin" /> Saving...</>
                  : isEdit ? "Update Contest" : "Create Contest"
                }
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}