import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Editor from "@monaco-editor/react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg:#0D1117; --surface:#161B22; --surface2:#1C2333; --border:#21262D; --border2:#2D3748;
  --green:#22C55E; --green-dim:#16A34A; --cyan:#00B4D8; --amber:#F59E0B; --red:#EF4444;
  --text:#E2E8F0; --muted:#64748B; --font:'Outfit',sans-serif; --mono:'JetBrains Mono',monospace;
}
* { scrollbar-width:thin; scrollbar-color:#21262D transparent; }
::-webkit-scrollbar { width:4px; height:4px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:#2D3748; border-radius:4px; }
@keyframes fadeUp { to { opacity:1; transform:translateY(0); } }
.sd-fade { opacity:0; transform:translateY(16px); animation:fadeUp 0.45s ease forwards; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.sd-shim { background:linear-gradient(90deg,#1E2530 25%,#252D3A 50%,#1E2530 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:10px; }
.sd-root { min-height:calc(100vh - 56px); background:var(--bg); color:var(--text); font-family:var(--font); position:relative; overflow-x:hidden; }
.sd-root::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0; background-image:linear-gradient(rgba(34,197,94,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.02) 1px,transparent 1px); background-size:48px 48px; }
.sd-inner { position:relative; z-index:1; max-width:1200px; margin:0 auto; padding:32px 28px 56px; }
.sd-topbar { display:flex; align-items:center; gap:12px; padding:0 28px; height:52px; background:var(--surface); border-bottom:1px solid var(--border); position:relative; z-index:2; }
.sd-back { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border:1px solid var(--border); border-radius:8px; background:transparent; color:var(--muted); font-family:var(--font); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.18s; }
.sd-back:hover { border-color:var(--green); color:var(--green); }
.sd-topbar-label { font-size:13px; font-weight:600; color:var(--muted); }
.sd-topbar-label span { color:var(--text); font-weight:700; }
.sd-sep { color:var(--border2); }
.sd-hero { display:flex; align-items:stretch; gap:16px; margin-bottom:24px; }
.sd-vcard { flex:1; display:flex; align-items:center; gap:20px; padding:22px 26px; background:var(--surface); border-radius:14px; border:1px solid; position:relative; overflow:hidden; }
.sd-vglow { position:absolute; inset:0; border-radius:14px; pointer-events:none; }
.sd-vicon { font-size:34px; line-height:1; flex-shrink:0; }
.sd-vlabel { font-size:24px; font-weight:800; letter-spacing:-0.4px; }
.sd-vsub { font-size:12px; color:var(--muted); font-weight:500; margin-top:4px; }
.sd-mcards { display:flex; flex-direction:column; gap:10px; width:230px; flex-shrink:0; }
.sd-mcard { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--surface); border-radius:12px; border:1px solid var(--border); }
.sd-mkey { font-size:11px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:0.6px; }
.sd-mval { font-size:13px; font-weight:700; font-family:var(--mono); }
.sd-diff { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
.sd-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
.sd-stat { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; transition:border-color 0.2s; }
.sd-stat:hover { border-color:var(--border2); }
.sd-skey { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--muted); margin-bottom:8px; }
.sd-sval { font-size:20px; font-weight:800; font-family:var(--mono); letter-spacing:-0.5px; }
.sd-sbar { height:3px; background:var(--border); border-radius:2px; overflow:hidden; margin-top:8px; }
.sd-sbar-fill { height:100%; border-radius:2px; transition:width 0.8s cubic-bezier(0.4,0,0.2,1); }
.sd-sec { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; color:var(--muted); margin-bottom:12px; display:flex; align-items:center; gap:8px; }
.sd-sec::before { content:''; width:3px; height:13px; background:var(--green); border-radius:2px; flex-shrink:0; }
.sd-cases { display:grid; grid-template-columns:repeat(auto-fill,minmax(70px,1fr)); gap:8px; margin-bottom:24px; }
.sd-case { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px; padding:10px 6px; border-radius:10px; border:1px solid; font-size:11px; font-weight:700; cursor:default; transition:transform 0.15s; }
.sd-case:hover { transform:translateY(-2px); }
.sd-cnum { font-family:var(--mono); font-size:10px; color:var(--muted); }
.sd-err { background:rgba(239,68,68,0.05); border:1px solid rgba(239,68,68,0.2); border-radius:12px; overflow:hidden; margin-bottom:24px; }
.sd-err-hdr { padding:10px 14px; background:rgba(239,68,68,0.08); border-bottom:1px solid rgba(239,68,68,0.15); font-size:12px; font-weight:700; color:#F87171; font-family:var(--mono); }
.sd-err-body { padding:12px 14px; font-family:var(--mono); font-size:12.5px; color:#FCA5A5; white-space:pre-wrap; word-break:break-word; line-height:1.7; max-height:200px; overflow-y:auto; }
.sd-code { background:var(--surface); border:1px solid var(--border); border-radius:14px; overflow:hidden; }
.sd-code-hdr { display:flex; align-items:center; gap:8px; padding:0 16px; height:42px; background:var(--surface2); border-bottom:1px solid var(--border); }
.sd-dot { width:8px; height:8px; border-radius:50%; }
.sd-fname { font-family:var(--mono); font-size:11px; color:var(--muted); margin-left:6px; }
.sd-clang { margin-left:auto; font-family:var(--mono); font-size:11px; font-weight:700; padding:2px 9px; border-radius:6px; }
.sd-copy { background:none; border:1px solid var(--border); border-radius:6px; color:var(--muted); font-family:var(--font); font-size:11px; font-weight:600; padding:3px 10px; cursor:pointer; transition:all 0.12s; }
.sd-copy:hover { border-color:var(--border2); color:var(--text); }
.sd-admin-strip { display:flex; align-items:center; gap:14px; padding:14px 18px; margin-bottom:20px; background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.2); border-radius:12px; }
.sd-admin-avatar { width:36px; height:36px; border-radius:50%; flex-shrink:0; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:800; color:var(--amber); }
`;

const LANG_MAP = {
  54: { label:"C++",    ext:"cpp",  monaco:"cpp"    },
  71: { label:"Python", ext:"py",   monaco:"python" },
  62: { label:"Java",   ext:"java", monaco:"java"   },
};
const ERR_SET = new Set(["Compilation Error","Runtime Error","Time Limit Exceeded","Memory Limit Exceeded"]);

function CopyBtn({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button className="sd-copy" onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}>
      {ok ? "✓ Copied" : "Copy"}
    </button>
  );
}

function getVC(status) {
  if (!status) return { color:"var(--muted)", bg:"rgba(100,116,139,0.08)", border:"var(--border)", icon:"...", label:"Pending" };
  const s = status.toLowerCase();
  if (s === "accepted")          return { color:"var(--green)", bg:"rgba(34,197,94,0.08)",  border:"rgba(34,197,94,0.3)",  icon:"✓", label:"Accepted"              };
  if (s.includes("wrong"))       return { color:"var(--red)",   bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.3)",  icon:"✗", label:"Wrong Answer"          };
  if (s.includes("time"))        return { color:"var(--amber)", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.3)", icon:"⏱", label:"Time Limit Exceeded"   };
  if (s.includes("memory"))      return { color:"var(--cyan)",  bg:"rgba(0,180,216,0.08)",  border:"rgba(0,180,216,0.3)", icon:"💾", label:"Memory Limit Exceeded" };
  if (s.includes("compilation")) return { color:"#F87171",      bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.3)", icon:"⚙", label:"Compilation Error"     };
  if (s.includes("runtime"))     return { color:"#F87171",      bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.3)", icon:"⚠", label:"Runtime Error"         };
  return { color:"var(--amber)", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.3)", icon:"⚠", label:status };
}

function getDC(d) {
  if (d === "Easy")   return { color:"#22C55E", bg:"rgba(34,197,94,0.12)",  border:"rgba(34,197,94,0.3)"  };
  if (d === "Medium") return { color:"#F59E0B", bg:"rgba(245,158,11,0.12)", border:"rgba(245,158,11,0.3)" };
  return                     { color:"#EF4444", bg:"rgba(239,68,68,0.12)",  border:"rgba(239,68,68,0.3)"  };
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
    + "  ·  " + d.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
}

export default function SubmissionDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const role     = localStorage.getItem("role") || "user";
  const isAdmin  = role === "admin";
  const [sub,      setSub]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(null);

  useEffect(() => {
    API.get(`/submissions/${id}`)
      .then(r => { setSub(r.data); setLoading(false); })
      .catch(e => { setFetchErr(e.response?.data?.msg || "Submission not found."); setLoading(false); });
  }, [id]);

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="sd-root">
        <div style={{ height:"52px", background:"var(--surface)", borderBottom:"1px solid var(--border)" }}/>
        <div className="sd-inner" style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div className="sd-shim" style={{ height:"100px" }}/>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
            {[0,1,2,3].map(i => <div key={i} className="sd-shim" style={{ height:"80px" }}/>)}
          </div>
          <div className="sd-shim" style={{ height:"500px" }}/>
        </div>
      </div>
    </>
  );

  if (fetchErr) return (
    <>
      <style>{CSS}</style>
      <div className="sd-root" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:"16px" }}>
          <div style={{ fontSize:"40px" }}>⚠</div>
          <div style={{ fontSize:"16px", fontWeight:700, color:"var(--red)" }}>{fetchErr}</div>
          <button className="sd-back" onClick={() => navigate(-1)}>← Go Back</button>
        </div>
      </div>
    </>
  );

  const vc  = getVC(sub.status);
  const lang = LANG_MAP[sub.languageId] || { label:"Code", ext:"txt", monaco:"plaintext" };
  const dc   = getDC(sub.problemId?.difficulty);
  const isErrStatus = ERR_SET.has(sub.status);
  const testResults = sub.testResults || [];
  const passed   = testResults.filter(t => t.status === "passed").length;
  const total    = testResults.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : null;

  return (
    <>
      <style>{CSS}</style>
      <div className="sd-root">
        <div className="sd-topbar">
          <button className="sd-back" onClick={() => navigate(-1)}>← Back</button>
          <span className="sd-sep">·</span>
          <span className="sd-topbar-label">Submission <span>#{id.slice(-8).toUpperCase()}</span></span>
          {sub.problemId?.title && (
            <>
              <span className="sd-sep">·</span>
              <span className="sd-topbar-label" style={{ cursor:"pointer" }}
                onClick={() => navigate(`/problems/${sub.problemId.slug}`)}>
                <span style={{ textDecoration:"underline", textDecorationColor:"var(--border2)" }}>
                  {sub.problemId.title}
                </span>
              </span>
            </>
          )}
          {isAdmin && (
            <span style={{ marginLeft:"auto", display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700, background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)", color:"var(--amber)" }}>
              ⚡ Admin View
            </span>
          )}
        </div>

        <div className="sd-inner">

          <div className="sd-hero sd-fade" style={{ animationDelay:"0.04s" }}>
            <div className="sd-vcard" style={{ borderColor:vc.border }}>
              <div className="sd-vglow" style={{ background:`radial-gradient(ellipse at 15% 50%, ${vc.bg} 0%, transparent 65%)` }}/>
              <span className="sd-vicon">{vc.icon}</span>
              <div>
                <div className="sd-vlabel" style={{ color:vc.color }}>{vc.label}</div>
                <div className="sd-vsub">
                  {sub.status === "Accepted" ? "All test cases passed successfully" : fmtDate(sub.createdAt)}
                </div>
              </div>
            </div>
            <div className="sd-mcards">
              <div className="sd-mcard">
                <span className="sd-mkey">Problem</span>
                <span className="sd-mval" style={{ fontSize:"12px", maxWidth:"130px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {sub.problemId?.title || "—"}
                </span>
              </div>
              <div className="sd-mcard">
                <span className="sd-mkey">Difficulty</span>
                {sub.problemId?.difficulty
                  ? <span className="sd-diff" style={{ color:dc.color, background:dc.bg, border:`1px solid ${dc.border}` }}>{sub.problemId.difficulty}</span>
                  : <span className="sd-mval" style={{ color:"var(--muted)" }}>—</span>}
              </div>
              <div className="sd-mcard">
                <span className="sd-mkey">Language</span>
                <span className="sd-mval" style={{ color:"var(--green)" }}>{lang.label}</span>
              </div>
            </div>
          </div>

          <div className="sd-stats sd-fade" style={{ animationDelay:"0.09s" }}>
            <div className="sd-stat">
              <div className="sd-skey">Submitted At</div>
              <div className="sd-sval" style={{ fontSize:"12px", fontFamily:"var(--font)", fontWeight:600, color:"var(--text)" }}>
                {fmtDate(sub.createdAt)}
              </div>
            </div>
            <div className="sd-stat">
              <div className="sd-skey">Test Cases</div>
              <div className="sd-sval" style={{ color:passRate===100?"var(--green)":passRate===0?"var(--red)":"var(--amber)" }}>
                {total > 0 ? `${passed} / ${total}` : sub.status === "Accepted" ? "All ✓" : "—"}
              </div>
              {total > 0 && (
                <div className="sd-sbar">
                  <div className="sd-sbar-fill" style={{ width:`${passRate}%`, background:passRate===100?"var(--green)":passRate===0?"var(--red)":"var(--amber)" }}/>
                </div>
              )}
            </div>
            <div className="sd-stat">
              <div className="sd-skey">Runtime</div>
              <div className="sd-sval" style={{ color:"var(--cyan)" }}>
                {sub.executionTime != null ? `${sub.executionTime} ms` : "—"}
              </div>
            </div>
            <div className="sd-stat">
              <div className="sd-skey">Memory</div>
              <div className="sd-sval" style={{ color:"var(--cyan)" }}>
                {sub.memoryUsed != null ? `${sub.memoryUsed} KB` : "—"}
              </div>
            </div>
          </div>

          {isAdmin && sub.userId && (
            <div className="sd-admin-strip sd-fade" style={{ animationDelay:"0.13s" }}>
              <div className="sd-admin-avatar">
                {(sub.userId.name || sub.userId.email || "U")[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:"13px", fontWeight:700, color:"var(--text)" }}>
                  {sub.userId.name || "—"}
                </div>
                <div style={{ fontSize:"11px", color:"var(--muted)", marginTop:"2px" }}>
                  {sub.userId.email || "—"}&nbsp;&middot;&nbsp;<span style={{ color:"var(--amber)" }}>Submitted by user</span>
                </div>
              </div>
            </div>
          )}

          {testResults.length > 0 && (
            <div className="sd-fade" style={{ animationDelay:"0.16s", marginBottom:"24px" }}>
              <div className="sd-sec">Test Cases</div>
              <div className="sd-cases">
                {testResults.map((t, i) => {
                  const pass = t.status === "passed";
                  return (
                    <div key={i} className="sd-case" style={{
                      color:       pass ? "var(--green)" : "var(--red)",
                      background:  pass ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                      borderColor: pass ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)",
                    }}>
                      <span style={{ fontSize:"14px" }}>{pass ? "✓" : "✗"}</span>
                      <span className="sd-cnum">#{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isErrStatus && sub.output && (
            <div className="sd-err sd-fade" style={{ animationDelay:"0.18s" }}>
              <div className="sd-err-hdr">
                {sub.status === "Compilation Error" ? "⚙ Compilation Error"
                  : sub.status === "Time Limit Exceeded" ? "⏱ Time Limit Exceeded"
                  : "⚠ " + sub.status}
              </div>
              <div className="sd-err-body">{sub.output}</div>
            </div>
          )}

          <div className="sd-fade" style={{ animationDelay:"0.2s" }}>
            <div className="sd-sec">
              Submitted Code
              <CopyBtn text={sub.code || ""} />
            </div>
            <div className="sd-code" style={{ height:"520px" }}>
              <div className="sd-code-hdr">
                <div className="sd-dot" style={{ background:"#EF4444" }}/>
                <div className="sd-dot" style={{ background:"#F59E0B" }}/>
                <div className="sd-dot" style={{ background:"#22C55E" }}/>
                <span className="sd-fname">solution.{lang.ext}</span>
                <span className="sd-clang" style={{ color:"var(--green)", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)" }}>
                  {lang.label}
                </span>
              </div>
              <div style={{ height:"calc(100% - 42px)" }}>
                <Editor
                  height="100%" width="100%"
                  language={lang.monaco}
                  value={sub.code || "// No code available"}
                  theme="vs-dark"
                  options={{
                    readOnly:true, minimap:{enabled:false}, fontSize:13.5,
                    fontFamily:"'JetBrains Mono',monospace", fontLigatures:true,
                    scrollBeyondLastLine:false, lineNumbersMinChars:3,
                    padding:{top:14,bottom:14},
                    scrollbar:{verticalScrollbarSize:4,horizontalScrollbarSize:4},
                    renderLineHighlight:"line", cursorBlinking:"smooth",
                    smoothScrolling:true, bracketPairColorization:{enabled:true},
                    automaticLayout:true,
                  }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}