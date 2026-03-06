import { useState, useEffect } from "react";
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
::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:#2D3748; border-radius:4px; }
@keyframes fadeUp { to{opacity:1;transform:translateY(0);} }
.apf-fade { opacity:0; transform:translateY(16px); animation:fadeUp 0.45s ease forwards; }
.apf-root { min-height:100vh; background:var(--bg); color:var(--text); font-family:var(--font); }
.apf-root::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0; background-image:linear-gradient(rgba(34,197,94,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.02) 1px,transparent 1px); background-size:48px 48px; }
.apf-inner { max-width:900px; margin:0 auto; padding:36px 28px 80px; position:relative; z-index:1; }
.apf-topbar { display:flex; align-items:center; gap:12px; margin-bottom:32px; }
.apf-back { display:inline-flex; align-items:center; gap:5px; padding:6px 14px; border:1px solid var(--border); border-radius:8px; background:transparent; color:var(--muted); font-family:var(--font); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.18s; }
.apf-back:hover { border-color:var(--green); color:var(--green); }
.apf-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(245,158,11,0.1); color:var(--amber); border:1px solid rgba(245,158,11,0.25); border-radius:20px; padding:4px 14px; font-size:12px; font-weight:700; }
.apf-title { font-size:28px; font-weight:900; color:#fff; letter-spacing:-0.5px; margin-bottom:6px; }
.apf-sub { font-size:13px; color:var(--muted); margin-bottom:32px; }
.apf-section { background:var(--surface); border:1px solid var(--border); border-radius:16px; overflow:hidden; margin-bottom:20px; }
.apf-section-hdr { display:flex; align-items:center; gap:10px; padding:16px 22px; background:var(--s2); border-bottom:1px solid var(--border); }
.apf-section-title { font-size:13px; font-weight:700; color:#fff; }
.apf-section-sub { font-size:12px; color:var(--muted); margin-left:auto; }
.apf-section-body { padding:22px; display:flex; flex-direction:column; gap:18px; }
.apf-row { display:grid; gap:16px; }
.apf-row-2 { grid-template-columns:1fr 1fr; }
.apf-row-3 { grid-template-columns:1fr 1fr 1fr; }
.apf-field { display:flex; flex-direction:column; gap:6px; }
.apf-label { font-size:11px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.8px; }
.apf-input { width:100%; background:var(--s2); border:1px solid var(--border); border-radius:10px; color:var(--text); font-family:var(--font); font-size:14px; padding:10px 14px; outline:none; transition:border-color 0.18s; }
.apf-input:focus { border-color:rgba(245,158,11,0.45); box-shadow:0 0 0 3px rgba(245,158,11,0.08); }
.apf-input::placeholder { color:var(--muted); }
.apf-textarea { width:100%; background:var(--s2); border:1px solid var(--border); border-radius:10px; color:var(--text); font-family:var(--font); font-size:14px; padding:10px 14px; outline:none; resize:vertical; line-height:1.7; transition:border-color 0.18s; }
.apf-textarea:focus { border-color:rgba(245,158,11,0.45); box-shadow:0 0 0 3px rgba(245,158,11,0.08); }
.apf-textarea::placeholder { color:var(--muted); }
.apf-select { width:100%; background:var(--s2); border:1px solid var(--border); border-radius:10px; color:var(--text); font-family:var(--font); font-size:14px; padding:10px 14px; outline:none; cursor:pointer; }
.apf-select:focus { border-color:rgba(245,158,11,0.45); }
.apf-mono { font-family:var(--mono); font-size:13px; }
.apf-tc { background:var(--bg); border:1px solid var(--border); border-radius:12px; padding:16px; transition:border-color 0.2s; }
.apf-tc:hover { border-color:var(--border2); }
.apf-tc-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
.apf-tc-label { font-size:12px; font-weight:700; color:var(--amber); font-family:var(--mono); }
.apf-tc-remove { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); border-radius:6px; color:var(--red); font-size:11px; font-weight:600; padding:3px 10px; cursor:pointer; font-family:var(--font); transition:all 0.15s; }
.apf-tc-remove:hover { background:rgba(239,68,68,0.2); }
.apf-tc-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.apf-add-btn { display:flex; align-items:center; gap:7px; padding:9px 16px; border:1px dashed var(--border2); border-radius:10px; background:transparent; color:var(--muted); font-family:var(--font); font-size:13px; font-weight:600; cursor:pointer; transition:all 0.18s; width:100%; justify-content:center; margin-top:4px; }
.apf-add-btn:hover { border-color:var(--amber); color:var(--amber); background:rgba(245,158,11,0.05); }
.apf-bar { position:sticky; bottom:0; z-index:10; background:rgba(13,17,23,0.95); backdrop-filter:blur(12px); border-top:1px solid var(--border); padding:16px 28px; display:flex; align-items:center; justify-content:space-between; gap:16px; margin:0 -28px; }
.apf-bar-info { font-size:13px; color:var(--muted); }
.apf-bar-info span { color:var(--amber); font-weight:700; }
.apf-bar-btns { display:flex; gap:10px; }
.apf-cancel { padding:10px 22px; border:1px solid var(--border); border-radius:10px; background:transparent; color:var(--muted); font-family:var(--font); font-size:13px; font-weight:600; cursor:pointer; transition:all 0.15s; }
.apf-cancel:hover { border-color:var(--red); color:var(--red); }
.apf-save { padding:10px 28px; border:none; border-radius:10px; background:var(--amber); color:#0D1117; font-family:var(--font); font-size:14px; font-weight:800; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:8px; }
.apf-save:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(245,158,11,0.35); }
.apf-save:disabled { opacity:0.55; cursor:not-allowed; transform:none; }
@keyframes spin { to{transform:rotate(360deg);} }
.apf-spin { width:14px; height:14px; border:2px solid rgba(0,0,0,0.2); border-top-color:#0D1117; border-radius:50%; animation:spin 0.6s linear infinite; }
.apf-err { background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:10px; padding:12px 16px; font-size:13px; color:var(--red); font-weight:600; }
.apf-success { background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.25); border-radius:10px; padding:12px 16px; font-size:13px; color:var(--green); font-weight:600; }
`;

const EMPTY_SAMPLE = { input: "", output: "", explanation: "" };
const EMPTY_TC     = { input: "", output: "" };

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export default function AdminProblemForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = Boolean(id);

  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState(null);
  const [form,        setForm]        = useState({
    title:"", slug:"", difficulty:"Easy",
    description:"", constraints:"", tags:"", companies:"",
  });
  const [samples,     setSamples]     = useState([{ ...EMPTY_SAMPLE }]);
  const [hiddenTests, setHiddenTests] = useState([{ ...EMPTY_TC }]);

  useEffect(() => {
    if (!isEdit) return;
    API.get(`/problems/${id}`).then(r => {
      const p = r.data;
      setForm({
        title:       p.title       || "",
        slug:        p.slug        || "",
        difficulty:  p.difficulty  || "Easy",
        description: p.description || "",
        constraints: p.constraints || "",
        tags:        (p.tags || p.topics || []).join(", "),
        companies:   (p.companies || []).join(", "),
      });
      if (p.samples?.length > 0) setSamples(p.samples);
    }).catch(() => setMsg({ type:"error", text:"Failed to load problem." }));
  }, [id]);

  const set = (k, v) => setForm(f => {
    const next = { ...f, [k]: v };
    if (k === "title" && !isEdit) next.slug = slugify(v);
    return next;
  });

  const addSample    = ()        => setSamples(s => [...s, { ...EMPTY_SAMPLE }]);
  const removeSample = i         => setSamples(s => s.filter((_,j) => j !== i));
  const setSample    = (i, k, v) => setSamples(s => s.map((x,j) => j===i ? { ...x, [k]:v } : x));
  const addTC        = ()        => setHiddenTests(t => [...t, { ...EMPTY_TC }]);
  const removeTC     = i         => setHiddenTests(t => t.filter((_,j) => j !== i));
  const setTC        = (i, k, v) => setHiddenTests(t => t.map((x,j) => j===i ? { ...x, [k]:v } : x));

  const handleSubmit = async () => {
    if (!form.title.trim())       return setMsg({ type:"error", text:"Title is required." });
    if (!form.slug.trim())        return setMsg({ type:"error", text:"Slug is required." });
    if (!form.description.trim()) return setMsg({ type:"error", text:"Description is required." });
    if (hiddenTests.some(t => !t.input.trim() || !t.output.trim()))
      return setMsg({ type:"error", text:"All hidden test cases must have input and output." });

    setSaving(true); setMsg(null);
    try {
      const payload = {
        ...form,
        tags:      form.tags.split(",").map(t => t.trim()).filter(Boolean),
        companies: form.companies.split(",").map(c => c.trim()).filter(Boolean),
        samples,
        hiddenTests,
      };
      if (isEdit) {
        await API.put(`/problems/${id}`, payload);
        setMsg({ type:"success", text:"Problem updated successfully!" });
      } else {
        await API.post("/problems/create", payload);
        setMsg({ type:"success", text:"Problem created! Redirecting..." });
        setTimeout(() => navigate("/admin/dashboard"), 1200);
      }
    } catch (err) {
      setMsg({ type:"error", text: err.response?.data?.error || "Failed to save problem." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="apf-root">
        <div className="apf-inner">

          <div className="apf-topbar apf-fade">
            <button className="apf-back" onClick={() => navigate("/admin/dashboard")}>← Dashboard</button>
            <span className="apf-badge">⚡ Admin</span>
          </div>

          <div className="apf-title apf-fade" style={{ animationDelay:"0.05s" }}>
            {isEdit ? "Edit Problem" : "Add New Problem"}
          </div>
          <div className="apf-sub apf-fade" style={{ animationDelay:"0.08s" }}>
            {isEdit ? "Update problem details and test cases." : "Fill in all details to create a new DSA problem."}
          </div>

          {msg && (
            <div className={`apf-fade ${msg.type==="success"?"apf-success":"apf-err"}`} style={{ marginBottom:20 }}>
              {msg.text}
            </div>
          )}

          {/* BASIC INFO */}
          <div className="apf-section apf-fade" style={{ animationDelay:"0.1s" }}>
            <div className="apf-section-hdr">
              <span style={{ fontSize:16 }}>📝</span>
              <span className="apf-section-title">Basic Information</span>
            </div>
            <div className="apf-section-body">
              <div className="apf-row apf-row-2">
                <div className="apf-field">
                  <label className="apf-label">Title *</label>
                  <input className="apf-input" placeholder="e.g. Two Sum" value={form.title} onChange={e => set("title", e.target.value)}/>
                </div>
                <div className="apf-field">
                  <label className="apf-label">Slug *</label>
                  <input className="apf-input apf-mono" placeholder="e.g. two-sum" value={form.slug} onChange={e => set("slug", e.target.value)}/>
                </div>
              </div>
              <div className="apf-row apf-row-3">
                <div className="apf-field">
                  <label className="apf-label">Difficulty *</label>
                  <select className="apf-select" value={form.difficulty} onChange={e => set("difficulty", e.target.value)}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className="apf-field">
                  <label className="apf-label">Tags (comma-separated)</label>
                  <input className="apf-input" placeholder="Array, HashMap" value={form.tags} onChange={e => set("tags", e.target.value)}/>
                </div>
                <div className="apf-field">
                  <label className="apf-label">Companies (comma-separated)</label>
                  <input className="apf-input" placeholder="Google, Amazon" value={form.companies} onChange={e => set("companies", e.target.value)}/>
                </div>
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="apf-section apf-fade" style={{ animationDelay:"0.13s" }}>
            <div className="apf-section-hdr">
              <span style={{ fontSize:16 }}>📄</span>
              <span className="apf-section-title">Problem Statement</span>
            </div>
            <div className="apf-section-body">
              <div className="apf-field">
                <label className="apf-label">Description *</label>
                <textarea className="apf-textarea" rows={6} placeholder="Describe the problem clearly..." value={form.description} onChange={e => set("description", e.target.value)}/>
              </div>
              <div className="apf-field">
                <label className="apf-label">Constraints</label>
                <textarea className="apf-textarea apf-mono" rows={3} placeholder="1 n 10^5" value={form.constraints} onChange={e => set("constraints", e.target.value)}/>
              </div>
            </div>
          </div>

          {/* SAMPLE TEST CASES */}
          <div className="apf-section apf-fade" style={{ animationDelay:"0.16s" }}>
            <div className="apf-section-hdr">
              <span style={{ fontSize:16 }}>🟢</span>
              <span className="apf-section-title">Sample Test Cases</span>
              <span className="apf-section-sub">Visible to users on problem page</span>
            </div>
            <div className="apf-section-body">
              {samples.map((s, i) => (
                <div key={i} className="apf-tc">
                  <div className="apf-tc-hdr">
                    <span className="apf-tc-label">Sample #{i + 1}</span>
                    {samples.length > 1 && (
                      <button className="apf-tc-remove" onClick={() => removeSample(i)}>Remove</button>
                    )}
                  </div>
                  <div className="apf-tc-grid">
                    <div className="apf-field">
                      <label className="apf-label">Input</label>
                      <textarea className="apf-textarea apf-mono" rows={3} placeholder="1 2" value={s.input} onChange={e => setSample(i,"input",e.target.value)}/>
                    </div>
                    <div className="apf-field">
                      <label className="apf-label">Output</label>
                      <textarea className="apf-textarea apf-mono" rows={3} placeholder="3" value={s.output} onChange={e => setSample(i,"output",e.target.value)}/>
                    </div>
                  </div>
                  <div className="apf-field" style={{ marginTop:12 }}>
                    <label className="apf-label">Explanation (optional)</label>
                    <input className="apf-input" placeholder="Why is this output correct?" value={s.explanation||""} onChange={e => setSample(i,"explanation",e.target.value)}/>
                  </div>
                </div>
              ))}
              <button className="apf-add-btn" onClick={addSample}>+ Add Sample</button>
            </div>
          </div>

          {/* HIDDEN TEST CASES */}
          <div className="apf-section apf-fade" style={{ animationDelay:"0.19s" }}>
            <div className="apf-section-hdr">
              <span style={{ fontSize:16 }}>🔒</span>
              <span className="apf-section-title">Hidden Test Cases</span>
              <span className="apf-section-sub">Used for judging — not visible to users</span>
            </div>
            <div className="apf-section-body">
              {hiddenTests.map((t, i) => (
                <div key={i} className="apf-tc">
                  <div className="apf-tc-hdr">
                    <span className="apf-tc-label">Test Case #{i + 1}</span>
                    {hiddenTests.length > 1 && (
                      <button className="apf-tc-remove" onClick={() => removeTC(i)}>Remove</button>
                    )}
                  </div>
                  <div className="apf-tc-grid">
                    <div className="apf-field">
                      <label className="apf-label">Input *</label>
                      <textarea className="apf-textarea apf-mono" rows={3} placeholder="1 2" value={t.input} onChange={e => setTC(i,"input",e.target.value)}/>
                    </div>
                    <div className="apf-field">
                      <label className="apf-label">Expected Output *</label>
                      <textarea className="apf-textarea apf-mono" rows={3} placeholder="3" value={t.output} onChange={e => setTC(i,"output",e.target.value)}/>
                    </div>
                  </div>
                </div>
              ))}
              <button className="apf-add-btn" onClick={addTC}>+ Add Test Case</button>
            </div>
          </div>

          {/* STICKY SAVE BAR */}
          <div className="apf-bar">
            <div className="apf-bar-info">
              <span>{hiddenTests.length}</span> hidden tests &middot; <span>{samples.length}</span> samples
            </div>
            <div className="apf-bar-btns">
              <button className="apf-cancel" onClick={() => navigate("/admin/dashboard")}>Cancel</button>
              <button className="apf-save" onClick={handleSubmit} disabled={saving}>
                {saving ? <><div className="apf-spin"/> Saving...</> : isEdit ? "Update Problem" : "Create Problem"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}