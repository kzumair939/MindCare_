import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

export default function Payment() {
  const { sessionId } = useParams(); const nav = useNavigate(); const { user } = useAuth();
  const [processing, setProcessing] = useState(false); const [error, setError] = useState("");
  const [card, setCard] = useState(""); const [expiry, setExpiry] = useState(""); const [cvv, setCvv] = useState("");
  const freeLeft = Math.max(0, 2-(user?.freeSessionsUsed||0));

  async function payFree() {
    try { await api.post(`/payment/free/${sessionId}`); nav("/my-sessions?booked"); }
    catch(e) { setError(e.response?.data?.error||"Failed"); }
  }
  async function handlePay(e) {
    e.preventDefault(); setProcessing(true); setError("");
    try {
      await api.post("/payment/pay", { sessionId:Number(sessionId), paymentMethodId:"pm_card_visa_test", amount:2500 });
      nav("/my-sessions?booked");
    } catch(e) { setError(e.response?.data?.error||"Payment failed"); }
    finally { setProcessing(false); }
  }

  return (
    <AppShell hideFooter={true}>
      <main className="mc-container mc-payment-main">
        <section className="mc-hero"><div><div className="mc-kicker">Payment</div><h1>Complete your booking</h1></div></section>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="mc-payment-grid">
          <div>
            <div className="mc-payment-card">
              <div className="mc-payment-header"><h3><i className="bi bi-calendar2-check me-2"/>Session Summary</h3></div>
              <div className="mc-payment-row"><span>Session ID</span><strong>#{sessionId}</strong></div>
              <div className="mc-payment-row"><span>Free sessions left</span><strong>{freeLeft} / 2</strong></div>
            </div>
            {freeLeft > 0 && <button className="btn btn-success w-100 mt-3" onClick={payFree}><i className="bi bi-gift me-2"/>Use Free Session (No charge)</button>}
          </div>
          <div className="mc-stripe-card">
            <div className="mc-stripe-header"><h3><i className="bi bi-credit-card me-2"/>Secure Payment</h3><span className="mc-stripe-badges"><i className="bi bi-shield-check"/> Stripe</span></div>
            <form onSubmit={handlePay} className="mc-form">
              <div className="mc-card-preview">
                <div className="mc-card-chip"><i className="bi bi-cpu"/></div>
                <div className="mc-card-number">{card||"•••• •••• •••• ••••"}</div>
                <div className="mc-card-footer"><span>{user?.displayName||"Card Holder"}</span><span>{expiry||"MM/YY"}</span></div>
              </div>
              <div className="mc-form-grid mt-3">
                <label className="mc-field span-12"><span>Card Number</span>
                  <div className="mc-input-wrap"><i className="bi bi-credit-card"/>
                    <input type="text" placeholder="4242 4242 4242 4242" maxLength={19} value={card} onChange={e=>setCard(e.target.value.replace(/\D/g,"").replace(/(.{4})/g,"$1 ").trim())}/>
                  </div>
                </label>
                <label className="mc-field"><span>Expiry</span><div className="mc-input-wrap"><i className="bi bi-calendar"/><input type="text" placeholder="MM / YY" maxLength={7} value={expiry} onChange={e=>setExpiry(e.target.value)}/></div></label>
                <label className="mc-field"><span>CVV</span><div className="mc-input-wrap"><i className="bi bi-lock"/><input type="password" placeholder="•••" maxLength={4} value={cvv} onChange={e=>setCvv(e.target.value)}/></div></label>
              </div>
              <button className="btn btn-primary w-100 mt-3 mc-pay-btn" type="submit" disabled={processing}>
                {processing?<><span className="spinner-border spinner-border-sm me-2"/>Processing…</>:<><i className="bi bi-lock-fill me-2"/>Pay $25.00</>}
              </button>
              <p className="mc-stripe-note"><i className="bi bi-shield-check"/> Test mode — use 4242 4242 4242 4242</p>
            </form>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
