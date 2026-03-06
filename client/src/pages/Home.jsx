import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:#0D1117; --surface:#161B22; --surface2:#1C2333; --border:#21262D;
    --green:#22C55E; --cyan:#00B4D8; --amber:#F59E0B; --red:#EF4444;
    --purple:#8B5CF6; --pink:#EC4899; --text:#E2E8F0; --muted:#64748B;
    --font:'Outfit',sans-serif; --mono:'JetBrains Mono',monospace;
  }
  .ct-page { background:var(--bg); color:var(--text); font-family:var(--font); min-height:100vh; overflow-x:hidden; }
  .ct-grid-bg {
    position:absolute; inset:0; pointer-events:none;
    background-image: linear-gradient(rgba(34,197,94,0.04) 1px,transparent 1px), linear-gradient(90deg,rgba(34,197,94,0.04) 1px,transparent 1px);
    background-size:48px 48px;
  }
  .ct-blob { position:absolute; border-radius:50%; filter:blur(100px); pointer-events:none; animation:blobDrift 12s ease-in-out infinite alternate; }
  .ct-blob-1 { width:500px; height:500px; background:rgba(34,197,94,0.08); top:-100px; left:-100px; }
  .ct-blob-2 { width:400px; height:400px; background:rgba(0,180,216,0.06); top:40%; right:-80px; animation-delay:-4s; }
  .ct-blob-3 { width:300px; height:300px; background:rgba(245,158,11,0.05); bottom:10%; left:30%; animation-delay:-8s; }
  @keyframes blobDrift { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(30px,40px) scale(1.08)} }
  .ct-fade-up { opacity:0; transform:translateY(28px); animation:fadeUp 0.7s ease forwards; }
  @keyframes fadeUp { to { opacity:1; transform:translateY(0); } }
  .ct-fade-in { opacity:0; animation:fadeIn 0.6s ease forwards; }
  @keyframes fadeIn { to { opacity:1; } }
  .ct-shimmer { background:linear-gradient(90deg,#1E2530 25%,#252D3A 50%,#1E2530 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .ct-btn-primary {
    display:inline-flex; align-items:center; gap:8px;
    background:var(--green); color:#0D1117; border:none; border-radius:10px;
    padding:14px 28px; font-family:var(--font); font-size:15px; font-weight:700;
    cursor:pointer; transition:all 0.2s; letter-spacing:0.2px; text-decoration:none;
  }
  .ct-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(34,197,94,0.3); }
  .ct-btn-ghost {
    display:inline-flex; align-items:center; gap:8px;
    background:transparent; color:var(--text); border:1px solid var(--border); border-radius:10px;
    padding:13px 28px; font-family:var(--font); font-size:15px; font-weight:600;
    cursor:pointer; transition:all 0.2s; text-decoration:none;
  }
  .ct-btn-ghost:hover { border-color:var(--green); color:var(--green); transform:translateY(-2px); }
  .ct-stat-card {
    background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:28px 24px;
    transition:all 0.2s; position:relative; overflow:hidden;
  }
  .ct-stat-card::before {
    content:''; position:absolute; inset:0; opacity:0;
    background:linear-gradient(135deg,var(--glow-color,rgba(34,197,94,0.06)),transparent);
    transition:opacity 0.3s;
  }
  .ct-stat-card:hover { transform:translateY(-4px); border-color:var(--glow-color,var(--green)); }
  .ct-stat-card:hover::before { opacity:1; }
  .ct-stat-number { font-size:44px; font-weight:800; line-height:1; font-variant-numeric:tabular-nums; letter-spacing:-1px; }
  .ct-feature-card {
    background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:32px 28px;
    transition:all 0.25s; position:relative; overflow:hidden; cursor:pointer;
  }
  .ct-feature-card::after {
    content:''; position:absolute; bottom:0; left:0; right:0;
    height:2px; background:var(--accent,var(--green));
    transform:scaleX(0); transition:transform 0.3s; transform-origin:left;
  }
  .ct-feature-card:hover { transform:translateY(-4px); border-color:var(--accent,var(--green)); box-shadow:0 16px 40px rgba(0,0,0,0.3); }
  .ct-feature-card:hover::after { transform:scaleX(1); }
  .ct-admin-card {
    background:linear-gradient(135deg,rgba(245,158,11,0.06),rgba(245,158,11,0.02));
    border:1px solid rgba(245,158,11,0.2); border-radius:16px; padding:28px 24px;
    transition:all 0.25s; cursor:pointer;
  }
  .ct-admin-card:hover { transform:translateY(-4px); border-color:rgba(245,158,11,0.5); box-shadow:0 16px 40px rgba(245,158,11,0.1); }
  .ct-bar { border-radius:3px; transition:transform 0.15s; cursor:default; }
  .ct-bar:hover { transform:scaleY(1.3); }
  .ct-badge {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(34,197,94,0.1); color:var(--green);
    border:1px solid rgba(34,197,94,0.25); border-radius:20px;
    padding:4px 14px; font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase;
  }
  .ct-badge-dot { width:6px; height:6px; background:var(--green); border-radius:50%; animation:pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
  .ct-ticker-wrap { overflow:hidden; }
  .ct-ticker { display:flex; gap:48px; animation:ticker 20s linear infinite; white-space:nowrap; }
  .ct-ticker:hover { animation-play-state:paused; }
  @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .ct-cta { background:linear-gradient(135deg,#0D1117 0%,#111827 50%,#0D1117 100%); position:relative; overflow:hidden; }
  .ct-cta-ring { position:absolute; border-radius:50%; border:1px solid rgba(34,197,94,0.08); pointer-events:none; }
  ::-webkit-scrollbar { width:6px; }
  ::-webkit-scrollbar-track { background:var(--bg); }
  ::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }
  .ct-code-block {
    background:#0D1117; border:1px solid var(--border); border-radius:12px;
    padding:20px; font-family:var(--mono); font-size:12.5px; line-height:1.8; color:#94A3B8;
    position:relative; overflow:hidden;
  }
  .ct-code-block::before {
    content:''; position:absolute; top:0; left:0; right:0;
    height:1px; background:linear-gradient(90deg,transparent,var(--green),transparent);
  }
  .kw{color:#FF79C6} .fn{color:#50FA7B} .str{color:#F1FA8C} .num{color:#BD93F9} .cm{color:#6272A4} .var{color:#8BE9FD}
  .ct-admin-banner {
    background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.03));
    border:1px solid rgba(245,158,11,0.25); border-radius:14px; padding:20px 28px;
    display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;
  }
  .ct-admin-quick-btn {
    display:inline-flex; align-items:center; gap:8px;
    background:rgba(245,158,11,0.12); color:var(--amber);
    border:1px solid rgba(245,158,11,0.3); border-radius:8px;
    padding:8px 16px; font-size:13px; font-weight:600;
    cursor:pointer; transition:all 0.2s; font-family:var(--font);
  }
  .ct-admin-quick-btn:hover { background:rgba(245,158,11,0.2); transform:translateY(-1px); }
`;

function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => { started.current = false; setCount(0); }, [target]);
  useEffect(() => {
    if (target === 0 || started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return count;
}

function StatCard({ value, label, color, glowColor, icon, delay, maxVal }) {
  const animated = useCountUp(value || 0);
  const pct = maxVal ? Math.min((value / maxVal) * 100, 100) : Math.min(value, 100);
  return (
    <div className="ct-stat-card ct-fade-up" style={{ '--glow-color': glowColor, animationDelay: delay }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
        <div style={{ fontSize:'28px' }}>{icon}</div>
        <div style={{ background:`${glowColor}15`, border:`1px solid ${glowColor}30`, borderRadius:'8px', padding:'4px 10px', fontSize:'11px', fontWeight:600, color:glowColor, fontFamily:'var(--mono)', letterSpacing:'0.5px' }}>
          {label.toUpperCase()}
        </div>
      </div>
      <div className="ct-stat-number" style={{ color }}>{animated}</div>
      <div style={{ marginTop:'8px', fontSize:'13px', color:'var(--muted)', fontWeight:500 }}>problems {label.toLowerCase()}</div>
      <div style={{ marginTop:'16px', height:'3px', background:'var(--border)', borderRadius:'2px', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${glowColor},${glowColor}88)`, borderRadius:'2px', transition:'width 1.2s ease' }}/>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, accent, badge, delay, onClick }) {
  return (
    <div className="ct-feature-card ct-fade-up" style={{ '--accent': accent, animationDelay: delay }} onClick={onClick}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
        <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:`${accent}15`, border:`1px solid ${accent}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' }}>{icon}</div>
        {badge && <span style={{ background:`${accent}15`, color:accent, border:`1px solid ${accent}30`, borderRadius:'20px', padding:'3px 10px', fontSize:'11px', fontWeight:600 }}>{badge}</span>}
      </div>
      <div style={{ fontSize:'17px', fontWeight:700, color:'#FFF', marginBottom:'10px', letterSpacing:'-0.2px' }}>{title}</div>
      <div style={{ fontSize:'13.5px', color:'var(--muted)', lineHeight:1.7 }}>{desc}</div>
      <div style={{ marginTop:'20px', display:'flex', alignItems:'center', gap:'6px', color:accent, fontSize:'13px', fontWeight:600 }}>
        <span>Explore</span><span>→</span>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("accessToken");
  const username   = localStorage.getItem("username") || "";
  const role       = localStorage.getItem("role") || "user";
  const isAdmin    = role === "admin";

  const [profileData,   setProfileData]   = useState(null);
  const [totalProblems, setTotalProblems] = useState(null);
  const [recentSolved,  setRecentSolved]  = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => { fetchAll(); }, []);

  // ✅ FIXED: correct API endpoints
  const fetchAll = async () => {
    setLoading(true);
    try {
      // Always fetch total problems count (public)
      const problemsRes = await API.get("/problems?limit=1").catch(() => null);
      if (problemsRes?.data?.pagination?.total) {
        setTotalProblems(problemsRes.data.pagination.total);
      }

      // Fetch user profile if logged in
      if (isLoggedIn) {
        const [profileRes, solvedRes] = await Promise.allSettled([
          API.get("/profile/stats"),  // ✅ fixed endpoint
          API.get("/user/solved"),    // ✅ fixed endpoint
        ]);

        if (profileRes.status === "fulfilled") {
          setProfileData(profileRes.value.data);
        }

        if (solvedRes.status === "fulfilled" && solvedRes.value.data?.solved?.length > 0) {
          setRecentSolved(solvedRes.value.data.solved.slice(0, 5));
        }
      }
    } catch (err) {
      console.error("Home fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: correct response shape matching backend
  // Backend returns: { success, totalSolved, easy, medium, hard, rating, maxRating, contests, rank, streak, ... }
  const stats = profileData ? {
    totalSolved: profileData.totalSolved ?? 0,
    easy:        profileData.easy        ?? 0,
    medium:      profileData.medium      ?? 0,
    hard:        profileData.hard        ?? 0,
    streak:      profileData.streak      ?? 0,
    rating:      profileData.rating      ?? 0,
    rank:        profileData.rank        ?? "—",
  } : null;

  // Build activity bars from submissions if available
  const submissions = profileData?.recentSubmissions || [];
  const bars = submissions.length > 0
    ? (() => {
        const weekMap = {};
        submissions.forEach(s => {
          const d = new Date(s.createdAt);
          const week = Math.floor((Date.now() - d.getTime()) / (7 * 24 * 60 * 60 * 1000));
          if (week < 52) weekMap[week] = (weekMap[week] || 0) + 1;
        });
        return Array.from({ length: 52 }, (_, i) => {
          const count = weekMap[51 - i] || 0;
          return {
            count,
            color: count === 0 ? '#1E2530' : count < 3 ? '#166534' : count < 6 ? '#16A34A' : count < 10 ? '#22C55E' : '#4ADE80',
            height: Math.min(10 + count * 8, 90),
          };
        });
      })()
    : Array.from({ length: 52 }, () => ({ height: 10, color: '#1E2530', count: 0 }));

  const platformNumbers = [
    { num: totalProblems ? `${totalProblems}+` : '…', label: 'Problems' },
    { num: '10+',  label: 'Companies' },
    { num: '500+', label: 'Users' },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div className="ct-page">

        {/* ══════════ HERO ══════════ */}
        <section style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', overflow:'hidden', padding:'80px 0 60px' }}>
          <div className="ct-grid-bg"/>
          <div className="ct-blob ct-blob-1"/>
          <div className="ct-blob ct-blob-2"/>
          <div className="ct-blob ct-blob-3"/>

          <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 40px', width:'100%', position:'relative', zIndex:1 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'80px', alignItems:'center' }}>

              {/* Left */}
              <div>
                <div className="ct-badge ct-fade-in" style={{ animationDelay:'0.1s', marginBottom:'28px' }}>
                  <span className="ct-badge-dot"/>
                  <span>Platform Online — v2.0</span>
                </div>
                <h1 className="ct-fade-up" style={{ animationDelay:'0.2s', fontSize:'clamp(42px,5vw,68px)', fontWeight:900, lineHeight:1.05, letterSpacing:'-2px', color:'#FFF', marginBottom:'24px' }}>
                  Code Smarter.<br/>
                  <span style={{ background:'linear-gradient(135deg,#22C55E,#00B4D8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Track Better.</span><br/>
                  <span style={{ color:'var(--muted)', fontSize:'0.75em', fontWeight:700 }}>Win More.</span>
                </h1>
                <p className="ct-fade-up" style={{ animationDelay:'0.35s', fontSize:'17px', color:'var(--muted)', lineHeight:1.8, marginBottom:'36px', maxWidth:'480px' }}>
                  Practice curated DSA problems, compete in contests, analyze performance with charts — and track your growth as a competitive programmer.
                </p>
                <div className="ct-fade-up" style={{ animationDelay:'0.5s', display:'flex', gap:'14px', flexWrap:'wrap' }}>
                  <button className="ct-btn-primary" onClick={() => navigate("/problems")}>
                    <span>Start Solving</span><span>→</span>
                  </button>
                  <button className="ct-btn-ghost" onClick={() => navigate("/contests-list")}>
                    <span>📅</span><span>View Contests</span>
                  </button>
                </div>
                <div className="ct-fade-up" style={{ animationDelay:'0.65s', display:'flex', gap:'32px', marginTop:'48px', paddingTop:'32px', borderTop:'1px solid var(--border)' }}>
                  {platformNumbers.map(({ num, label }) => (
                    <div key={label}>
                      <div style={{ fontSize:'24px', fontWeight:800, color:'#FFF', letterSpacing:'-0.5px' }}>{num}</div>
                      <div style={{ fontSize:'12px', color:'var(--muted)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.5px', marginTop:'2px' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: floating card + code block */}
              <div className="ct-fade-in" style={{ animationDelay:'0.4s', position:'relative' }}>
                {/* Floating profile card */}
                <div style={{ position:'absolute', top:'-20px', right:'-10px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'14px', padding:'16px 20px', zIndex:10, minWidth:'200px', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'50%', background: isAdmin ? 'linear-gradient(135deg,#F59E0B,#EF4444)' : 'linear-gradient(135deg,#22C55E,#00B4D8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:800, color:'#0D1117' }}>
                      {username ? username[0].toUpperCase() : "?"}
                    </div>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:700, color:'#FFF' }}>{isLoggedIn ? username : "Guest"}</div>
                      <div style={{ fontSize:'11px', color: isAdmin ? 'var(--amber)' : 'var(--green)' }}>
                        {isLoggedIn ? (isAdmin ? "⚡ Admin" : "● Online") : "Not logged in"}
                      </div>
                    </div>
                  </div>
                  {isLoggedIn ? (
                    <div style={{ display:'flex', gap:'8px' }}>
                      {[
                        { label:'Solved', val: loading ? '…' : (stats?.totalSolved ?? 0), color:'#FFF' },
                        { label:'Rating', val: loading ? '…' : (stats?.rating || '—'),    color:'var(--amber)' },
                      ].map(({ label, val, color }) => (
                        <div key={label} style={{ flex:1, background:'var(--surface2)', borderRadius:'8px', padding:'8px 10px', textAlign:'center' }}>
                          <div style={{ fontSize:'16px', fontWeight:800, color, fontFamily:'var(--mono)' }}>{val}</div>
                          <div style={{ fontSize:'10px', color:'var(--muted)', marginTop:'2px' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button className="ct-btn-primary" style={{ width:'100%', padding:'8px', fontSize:'13px', justifyContent:'center' }} onClick={() => navigate("/login")}>
                      Sign In →
                    </button>
                  )}
                </div>

                {/* Code block */}
                <div className="ct-code-block" style={{ marginTop:'40px' }}>
                  <div style={{ display:'flex', gap:'6px', marginBottom:'16px' }}>
                    {['#EF4444','#F59E0B','#22C55E'].map(c => <div key={c} style={{ width:'10px', height:'10px', borderRadius:'50%', background:c }}/>)}
                  </div>
                  <div><span className="cm">// Two Sum — Easy</span></div>
                  <div style={{ marginTop:'8px' }}><span className="kw">function </span><span className="fn">twoSum</span><span>(</span><span className="var">nums</span><span>, </span><span className="var">target</span><span>) {'{'}</span></div>
                  <div style={{ paddingLeft:'16px' }}><span className="kw">const </span><span className="var">map</span><span> = </span><span className="kw">new </span><span className="fn">Map</span><span>();</span></div>
                  <div style={{ paddingLeft:'16px' }}><span className="kw">for </span><span>(</span><span className="kw">let </span><span className="var">i</span><span> = </span><span className="num">0</span><span>; </span><span className="var">i</span><span> &lt; </span><span className="var">nums</span><span>.length; </span><span className="var">i</span><span>++) {'{'}</span></div>
                  <div style={{ paddingLeft:'32px' }}><span className="kw">const </span><span className="var">diff</span><span> = </span><span className="var">target</span><span> - </span><span className="var">nums</span><span>[</span><span className="var">i</span><span>];</span></div>
                  <div style={{ paddingLeft:'32px' }}><span className="kw">if </span><span>(</span><span className="var">map</span><span>.</span><span className="fn">has</span><span>(</span><span className="var">diff</span><span>)) </span><span className="kw">return </span><span>[</span><span className="var">map</span><span>.</span><span className="fn">get</span><span>(</span><span className="var">diff</span><span>), </span><span className="var">i</span><span>];</span></div>
                  <div style={{ paddingLeft:'32px' }}><span className="var">map</span><span>.</span><span className="fn">set</span><span>(</span><span className="var">nums</span><span>[</span><span className="var">i</span><span>], </span><span className="var">i</span><span>);</span></div>
                  <div style={{ paddingLeft:'16px' }}><span>{'}'}</span></div>
                  <div><span>{'}'}</span></div>
                  <div style={{ marginTop:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ background:'rgba(34,197,94,0.15)', color:'var(--green)', borderRadius:'6px', padding:'3px 10px', fontSize:'11px', fontWeight:600 }}>✓ Accepted</span>
                    <span style={{ color:'var(--muted)', fontSize:'11px', fontFamily:'var(--mono)' }}>Runtime: 72ms</span>
                  </div>
                </div>

                {/* Streak badge */}
                <div style={{ position:'absolute', bottom:'-16px', left:'-16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'12px 18px', display:'flex', alignItems:'center', gap:'10px', boxShadow:'0 16px 48px rgba(0,0,0,0.4)' }}>
                  <div style={{ fontSize:'24px' }}>🔥</div>
                  <div>
                    <div style={{ fontSize:'16px', fontWeight:800, color:'var(--amber)' }}>
                      {loading || !isLoggedIn ? '—' : `${stats?.streak ?? 0}-Day Streak`}
                    </div>
                    <div style={{ fontSize:'11px', color:'var(--muted)' }}>
                      {isLoggedIn ? 'Keep it going!' : 'Login to track'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ TICKER ══════════ */}
        <div style={{ background:'var(--surface)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', padding:'14px 0', overflow:'hidden' }}>
          <div className="ct-ticker">
            {[...Array(2)].map((_, ri) =>
              ["Arrays","Dynamic Programming","Graph Theory","Binary Search","Two Pointers","Sliding Window","Trees","Heaps","Recursion","Backtracking","Sorting","Hash Maps","Linked Lists","Stacks & Queues","Greedy","Trie","Segment Tree","Bit Manipulation"].map((t, i) => (
                <span key={`${ri}-${i}`} style={{ color:'var(--muted)', fontSize:'13px', fontWeight:500, display:'flex', alignItems:'center', gap:'16px', whiteSpace:'nowrap' }}>
                  <span style={{ width:'4px', height:'4px', background:'var(--green)', borderRadius:'50%', display:'inline-block', flexShrink:0 }}/>
                  {t}
                </span>
              ))
            )}
          </div>
        </div>

        {/* ══════════ ADMIN BANNER ══════════ */}
        {isAdmin && (
          <div style={{ maxWidth:'1200px', margin:'40px auto 0', padding:'0 40px' }}>
            <div className="ct-admin-banner ct-fade-in">
              <div>
                <div style={{ fontSize:'13px', fontWeight:700, color:'var(--amber)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'4px' }}>⚡ Admin Panel</div>
                <div style={{ fontSize:'15px', fontWeight:600, color:'var(--text)' }}>Manage your platform from here</div>
              </div>
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                <button className="ct-admin-quick-btn" onClick={() => navigate("/admin/problems/new")}>➕ Add Problem</button>
                <button className="ct-admin-quick-btn" onClick={() => navigate("/admin/contests/new")}>🎯 Create Contest</button>
                <button className="ct-admin-quick-btn" onClick={() => navigate("/admin/dashboard")}>📊 Dashboard</button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ PROGRESS (logged-in users) ══════════ */}
        {isLoggedIn && (
          <section style={{ padding:'80px 40px 40px', maxWidth:'1200px', margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:'48px' }}>
              <div className="ct-badge ct-fade-in" style={{ marginBottom:'16px' }}>📊 Your Stats</div>
              <h2 className="ct-fade-up" style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:800, color:'#FFF', letterSpacing:'-1px', marginBottom:'10px' }}>
                Your Progress Dashboard
              </h2>
              <p style={{ color:'var(--muted)', fontSize:'15px' }}>
                Welcome back, <span style={{ color: isAdmin ? 'var(--amber)' : 'var(--green)', fontWeight:700 }}>{username}</span> {isAdmin ? '⚡' : '👋'}
              </p>
            </div>

            {loading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'20px' }}>
                {Array.from({ length:4 }).map((_,i) => <div key={i} className="ct-shimmer" style={{ height:'160px' }}/>)}
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'20px' }}>
                <StatCard value={stats?.totalSolved ?? 0} label="Total Solved" color="#FFF"    glowColor="#22C55E" icon="⚡" delay="0s"   maxVal={totalProblems || 200}/>
                <StatCard value={stats?.easy        ?? 0} label="Easy"         color="#22C55E" glowColor="#22C55E" icon="🟢" delay="0.1s" maxVal={100}/>
                <StatCard value={stats?.medium      ?? 0} label="Medium"       color="#F59E0B" glowColor="#F59E0B" icon="🟡" delay="0.2s" maxVal={100}/>
                <StatCard value={stats?.hard        ?? 0} label="Hard"         color="#EF4444" glowColor="#EF4444" icon="🔴" delay="0.3s" maxVal={50}/>
              </div>
            )}

            {/* Activity bars */}
            <div className="ct-fade-up" style={{ marginTop:'32px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'16px', padding:'28px 32px', animationDelay:'0.4s' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
                <div>
                  <div style={{ fontSize:'16px', fontWeight:700, color:'#FFF' }}>Submission Activity</div>
                  <div style={{ fontSize:'12px', color:'var(--muted)', marginTop:'4px' }}>Last 12 months</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'var(--muted)' }}>
                  <span>Less</span>
                  {['#1E2530','#166534','#16A34A','#22C55E','#4ADE80'].map(c => (
                    <div key={c} style={{ width:'12px', height:'12px', background:c, borderRadius:'3px' }}/>
                  ))}
                  <span>More</span>
                </div>
              </div>
              {loading ? (
                <div className="ct-shimmer" style={{ height:'64px' }}/>
              ) : (
                <div style={{ display:'flex', gap:'3px', alignItems:'flex-end', height:'64px', overflowX:'auto' }}>
                  {bars.map((bar, i) => (
                    <div key={i} className="ct-bar"
                      style={{ flex:'0 0 14px', height:`${bar.height || 10}%`, background:bar.color, borderRadius:'2px', minHeight:'4px' }}
                      title={`${bar.count} submission${bar.count !== 1 ? 's' : ''}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Rating & rank summary */}
            {!loading && stats && (
              <div style={{ marginTop:'20px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'16px' }}>
                {[
                  { label:'Current Rating', val: stats.rating || '—',    color:'var(--amber)',  icon:'📈' },
                  { label:'Global Rank',    val: stats.rank   ? `#${stats.rank}` : '—', color:'var(--cyan)', icon:'🏅' },
                  { label:'Day Streak',     val: `${stats.streak}🔥`,    color:'var(--green)', icon:'🔥' },
                ].map(({ label, val, color, icon }) => (
                  <div key={label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 20px', display:'flex', alignItems:'center', gap:'14px' }}>
                    <div style={{ fontSize:'24px' }}>{icon}</div>
                    <div>
                      <div style={{ fontSize:'20px', fontWeight:800, color, fontFamily:'var(--mono)' }}>{val}</div>
                      <div style={{ fontSize:'11px', color:'var(--muted)', marginTop:'2px' }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick links */}
            <div style={{ marginTop:'20px', display:'flex', gap:'12px', flexWrap:'wrap' }}>
              {[
                { label:'📋 My Submissions', path:'/profile' },
                { label:'🏆 My Contests',    path:'/contests-list' },
                { label:'👤 Edit Profile',   path:'/profile' },
              ].map(({ label, path }) => (
                <button key={label} className="ct-btn-ghost" style={{ padding:'10px 20px', fontSize:'13px' }} onClick={() => navigate(path)}>
                  {label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ══════════ FEATURES ══════════ */}
        <section style={{ background:'var(--surface)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', padding:'100px 40px' }}>
          <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:'60px' }}>
              <div className="ct-badge ct-fade-in" style={{ marginBottom:'16px' }}>🚀 Features</div>
              <h2 className="ct-fade-up" style={{ fontSize:'clamp(32px,4vw,48px)', fontWeight:800, color:'#FFF', letterSpacing:'-1px', marginBottom:'14px' }}>Everything You Need to Grow</h2>
              <p style={{ fontSize:'16px', color:'var(--muted)' }}>A complete competitive programming platform in one place</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'20px' }}>
              <FeatureCard icon="💻" title="Coding Problems"  accent="#22C55E" badge={totalProblems ? `${totalProblems}+ Problems` : "Problems"} delay="0s"   desc="Solve handpicked DSA problems with a real online judge, hidden test cases, and instant verdict feedback." onClick={() => navigate("/problems")}/>
              <FeatureCard icon="🏆" title="Contest Arena"    accent="#F59E0B" badge="Live"      delay="0.1s" desc="Participate in timed contests, compete on a live leaderboard, and push your rating higher every week."     onClick={() => navigate("/contests-list")}/>
              <FeatureCard icon="🗺️" title="Contest Tracker"  accent="#00B4D8" badge="Real-time" delay="0.2s" desc="Never miss a Codeforces, CodeChef or LeetCode contest. Track upcoming rounds with reminders."             onClick={() => navigate("/contests")}/>
              <FeatureCard icon="🏢" title="Company Sheets"   accent="#8B5CF6" badge="Curated"   delay="0.3s" desc="Curated problem sets from top tech companies — Google, Amazon, Microsoft and more."                      onClick={() => navigate("/problems")}/>
              <FeatureCard icon="📊" title="Analytics"        accent="#EC4899" badge="Charts"    delay="0.4s" desc="Visualize your progress with beautiful charts. Track streaks, submission history and topic mastery."     onClick={() => navigate("/profile")}/>
              <FeatureCard icon="🤖" title="AI Hints"         accent="#06B6D4" badge="Beta"      delay="0.5s" desc="Stuck on a problem? Get intelligent hints powered by AI without spoiling the full solution."            onClick={() => navigate("/problems")}/>
            </div>

            {isAdmin && (
              <div style={{ marginTop:'32px' }}>
                <div style={{ fontSize:'12px', fontWeight:700, color:'var(--amber)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'16px' }}>⚡ Admin Actions</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'16px' }}>
                  {[
                    { icon:'➕', title:'Add Problem',     path:'/admin/problems/new', desc:'Create a new DSA problem with test cases' },
                    { icon:'🎯', title:'Create Contest',  path:'/admin/contests/new', desc:'Set up a new timed contest for users' },
                    { icon:'👥', title:'Manage Users',    path:'/admin/users',        desc:'View, promote or suspend user accounts' },
                    { icon:'📊', title:'Admin Dashboard', path:'/admin/dashboard',    desc:'Full platform analytics and controls' },
                  ].map(({ icon, title, path, desc }) => (
                    <div key={path} className="ct-admin-card" onClick={() => navigate(path)}>
                      <div style={{ fontSize:'24px', marginBottom:'12px' }}>{icon}</div>
                      <div style={{ fontSize:'15px', fontWeight:700, color:'var(--amber)', marginBottom:'6px' }}>{title}</div>
                      <div style={{ fontSize:'13px', color:'var(--muted)', lineHeight:1.6 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ══════════ COMPANIES ══════════ */}
        <section style={{ padding:'60px 40px', maxWidth:'1200px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'36px' }}>
            <div style={{ fontSize:'13px', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'1px', fontWeight:600 }}>Problems from top companies</div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'12px' }}>
            {[
              { name:'Google', color:'#4285F4' }, { name:'Amazon', color:'#FF9900' },
              { name:'Microsoft', color:'#00A4EF' }, { name:'Meta', color:'#0866FF' },
              { name:'Apple', color:'#A2AAAD' }, { name:'Netflix', color:'#E50914' },
              { name:'Flipkart', color:'#F9A825' }, { name:'TCS', color:'#22C55E' },
              { name:'Wipro', color:'#8B5CF6' }, { name:'Infosys', color:'#00B4D8' },
            ].map(({ name, color }) => (
              <div key={name}
                style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'10px', padding:'10px 20px', fontSize:'13px', fontWeight:600, color, transition:'all 0.2s', cursor:'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=color; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateY(0)'; }}
              >{name}</div>
            ))}
          </div>
        </section>

        {/* ══════════ CTA ══════════ */}
        <section className="ct-cta" style={{ padding:'120px 40px', textAlign:'center', position:'relative' }}>
          {[300,500,700].map(s => (
            <div key={s} className="ct-cta-ring" style={{ width:`${s}px`, height:`${s}px`, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}/>
          ))}
          <div style={{ position:'relative', zIndex:1, maxWidth:'640px', margin:'0 auto' }}>
            <div style={{ fontSize:'64px', marginBottom:'24px' }}>⚡</div>
            <h2 className="ct-fade-up" style={{ fontSize:'clamp(32px,4vw,52px)', fontWeight:900, color:'#FFF', letterSpacing:'-1.5px', lineHeight:1.1, marginBottom:'20px' }}>
              {isLoggedIn
                ? <><span>Keep Grinding,</span><br/><span style={{ color:'var(--green)' }}>{username}!</span></>
                : <><span>Ready to Level Up</span><br/><span style={{ color:'var(--green)' }}>Your Coding?</span></>
              }
            </h2>
            <p className="ct-fade-up" style={{ fontSize:'17px', color:'var(--muted)', marginBottom:'40px', lineHeight:1.7, animationDelay:'0.1s' }}>
              {isLoggedIn
                ? `You've solved ${stats?.totalSolved ?? 0} problems. Keep pushing to the next level.`
                : 'Join thousands of competitive programmers already using CodeTrack to sharpen their skills.'
              }
            </p>
            <div className="ct-fade-up" style={{ display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap', animationDelay:'0.2s' }}>
              {isLoggedIn ? (
                <>
                  <button className="ct-btn-primary" style={{ padding:'16px 36px', fontSize:'16px' }} onClick={() => navigate("/problems")}>🚀 Solve Problems</button>
                  <button className="ct-btn-ghost" onClick={() => navigate("/contests-list")}>🏆 Join a Contest</button>
                </>
              ) : (
                <>
                  <button className="ct-btn-primary" style={{ padding:'16px 36px', fontSize:'16px' }} onClick={() => navigate("/login")}>🚀 Get Started Free</button>
                  <button className="ct-btn-ghost" onClick={() => navigate("/problems")}>💻 Browse Problems</button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ══════════ FOOTER ══════════ */}
        <footer style={{ background:'var(--surface)', borderTop:'1px solid var(--border)', padding:'32px 40px' }}>
          <div style={{ maxWidth:'1200px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'18px', fontWeight:800, color:'var(--green)' }}>CodeTrack</span>
              <span style={{ color:'var(--muted)', fontSize:'13px' }}>— Built for competitive programmers</span>
            </div>
            <div style={{ fontSize:'12px', color:'var(--muted)' }}>© 2025 CodeTrack. All rights reserved.</div>
          </div>
        </footer>

      </div>
    </>
  );
}