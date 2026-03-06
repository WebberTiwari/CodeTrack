// components/UpgradeModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shows when user hits the 5/day AI review limit.
// Auto-detects Mock Mode from the backend response — no config needed.
//
// Usage:
//   <UpgradeModal
//     open={showUpgrade}
//     onClose={() => setShowUpgrade(false)}
//     resetsAt={resetTime}   // ISO string from API
//   />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const STYLES = `
  @keyframes modalIn { from{opacity:0;transform:scale(0.94) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes countdownPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .um-overlay { position:fixed; inset:0; z-index:2000; background:rgba(0,0,0,0.8);
    backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:20px; }
  .um-modal { width:100%; max-width:440px; background:#161B22; border:1px solid #21262D;
    border-radius:20px; overflow:hidden; box-shadow:0 32px 80px rgba(0,0,0,0.7);
    animation:modalIn 0.22s ease forwards; font-family:'Outfit',sans-serif; }
  .um-header { padding:28px 28px 0; text-align:center; }
  .um-body { padding:20px 28px 28px; }
  .um-btn { display:flex; align-items:center; justify-content:center; gap:8px; width:100%;
    padding:14px; border-radius:12px; font-family:'Outfit',sans-serif; font-size:15px;
    font-weight:700; cursor:pointer; transition:all 0.2s; border:none; }
  .um-btn-primary { background:#22C55E; color:#0D1117; }
  .um-btn-primary:hover:not(:disabled) { background:#16A34A; transform:translateY(-2px); box-shadow:0 8px 24px rgba(34,197,94,0.35); }
  .um-btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
  .um-btn-secondary { background:transparent; color:#64748B; border:1px solid #21262D; margin-top:10px; }
  .um-btn-secondary:hover { border-color:#22C55E; color:#22C55E; }

  /* Mock checkout panel (inline, below CTA) */
  .um-mock-panel { background:#0D1117; border:1px solid rgba(245,158,11,0.25); border-radius:14px;
    padding:18px; margin-top:16px; }
  .um-mock-input { width:100%; background:#161B22; border:1px solid #21262D; border-radius:9px;
    padding:10px 12px; color:#E2E8F0; font-family:'JetBrains Mono',monospace; font-size:13px;
    outline:none; transition:border-color 0.2s; margin-bottom:10px; }
  .um-mock-input:focus { border-color:rgba(34,197,94,0.4); }
  .um-mock-input::placeholder { color:#64748B; }
  .um-mock-row { display:flex; gap:8px; }
  .um-spinner { width:16px; height:16px; border:2px solid rgba(13,17,23,0.3);
    border-top-color:#0D1117; border-radius:50%; animation:spin 0.7s linear infinite; }
`;

function useCountdown(resetsAt) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!resetsAt) return;
    const tick = () => {
      const ms = new Date(resetsAt) - Date.now();
      if (ms <= 0) { setTimeLeft("00:00:00"); return; }
      const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
      const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
      setTimeLeft(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [resetsAt]);
  return timeLeft;
}

export default function UpgradeModal({ open, onClose, resetsAt, used = 5, limit = 5 }) {
  const navigate  = useNavigate();
  const countdown = useCountdown(resetsAt);
  const [paying,      setPaying]      = useState(false);
  const [showMock,    setShowMock]    = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);

  // Mock card fields
  const [card,   setCard]   = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv,    setCvv]    = useState("123");

  const formatCard = (v) => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const formatExp  = (v) => { const d=v.replace(/\D/g,"").slice(0,4); return d.length>2?`${d.slice(0,2)}/${d.slice(2)}`:d; };

  const handleUpgrade = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) { navigate("/login"); return; }

    setPaying(true);
    try {
      const res = await API.post("/payment/create-order", { planId: "pro_monthly" });
      const { mock, orderId, amount, planId, keyId } = res.data;

      if (mock) {
        // Mock Mode: show inline card form
        setPendingOrder({ orderId, amount, planId });
        setPaying(false);
        setShowMock(true);
        return;
      }

      // Real Razorpay flow
      const options = {
        key:         keyId,
        amount,
        currency:    "INR",
        name:        "CodeArena Pro",
        description: "Pro Monthly — Unlimited AI Reviews",
        order_id:    orderId,
        prefill: { email: localStorage.getItem("email") || "" },
        theme: { color: "#22C55E" },
        handler: async (response) => {
          try {
            await API.post("/payment/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              planId: "pro_monthly",
            });
            onClose();
            alert("🎉 Pro activated! You now have unlimited AI reviews.");
          } catch {
            alert("Payment received but activation failed. Please contact support.");
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => { alert("Payment failed. Please try again."); setPaying(false); });
      rzp.open();
    } catch {
      alert("Couldn't open checkout. Please try again.");
      setPaying(false);
    }
  }, [navigate, onClose]);

  const handleMockPay = async () => {
    if (!pendingOrder) return;
    setPaying(true);
    try {
      await API.post("/payment/verify", {
        razorpay_order_id: pendingOrder.orderId,
        planId:            pendingOrder.planId,
      });
      setShowMock(false);
      setPendingOrder(null);
      onClose();
      alert("🎉 Pro activated! (Mock Mode — no real charge)");
    } catch {
      alert("Activation failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (!open) return null;

  const pct = Math.round((used / limit) * 100);

  return (
    <>
      <style>{STYLES}</style>
      <div className="um-overlay" onClick={onClose}>
        <div className="um-modal" onClick={e => e.stopPropagation()}>

          <div style={{ height:3, background:"linear-gradient(90deg,#22C55E,#00B4D8)" }}/>

          <div className="um-header">
            <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(239,68,68,0.1)", border:"2px solid rgba(239,68,68,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 16px" }}>
              🔒
            </div>
            <h2 style={{ fontSize:20, fontWeight:800, color:"#fff", marginBottom:8 }}>
              Daily AI limit reached
            </h2>
            <p style={{ fontSize:14, color:"#64748B", lineHeight:1.6 }}>
              You've used all <strong style={{ color:"#fff" }}>{used}/{limit}</strong> free AI code reviews for today.
            </p>
          </div>

          <div className="um-body">
            {/* Usage bar */}
            <div style={{ background:"#1C2333", borderRadius:12, padding:"14px 16px", marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <span style={{ fontSize:12, color:"#64748B" }}>Today's usage</span>
                <span style={{ fontSize:12, fontFamily:"'JetBrains Mono',monospace", color:"#EF4444", fontWeight:700 }}>{used}/{limit}</span>
              </div>
              <div style={{ height:6, borderRadius:99, background:"#21262D" }}>
                <div style={{ height:"100%", width:`${pct}%`, borderRadius:99, background:"linear-gradient(90deg,#F59E0B,#EF4444)" }}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
                <span style={{ fontSize:11, color:"#64748B" }}>Resets in</span>
                <span style={{ fontSize:12, fontFamily:"'JetBrains Mono',monospace", color:"#F59E0B", fontWeight:700, animation:"countdownPulse 1s infinite" }}>
                  {countdown || "calculating…"}
                </span>
              </div>
            </div>

            {/* Pro benefits */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>
                What you get with Pro
              </div>
              {[
                { icon:"✨", text:"Unlimited AI code reviews every day" },
                { icon:"⚡", text:"Priority AI responses (faster)" },
                { icon:"💎", text:"Pro badge on your profile" },
                { icon:"🏆", text:"Access to all private contests" },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid rgba(33,38,45,0.6)" }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
                  <span style={{ fontSize:13, color:"#E2E8F0" }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Price */}
            <div style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"#22C55E" }}>Pro Monthly</div>
                <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>Cancel anytime</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:22, fontWeight:900, color:"#fff", lineHeight:1 }}>₹99</div>
                <div style={{ fontSize:11, color:"#64748B" }}>/month</div>
              </div>
            </div>

            {/* CTA */}
            {!showMock ? (
              <button className="um-btn um-btn-primary" onClick={handleUpgrade} disabled={paying}>
                {paying ? <><div className="um-spinner"/> Opening checkout…</> : "⚡ Upgrade to Pro — ₹99/mo"}
              </button>
            ) : (
              /* ── Inline Mock Checkout ── */
              <div className="um-mock-panel">
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
                  <span style={{ fontSize:12 }}>🧪</span>
                  <span style={{ fontSize:12, fontWeight:700, color:"#F59E0B" }}>TEST MODE — no real charge</span>
                </div>
                <input className="um-mock-input" placeholder="Card number" value={card} onChange={e => setCard(formatCard(e.target.value))} />
                <div className="um-mock-row">
                  <input className="um-mock-input" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(formatExp(e.target.value))} style={{ flex:1 }}/>
                  <input className="um-mock-input" placeholder="CVV" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,"").slice(0,3))} style={{ flex:1 }}/>
                </div>
                <button className="um-btn um-btn-primary" style={{ marginTop:4 }} onClick={handleMockPay} disabled={paying}>
                  {paying ? <><div className="um-spinner"/> Activating…</> : "🔒 Pay ₹99 & Activate Pro"}
                </button>
                <button className="um-btn um-btn-secondary" style={{ marginTop:8, fontSize:13 }} onClick={() => setShowMock(false)}>
                  ← Back
                </button>
              </div>
            )}

            <button className="um-btn um-btn-secondary" onClick={() => { onClose(); navigate("/pricing"); }}>
              See all plans
            </button>

            <button className="um-btn um-btn-secondary" onClick={onClose} style={{ marginTop:6, fontSize:13 }}>
              Wait for daily reset ({countdown})
            </button>
          </div>
        </div>
      </div>
    </>
  );
}