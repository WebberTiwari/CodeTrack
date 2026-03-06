// components/Navbar.jsx
// Pure CSS — no MUI dependency. Role-aware nav.

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

:root {
  --bg:      #0D1117;
  --surface: #161B22;
  --s2:      #1C2333;
  --border:  #21262D;
  --green:   #22C55E;
  --amber:   #F59E0B;
  --red:     #EF4444;
  --text:    #E2E8F0;
  --muted:   #64748B;
  --font:    'Outfit', sans-serif;
  --mono:    'JetBrains Mono', monospace;
}

/* ── bar ── */
.nb {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  height: 56px;
  background: rgba(13,17,23,0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center;
  padding: 0 24px;
  font-family: var(--font);
}

/* shimmer line at bottom of navbar */
.nb::after {
  content: '';
  position: absolute; bottom: 0; left: 10%; right: 10%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(34,197,94,0.4), rgba(0,180,216,0.3), transparent);
  background-size: 200% 100%;
  animation: nbShimmer 4s ease infinite;
}
@keyframes nbShimmer {
  0%   { background-position: -100% 0; }
  100% { background-position: 200% 0; }
}

.nb-spacer { height: 56px; }

/* ── logo ── */
.nb-logo {
  display: flex; align-items: center; gap: 8px;
  text-decoration: none; cursor: pointer; flex-shrink: 0;
}
.nb-logo-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(34,197,94,0.12);
  border: 1px solid rgba(34,197,94,0.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; transition: all 0.2s;
}
.nb-logo:hover .nb-logo-icon {
  background: rgba(34,197,94,0.2);
  box-shadow: 0 0 12px rgba(34,197,94,0.25);
}
.nb-logo-text {
  font-size: 17px; font-weight: 800; color: var(--green);
  letter-spacing: -0.3px; font-family: var(--mono);
}

/* ── center links ── */
.nb-links {
  display: flex; align-items: center; gap: 2px;
  margin: 0 auto;
}
.nb-link {
  position: relative;
  padding: 6px 13px; border-radius: 8px;
  font-size: 13.5px; font-weight: 600;
  color: var(--muted); text-decoration: none;
  transition: color 0.18s, background 0.18s;
  white-space: nowrap;
}
.nb-link:hover { color: var(--text); background: rgba(255,255,255,0.04); }
.nb-link.active { color: var(--green); }
.nb-link.active::after {
  content: '';
  position: absolute; bottom: -1px; left: 20%; right: 20%;
  height: 2px; border-radius: 1px;
  background: var(--green);
  box-shadow: 0 0 8px rgba(34,197,94,0.5);
}

/* ── admin badge in links ── */
.nb-admin-tag {
  font-size: 9px; font-weight: 700; letter-spacing: 0.8px;
  text-transform: uppercase; padding: 1px 5px; border-radius: 4px;
  background: rgba(245,158,11,0.15); color: var(--amber);
  border: 1px solid rgba(245,158,11,0.25);
  margin-left: 5px; vertical-align: middle;
}

/* ── right side ── */
.nb-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

/* login btn */
.nb-login-btn {
  padding: 7px 18px; border-radius: 8px;
  background: var(--green); color: #0D1117;
  font-family: var(--font); font-size: 13px; font-weight: 800;
  border: none; cursor: pointer; transition: all 0.2s;
  text-decoration: none; display: inline-flex; align-items: center;
}
.nb-login-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(34,197,94,0.3); background: #16A34A; }

/* role pill */
.nb-role-pill {
  font-size: 10px; font-weight: 700; letter-spacing: 1px;
  text-transform: uppercase; padding: 3px 9px; border-radius: 20px;
}
.nb-role-pill.admin {
  background: rgba(245,158,11,0.12); color: var(--amber);
  border: 1px solid rgba(245,158,11,0.3);
}
.nb-role-pill.user {
  background: rgba(34,197,94,0.10); color: var(--green);
  border: 1px solid rgba(34,197,94,0.25);
}

/* avatar button */
.nb-avatar-btn {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--green); color: #0D1117;
  font-size: 13px; font-weight: 800;
  border: 2px solid rgba(34,197,94,0.3);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; font-family: var(--font);
  flex-shrink: 0;
}
.nb-avatar-btn:hover { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); transform: scale(1.05); }
.nb-avatar-btn.admin {
  background: var(--amber); color: #0D1117;
  border-color: rgba(245,158,11,0.4);
}
.nb-avatar-btn.admin:hover { box-shadow: 0 0 0 3px rgba(245,158,11,0.2); }

/* dropdown */
.nb-dropdown-wrap { position: relative; }
.nb-dropdown {
  position: absolute; top: calc(100% + 10px); right: 0;
  width: 220px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.5);
  overflow: hidden;
  opacity: 0; transform: translateY(-8px) scale(0.97);
  pointer-events: none;
  transition: all 0.18s ease;
  z-index: 100;
}
.nb-dropdown.open {
  opacity: 1; transform: translateY(0) scale(1);
  pointer-events: all;
}

/* dropdown header */
.nb-dd-header {
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--border);
}
.nb-dd-name {
  font-size: 14px; font-weight: 700; color: var(--text);
  margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.nb-dd-email {
  font-size: 11px; color: var(--muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* dropdown items */
.nb-dd-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; font-size: 13.5px; font-weight: 500;
  color: var(--text); cursor: pointer; text-decoration: none;
  transition: background 0.15s;
  background: none; border: none; width: 100%;
  font-family: var(--font); text-align: left;
}
.nb-dd-item:hover { background: rgba(255,255,255,0.04); }
.nb-dd-item.danger { color: var(--red); }
.nb-dd-item.danger:hover { background: rgba(239,68,68,0.08); }
.nb-dd-item-icon { font-size: 15px; width: 20px; text-align: center; }

.nb-dd-divider { height: 1px; background: var(--border); margin: 2px 0; }

/* admin section label */
.nb-dd-section {
  padding: 8px 16px 4px;
  font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
  text-transform: uppercase; color: var(--amber);
}
`;

// ── nav links config ─────────────────────────────────────────────────────
const USER_LINKS = [
  { label: "Home",             path: "/"              },
  { label: "Arena",            path: "/contests-list" },
  { label: "External Tracker", path: "/contests"      },
  { label: "Problems",         path: "/problems"      },
];

const ADMIN_LINKS = [
  { label: "Home",         path: "/"                  },
  { label: "Arena",        path: "/contests-list"     },
  { label: "Problems",     path: "/problems"          },
  { label: "Dashboard",    path: "/admin/dashboard", admin: true },
  { label: "Manage Users", path: "/admin/users",     admin: true },
];
// ─────────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [role,     setRole]     = useState("user");
  const [open,     setOpen]     = useState(false);
  const dropRef = useRef(null);

  // Re-read localStorage on every route change
  useEffect(() => {
    const token = localStorage.getItem("accessToken"); // ← FIXED: was "refreshToken"
    const name  = localStorage.getItem("username") || "";
    const em    = localStorage.getItem("email")    || "";
    const r     = localStorage.getItem("role")     || "user";

    setLoggedIn(!!token); // ← FIXED: was !!Token (capital T typo)
    setUsername(name);
    setEmail(em);
    setRole(r);
    setOpen(false);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const logout = async () => {
    try {
      // Clear refresh token cookie on server
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore errors — clear locally regardless
    }
    localStorage.clear();
    setLoggedIn(false);
    setOpen(false);
    navigate("/login");
  };

  const isActive = path =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const links = role === "admin" ? ADMIN_LINKS : USER_LINKS;

  return (
    <>
      <style>{CSS}</style>

      <nav className="nb">
        {/* Logo */}
        <Link to="/" className="nb-logo">
          <div className="nb-logo-icon">⚡</div>
          <span className="nb-logo-text">CodeTrack</span>
        </Link>

        {/* Nav links */}
        <div className="nb-links">
          {links.map(({ label, path, admin }) => (
            <Link
              key={path}
              to={path}
              className={`nb-link ${isActive(path) ? "active" : ""}`}
            >
              {label}
              {admin && <span className="nb-admin-tag">Admin</span>}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="nb-right">
          {!loggedIn ? (
            <Link to="/login" className="nb-login-btn">Sign In →</Link>
          ) : (
            <>
              {/* role pill */}
              <span className={`nb-role-pill ${role}`}>
                {role === "admin" ? "⚡ Admin" : "● User"}
              </span>

              {/* avatar + dropdown */}
              <div className="nb-dropdown-wrap" ref={dropRef}>
                <button
                  className={`nb-avatar-btn ${role}`}
                  onClick={() => setOpen(v => !v)}
                  title={username}
                >
                  {username ? username[0].toUpperCase() : "U"}
                </button>

                <div className={`nb-dropdown ${open ? "open" : ""}`}>
                  {/* header */}
                  <div className="nb-dd-header">
                    <div className="nb-dd-name">{username}</div>
                    <div className="nb-dd-email">{email}</div>
                  </div>

                  {/* user actions */}
                  <Link to="/profile" className="nb-dd-item" onClick={() => setOpen(false)}>
                    <span className="nb-dd-item-icon">👤</span> Profile
                  </Link>
                  <Link to="/contests-list" className="nb-dd-item" onClick={() => setOpen(false)}>
                    <span className="nb-dd-item-icon">🏆</span> My Contests
                  </Link>

                  {/* admin-only section */}
                  {role === "admin" && (
                    <>
                      <div className="nb-dd-divider"/>
                      <div className="nb-dd-section">Admin Panel</div>
                      <Link to="/admin/dashboard" className="nb-dd-item" onClick={() => setOpen(false)}>
                        <span className="nb-dd-item-icon">📊</span> Dashboard
                      </Link>
                      <Link to="/admin/users" className="nb-dd-item" onClick={() => setOpen(false)}>
                        <span className="nb-dd-item-icon">👥</span> Manage Users
                      </Link>
                      <Link to="/admin/problems/new" className="nb-dd-item" onClick={() => setOpen(false)}>
                        <span className="nb-dd-item-icon">➕</span> Add Problem
                      </Link>
                      <Link to="/admin/contests/new" className="nb-dd-item" onClick={() => setOpen(false)}>
                        <span className="nb-dd-item-icon">🎯</span> Create Contest
                      </Link>
                    </>
                  )}

                  <div className="nb-dd-divider"/>
                  <button className="nb-dd-item danger" onClick={logout}>
                    <span className="nb-dd-item-icon">🚪</span> Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* spacer so content doesn't hide under fixed navbar */}
      <div className="nb-spacer"/>
    </>
  );
}