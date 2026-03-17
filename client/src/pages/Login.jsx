// src/pages/Login.jsx  — COMPLETE FILE
import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:      #0D1117;
  --surface: #161B22;
  --s2:      #1C2333;
  --border:  #21262D;
  --border2: #2D3748;
  --green:   #22C55E;
  --cyan:    #00B4D8;
  --amber:   #F59E0B;
  --red:     #EF4444;
  --text:    #E2E8F0;
  --muted:   #64748B;
  --font:    'Outfit', sans-serif;
  --mono:    'JetBrains Mono', monospace;
}

@keyframes fadeUp  { to { opacity:1; transform:translateY(0); } }
@keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
@keyframes blobDrift { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(30px,40px) scale(1.08)} }
@keyframes shimmerBorder {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.lg-page {
  min-height: 100vh;
  background: var(--bg);
  font-family: var(--font);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 24px;
}

.lg-page::before {
  content: '';
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px);
  background-size: 48px 48px;
}

.lg-blob {
  position: absolute; border-radius: 50%;
  filter: blur(100px); pointer-events: none;
  animation: blobDrift 12s ease-in-out infinite alternate;
}
.lg-blob-1 { width:500px; height:500px; background:rgba(34,197,94,0.07);  top:-120px; left:-120px; }
.lg-blob-2 { width:400px; height:400px; background:rgba(0,180,216,0.05);  bottom:-80px; right:-80px; animation-delay:-6s; }

.lg-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 40px 40px 36px;
  width: 100%; max-width: 420px;
  position: relative; z-index: 1;
  opacity: 0; transform: translateY(24px);
  animation: fadeUp 0.55s ease 0.1s forwards;
  box-shadow: 0 24px 64px rgba(0,0,0,0.4);
}

.lg-card::before {
  content: '';
  position: absolute; top: 0; left: 20%; right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #22C55E, #00B4D8, transparent);
  background-size: 200% 100%;
  animation: shimmerBorder 3s ease infinite;
  border-radius: 1px;
}

.lg-logo {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; margin-bottom: 28px;
}
.lg-logo-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: rgba(34,197,94,0.12);
  border: 1px solid rgba(34,197,94,0.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}
.lg-logo-text {
  font-size: 20px; font-weight: 800; color: var(--green);
  letter-spacing: -0.3px;
}

.lg-heading {
  text-align: center; margin-bottom: 6px;
  font-size: 24px; font-weight: 800; color: #fff;
  letter-spacing: -0.4px;
}
.lg-sub {
  text-align: center; color: var(--muted);
  font-size: 13.5px; margin-bottom: 30px; line-height: 1.6;
}

.lg-form { display: flex; flex-direction: column; gap: 14px; }

.lg-field { display: flex; flex-direction: column; gap: 6px; }
.lg-label {
  font-size: 12px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.8px;
  color: var(--muted);
}

.lg-input-wrap { position: relative; }
.lg-input-icon {
  position: absolute; left: 12px; top: 50%;
  transform: translateY(-50%);
  color: var(--muted); font-size: 15px; pointer-events: none;
  display: flex; align-items: center;
}

.lg-input {
  width: 100%;
  background: var(--s2);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text);
  font-family: var(--font);
  font-size: 14px;
  padding: 11px 12px 11px 38px;
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.lg-input::placeholder { color: var(--muted); }
.lg-input:focus {
  border-color: rgba(34,197,94,0.45);
  box-shadow: 0 0 0 3px rgba(34,197,94,0.08);
}
.lg-input.err {
  border-color: rgba(239,68,68,0.45);
  box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
}

.lg-eye {
  position: absolute; right: 12px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: var(--muted); font-size: 15px;
  display: flex; align-items: center;
  transition: color 0.15s;
}
.lg-eye:hover { color: var(--text); }

.lg-submit {
  width: 100%;
  background: var(--green);
  color: #0D1117;
  border: none; border-radius: 10px;
  padding: 13px;
  font-family: var(--font); font-size: 15px; font-weight: 800;
  cursor: pointer; transition: all 0.2s;
  letter-spacing: 0.2px; margin-top: 4px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.lg-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(34,197,94,0.3); background: #16A34A; }
.lg-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

@keyframes spin { to { transform: rotate(360deg); } }
.lg-spin { width:16px; height:16px; border:2px solid rgba(0,0,0,0.2); border-top-color:#0D1117; border-radius:50%; animation:spin 0.6s linear infinite; }

.lg-divider {
  display: flex; align-items: center; gap: 12px;
  margin: 4px 0;
}
.lg-divider-line { flex: 1; height: 1px; background: var(--border); }
.lg-divider-text { font-size: 11px; color: var(--muted); font-weight: 600; }

.lg-toggle {
  text-align: center; font-size: 13.5px; color: var(--muted);
}
.lg-toggle button {
  background: none; border: none; cursor: pointer;
  color: var(--green); font-family: var(--font);
  font-size: 13.5px; font-weight: 700;
  transition: color 0.15s; padding: 0;
}
.lg-toggle button:hover { color: #4ADE80; }

.lg-field-err {
  font-size: 11px; color: var(--red); font-weight: 500;
}

.lg-mode-tabs {
  display: flex;
  background: var(--s2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 3px;
  margin-bottom: 24px;
}
.lg-mode-tab {
  flex: 1; padding: 8px;
  background: none; border: none; border-radius: 8px;
  font-family: var(--font); font-size: 13px; font-weight: 700;
  cursor: pointer; transition: all 0.2s; color: var(--muted);
}
.lg-mode-tab.on {
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

.lg-role-badge {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.8px;
  text-transform: uppercase; padding: 4px 10px; border-radius: 20px;
  margin: 0 auto 20px; 
}
.lg-role-badge.admin { background: rgba(245,158,11,0.12); color: #F59E0B; border: 1px solid rgba(245,158,11,0.3); }
.lg-role-badge.user  { background: rgba(34,197,94,0.10);  color: #22C55E; border: 1px solid rgba(34,197,94,0.25); }
`;

export function getRole()    { return localStorage.getItem("role"); }
export function isAdmin()    { return getRole() === "admin"; }
export function isLoggedIn() { return !!localStorage.getItem("accessToken"); }

export default function Login() {
  const navigate  = useNavigate();
  const [isLogin, setIsLogin]   = useState(true);
  const [form,    setForm]      = useState({ name:"", email:"", password:"" });
  const [loading, setLoading]   = useState(false);
  const [showPw,  setShowPw]    = useState(false);
  const [errors,  setErrors]    = useState({});

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const e = {};
    if (!isLogin && !form.name.trim())          e.name     = "Name is required";
    if (!form.email.trim())                     e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = "Enter a valid email";
    if (!form.password)                         e.password = "Password is required";
    // ── FIXED: match backend requirements ──
    else if (form.password.length < 8)          e.password = "Minimum 8 characters";
    else if (!isLogin && !/[A-Z]/.test(form.password)) e.password = "Must include an uppercase letter";
    else if (!isLogin && !/[0-9]/.test(form.password)) e.password = "Must include a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const url     = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : form;

      const res = await API.post(url, payload);
      const { accessToken, user } = res.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("userId",      user._id);
      localStorage.setItem("username",    user.name);
      localStorage.setItem("email",       user.email);
      localStorage.setItem("role",        user.role ?? "user");

      toast.success(isLogin ? "Welcome back! 🎉" : "Account created! 🎉");

      setTimeout(() => {
        if (user.role === "admin") navigate("/admin/dashboard");
        else navigate("/profile");
      }, 900);

    } catch (err) {
      // ── FIXED: message is a string, never call .map() on it ──
      const message = err.response?.data?.message;
      toast.error(typeof message === "string" ? message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(l => !l);
    setForm({ name:"", email:"", password:"" });
    setErrors({});
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="lg-page">
        <div className="lg-blob lg-blob-1"/>
        <div className="lg-blob lg-blob-2"/>

        <div className="lg-card">
          <div className="lg-logo">
            <div className="lg-logo-icon">⚡</div>
            <span className="lg-logo-text">CodeTrack</span>
          </div>

          <div className="lg-mode-tabs">
            <button className={`lg-mode-tab ${isLogin ? "on" : ""}`}  onClick={() => { if(!isLogin) switchMode(); }}>Sign In</button>
            <button className={`lg-mode-tab ${!isLogin ? "on" : ""}`} onClick={() => { if(isLogin)  switchMode(); }}>Create Account</button>
          </div>

          <div className="lg-heading">{isLogin ? "Welcome back" : "Join CodeTrack"}</div>
          <div className="lg-sub">
            {isLogin ? "Sign in to continue your coding journey" : "Start solving, competing and tracking your growth"}
          </div>

          <form className="lg-form" onSubmit={handleSubmit} noValidate>
            {!isLogin && (
              <div className="lg-field">
                <label className="lg-label">Full Name</label>
                <div className="lg-input-wrap">
                  <span className="lg-input-icon">👤</span>
                  <input
                    className={`lg-input ${errors.name ? "err" : ""}`}
                    name="name" placeholder="Your full name"
                    value={form.name} onChange={handleChange}
                    autoComplete="name"
                  />
                </div>
                {errors.name && <span className="lg-field-err">{errors.name}</span>}
              </div>
            )}

            <div className="lg-field">
              <label className="lg-label">Email</label>
              <div className="lg-input-wrap">
                <span className="lg-input-icon">✉️</span>
                <input
                  className={`lg-input ${errors.email ? "err" : ""}`}
                  name="email" type="email" placeholder="you@example.com"
                  value={form.email} onChange={handleChange}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="lg-field-err">{errors.email}</span>}
            </div>

            <div className="lg-field">
              <label className="lg-label">Password</label>
              <div className="lg-input-wrap">
                <span className="lg-input-icon">🔒</span>
                <input
                  className={`lg-input ${errors.password ? "err" : ""}`}
                  name="password" type={showPw ? "text" : "password"}
                  placeholder={isLogin ? "Your password" : "Min. 8 chars, 1 uppercase, 1 number"}
                  value={form.password} onChange={handleChange}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  style={{ paddingRight:"42px" }}
                />
                <button type="button" className="lg-eye" onClick={() => setShowPw(v => !v)}>
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.password && <span className="lg-field-err">{errors.password}</span>}
            </div>

            <button className="lg-submit" type="submit" disabled={loading}>
              {loading
                ? <><div className="lg-spin"/> {isLogin ? "Signing in…" : "Creating account…"}</>
                : isLogin ? "Sign In →" : "Create Account →"
              }
            </button>
          </form>

          <div className="lg-divider" style={{ marginTop:"22px" }}>
            <div className="lg-divider-line"/>
            <span className="lg-divider-text">OR</span>
            <div className="lg-divider-line"/>
          </div>

          <div className="lg-toggle">
            {isLogin ? "New to CodeTrack? " : "Already have an account? "}
            <button onClick={switchMode}>
              {isLogin ? "Create a free account" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}