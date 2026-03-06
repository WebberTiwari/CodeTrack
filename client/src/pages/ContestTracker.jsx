import { useEffect, useState, useMemo } from "react";
import API from "../services/api";
import dayjs from "dayjs";
import PlatformIcon from "../components/PlatformIcon";
import { requestPermission, addReminder } from "../utils/contestReminder";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
:root {
  --bg:#0D1117; --surface:#161B22; --s2:#1C2333; --border:#21262D; --border2:#2D3748;
  --green:#22C55E; --cyan:#00B4D8; --amber:#F59E0B; --red:#EF4444; --purple:#8B5CF6;
  --text:#E2E8F0; --muted:#64748B; --font:'Outfit',sans-serif; --mono:'JetBrains Mono',monospace;
}
* { scrollbar-width:thin; scrollbar-color:#21262D transparent; }
::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:#2D3748;border-radius:4px;}

@keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
@keyframes fadeUp   { to{opacity:1;transform:translateY(0);} }
@keyframes pulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
@keyframes livePulse{ 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
@keyframes tickFlip { 0%{transform:translateY(-4px);opacity:0} 100%{transform:translateY(0);opacity:1} }
@keyframes blobDrift{ 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(30px,40px) scale(1.08)} }

.ct-page { min-height:100vh; background:var(--bg); color:var(--text); font-family:var(--font); position:relative; overflow-x:hidden; }

/* grid bg */
.ct-page::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0; background-image:linear-gradient(rgba(34,197,94,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.025) 1px,transparent 1px); background-size:48px 48px; }

/* blobs */
.ct-blob { position:fixed; border-radius:50%; filter:blur(120px); pointer-events:none; z-index:0; animation:blobDrift 14s ease-in-out infinite alternate; }
.ct-blob-1 { width:400px; height:400px; background:rgba(34,197,94,0.05); top:-80px; left:-80px; }
.ct-blob-2 { width:350px; height:350px; background:rgba(0,180,216,0.04); bottom:10%; right:-60px; animation-delay:-6s; }

.ct-inner { max-width:980px; margin:0 auto; padding:40px 32px 80px; position:relative; z-index:1; }

/* ── header ── */
.ct-hdr { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:32px; flex-wrap:wrap; gap:16px; }
.ct-hdr-left {}
.ct-hdr-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(34,197,94,0.1); color:var(--green); border:1px solid rgba(34,197,94,0.25); border-radius:20px; padding:4px 14px; font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:14px; }
.ct-hdr-badge-dot { width:6px; height:6px; border-radius:50%; background:var(--green); animation:pulse 2s ease-in-out infinite; }
.ct-hdr-title { font-size:32px; font-weight:900; color:#fff; letter-spacing:-0.8px; line-height:1.1; margin-bottom:8px; }
.ct-hdr-title span { background:linear-gradient(135deg,#22C55E,#00B4D8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.ct-hdr-sub { font-size:14px; color:var(--muted); }

/* ── stat pills ── */
.ct-stats { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:28px; }
.ct-stat { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:12px 20px; text-align:center; min-width:90px; transition:all 0.18s; }
.ct-stat:hover { border-color:var(--border2); transform:translateY(-2px); }
.ct-stat-num { font-size:22px; font-weight:800; font-family:var(--mono); letter-spacing:-0.5px; }
.ct-stat-lbl { font-size:11px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px; }

/* ── search + filters bar ── */
.ct-filter-bar { display:flex; align-items:center; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
.ct-search { display:flex; align-items:center; gap:8px; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:9px 14px; transition:border-color 0.15s; flex:1; min-width:180px; max-width:280px; }
.ct-search:focus-within { border-color:rgba(34,197,94,0.35); }
.ct-search input { background:none; border:none; outline:none; color:var(--text); font-family:var(--font); font-size:13px; width:100%; }
.ct-search input::placeholder { color:var(--muted); }

/* ── platform tabs ── */
.ct-tabs { display:flex; gap:0; border-bottom:1px solid var(--border); margin-bottom:28px; }
.ct-tab { padding:11px 20px; background:none; border:none; border-bottom:2px solid transparent; color:var(--muted); font-family:var(--font); font-size:13px; font-weight:600; cursor:pointer; transition:all 0.15s; display:flex; align-items:center; gap:7px; }
.ct-tab:hover { color:var(--text); }
.ct-tab.on { color:var(--green); border-bottom-color:var(--green); }
.ct-tab-count { background:var(--s2); border:1px solid var(--border); border-radius:10px; padding:1px 7px; font-size:10px; font-weight:700; font-family:var(--mono); }
.ct-tab.on .ct-tab-count { background:rgba(34,197,94,0.12); border-color:rgba(34,197,94,0.25); color:var(--green); }

/* ── error ── */
.ct-alert { background:rgba(239,68,68,0.07); border:1px solid rgba(239,68,68,0.25); border-radius:12px; padding:13px 18px; color:#FCA5A5; font-size:13px; margin-bottom:24px; display:flex; align-items:center; gap:8px; }

/* ── cards ── */
.ct-list { display:flex; flex-direction:column; gap:14px; }
.ct-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; overflow:hidden; transition:all 0.2s; opacity:0; transform:translateY(16px); animation:fadeUp 0.45s ease forwards; position:relative; }
.ct-card:hover { border-color:var(--border2); transform:translateY(-2px); box-shadow:0 10px 36px rgba(0,0,0,0.35); }
.ct-card-stripe { position:absolute; left:0; top:0; bottom:0; width:4px; border-radius:16px 0 0 16px; }
.ct-card-inner { padding:20px 22px 20px 28px; display:flex; flex-direction:column; gap:16px; }

/* top row */
.ct-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.ct-card-title-row { display:flex; align-items:center; gap:12px; min-width:0; }
.ct-platform-icon { width:38px; height:38px; border-radius:10px; background:var(--s2); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:19px; }
.ct-card-name { font-size:15px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:-0.1px; }
.ct-card-platform { font-size:11px; color:var(--muted); font-weight:500; margin-top:2px; }

/* status badges */
.ct-status-live { display:inline-flex; align-items:center; gap:6px; background:rgba(239,68,68,0.12); color:var(--red); border:1px solid rgba(239,68,68,0.3); border-radius:20px; padding:4px 12px; font-size:11px; font-weight:800; letter-spacing:0.8px; text-transform:uppercase; flex-shrink:0; }
.ct-live-dot { width:6px; height:6px; border-radius:50%; background:var(--red); animation:livePulse 1.5s ease-in-out infinite; }
.ct-status-soon { background:rgba(245,158,11,0.12); color:var(--amber); border:1px solid rgba(245,158,11,0.3); border-radius:20px; padding:4px 12px; font-size:11px; font-weight:700; letter-spacing:0.5px; flex-shrink:0; }
.ct-status-upcoming { background:rgba(34,197,94,0.08); color:var(--green); border:1px solid rgba(34,197,94,0.2); border-radius:20px; padding:4px 12px; font-size:11px; font-weight:700; letter-spacing:0.5px; flex-shrink:0; }

/* meta row */
.ct-card-meta { display:flex; flex-wrap:wrap; gap:24px; }
.ct-meta-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--muted); margin-bottom:4px; }
.ct-meta-value { font-size:13px; font-weight:600; color:var(--text); font-family:var(--mono); }
.ct-meta-value.live { color:var(--red); }
.ct-meta-value.countdown { font-size:16px; font-weight:800; letter-spacing:-0.3px; color:var(--cyan); animation:tickFlip 0.15s ease; }

.ct-card-divider { height:1px; background:var(--border); margin:0 -28px; }
.ct-card-actions { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }

.ct-btn-visit { display:inline-flex; align-items:center; gap:6px; background:var(--green); color:#0D1117; border:none; border-radius:8px; padding:9px 20px; font-size:13px; font-weight:700; cursor:pointer; font-family:var(--font); transition:all 0.18s; text-decoration:none; }
.ct-btn-visit:hover { background:#16A34A; transform:translateY(-1px); box-shadow:0 6px 18px rgba(34,197,94,0.3); }
.ct-btn-remind { display:inline-flex; align-items:center; gap:6px; background:transparent; color:var(--muted); border:1px solid var(--border); border-radius:8px; padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; font-family:var(--font); transition:all 0.15s; }
.ct-btn-remind:hover { border-color:var(--amber); color:var(--amber); }
.ct-btn-remind.set { border-color:rgba(245,158,11,0.3); color:var(--amber); background:rgba(245,158,11,0.08); }

/* end time progress bar */
.ct-progress { height:3px; background:var(--border); border-radius:2px; overflow:hidden; margin-top:2px; }
.ct-progress-fill { height:100%; border-radius:2px; transition:width 1s linear; }

/* skeleton */
.ct-skel { background:linear-gradient(90deg,#161B22 25%,#1C2333 50%,#161B22 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }

/* empty */
.ct-empty { text-align:center; padding:72px 24px; background:var(--surface); border:1px solid var(--border); border-radius:16px; color:var(--muted); }
.ct-empty-icon { font-size:40px; margin-bottom:12px; }
.ct-empty-text { font-size:14px; }

/* refresh btn */
.ct-refresh { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; border:1px solid var(--border); background:transparent; color:var(--muted); font-family:var(--font); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s; }
.ct-refresh:hover { border-color:var(--green); color:var(--green); }
.ct-refresh.spinning svg { animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
`;

const PLATFORMS = ["All","Codeforces","CodeChef","LeetCode"];
const PLATFORM_COLOR = { Codeforces:"#F59E0B", CodeChef:"#8B5CF6", LeetCode:"#F97316" };
const PLATFORM_EMOJI = { Codeforces:"🔵", CodeChef:"🍴", LeetCode:"💛" };

function SkeletonCard() {
  return (
    <div style={{ background:"#161B22", border:"1px solid #21262D", borderRadius:16, padding:"22px 28px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <div className="ct-skel" style={{ width:38, height:38, borderRadius:10 }}/>
          <div>
            <div className="ct-skel" style={{ width:220, height:14, marginBottom:6 }}/>
            <div className="ct-skel" style={{ width:80, height:11 }}/>
          </div>
        </div>
        <div className="ct-skel" style={{ width:70, height:24, borderRadius:20 }}/>
      </div>
      <div style={{ display:"flex", gap:24, marginBottom:16 }}>
        {[130,100,120].map((w,i)=>(
          <div key={i}><div className="ct-skel" style={{ width:60, height:10, marginBottom:5 }}/><div className="ct-skel" style={{ width:w, height:13 }}/></div>
        ))}
      </div>
      <div style={{ height:1, background:"#21262D", margin:"0 0 16px" }}/>
      <div style={{ display:"flex", gap:10 }}>
        <div className="ct-skel" style={{ width:130, height:34, borderRadius:8 }}/>
        <div className="ct-skel" style={{ width:120, height:34, borderRadius:8 }}/>
      </div>
    </div>
  );
}

export default function ContestTracker() {
  const [contests,  setContests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [tab,       setTab]       = useState("All");
  const [search,    setSearch]    = useState("");
  const [now,       setNow]       = useState(Date.now());
  const [error,     setError]     = useState(null);
  const [reminded,  setReminded]  = useState(new Set());

  // live clock — tick every second
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // fetch + auto-refresh every 60s
  useEffect(() => {
    fetchContests();
    const t = setInterval(fetchContests, 60000);
    return () => clearInterval(t);
  }, []);

  const fetchContests = async (manual = false) => {
    if (manual) setRefreshing(true); else setLoading(true);
    try {
      const res = await API.get("/contests/external");
      const list = res.data?.contests || [];
      setContests(list.sort((a, b) => a.startTime - b.startTime));  
      setError(null);
    } catch {
      setError("Unable to load contests. Check your connection and try again.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  const getCountdown = start => {
    const diff = start - now;
    if (diff <= 0) return "LIVE";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (h >= 24) { const d = Math.floor(h/24); return `${d}d ${h%24}h ${m}m`; }
    return `${h}h ${m}m ${s}s`;
  };

  const getStatus = (start, duration) => {
    const end = start + duration * 1000;
    if (now >= start && now <= end) return "LIVE";
    if (start - now <= 3600000)     return "Starting Soon";
    return "Upcoming";
  };

  // progress % through a live contest
  const getLiveProgress = (start, duration) => {
    const end = start + duration * 1000;
    return Math.min(((now - start) / (end - start)) * 100, 100);
  };

  const handleReminder = async contest => {
    const granted = await requestPermission();
    if (!granted) { alert("Notification permission denied"); return; }
    addReminder(contest);
    setReminded(r => new Set([...r, contest.name]));
  };

  const filtered = useMemo(() => {
    let list = tab === "All" ? contests : contests.filter(c => c.platform === tab);
    if (search.trim()) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [contests, tab, search]);

  const counts = useMemo(() => {
    const m = { All: contests.length };
    contests.forEach(c => { m[c.platform] = (m[c.platform] || 0) + 1; });
    return m;
  }, [contests]);

  const liveCount    = contests.filter(c => getStatus(c.startTime, c.duration) === "LIVE").length;
  const soonCount    = contests.filter(c => getStatus(c.startTime, c.duration) === "Starting Soon").length;
  const upcomingCount = contests.filter(c => getStatus(c.startTime, c.duration) === "Upcoming").length;

  return (
    <>
      <style>{CSS}</style>
      <div className="ct-page">
        <div className="ct-blob ct-blob-1"/>
        <div className="ct-blob ct-blob-2"/>
        <div className="ct-inner">

          {/* ── HEADER ── */}
          <div className="ct-hdr">
            <div className="ct-hdr-left">
              <div className="ct-hdr-badge"><div className="ct-hdr-badge-dot"/>Live Tracker</div>
              <div className="ct-hdr-title">Global Contest <span>Tracker</span></div>
              <div className="ct-hdr-sub">Upcoming challenges from Codeforces, CodeChef, and LeetCode — all in one place.</div>
            </div>
            <button className={`ct-refresh ${refreshing?"spinning":""}`} onClick={() => fetchContests(true)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {/* ── STATS ── */}
          {!loading && (
            <div className="ct-stats">
              <div className="ct-stat">
                <div className="ct-stat-num" style={{ color:"var(--cyan)" }}>{contests.length}</div>
                <div className="ct-stat-lbl">Total</div>
              </div>
              <div className="ct-stat">
                <div className="ct-stat-num" style={{ color:"var(--red)" }}>{liveCount}</div>
                <div className="ct-stat-lbl">Live Now</div>
              </div>
              <div className="ct-stat">
                <div className="ct-stat-num" style={{ color:"var(--amber)" }}>{soonCount}</div>
                <div className="ct-stat-lbl">Starting Soon</div>
              </div>
              <div className="ct-stat">
                <div className="ct-stat-num" style={{ color:"var(--green)" }}>{upcomingCount}</div>
                <div className="ct-stat-lbl">Upcoming</div>
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {error && <div className="ct-alert"><span>⚠️</span>{error}</div>}

          {/* ── SEARCH + TABS ── */}
          <div className="ct-filter-bar">
            <div className="ct-search">
              <svg width="13" height="13" fill="none" stroke="#64748B" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input placeholder="Search contests…" value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
          </div>

          <div className="ct-tabs">
            {PLATFORMS.map(p => (
              <button key={p} className={`ct-tab ${tab===p?"on":""}`} onClick={() => setTab(p)}>
                {p}
                {!loading && <span className="ct-tab-count">{counts[p]||0}</span>}
              </button>
            ))}
          </div>

          {/* ── CARDS ── */}
          {loading ? (
            <div className="ct-list">{Array.from({length:4}).map((_,i)=><SkeletonCard key={i}/>)}</div>
          ) : filtered.length === 0 ? (
            <div className="ct-empty">
              <div className="ct-empty-icon">📭</div>
              <div className="ct-empty-text">{search ? `No contests matching "${search}"` : "No contests found for this platform right now."}</div>
            </div>
          ) : (
            <div className="ct-list">
              {filtered.map((c, i) => {
                const status     = getStatus(c.startTime, c.duration);
                const countdown  = getCountdown(c.startTime);
                const isLive     = status === "LIVE";
                const isSoon     = status === "Starting Soon";
                const stripeColor = PLATFORM_COLOR[c.platform] || "#22C55E";
                const isReminded  = reminded.has(c.name);
                const livePct     = isLive ? getLiveProgress(c.startTime, c.duration) : 0;

                return (
                  <div key={i} className="ct-card" style={{ animationDelay:`${i*0.06}s` }}>
                    <div className="ct-card-stripe" style={{ background:stripeColor }}/>
                    <div className="ct-card-inner">

                      {/* top */}
                      <div className="ct-card-top">
                        <div className="ct-card-title-row">
                          <div className="ct-platform-icon">{PLATFORM_EMOJI[c.platform]||"🏆"}</div>
                          <div style={{ minWidth:0 }}>
                            <div className="ct-card-name">{c.name}</div>
                            <div className="ct-card-platform">{c.platform}</div>
                          </div>
                        </div>
                        {isLive ? (
                          <div className="ct-status-live"><div className="ct-live-dot"/>LIVE</div>
                        ) : isSoon ? (
                          <div className="ct-status-soon">Starting Soon</div>
                        ) : (
                          <div className="ct-status-upcoming">Upcoming</div>
                        )}
                      </div>

                      {/* live progress bar */}
                      {isLive && (
                        <div>
                          <div className="ct-progress">
                            <div className="ct-progress-fill" style={{ width:`${livePct}%`, background:`linear-gradient(90deg,${stripeColor}88,${stripeColor})` }}/>
                          </div>
                          <div style={{ fontSize:10, color:"var(--muted)", marginTop:4, fontFamily:"var(--mono)" }}>
                            {Math.round(livePct)}% complete
                          </div>
                        </div>
                      )}

                      {/* meta */}
                      <div className="ct-card-meta">
                        <div>
                          <div className="ct-meta-label">Start Time</div>
                          <div className="ct-meta-value">{dayjs(c.startTime).format("DD MMM, hh:mm A")}</div>
                        </div>
                        <div>
                          <div className="ct-meta-label">Duration</div>
                          <div className="ct-meta-value">
                            {Math.floor(c.duration/3600)}h {Math.floor((c.duration%3600)/60)>0?`${Math.floor((c.duration%3600)/60)}m`:""}
                          </div>
                        </div>
                        <div>
                          <div className="ct-meta-label">{isLive?"Time Left":"Countdown"}</div>
                          <div className={`ct-meta-value ${isLive?"live":"countdown"}`}>{countdown}</div>
                        </div>
                        {!isLive && (
                          <div>
                            <div className="ct-meta-label">End Time</div>
                            <div className="ct-meta-value">{dayjs(c.startTime + c.duration*1000).format("DD MMM, hh:mm A")}</div>
                          </div>
                        )}
                      </div>

                      <div className="ct-card-divider"/>

                      {/* actions */}
                      <div className="ct-card-actions">
                        <a href={c.url} target="_blank" rel="noreferrer" className="ct-btn-visit">
                          <span>↗</span> {isLive ? "Join Now" : "Register / Visit"}
                        </a>
                        {!isLive && (
                          <button className={`ct-btn-remind ${isReminded?"set":""}`} onClick={() => handleReminder(c)}>
                            <span>{isReminded?"🔔":"🔕"}</span>
                            {isReminded?"Reminder Set":"Set Reminder"}
                          </button>
                        )}
                        <div style={{ marginLeft:"auto", fontSize:11, color:"var(--muted)", fontFamily:"var(--mono)" }}>
                          {dayjs(c.startTime).format("ddd, MMM D")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </>
  );
}