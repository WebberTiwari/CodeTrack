// pages/PricingPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:#0D1117; --surface:#161B22; --surface2:#1C2333; --border:#21262D;
    --green:#22C55E; --cyan:#00B4D8; --amber:#F59E0B; --red:#EF4444;
    --purple:#8B5CF6; --text:#E2E8F0; --muted:#64748B;
    --font:'Outfit',sans-serif; --mono:'JetBrains Mono',monospace;
  }
  .pp-page { min-height:100vh; background:var(--bg); color:var(--text); font-family:var(--font); }
  .pp-grid { position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image:linear-gradient(rgba(34,197,94,0.025) 1px,transparent 1px),
                     linear-gradient(90deg,rgba(34,197,94,0.025) 1px,transparent 1px);
    background-size:48px 48px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glowPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
  @keyframes modalIn { from{opacity:0;transform:scale(0.94) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .pp-fade { opacity:0; animation:fadeUp 0.5s ease forwards; }
  .pp-card { background:var(--surface); border:1px solid var(--border); border-radius:20px;
    position:relative; overflow:hidden; transition:all 0.3s; }
  .pp-card:hover { transform:translateY(-6px); }
  .pp-card.featured { border-color:rgba(34,197,94,0.5);
    box-shadow:0 0 40px rgba(34,197,94,0.12), 0 20px 60px rgba(0,0,0,0.4); }
  .pp-card.featured::before { content:''; position:absolute; top:0; left:10%; right:10%; height:2px;
    background:linear-gradient(90deg,transparent,#22C55E,transparent); animation:glowPulse 2s infinite; }
  .pp-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px;
    border-radius:12px; font-family:var(--font); font-weight:700; cursor:pointer;
    transition:all 0.2s; border:none; text-decoration:none; }
  .pp-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none !important; }
  .pp-btn-primary { background:var(--green); color:#0D1117; }
  .pp-btn-primary:hover:not(:disabled) { background:#16A34A; transform:translateY(-2px);
    box-shadow:0 8px 24px rgba(34,197,94,0.35); }
  .pp-btn-outline { background:transparent; color:var(--text); border:1px solid var(--border); }
  .pp-btn-outline:hover:not(:disabled) { border-color:var(--green); color:var(--green); }
  .pp-badge { display:inline-flex; align-items:center; gap:5px; border-radius:20px; padding:4px 14px;
    font-size:12px; font-weight:700; letter-spacing:0.5px; }
  .pp-toggle { display:flex; background:var(--surface2); border:1px solid var(--border); border-radius:10px; padding:3px; }
  .pp-toggle-btn { padding:8px 20px; border-radius:8px; border:none; font-family:var(--font);
    font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; }
  .pp-toggle-btn.active { background:var(--green); color:#0D1117; }
  .pp-toggle-btn:not(.active) { background:transparent; color:var(--muted); }
  .pp-feature-row { display:flex; align-items:center; gap:10px; padding:10px 0;
    border-bottom:1px solid rgba(33,38,45,0.6); font-size:14px; color:var(--text); }
  .pp-feature-row:last-child { border-bottom:none; }
  .pp-quota-bar { height:6px; border-radius:99px; background:var(--border); overflow:hidden; margin-top:6px; }
  .pp-quota-fill { height:100%; border-radius:99px; transition:width 1s ease; }

  /* ── Mock Checkout Modal ── */
  .mock-overlay { position:fixed; inset:0; z-index:3000; background:rgba(0,0,0,0.85);
    backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; padding:20px; }
  .mock-modal { width:100%; max-width:420px; background:#161B22; border:1px solid #21262D;
    border-radius:20px; overflow:hidden; box-shadow:0 32px 80px rgba(0,0,0,0.8);
    animation:modalIn 0.22s ease forwards; font-family:'Outfit',sans-serif; }
  .mock-header { background:linear-gradient(135deg,#0f2027,#1a3a2a); padding:24px 28px 20px;
    border-bottom:1px solid #21262D; }
  .mock-body { padding:24px 28px 28px; }
  .mock-input { width:100%; background:#0D1117; border:1px solid #21262D; border-radius:10px;
    padding:12px 14px; color:#E2E8F0; font-family:'JetBrains Mono',monospace; font-size:14px;
    outline:none; transition:border-color 0.2s; }
  .mock-input:focus { border-color:rgba(34,197,94,0.5); }
  .mock-input::placeholder { color:#64748B; }
  .mock-row { display:flex; gap:12px; }
  .mock-pay-btn { width:100%; padding:15px; background:#22C55E; color:#0D1117; border:none;
    border-radius:12px; font-family:'Outfit',sans-serif; font-size:15px; font-weight:800;
    cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px; }
  .mock-pay-btn:hover:not(:disabled) { background:#16A34A; transform:translateY(-2px); box-shadow:0 8px 24px rgba(34,197,94,0.4); }
  .mock-pay-btn:disabled { opacity:0.6; cursor:not-allowed; }
  .mock-spinner { width:18px; height:18px; border:2px solid rgba(13,17,23,0.3);
    border-top-color:#0D1117; border-radius:50%; animation:spin 0.7s linear infinite; }
`;

const FEATURES = [
  { label: "Problem solving",          free: "Unlimited",  pro: "Unlimited"  },
  { label: "Submissions/day",          free: "Unlimited",  pro: "Unlimited"  },
  { label: "Contest participation",    free: "Public",     pro: "All"        },
  { label: "AI code reviews/day",      free: "5",          pro: "Unlimited ✨" },
  { label: "Detailed AI feedback",     free: true,         pro: true         },
  { label: "Activity heatmap",         free: true,         pro: true         },
  { label: "Submission history",       free: true,         pro: true         },
  { label: "Priority AI responses",    free: false,        pro: true         },
  { label: "Pro badge on profile",     free: false,        pro: true         },
  { label: "Private contest access",   free: false,        pro: true         },
];

// ── Mock Checkout Modal ────────────────────────────────────────────────────────
function MockCheckoutModal({ open, onClose, onPay, amount, planLabel, paying }) {
  const [card,   setCard]   = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv,    setCvv]    = useState("123");
  const [name,   setName]   = useState("Test User");

  const formatCard = (v) => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const formatExp  = (v) => { const d=v.replace(/\D/g,"").slice(0,4); return d.length>2?`${d.slice(0,2)}/${d.slice(2)}`:d; };

  if (!open) return null;

  return (
    <>
      <div className="mock-overlay" onClick={onClose}>
        <div className="mock-modal" onClick={e => e.stopPropagation()}>

          {/* Top accent */}
          <div style={{ height:3, background:"linear-gradient(90deg,#22C55E,#00B4D8)" }}/>

          {/* Header */}
          <div className="mock-header">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:8, background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>💎</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:"#fff" }}>CodeArena Pro</div>
                  <div style={{ fontSize:12, color:"#64748B" }}>{planLabel}</div>
                </div>
              </div>
              <button onClick={onClose} style={{ background:"none", border:"none", color:"#64748B", cursor:"pointer", fontSize:20, lineHeight:1 }}>✕</button>
            </div>

            <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
              <span style={{ fontSize:32, fontWeight:900, color:"#22C55E" }}>₹{amount / 100}</span>
              <span style={{ fontSize:13, color:"#64748B" }}>due today</span>
            </div>

            {/* Mock Mode badge */}
            <div style={{ marginTop:10, display:"inline-flex", alignItems:"center", gap:6, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:6, padding:"4px 10px" }}>
              <span style={{ fontSize:11 }}>🧪</span>
              <span style={{ fontSize:11, fontWeight:700, color:"#F59E0B", letterSpacing:"0.5px" }}>TEST MODE — no real charge</span>
            </div>
          </div>

          {/* Body */}
          <div className="mock-body">
            <div style={{ fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"1px", marginBottom:14 }}>Card Details</div>

            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
              <input
                className="mock-input"
                placeholder="Card number"
                value={card}
                onChange={e => setCard(formatCard(e.target.value))}
              />
              <input
                className="mock-input"
                placeholder="Cardholder name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <div className="mock-row">
                <input
                  className="mock-input"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={e => setExpiry(formatExp(e.target.value))}
                  style={{ flex:1 }}
                />
                <input
                  className="mock-input"
                  placeholder="CVV"
                  value={cvv}
                  onChange={e => setCvv(e.target.value.replace(/\D/g,"").slice(0,3))}
                  style={{ flex:1 }}
                />
              </div>
            </div>

            <button className="mock-pay-btn" onClick={onPay} disabled={paying}>
              {paying
                ? <><div className="mock-spinner"/> Processing…</>
                : <>🔒 Pay ₹{amount / 100} & Activate Pro</>
              }
            </button>

            <div style={{ textAlign:"center", marginTop:14, fontSize:12, color:"#64748B" }}>
              🧪 This is a demo — clicking Pay activates Pro instantly with no real charge
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const navigate  = useNavigate();
  const [billing, setBilling]   = useState("monthly");
  const [status,  setStatus]    = useState(null);
  const [loading, setLoading]   = useState(true);
  const [paying,  setPaying]    = useState(false);
  const [mockModal, setMockModal]     = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null); // { orderId, amount, planId, planLabel }
  const userId = localStorage.getItem("userId");

  useEffect(() => { loadStatus(); }, []);

  const loadStatus = async () => {
    try {
      const res = await API.get("/payment/status");
      setStatus(res.data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const planId    = billing === "monthly" ? "pro_monthly" : "pro_yearly";
  const price     = billing === "monthly" ? 99 : 999;
  const perMonth  = billing === "yearly"  ? Math.round(999 / 12) : 99;
  const saving    = billing === "yearly"  ? Math.round(((99 * 12 - 999) / (99 * 12)) * 100) : 0;
  const isPro     = status?.isPro;
  const isMock    = status?.mock;
  const aiUsed    = status?.ai?.used ?? 0;
  const aiLimit   = status?.ai?.limit ?? 5;

  // ── Handle upgrade — branches on mock flag from backend ───────────────────
  const handleUpgrade = async () => {
    if (!userId) { navigate("/login"); return; }
    setPaying(true);
    try {
      const res = await API.post("/payment/create-order", { planId });
      const { mock, orderId, amount, planId: pid } = res.data;

      if (mock) {
        // Mock Mode: show fake checkout modal
        setPendingOrder({ orderId, amount, planId: pid, planLabel: billing === "monthly" ? "Pro Monthly — ₹99/mo" : "Pro Yearly — ₹999/yr" });
        setPaying(false);
        setMockModal(true);
        return;
      }

      // Real Razorpay flow
      const { keyId } = res.data;
      const options = {
        key:         keyId,
        amount,
        currency:    "INR",
        name:        "CodeArena Pro",
        description: billing === "monthly" ? "Pro Monthly — ₹99/mo" : "Pro Yearly — ₹999/yr",
        order_id:    orderId,
        prefill: {
          name:  localStorage.getItem("username") || "",
          email: localStorage.getItem("email")    || "",
        },
        theme: { color: "#22C55E" },
        handler: async (response) => {
          try {
            await API.post("/payment/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              planId,
            });
            await loadStatus();
            alert("🎉 Pro plan activated! Enjoy unlimited AI reviews.");
          } catch {
            alert("Payment verified but activation failed. Please contact support.");
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => { alert("Payment failed. Please try again."); setPaying(false); });
      rzp.open();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to initiate payment. Try again.");
      setPaying(false);
    }
  };

  // ── Mock pay button handler ───────────────────────────────────────────────
  const handleMockPay = async () => {
    if (!pendingOrder) return;
    setPaying(true);
    try {
      await API.post("/payment/verify", {
        razorpay_order_id: pendingOrder.orderId,
        planId:            pendingOrder.planId,
      });
      setMockModal(false);
      setPendingOrder(null);
      await loadStatus();
      alert("🎉 Pro activated! (Mock Mode — no real charge)");
    } catch {
      alert("Activation failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      {/* Only load Razorpay SDK in real mode */}
      {!isMock && <script src="https://checkout.razorpay.com/v1/checkout.js" async/>}

      {/* Mock checkout modal */}
      <MockCheckoutModal
        open={mockModal}
        onClose={() => { setMockModal(false); setPaying(false); }}
        onPay={handleMockPay}
        amount={pendingOrder?.amount ?? 9900}
        planLabel={pendingOrder?.planLabel ?? ""}
        paying={paying}
      />

      <div className="pp-page">
        <div className="pp-grid"/>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"56px 24px", position:"relative", zIndex:1 }}>

          {/* ── Header ── */}
          <div className="pp-fade" style={{ textAlign:"center", marginBottom:48, animationDelay:"0s" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20 }}>
              <div className="pp-badge" style={{ background:"rgba(34,197,94,0.1)", color:"var(--green)", border:"1px solid rgba(34,197,94,0.25)", fontSize:13 }}>
                ✨ Simple Pricing
              </div>
              {isMock && (
                <div className="pp-badge" style={{ background:"rgba(245,158,11,0.1)", color:"var(--amber)", border:"1px solid rgba(245,158,11,0.3)", fontSize:12 }}>
                  🧪 Test Mode
                </div>
              )}
            </div>
            <h1 style={{ fontSize:"clamp(32px,5vw,52px)", fontWeight:900, color:"#fff", lineHeight:1.1, marginBottom:16, letterSpacing:"-1px" }}>
              Supercharge your<br/>
              <span style={{ background:"linear-gradient(90deg,#22C55E,#00B4D8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                coding with AI
              </span>
            </h1>
            <p style={{ fontSize:17, color:"var(--muted)", maxWidth:480, margin:"0 auto 32px" }}>
              Free tier gives you 5 AI reviews per day. Upgrade to Pro for unlimited access.
            </p>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
              <div className="pp-toggle">
                <button className={`pp-toggle-btn ${billing==="monthly"?"active":""}`} onClick={()=>setBilling("monthly")}>Monthly</button>
                <button className={`pp-toggle-btn ${billing==="yearly"?"active":""}`} onClick={()=>setBilling("yearly")}>Yearly</button>
              </div>
              {billing==="yearly" && (
                <span className="pp-badge" style={{ background:"rgba(245,158,11,0.12)", color:"var(--amber)", border:"1px solid rgba(245,158,11,0.3)" }}>
                  Save {saving}%
                </span>
              )}
            </div>
          </div>

          {/* ── Current plan banner ── */}
          {!loading && status && (
            <div className="pp-fade" style={{ marginBottom:32, animationDelay:"0.1s" }}>
              <div style={{ background:isPro?"rgba(34,197,94,0.06)":"rgba(100,116,139,0.06)", border:`1px solid ${isPro?"rgba(34,197,94,0.2)":"var(--border)"}`, borderRadius:14, padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:20 }}>{isPro?"💎":"⚡"}</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color: isPro?"var(--green)":"var(--text)" }}>
                      {isPro ? "You're on Pro 🎉" : "You're on Free"}
                      {isPro && isMock && <span style={{ marginLeft:8, fontSize:11, color:"var(--amber)", fontWeight:600 }}>(Mock)</span>}
                    </div>
                    <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>
                      {isPro
                        ? `Pro expires ${new Date(status.planExpiry).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}`
                        : `${aiUsed}/${aiLimit} AI reviews used today`
                      }
                    </div>
                    {!isPro && (
                      <div className="pp-quota-bar" style={{ width:160, marginTop:8 }}>
                        <div className="pp-quota-fill" style={{ width:`${Math.min(100,(aiUsed/aiLimit)*100)}%`, background:aiUsed>=aiLimit?"var(--red)":aiUsed>=3?"var(--amber)":"var(--green)" }}/>
                      </div>
                    )}
                  </div>
                </div>
                {!isPro && <span style={{ fontSize:12, color:"var(--muted)" }}>Resets daily at midnight</span>}
              </div>
            </div>
          )}

          {/* ── Pricing cards ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:24, marginBottom:64 }}>

            {/* FREE CARD */}
            <div className="pp-card pp-fade" style={{ padding:32, animationDelay:"0.15s" }}>
              <div style={{ marginBottom:28 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:12 }}>Free</div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:6, marginBottom:8 }}>
                  <span style={{ fontSize:44, fontWeight:900, color:"#fff", lineHeight:1 }}>₹0</span>
                  <span style={{ fontSize:14, color:"var(--muted)", paddingBottom:6 }}>/forever</span>
                </div>
                <p style={{ fontSize:14, color:"var(--muted)", lineHeight:1.6 }}>Everything you need to get started with competitive programming.</p>
              </div>
              <div style={{ marginBottom:28, display:"flex", flexDirection:"column", gap:0 }}>
                {["Unlimited problem solving","Unlimited submissions","5 AI code reviews / day","Activity heatmap & stats","Public contest access"].map(f => (
                  <div key={f} className="pp-feature-row">
                    <span style={{ color:"var(--green)", fontWeight:700 }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <button className="pp-btn pp-btn-outline" style={{ width:"100%", padding:"13px", fontSize:14 }} onClick={() => navigate("/problems")}>
                Start for free
              </button>
            </div>

            {/* PRO CARD */}
            <div className="pp-card featured pp-fade" style={{ padding:32, animationDelay:"0.22s" }}>
              <div style={{ position:"absolute", top:-1, right:28 }}>
                <div style={{ background:"var(--green)", color:"#0D1117", fontSize:11, fontWeight:800, padding:"5px 16px", borderRadius:"0 0 10px 10px", letterSpacing:"0.5px" }}>
                  MOST POPULAR
                </div>
              </div>
              <div style={{ marginBottom:28 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--green)", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:12 }}>Pro 💎</div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:6, marginBottom:4 }}>
                  <span style={{ fontSize:44, fontWeight:900, color:"#fff", lineHeight:1 }}>₹{perMonth}</span>
                  <span style={{ fontSize:14, color:"var(--muted)", paddingBottom:6 }}>/month</span>
                </div>
                {billing==="yearly" && (
                  <div style={{ fontSize:13, color:"var(--amber)", fontWeight:600, marginBottom:8 }}>
                    Billed ₹999/year — save ₹{(99*12)-999}
                  </div>
                )}
                <p style={{ fontSize:14, color:"var(--muted)", lineHeight:1.6 }}>Unlimited AI-powered code reviews and all premium features.</p>
              </div>
              <div style={{ marginBottom:28, display:"flex", flexDirection:"column", gap:0 }}>
                {["Everything in Free","Unlimited AI reviews/day ✨","Priority AI responses","Pro badge on profile","All contests (public + private)","Early access to new features"].map(f => (
                  <div key={f} className="pp-feature-row">
                    <span style={{ color:"var(--green)", fontWeight:700 }}>✓</span>
                    <span style={{ color: f.includes("✨") ? "var(--green)" : "var(--text)", fontWeight: f.includes("✨") ? 600 : 400 }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                className="pp-btn pp-btn-primary"
                style={{ width:"100%", padding:"13px", fontSize:15 }}
                onClick={handleUpgrade}
                disabled={isPro || paying}
              >
                {isPro ? "✓ Already Pro" : paying ? "Opening checkout…" : `Upgrade to Pro — ₹${price}/${billing === "monthly" ? "mo" : "yr"}`}
              </button>

              {!isPro && (
                <p style={{ textAlign:"center", fontSize:12, color:"var(--muted)", marginTop:10 }}>
                  {isMock ? "🧪 Demo mode — no real charge" : "Secure payment via Razorpay · Cancel anytime"}
                </p>
              )}
            </div>
          </div>

          {/* ── Feature comparison ── */}
          <div className="pp-fade" style={{ animationDelay:"0.3s" }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:24, textAlign:"center" }}>Full Feature Comparison</h2>
            <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"var(--surface2)" }}>
                    <th style={{ padding:"14px 20px", textAlign:"left", fontSize:12, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", borderBottom:"1px solid var(--border)" }}>Feature</th>
                    <th style={{ padding:"14px 20px", textAlign:"center", fontSize:12, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", borderBottom:"1px solid var(--border)", width:100 }}>Free</th>
                    <th style={{ padding:"14px 20px", textAlign:"center", fontSize:12, fontWeight:700, color:"var(--green)", textTransform:"uppercase", letterSpacing:"1px", borderBottom:"1px solid var(--border)", width:100 }}>Pro 💎</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((f, i) => (
                    <tr key={f.label} style={{ borderBottom: i < FEATURES.length-1 ? "1px solid var(--border)" : "none", transition:"background 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(34,197,94,0.03)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"13px 20px", fontSize:14, color:"var(--text)" }}>{f.label}</td>
                      <td style={{ padding:"13px 20px", textAlign:"center" }}>
                        {typeof f.free === "boolean"
                          ? <span style={{ fontSize:16 }}>{f.free ? "✅" : "❌"}</span>
                          : <span style={{ fontSize:13, fontFamily:"var(--mono)", color:"var(--muted)" }}>{f.free}</span>}
                      </td>
                      <td style={{ padding:"13px 20px", textAlign:"center" }}>
                        {typeof f.pro === "boolean"
                          ? <span style={{ fontSize:16 }}>{f.pro ? "✅" : "❌"}</span>
                          : <span style={{ fontSize:13, fontFamily:"var(--mono)", color:"var(--green)", fontWeight:600 }}>{f.pro}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── FAQ ── */}
          <div className="pp-fade" style={{ marginTop:56, animationDelay:"0.38s" }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:28, textAlign:"center" }}>FAQ</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
              {[
                { q:"When do free AI reviews reset?", a:"Every day at midnight (IST). You get a fresh 5 reviews every day automatically." },
                { q:"What happens if I hit the daily limit?", a:"You'll see an upgrade prompt. Your code editor still works — only the AI review button is paused." },
                { q:"Can I cancel my Pro subscription?", a:"Yes, anytime. Your Pro access continues until the end of your billing period." },
                { q:"Is payment secure?", a:"Yes. We use Razorpay — India's most trusted payment gateway. We never store card details." },
              ].map(({ q, a }) => (
                <div key={q} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:20 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:8 }}>{q}</div>
                  <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>{a}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}