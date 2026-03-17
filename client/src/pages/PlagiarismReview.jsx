import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
:root {
  --bg:#0D1117; --surface:#161B22; --s2:#1C2333; --border:#21262D;
  --green:#22C55E; --cyan:#00B4D8; --amber:#F59E0B; --red:#EF4444; --purple:#8B5CF6;
  --text:#E2E8F0; --muted:#64748B; --font:'Outfit',sans-serif; --mono:'JetBrains Mono',monospace;
}
* { scrollbar-width:thin; scrollbar-color:#21262D transparent; }
::-webkit-scrollbar { width:5px; }
::-webkit-scrollbar-thumb { background:#2D3748; border-radius:4px; }
@keyframes fadeUp { to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn { to{opacity:1} }
@keyframes pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
@keyframes spin   { to{transform:rotate(360deg)} }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.pr-page { min-height:100vh; background:var(--bg); color:var(--text); font-family:var(--font); }
.pr-page::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0; background-image:linear-gradient(rgba(139,92,246,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.02) 1px,transparent 1px); background-size:48px 48px; }
.pr-inner { max-width:1400px; margin:0 auto; padding:36px 40px 80px; position:relative; z-index:1; }
.pr-fade { opacity:0; transform:translateY(18px); animation:fadeUp 0.5s ease forwards; }
.pr-hdr { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:32px; flex-wrap:wrap; gap:16px; }
.pr-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(139,92,246,0.1); color:var(--purple); border:1px solid rgba(139,92,246,0.25); border-radius:20px; padding:4px 14px; font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:12px; }
.pr-badge-dot { width:6px; height:6px; border-radius:50%; background:var(--purple); animation:pulse 2s ease-in-out infinite; }
.pr-title { font-size:32px; font-weight:900; color:#fff; letter-spacing:-1px; }
.pr-title span { background:linear-gradient(135deg,#8B5CF6,#EF4444); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.pr-sub { font-size:14px; color:var(--muted); margin-top:6px; }
.pr-btn { display:inline-flex; align-items:center; gap:7px; padding:10px 20px; border-radius:10px; font-family:var(--font); font-size:13px; font-weight:700; cursor:pointer; transition:all 0.2s; border:1px solid; }
.pr-btn:hover { transform:translateY(-2px); }
.pr-empty { text-align:center; padding:80px 20px; color:var(--muted); }
.pr-empty-icon { font-size:56px; margin-bottom:16px; }
.pr-empty-title { font-size:20px; font-weight:700; color:var(--text); margin-bottom:8px; }
.pr-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; overflow:hidden; margin-bottom:24px; transition:border-color 0.2s; }
.pr-card.flagged { border-color:rgba(239,68,68,0.3); }
.pr-card.cleared { border-color:rgba(34,197,94,0.3); opacity:0.6; }
.pr-card-hdr { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid var(--border); flex-wrap:wrap; gap:12px; }
.pr-card-hdr-left { display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
.pr-similarity { font-size:28px; font-weight:900; font-family:var(--mono); }
.pr-card-meta { font-size:13px; color:var(--muted); }
.pr-card-meta strong { color:var(--text); }
.pr-pill { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
.pr-actions { display:flex; gap:10px; flex-wrap:wrap; }
.pr-action-btn { padding:8px 20px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; border:1px solid; font-family:var(--font); transition:all 0.15s; }
.pr-action-btn:hover { transform:translateY(-1px); }
.pr-action-btn:disabled { opacity:0.4; cursor:not-allowed; transform:none; }
.pr-code-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; }
.pr-code-panel { padding:0; }
.pr-code-panel:first-child { border-right:1px solid var(--border); }
.pr-code-header { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; background:var(--s2); border-bottom:1px solid var(--border); }
.pr-user-info { display:flex; align-items:center; gap:10px; }
.pr-avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:#0D1117; flex-shrink:0; }
.pr-username { font-size:14px; font-weight:700; color:var(--text); }
.pr-submit-time { font-size:11px; color:var(--muted); margin-top:2px; }
.pr-code-body { padding:20px; background:#0D1117; font-family:var(--mono); font-size:12px; line-height:1.7; color:#E2E8F0; overflow-x:auto; min-height:200px; max-height:400px; overflow-y:auto; white-space:pre; }
.pr-status-bar { display:flex; align-items:center; gap:8px; padding:10px 20px; background:var(--s2); border-top:1px solid var(--border); font-size:12px; color:var(--muted); }
.pr-shimmer { background:linear-gradient(90deg,#1E2530 25%,#252D3A 50%,#1E2530 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }
.pr-stats { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:14px; margin-bottom:28px; }
.pr-stat { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:18px 20px; }
.pr-stat-val { font-size:28px; font-weight:900; font-family:var(--mono); }
.pr-stat-label { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:0.8px; margin-top:4px; }
.pr-toast-wrap { position:fixed; bottom:24px; right:24px; z-index:9999; display:flex; flex-direction:column; gap:8px; pointer-events:none; }
.pr-toast { display:flex; align-items:center; gap:10px; padding:12px 18px; border-radius:10px; font-size:13px; font-weight:600; animation:fadeIn 0.3s ease; box-shadow:0 4px 20px rgba(0,0,0,0.5); }
.pr-toast.success { background:#052e16; color:#22C55E; border:1px solid #166534; }
.pr-toast.error   { background:#2a0a0a; color:#EF4444; border:1px solid #7f1d1d; }
.pr-toast.info    { background:#0a1628; color:#00B4D8; border:1px solid #0e4d6b; }
.pr-section-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:var(--muted); margin-bottom:16px; display:flex; align-items:center; gap:10px; }
.pr-section-label::after { content:''; flex:1; height:1px; background:var(--border); }
.pr-error-box { background:rgba(239,68,68,0.07); border:1px solid rgba(239,68,68,0.25); border-radius:14px; padding:40px 32px; text-align:center; }
.pr-no-check-box { background:rgba(139,92,246,0.07); border:1px solid rgba(139,92,246,0.25); border-radius:14px; padding:48px 32px; text-align:center; }
@media (max-width: 768px) {
  .pr-code-grid { grid-template-columns:1fr; }
  .pr-code-panel:first-child { border-right:none; border-bottom:1px solid var(--border); }
  .pr-inner { padding:20px 16px 60px; }
}
`;

export default function PlagiarismReview() {
  const { contestId } = useParams();
  const navigate      = useNavigate();

  const [report,     setReport]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  // ✅ FIX: track whether no check has been run yet (404) vs a real error (500)
  const [errorState, setErrorState] = useState(null); // null | "no-check" | "error"
  const [actionLoad, setActionLoad] = useState(null);
  const [toasts,     setToasts]     = useState([]);
  const [dismissed,  setDismissed]  = useState(new Set());

  const showToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  const fetchReport = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      // ✅ FIX: corrected endpoint from /plagiarism/contests/... to /admin/contests/...
      const res = await API.get(`/admin/contests/${contestId}/plagiarism-report`);
      setReport(res.data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        // No check has been run yet — show a friendly "run check first" state
        setErrorState("no-check");
        setReport(null);
      } else {
        // Real server error
        setErrorState("error");
        setReport(null);
        showToast("Failed to load plagiarism report", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [contestId]);

  // Confirm penalty — send email + keep score at 0
  const confirmPenalty = async (sub1Id, sub2Id, user1, user2) => {
    setActionLoad(sub1Id);
    try {
      await API.post(`/plagiarism/confirm-penalty`, { sub1Id, sub2Id });
      showToast(`Penalty confirmed — emails sent to ${user1} & ${user2} ✓`);
      setDismissed(d => new Set([...d, sub1Id, sub2Id]));
    } catch (err) {
      showToast("Failed to confirm penalty", "error");
    } finally {
      setActionLoad(null);
    }
  };

  // Clear false positive — reset isPlagiarised
  const clearFalsePositive = async (sub1Id, sub2Id) => {
    setActionLoad(sub1Id);
    try {
      await API.post(`/plagiarism/clear-false-positive`, { sub1Id, sub2Id });
      showToast("Marked as false positive — submissions cleared ✓");
      setDismissed(d => new Set([...d, sub1Id, sub2Id]));
    } catch (err) {
      showToast("Failed to clear false positive", "error");
    } finally {
      setActionLoad(null);
    }
  };

  // Deduplicate flagged pairs (A flagged B and B flagged A = same pair)
  const getPairs = (flagged) => {
    const seen = new Set();
    const pairs = [];
    for (const sub of flagged) {
      if (!sub.matchedSubmission) continue;
      const matchedId = sub.matchedSubmission?._id || sub.matchedSubmission;
      const key = [sub._id, matchedId].sort().join('-');
      if (seen.has(key)) continue;
      seen.add(key);
      const matched = flagged.find(s => s._id === matchedId?.toString()) ||
                      flagged.find(s => s._id?.toString() === matchedId?.toString());
      pairs.push({ sub1: sub, sub2: matched || sub.matchedSubmission });
    }
    return pairs;
  };

  const flagged = report?.flagged || [];
  const pairs   = getPairs(flagged);
  const active  = pairs.filter(p => !dismissed.has(p.sub1._id) && !dismissed.has(p.sub2?._id));

  const totalFlagged   = flagged.length;
  const uniquePairs    = pairs.length;
  const highSimilarity = flagged.filter(s => s.similarityScore >= 90).length;

  const similarityColor = (score) => {
    if (score >= 90) return '#EF4444';
    if (score >= 80) return '#F59E0B';
    return '#22C55E';
  };

  return (
    <>
      <style>{CSS}</style>

      <div className="pr-toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`pr-toast ${t.type}`}>
            {t.type==="success"?"✓":t.type==="error"?"✗":"ℹ"} {t.msg}
          </div>
        ))}
      </div>

      <div className="pr-page">
        <div className="pr-inner">

          {/* Header */}
          <div className="pr-hdr pr-fade">
            <div>
              <div className="pr-badge"><div className="pr-badge-dot"/> Plagiarism Review</div>
              <div className="pr-title">Code <span>Review.</span></div>
              <div className="pr-sub">
                {report?.contestTitle
                  ? `Reviewing flagged submissions for: ${report.contestTitle}`
                  : loading
                    ? 'Loading contest details...'
                    : 'Plagiarism Review'}
              </div>
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button
                className="pr-btn"
                onClick={fetchReport}
                style={{background:"transparent",color:"var(--cyan)",borderColor:"rgba(0,180,216,0.3)"}}
              >
                ↻ Refresh
              </button>
              <button
                className="pr-btn"
                onClick={() => navigate('/admin')}
                style={{background:"transparent",color:"var(--muted)",borderColor:"var(--border)"}}
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="pr-stats">
              {[0,1,2,3].map(i => <div key={i} className="pr-shimmer" style={{height:80}}/>)}
            </div>
          ) : !errorState ? (
            <div className="pr-stats pr-fade" style={{animationDelay:"0.1s"}}>
              <div className="pr-stat">
                <div className="pr-stat-val" style={{color:"var(--purple)"}}>{uniquePairs}</div>
                <div className="pr-stat-label">Suspicious Pairs</div>
              </div>
              <div className="pr-stat">
                <div className="pr-stat-val" style={{color:"var(--red)"}}>{highSimilarity}</div>
                <div className="pr-stat-label">High Similarity (≥90%)</div>
              </div>
              <div className="pr-stat">
                <div className="pr-stat-val" style={{color:"var(--amber)"}}>{active.length}</div>
                <div className="pr-stat-label">Pending Review</div>
              </div>
              <div className="pr-stat">
                <div className="pr-stat-val" style={{color:"var(--green)"}}>{uniquePairs - active.length}</div>
                <div className="pr-stat-label">Reviewed</div>
              </div>
            </div>
          ) : null}

          {/* ✅ FIX: Proper error/empty states instead of just a toast */}
          {!loading && errorState === "no-check" && (
            <div className="pr-no-check-box pr-fade">
              <div style={{fontSize:52,marginBottom:16}}>🔍</div>
              <div style={{fontSize:20,fontWeight:800,color:"var(--text)",marginBottom:8}}>No plagiarism check run yet</div>
              <div style={{fontSize:14,color:"var(--muted)",marginBottom:24,maxWidth:400,margin:"0 auto 24px"}}>
                Go back to the dashboard, find this contest in the Contests tab, and click <strong style={{color:"var(--purple)"}}>🔍 Plag Check</strong> to run the analysis first.
              </div>
              <button
                className="pr-btn"
                onClick={() => navigate('/admin')}
                style={{background:"rgba(139,92,246,0.1)",color:"var(--purple)",borderColor:"rgba(139,92,246,0.3)",margin:"0 auto"}}
              >
                ← Go to Dashboard
              </button>
            </div>
          )}

          {!loading && errorState === "error" && (
            <div className="pr-error-box pr-fade">
              <div style={{fontSize:52,marginBottom:16}}>⚠️</div>
              <div style={{fontSize:20,fontWeight:800,color:"var(--text)",marginBottom:8}}>Failed to load report</div>
              <div style={{fontSize:14,color:"var(--muted)",marginBottom:24}}>
                There was a server error loading the plagiarism report. Please try again.
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                <button
                  className="pr-btn"
                  onClick={fetchReport}
                  style={{background:"rgba(239,68,68,0.1)",color:"var(--red)",borderColor:"rgba(239,68,68,0.3)"}}
                >
                  ↻ Retry
                </button>
                <button
                  className="pr-btn"
                  onClick={() => navigate('/admin')}
                  style={{background:"transparent",color:"var(--muted)",borderColor:"var(--border)"}}
                >
                  ← Back to Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Pairs — only show when we have a valid report */}
          {!loading && !errorState && (
            <>
              <div className="pr-section-label">⚠️ Flagged Pairs</div>

              {active.length === 0 ? (
                <div className="pr-empty pr-fade">
                  <div className="pr-empty-icon">✅</div>
                  <div className="pr-empty-title">All pairs reviewed!</div>
                  <div style={{color:"var(--muted)",fontSize:14}}>
                    {uniquePairs === 0
                      ? "No plagiarism detected in this contest."
                      : "You've reviewed all flagged submissions."}
                  </div>
                </div>
              ) : (
                active.map(({ sub1, sub2 }, idx) => {
                  const score    = sub1.similarityScore || 0;
                  const sColor   = similarityColor(score);
                  const user1    = sub1.userId?.username || sub1.userId?.name || 'User 1';
                  const user2    = sub2?.userId?.username || sub2?.userId?.name || 'User 2';
                  const email1   = sub1.userId?.email || '';
                  const email2   = sub2?.userId?.email || '';
                  const time1    = sub1.createdAt ? new Date(sub1.createdAt).toLocaleString() : '—';
                  const time2    = sub2?.createdAt ? new Date(sub2.createdAt).toLocaleString() : '—';
                  const isLater1 = sub1.createdAt && sub2?.createdAt
                    ? new Date(sub1.createdAt) > new Date(sub2.createdAt)
                    : false;
                  const isLoading = actionLoad === sub1._id;

                  return (
                    <div
                      key={sub1._id}
                      className="pr-card flagged pr-fade"
                      style={{animationDelay:`${idx * 0.1}s`}}
                    >
                      {/* Card Header */}
                      <div className="pr-card-hdr">
                        <div className="pr-card-hdr-left">
                          <div>
                            <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:4}}>
                              Pair #{idx + 1}
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <span className="pr-similarity" style={{color:sColor}}>{score}%</span>
                              <span className="pr-pill" style={{
                                color:sColor,
                                background:`${sColor}15`,
                                border:`1px solid ${sColor}30`
                              }}>
                                {score >= 90 ? '🔴 Very High' : score >= 80 ? '🟡 High' : '🟢 Moderate'}
                              </span>
                            </div>
                          </div>
                          <div className="pr-card-meta">
                            <div><strong>{user1}</strong> vs <strong>{user2}</strong></div>
                            <div style={{marginTop:3}}>{sub1.problemId?.title || 'Unknown Problem'}</div>
                          </div>
                        </div>

                        <div className="pr-actions">
                          <button
                            className="pr-action-btn"
                            disabled={isLoading}
                            onClick={() => confirmPenalty(sub1._id, sub2?._id, user1, user2)}
                            style={{
                              color:"var(--red)",
                              borderColor:"rgba(239,68,68,0.3)",
                              background:"rgba(239,68,68,0.06)"
                            }}
                          >
                            {isLoading ? "⏳ Processing…" : "✗ Confirm Penalty"}
                          </button>
                          <button
                            className="pr-action-btn"
                            disabled={isLoading}
                            onClick={() => clearFalsePositive(sub1._id, sub2?._id)}
                            style={{
                              color:"var(--green)",
                              borderColor:"rgba(34,197,94,0.3)",
                              background:"rgba(34,197,94,0.06)"
                            }}
                          >
                            ✓ False Positive
                          </button>
                        </div>
                      </div>

                      {/* Code side by side */}
                      <div className="pr-code-grid">
                        {/* User 1 */}
                        <div className="pr-code-panel">
                          <div className="pr-code-header">
                            <div className="pr-user-info">
                              <div className="pr-avatar" style={{background:"linear-gradient(135deg,#8B5CF6,#EF4444)"}}>
                                {user1[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="pr-username">{user1}</div>
                                <div className="pr-submit-time">{email1} · {time1}</div>
                              </div>
                            </div>
                            {isLater1 && (
                              <span className="pr-pill" style={{color:"var(--red)",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)"}}>
                                ⏰ Later
                              </span>
                            )}
                          </div>
                          <pre className="pr-code-body">{sub1.code || '// No code available'}</pre>
                          <div className="pr-status-bar">
                            <span style={{color:"var(--purple)"}}>⚠ Flagged</span>
                            <span style={{marginLeft:"auto"}}>Score: {sub1.currentScore ?? 0}</span>
                          </div>
                        </div>

                        {/* User 2 */}
                        <div className="pr-code-panel">
                          <div className="pr-code-header">
                            <div className="pr-user-info">
                              <div className="pr-avatar" style={{background:"linear-gradient(135deg,#F59E0B,#EF4444)"}}>
                                {user2[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="pr-username">{user2}</div>
                                <div className="pr-submit-time">{email2} · {time2}</div>
                              </div>
                            </div>
                            {!isLater1 && sub2?.createdAt && (
                              <span className="pr-pill" style={{color:"var(--red)",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)"}}>
                                ⏰ Later
                              </span>
                            )}
                          </div>
                          <pre className="pr-code-body">{sub2?.code || '// No code available'}</pre>
                          <div className="pr-status-bar">
                            <span style={{color:"var(--purple)"}}>⚠ Flagged</span>
                            <span style={{marginLeft:"auto"}}>Score: {sub2?.currentScore ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}