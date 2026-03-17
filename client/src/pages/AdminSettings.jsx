import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
:root {
  --bg:#0D1117; --surface:#161B22; --s2:#1C2333; --border:#21262D;
  --green:#22C55E; --cyan:#00B4D8; --amber:#F59E0B; --red:#EF4444; --purple:#8B5CF6;
  --pink:#EC4899; --blue:#3B82F6;
  --text:#E2E8F0; --muted:#64748B; --font:'Outfit',sans-serif; --mono:'JetBrains Mono',monospace;
}
* { scrollbar-width:thin; scrollbar-color:#21262D transparent; }
::-webkit-scrollbar { width:5px; }
::-webkit-scrollbar-thumb { background:#2D3748; border-radius:4px; }
@keyframes fadeUp  { to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn  { to{opacity:1} }
@keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
@keyframes spin    { to{transform:rotate(360deg)} }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
@keyframes slideRight { from{transform:translateX(-4px);opacity:0} to{transform:translateX(0);opacity:1} }

.as-page { min-height:100vh; background:var(--bg); color:var(--text); font-family:var(--font); position:relative; overflow-x:hidden; }
.as-page::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
  background-image:linear-gradient(rgba(139,92,246,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.02) 1px,transparent 1px);
  background-size:48px 48px; }

.as-layout { display:grid; grid-template-columns:240px 1fr; min-height:100vh; position:relative; z-index:1; }

/* ── Sidebar ── */
.as-sidebar { background:var(--surface); border-right:1px solid var(--border); padding:32px 0; position:sticky; top:0; height:100vh; overflow-y:auto; }
.as-sidebar-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:var(--muted); padding:0 20px 12px; }
.as-nav-item { display:flex; align-items:center; gap:10px; padding:10px 20px; cursor:pointer; transition:all 0.15s; border-left:2px solid transparent; font-size:13px; font-weight:600; color:var(--muted); }
.as-nav-item:hover { color:var(--text); background:rgba(255,255,255,0.03); }
.as-nav-item.on { color:var(--amber); border-left-color:var(--amber); background:rgba(245,158,11,0.06); }
.as-nav-icon { font-size:15px; flex-shrink:0; }
.as-nav-divider { height:1px; background:var(--border); margin:12px 20px; }

/* ── Main ── */
.as-main { padding:40px 48px 80px; max-width:800px; }
.as-fade { opacity:0; transform:translateY(16px); animation:fadeUp 0.45s ease forwards; }
.as-fade-in { opacity:0; animation:fadeIn 0.4s ease forwards; }

/* ── Header ── */
.as-hdr { margin-bottom:36px; }
.as-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(139,92,246,0.1); color:var(--purple); border:1px solid rgba(139,92,246,0.25); border-radius:20px; padding:4px 14px; font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:12px; }
.as-badge-dot { width:6px; height:6px; border-radius:50%; background:var(--purple); animation:pulse 2s ease-in-out infinite; }
.as-title { font-size:32px; font-weight:900; color:#fff; letter-spacing:-1px; line-height:1.05; }
.as-title span { background:linear-gradient(135deg,#8B5CF6,#EC4899); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.as-sub { font-size:14px; color:var(--muted); margin-top:6px; }

/* ── Section ── */
.as-section { margin-bottom:36px; animation:slideRight 0.35s ease forwards; }
.as-section-title { font-size:14px; font-weight:800; color:#fff; margin-bottom:4px; display:flex; align-items:center; gap:8px; }
.as-section-desc { font-size:12px; color:var(--muted); margin-bottom:18px; }
.as-card { background:var(--surface); border:1px solid var(--border); border-radius:14px; overflow:hidden; }

/* ── Field rows ── */
.as-field { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid var(--border); gap:20px; }
.as-field:last-child { border-bottom:none; }
.as-field-info { flex:1; min-width:0; }
.as-field-label { font-size:13px; font-weight:700; color:var(--text); margin-bottom:3px; }
.as-field-hint { font-size:11px; color:var(--muted); }
.as-field-control { flex-shrink:0; }

/* ── Inputs ── */
.as-input { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:8px 12px; color:var(--text); font-family:var(--font); font-size:13px; outline:none; transition:border-color 0.15s; min-width:200px; }
.as-input:focus { border-color:var(--purple); box-shadow:0 0 0 3px rgba(139,92,246,0.12); }
.as-input::placeholder { color:var(--muted); }
.as-input-sm { min-width:100px; }
.as-textarea { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px 12px; color:var(--text); font-family:var(--font); font-size:13px; outline:none; transition:border-color 0.15s; width:100%; resize:vertical; min-height:80px; }
.as-textarea:focus { border-color:var(--purple); box-shadow:0 0 0 3px rgba(139,92,246,0.12); }
.as-select { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:8px 12px; color:var(--text); font-family:var(--font); font-size:13px; outline:none; cursor:pointer; min-width:150px; }
.as-select option { background:var(--surface); }

/* ── Toggle ── */
.as-toggle { position:relative; width:44px; height:24px; cursor:pointer; flex-shrink:0; }
.as-toggle input { opacity:0; width:0; height:0; position:absolute; }
.as-toggle-track { position:absolute; inset:0; border-radius:12px; background:#21262D; border:1px solid var(--border); transition:all 0.2s; }
.as-toggle input:checked + .as-toggle-track { background:var(--green); border-color:var(--green); }
.as-toggle-thumb { position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform 0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.3); }
.as-toggle input:checked ~ .as-toggle-thumb { transform:translateX(20px); }

/* ── Color swatch ── */
.as-color-row { display:flex; gap:8px; flex-wrap:wrap; }
.as-color-swatch { width:28px; height:28px; border-radius:6px; cursor:pointer; border:2px solid transparent; transition:all 0.15s; }
.as-color-swatch.on { border-color:#fff; transform:scale(1.15); }
.as-color-input { width:36px; height:28px; border-radius:6px; border:1px solid var(--border); background:var(--bg); cursor:pointer; padding:2px; }

/* ── Buttons ── */
.as-btn { display:inline-flex; align-items:center; gap:7px; padding:9px 20px; border-radius:9px; font-family:var(--font); font-size:13px; font-weight:700; cursor:pointer; transition:all 0.18s; border:1px solid; }
.as-btn:hover:not(:disabled) { transform:translateY(-1px); }
.as-btn:disabled { opacity:0.4; cursor:not-allowed; }
.as-btn-primary { background:var(--purple); color:#fff; border-color:var(--purple); box-shadow:0 4px 16px rgba(139,92,246,0.3); }
.as-btn-primary:hover:not(:disabled) { box-shadow:0 8px 24px rgba(139,92,246,0.4); }
.as-btn-ghost { background:transparent; color:var(--muted); border-color:var(--border); }
.as-btn-ghost:hover:not(:disabled) { color:var(--text); border-color:#464f5b; }
.as-btn-danger { background:rgba(239,68,68,0.08); color:var(--red); border-color:rgba(239,68,68,0.3); }
.as-btn-danger:hover:not(:disabled) { background:rgba(239,68,68,0.15); }
.as-btn-success { background:rgba(34,197,94,0.08); color:var(--green); border-color:rgba(34,197,94,0.3); }
.as-btn-success:hover:not(:disabled) { background:rgba(34,197,94,0.15); }

/* ── Save bar ── */
.as-save-bar { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#161B22; border:1px solid rgba(139,92,246,0.3); border-radius:14px; padding:12px 20px; display:flex; align-items:center; gap:14px; box-shadow:0 8px 40px rgba(0,0,0,0.6); z-index:100; animation:fadeUp 0.3s ease; }
.as-save-bar-text { font-size:13px; font-weight:600; color:var(--muted); }
.as-save-bar-dot { width:7px; height:7px; border-radius:50%; background:var(--amber); animation:pulse 1.5s ease-in-out infinite; }

/* ── Toast ── */
.as-toast-wrap { position:fixed; bottom:24px; right:24px; z-index:9999; display:flex; flex-direction:column; gap:8px; pointer-events:none; }
.as-toast { display:flex; align-items:center; gap:10px; padding:12px 18px; border-radius:10px; font-size:13px; font-weight:600; animation:fadeIn 0.3s ease; box-shadow:0 4px 20px rgba(0,0,0,0.5); }
.as-toast.success { background:#052e16; color:#22C55E; border:1px solid #166534; }
.as-toast.error   { background:#2a0a0a; color:#EF4444; border:1px solid #7f1d1d; }
.as-toast.info    { background:#0a1628; color:#00B4D8; border:1px solid #0e4d6b; }

/* ── Maintenance banner ── */
.as-maintenance-banner { background:linear-gradient(135deg,rgba(239,68,68,0.1),rgba(245,158,11,0.1)); border:1px solid rgba(239,68,68,0.3); border-radius:12px; padding:16px 20px; display:flex; align-items:center; gap:14px; margin-bottom:24px; }
.as-maintenance-icon { font-size:24px; flex-shrink:0; }
.as-maintenance-text { flex:1; }
.as-maintenance-title { font-size:14px; font-weight:800; color:var(--red); }
.as-maintenance-sub { font-size:12px; color:var(--muted); margin-top:2px; }

/* ── Tag input ── */
.as-tag-wrap { display:flex; flex-wrap:wrap; gap:6px; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:8px 10px; min-width:280px; cursor:text; }
.as-tag-wrap:focus-within { border-color:var(--purple); box-shadow:0 0 0 3px rgba(139,92,246,0.12); }
.as-tag { display:inline-flex; align-items:center; gap:5px; background:rgba(139,92,246,0.15); border:1px solid rgba(139,92,246,0.3); color:var(--purple); border-radius:5px; padding:2px 8px; font-size:11px; font-weight:600; }
.as-tag-x { cursor:pointer; opacity:0.6; font-size:13px; line-height:1; }
.as-tag-x:hover { opacity:1; }
.as-tag-input { border:none; outline:none; background:transparent; color:var(--text); font-family:var(--font); font-size:12px; min-width:80px; flex:1; }

/* ── Danger zone ── */
.as-danger-card { background:rgba(239,68,68,0.04); border:1px solid rgba(239,68,68,0.2); border-radius:14px; overflow:hidden; }
.as-danger-field { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid rgba(239,68,68,0.12); gap:20px; }
.as-danger-field:last-child { border-bottom:none; }

/* ── Shimmer ── */
.as-shimmer { background:linear-gradient(90deg,#1E2530 25%,#252D3A 50%,#1E2530 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }

@media (max-width: 900px) {
  .as-layout { grid-template-columns:1fr; }
  .as-sidebar { display:none; }
  .as-main { padding:24px 20px 80px; }
}
`;

const SECTIONS = [
  { id: "general",      icon: "🏠", label: "General"          },
  { id: "appearance",   icon: "🎨", label: "Appearance"       },
  { id: "judge",        icon: "⚙️", label: "Judge & Execution" },
  { id: "contests",     icon: "🏆", label: "Contests"         },
  { id: "email",        icon: "📧", label: "Email & Alerts"   },
  { id: "security",     icon: "🔒", label: "Security"         },
  { id: "danger",       icon: "⚠️", label: "Danger Zone"      },
];

const ACCENT_COLORS = ["#22C55E","#00B4D8","#8B5CF6","#F59E0B","#EF4444","#EC4899","#3B82F6","#F97316"];

function Toggle({ checked, onChange }) {
  return (
    <label className="as-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <div className="as-toggle-track" />
      <div className="as-toggle-thumb" />
    </label>
  );
}

function TagInput({ value, onChange, placeholder }) {
  const [input, setInput] = useState("");
  const tags = Array.isArray(value) ? value : [];

  const add = (v) => {
    const t = v.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  };

  const remove = (t) => onChange(tags.filter(x => x !== t));

  return (
    <div className="as-tag-wrap" onClick={e => e.currentTarget.querySelector("input")?.focus()}>
      {tags.map(t => (
        <span key={t} className="as-tag">
          {t}
          <span className="as-tag-x" onClick={() => remove(t)}>×</span>
        </span>
      ))}
      <input
        className="as-tag-input"
        value={input}
        placeholder={tags.length === 0 ? placeholder : ""}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); }
          if (e.key === "Backspace" && !input && tags.length) remove(tags[tags.length - 1]);
        }}
        onBlur={() => { if (input.trim()) add(input); }}
      />
    </div>
  );
}

const DEFAULT_SETTINGS = {
  // General
  siteName:        "CodeTrack",
  siteTagline:     "Master DSA. Dominate Contests.",
  siteUrl:         "",
  supportEmail:    "",
  maintenanceMode: false,
  maintenanceMsg:  "We're performing scheduled maintenance. Back soon!",
  registrationOpen: true,
  maxUsersPerPage: 20,

  // Appearance
  accentColor:     "#22C55E",
  logoEmoji:       "⚡",
  showLeaderboard: true,
  showAnalytics:   true,
  darkModeForced:  true,

  // Judge
  defaultTimeLimit:   1000,
  defaultMemoryLimit: 256,
  maxTimeLimit:       10000,
  maxMemoryLimit:     1024,
  allowedLanguages:   ["C++","Python","Java","JavaScript"],
  judgeUrl:           "",
  judgeToken:         "",

  // Contests
  maxContestDuration:  480,
  allowVirtualContests: true,
  plagiarismThreshold:  80,
  autoEndContests:      true,
  contestCooldown:      24,

  // Email
  smtpHost:      "",
  smtpPort:      "587",
  smtpUser:      "",
  smtpPass:      "",
  emailFromName: "CodeTrack",
  notifyOnBan:   true,
  notifyOnPlag:  true,
  notifyOnContest: true,

  // Security
  sessionTimeout:    7,
  maxLoginAttempts:  5,
  requireEmailVerify: false,
  twoFactorAdmin:    false,
  rateLimitPerMin:   60,
  allowGuestView:    true,
};

export default function AdminSettings() {
  const navigate  = useNavigate();
  const role      = localStorage.getItem("role") || "user";
  if (role !== "admin") { window.location.href = "/"; return null; }

  const [active,   setActive]   = useState("general");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved,    setSaved]     = useState({ ...DEFAULT_SETTINGS });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toasts,   setToasts]   = useState([]);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(saved);

  const showToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  // Load settings from API on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await API.get("/admin/settings");
        const merged = { ...DEFAULT_SETTINGS, ...res.data };
        setSettings(merged);
        setSaved(merged);
      } catch {
        // No settings API yet — use defaults silently
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  const saveSettings = async () => {
    setSaving(true);
    try {
      await API.put("/admin/settings", settings);
      setSaved({ ...settings });
      showToast("Settings saved successfully ✓");
    } catch {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const resetSection = () => {
    const keys = Object.keys(DEFAULT_SETTINGS);
    const reset = {};
    keys.forEach(k => { reset[k] = DEFAULT_SETTINGS[k]; });
    setSettings(reset);
    showToast("Settings reset to defaults", "info");
  };

  const Field = ({ label, hint, children }) => (
    <div className="as-field">
      <div className="as-field-info">
        <div className="as-field-label">{label}</div>
        {hint && <div className="as-field-hint">{hint}</div>}
      </div>
      <div className="as-field-control">{children}</div>
    </div>
  );

  const renderSection = () => {
    if (loading) return (
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {[0,1,2,3].map(i=><div key={i} className="as-shimmer" style={{height:64}}/>)}
      </div>
    );

    switch (active) {

      case "general": return (
        <div className="as-section">
          <div className="as-section-title">🏠 General Settings</div>
          <div className="as-section-desc">Core platform identity and access configuration.</div>

          {settings.maintenanceMode && (
            <div className="as-maintenance-banner as-fade-in">
              <div className="as-maintenance-icon">🚧</div>
              <div className="as-maintenance-text">
                <div className="as-maintenance-title">Maintenance Mode is ON</div>
                <div className="as-maintenance-sub">Users see the maintenance message and cannot access the platform.</div>
              </div>
            </div>
          )}

          <div className="as-card">
            <Field label="Site Name" hint="Displayed in browser tab and emails">
              <input className="as-input" value={settings.siteName} onChange={e=>set("siteName",e.target.value)} placeholder="CodeTrack"/>
            </Field>
            <Field label="Tagline" hint="Short description shown on the home page">
              <input className="as-input" value={settings.siteTagline} onChange={e=>set("siteTagline",e.target.value)} placeholder="Master DSA..."/>
            </Field>
            <Field label="Site URL" hint="Full URL including https://">
              <input className="as-input" value={settings.siteUrl} onChange={e=>set("siteUrl",e.target.value)} placeholder="https://codetrack.io"/>
            </Field>
            <Field label="Support Email" hint="Shown in system emails to users">
              <input className="as-input" type="email" value={settings.supportEmail} onChange={e=>set("supportEmail",e.target.value)} placeholder="support@codetrack.io"/>
            </Field>
            <Field label="Logo / Icon Emoji" hint="Emoji displayed in the navbar">
              <input className="as-input as-input-sm" value={settings.logoEmoji} onChange={e=>set("logoEmoji",e.target.value)} maxLength={4}/>
            </Field>
            <Field label="Open Registration" hint="Allow new users to create accounts">
              <Toggle checked={settings.registrationOpen} onChange={v=>set("registrationOpen",v)}/>
            </Field>
            <Field label="Maintenance Mode" hint="Take the site offline for maintenance">
              <Toggle checked={settings.maintenanceMode} onChange={v=>set("maintenanceMode",v)}/>
            </Field>
            {settings.maintenanceMode && (
              <Field label="Maintenance Message" hint="Shown to users during maintenance">
                <textarea className="as-textarea" style={{minWidth:280}} value={settings.maintenanceMsg} onChange={e=>set("maintenanceMsg",e.target.value)}/>
              </Field>
            )}
            <Field label="Users Per Page" hint="Default pagination size in admin tables">
              <input className="as-input as-input-sm" type="number" min={5} max={100} value={settings.maxUsersPerPage} onChange={e=>set("maxUsersPerPage",+e.target.value)}/>
            </Field>
          </div>
        </div>
      );

      case "appearance": return (
        <div className="as-section">
          <div className="as-section-title">🎨 Appearance</div>
          <div className="as-section-desc">Customize the look and feel of the platform.</div>
          <div className="as-card">
            <Field label="Accent Color" hint="Primary brand color used across the UI">
              <div className="as-color-row">
                {ACCENT_COLORS.map(c => (
                  <div
                    key={c}
                    className={`as-color-swatch${settings.accentColor===c?" on":""}`}
                    style={{background:c}}
                    onClick={()=>set("accentColor",c)}
                    title={c}
                  />
                ))}
                <input
                  type="color"
                  className="as-color-input"
                  value={settings.accentColor}
                  onChange={e=>set("accentColor",e.target.value)}
                  title="Custom color"
                />
              </div>
            </Field>
            <Field label="Force Dark Mode" hint="Prevent users from switching to light mode">
              <Toggle checked={settings.darkModeForced} onChange={v=>set("darkModeForced",v)}/>
            </Field>
            <Field label="Show Leaderboard" hint="Display global rankings to all users">
              <Toggle checked={settings.showLeaderboard} onChange={v=>set("showLeaderboard",v)}/>
            </Field>
            <Field label="Show Analytics Tab" hint="Show the analytics section in the dashboard">
              <Toggle checked={settings.showAnalytics} onChange={v=>set("showAnalytics",v)}/>
            </Field>
          </div>
        </div>
      );

      case "judge": return (
        <div className="as-section">
          <div className="as-section-title">⚙️ Judge & Execution</div>
          <div className="as-section-desc">Code runner and execution environment settings.</div>
          <div className="as-card">
            <Field label="Judge API URL" hint="Base URL of your Judge0 or custom judge">
              <input className="as-input" value={settings.judgeUrl} onChange={e=>set("judgeUrl",e.target.value)} placeholder="https://judge.example.com"/>
            </Field>
            <Field label="Judge API Token" hint="X-Auth-Token header value">
              <input className="as-input" type="password" value={settings.judgeToken} onChange={e=>set("judgeToken",e.target.value)} placeholder="••••••••"/>
            </Field>
            <Field label="Default Time Limit (ms)" hint="Applied when no custom limit is set">
              <input className="as-input as-input-sm" type="number" min={100} value={settings.defaultTimeLimit} onChange={e=>set("defaultTimeLimit",+e.target.value)}/>
            </Field>
            <Field label="Default Memory Limit (MB)" hint="Applied when no custom limit is set">
              <input className="as-input as-input-sm" type="number" min={32} value={settings.defaultMemoryLimit} onChange={e=>set("defaultMemoryLimit",+e.target.value)}/>
            </Field>
            <Field label="Max Time Limit (ms)" hint="Hard ceiling; users cannot exceed this">
              <input className="as-input as-input-sm" type="number" min={100} value={settings.maxTimeLimit} onChange={e=>set("maxTimeLimit",+e.target.value)}/>
            </Field>
            <Field label="Max Memory Limit (MB)" hint="Hard ceiling per submission">
              <input className="as-input as-input-sm" type="number" min={64} value={settings.maxMemoryLimit} onChange={e=>set("maxMemoryLimit",+e.target.value)}/>
            </Field>
            <Field label="Allowed Languages" hint="Enter languages, press Enter to add">
              <TagInput value={settings.allowedLanguages} onChange={v=>set("allowedLanguages",v)} placeholder="C++, Python…"/>
            </Field>
          </div>
        </div>
      );

      case "contests": return (
        <div className="as-section">
          <div className="as-section-title">🏆 Contest Settings</div>
          <div className="as-section-desc">Rules and defaults for competitive programming contests.</div>
          <div className="as-card">
            <Field label="Max Contest Duration (min)" hint="Longest allowed contest in minutes">
              <input className="as-input as-input-sm" type="number" min={30} value={settings.maxContestDuration} onChange={e=>set("maxContestDuration",+e.target.value)}/>
            </Field>
            <Field label="Contest Cooldown (hrs)" hint="Minimum gap between contests per user">
              <input className="as-input as-input-sm" type="number" min={0} value={settings.contestCooldown} onChange={e=>set("contestCooldown",+e.target.value)}/>
            </Field>
            <Field label="Plagiarism Threshold (%)" hint="Similarity score that triggers a flag">
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <input className="as-input as-input-sm" type="number" min={50} max={100} value={settings.plagiarismThreshold} onChange={e=>set("plagiarismThreshold",+e.target.value)}/>
                <span style={{fontSize:12,color:"var(--muted)"}}>%</span>
              </div>
            </Field>
            <Field label="Allow Virtual Contests" hint="Users can run past contests in practice mode">
              <Toggle checked={settings.allowVirtualContests} onChange={v=>set("allowVirtualContests",v)}/>
            </Field>
            <Field label="Auto-End Contests" hint="Automatically close contests at end time">
              <Toggle checked={settings.autoEndContests} onChange={v=>set("autoEndContests",v)}/>
            </Field>
          </div>
        </div>
      );

      case "email": return (
        <div className="as-section">
          <div className="as-section-title">📧 Email & Notifications</div>
          <div className="as-section-desc">SMTP configuration and automated notification triggers.</div>
          <div className="as-card">
            <Field label="SMTP Host" hint="e.g. smtp.gmail.com">
              <input className="as-input" value={settings.smtpHost} onChange={e=>set("smtpHost",e.target.value)} placeholder="smtp.gmail.com"/>
            </Field>
            <Field label="SMTP Port" hint="Usually 587 (TLS) or 465 (SSL)">
              <input className="as-input as-input-sm" value={settings.smtpPort} onChange={e=>set("smtpPort",e.target.value)} placeholder="587"/>
            </Field>
            <Field label="SMTP Username" hint="Login for your mail server">
              <input className="as-input" value={settings.smtpUser} onChange={e=>set("smtpUser",e.target.value)} placeholder="you@gmail.com"/>
            </Field>
            <Field label="SMTP Password" hint="App password or SMTP secret">
              <input className="as-input" type="password" value={settings.smtpPass} onChange={e=>set("smtpPass",e.target.value)} placeholder="••••••••"/>
            </Field>
            <Field label="From Name" hint="Display name in sent emails">
              <input className="as-input" value={settings.emailFromName} onChange={e=>set("emailFromName",e.target.value)} placeholder="CodeTrack"/>
            </Field>
          </div>

          <div style={{height:20}}/>
          <div className="as-section-title" style={{fontSize:13}}>🔔 Notification Triggers</div>
          <div className="as-section-desc" style={{marginTop:4}}>Choose which events send automated emails.</div>
          <div className="as-card">
            <Field label="Notify on Ban" hint="Email user when their account is banned">
              <Toggle checked={settings.notifyOnBan} onChange={v=>set("notifyOnBan",v)}/>
            </Field>
            <Field label="Notify on Plagiarism" hint="Email flagged users after plag check">
              <Toggle checked={settings.notifyOnPlag} onChange={v=>set("notifyOnPlag",v)}/>
            </Field>
            <Field label="Notify on Contest" hint="Remind users before a contest starts">
              <Toggle checked={settings.notifyOnContest} onChange={v=>set("notifyOnContest",v)}/>
            </Field>
          </div>
        </div>
      );

      case "security": return (
        <div className="as-section">
          <div className="as-section-title">🔒 Security</div>
          <div className="as-section-desc">Authentication, rate limits, and access controls.</div>
          <div className="as-card">
            <Field label="Session Timeout (days)" hint="How long before users are logged out">
              <input className="as-input as-input-sm" type="number" min={1} max={90} value={settings.sessionTimeout} onChange={e=>set("sessionTimeout",+e.target.value)}/>
            </Field>
            <Field label="Max Login Attempts" hint="Attempts before temporary account lock">
              <input className="as-input as-input-sm" type="number" min={3} max={20} value={settings.maxLoginAttempts} onChange={e=>set("maxLoginAttempts",+e.target.value)}/>
            </Field>
            <Field label="Rate Limit (req/min)" hint="Max API requests per user per minute">
              <input className="as-input as-input-sm" type="number" min={10} value={settings.rateLimitPerMin} onChange={e=>set("rateLimitPerMin",+e.target.value)}/>
            </Field>
            <Field label="Require Email Verification" hint="New users must verify email before access">
              <Toggle checked={settings.requireEmailVerify} onChange={v=>set("requireEmailVerify",v)}/>
            </Field>
            <Field label="2FA for Admins" hint="Require two-factor auth for all admin accounts">
              <Toggle checked={settings.twoFactorAdmin} onChange={v=>set("twoFactorAdmin",v)}/>
            </Field>
            <Field label="Allow Guest Viewing" hint="Non-logged-in users can browse problems">
              <Toggle checked={settings.allowGuestView} onChange={v=>set("allowGuestView",v)}/>
            </Field>
          </div>
        </div>
      );

      case "danger": return (
        <div className="as-section">
          <div className="as-section-title" style={{color:"var(--red)"}}>⚠️ Danger Zone</div>
          <div className="as-section-desc">Irreversible actions. Proceed with extreme caution.</div>
          <div className="as-danger-card">
            <div className="as-danger-field">
              <div className="as-field-info">
                <div className="as-field-label">Reset All Settings</div>
                <div className="as-field-hint">Restore all settings to their factory defaults.</div>
              </div>
              <button className="as-btn as-btn-danger" onClick={resetSection}>↺ Reset to Defaults</button>
            </div>
            <div className="as-danger-field">
              <div className="as-field-info">
                <div className="as-field-label">Clear Submission Cache</div>
                <div className="as-field-hint">Force recompute of acceptance rates and stats.</div>
              </div>
              <button className="as-btn as-btn-danger" onClick={async () => {
                try { await API.post("/admin/cache/clear"); showToast("Cache cleared ✓"); }
                catch { showToast("Failed to clear cache","error"); }
              }}>🗑 Clear Cache</button>
            </div>
            <div className="as-danger-field">
              <div className="as-field-info">
                <div className="as-field-label">Recalculate Leaderboard</div>
                <div className="as-field-hint">Rebuild scores and rankings from scratch.</div>
              </div>
              <button className="as-btn as-btn-danger" onClick={async () => {
                try { await API.post("/admin/leaderboard/recalculate"); showToast("Leaderboard recalculated ✓"); }
                catch { showToast("Failed to recalculate","error"); }
              }}>📊 Recalculate</button>
            </div>
            <div className="as-danger-field">
              <div className="as-field-info">
                <div className="as-field-label" style={{color:"var(--red)"}}>Enable Maintenance Mode</div>
                <div className="as-field-hint">Immediately take the platform offline for all non-admin users.</div>
              </div>
              <Toggle checked={settings.maintenanceMode} onChange={v=>set("maintenanceMode",v)}/>
            </div>
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <>
      <style>{CSS}</style>

      {/* Toasts */}
      <div className="as-toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`as-toast ${t.type}`}>
            {t.type==="success"?"✓":t.type==="error"?"✗":"ℹ"} {t.msg}
          </div>
        ))}
      </div>

      <div className="as-page">
        <div className="as-layout">

          {/* Sidebar */}
          <aside className="as-sidebar">
            <div style={{padding:"0 20px 20px",borderBottom:"1px solid var(--border)",marginBottom:16}}>
              <button
                onClick={()=>navigate("/admin/dashboard")}
                style={{display:"flex",alignItems:"center",gap:7,background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"var(--font)",padding:0,transition:"color 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.color="var(--text)"}
                onMouseLeave={e=>e.currentTarget.style.color="var(--muted)"}
              >
                ← Dashboard
              </button>
              <div style={{fontSize:16,fontWeight:800,color:"#fff",marginTop:10}}>⚙️ Settings</div>
            </div>
            <div className="as-sidebar-title">Configuration</div>
            {SECTIONS.map(s => (
              <div
                key={s.id}
                className={`as-nav-item ${active===s.id?"on":""}`}
                onClick={() => setActive(s.id)}
              >
                <span className="as-nav-icon">{s.icon}</span>
                {s.label}
                {s.id==="danger"&&<span style={{marginLeft:"auto",fontSize:9,background:"rgba(239,68,68,0.2)",color:"var(--red)",padding:"1px 5px",borderRadius:3,fontWeight:700}}>⚠</span>}
              </div>
            ))}
          </aside>

          {/* Main content */}
          <main className="as-main">
            <div className="as-hdr as-fade">
              <div className="as-badge"><div className="as-badge-dot"/> Admin Settings</div>
              <div className="as-title">Platform <span>Config.</span></div>
              <div className="as-sub">Configure and fine-tune every aspect of your platform.</div>
            </div>

            {renderSection()}

            {/* Save / Cancel buttons at bottom */}
            {active !== "danger" && (
              <div style={{display:"flex",gap:10,marginTop:8}}>
                <button
                  className="as-btn as-btn-primary"
                  onClick={saveSettings}
                  disabled={saving || !isDirty}
                >
                  {saving
                    ? <><span style={{display:"inline-block",animation:"spin 0.8s linear infinite"}}>⟳</span> Saving…</>
                    : "💾 Save Changes"}
                </button>
                {isDirty && (
                  <button
                    className="as-btn as-btn-ghost"
                    onClick={()=>setSettings({...saved})}
                  >
                    Discard
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating unsaved changes bar */}
      {isDirty && (
        <div className="as-save-bar">
          <div className="as-save-bar-dot"/>
          <span className="as-save-bar-text">You have unsaved changes</span>
          <button className="as-btn as-btn-ghost" style={{padding:"6px 14px",fontSize:12}} onClick={()=>setSettings({...saved})}>Discard</button>
          <button className="as-btn as-btn-primary" style={{padding:"6px 16px",fontSize:12}} onClick={saveSettings} disabled={saving}>
            {saving?"Saving…":"Save"}
          </button>
        </div>
      )}
    </>
  );
}