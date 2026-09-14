import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import "../../styles/payment.css";

const THERAPY_LABELS = {
  CBT: "Cognitive Behavioural Therapy (CBT)",
  ACT: "Acceptance & Commitment Therapy (ACT)",
  DBT: "Dialectical Behaviour Therapy (DBT)",
  TRAUMA_FOCUSED: "Trauma-Focused Therapy",
  COUPLES_FAMILY: "Couples & Family Therapy",
  SLEEP_CBT_I: "Sleep Therapy (CBT-I)",
  ADHD_COACHING: "ADHD Coaching & Strategies",
  GENERAL_COUNSELLING: "General Counselling & Wellness"
};

function formatTime(time24) {
  if (!time24) return "—";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function Payment() {
  const { sessionId } = useParams();
  const nav = useNavigate();
  const { user, refreshUser } = useAuth();

  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [freeProcessing, setFreeProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Card Form State
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardBrand, setCardBrand] = useState("VISA");

  // Always calculate real-time free credits from fresh user object
  const freeUsed = Number(user?.freeSessionsUsed || 0);
  const freeLeft = Math.max(0, 2 - freeUsed);

  // Refresh user data & session data on mount
  useEffect(() => {
    let mounted = true;
    
    // Always refresh user data so free credits are 100% accurate
    if (typeof refreshUser === "function") {
      refreshUser().catch(() => {});
    }

    // Fetch session details
    api.get(`/session/${sessionId}`)
      .then(res => {
        if (mounted) {
          setSession(res.data);
          if (user?.displayName && !cardHolder) {
            setCardHolder(user.displayName);
          }
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.response?.data?.error || "Could not load session details");
        }
      })
      .finally(() => {
        if (mounted) setLoadingSession(false);
      });

    return () => { mounted = false; };
  }, [sessionId]);

  // Card formatting handlers
  function handleCardInput(e) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    setCardNumber(formatted);
    if (val.startsWith("5")) setCardBrand("MASTERCARD");
    else if (val.startsWith("3")) setCardBrand("AMEX");
    else setCardBrand("VISA");
  }

  function handleExpiryInput(e) {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setExpiry(val);
  }

  function handleCvvInput(e) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvv(val);
  }

  function fillDemoCard() {
    setCardNumber("4242 4242 4242 4242");
    setCardHolder(user?.displayName || user?.username || "Jane Doe");
    setExpiry("12/28");
    setCvv("888");
    setCardBrand("VISA");
    setError("");
  }

  // Claim Free Session
  async function payFree() {
    if (freeLeft <= 0) {
      setError("No free sessions remaining. Please use card payment.");
      return;
    }
    setError("");
    setFreeProcessing(true);
    try {
      await api.post(`/payment/free/${sessionId}`);
      if (typeof refreshUser === "function") {
        await refreshUser();
      }
      setSuccess(true);
      setTimeout(() => nav("/my-sessions?booked=true"), 1800);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to apply free session credit.");
    } finally {
      setFreeProcessing(false);
    }
  }

  // Process Card Payment
  async function handlePay(e) {
    e.preventDefault();
    if (!cardNumber || cardNumber.replace(/\s/g, "").length < 16) {
      setError("Please enter a valid 16-digit card number.");
      return;
    }
    if (!expiry || expiry.length < 5) {
      setError("Please enter card expiry in MM/YY format.");
      return;
    }
    if (!cvv || cvv.length < 3) {
      setError("Please enter a valid CVV security code.");
      return;
    }

    setProcessing(true);
    setError("");
    try {
      const amount = session?.feeAmount ? Number(session.feeAmount) : 50;
      await api.post("/payment/pay", {
        sessionId: Number(sessionId),
        paymentMethodId: "pm_card_visa_test",
        amount: amount * 100 // in cents
      });
      if (typeof refreshUser === "function") {
        await refreshUser();
      }
      setSuccess(true);
      setTimeout(() => nav("/my-sessions?booked=true"), 1800);
    } catch (e) {
      setError(e.response?.data?.error || "Payment failed. Please verify your card details.");
    } finally {
      setProcessing(false);
    }
  }

  const basePrice = session?.feeAmount || 50;
  const patientDisplayName = user?.displayName || user?.username || "Patient";

  return (
    <AppShell hideFooter={true}>
      <main className="mc-pay-page">
        {/* Top Header */}
        <section className="mc-hero mb-3">
          <div>
            <div className="mc-kicker">
              <i className="bi bi-shield-lock-fill me-1" /> Secure Checkout
            </div>
            <h1>Patient Booking & Payment</h1>
            <p>Review your appointment invoice and confirm your therapy reservation.</p>
          </div>
        </section>

        {error && (
          <div className="mc-alert mc-alert-danger mc-alert-animate mb-3">
            <i className="bi bi-exclamation-triangle-fill me-2" />
            {error}
          </div>
        )}

        {success ? (
          <div className="mc-pay-success-box">
            <div className="mc-pay-success-icon">
              <i className="bi bi-check-lg" />
            </div>
            <h2 className="mb-2" style={{ fontWeight: 800 }}>Booking Confirmed!</h2>
            <p className="text-muted mb-4">
              Your appointment with <strong>{session?.therapistName || "your therapist"}</strong> has been finalized.
              Receipt reference <strong>#MC-BKG-{String(sessionId).padStart(5, "0")}</strong>.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Link to="/my-sessions" className="btn btn-primary px-4 py-2">
                <i className="bi bi-calendar2-check me-2" /> View My Sessions
              </Link>
            </div>
          </div>
        ) : (
          <div className="mc-pay-grid">
            {/* LEFT COLUMN: PATIENT BOOKING RECEIPT */}
            <div className="d-flex flex-column gap-3">
              {/* Free Sessions Benefit Widget */}
              <div className={`mc-pay-credits-banner ${freeLeft === 0 ? "exhausted" : ""}`}>
                <div className="mc-pay-credits-head">
                  <div className="mc-pay-credits-title">
                    <i className={`bi ${freeLeft > 0 ? "bi-gift-fill text-success" : "bi-check2-all text-muted"}`} />
                    <span>Introductory Free Sessions</span>
                  </div>
                  <span className={`mc-pay-credits-badge ${freeLeft > 0 ? "active" : "zero"}`}>
                    {freeLeft} / 2 Available
                  </span>
                </div>

                <div className="mc-pay-credits-steps">
                  <div className={`mc-pay-credit-pill ${freeUsed >= 1 ? "used" : "available"}`}>
                    <i className={`bi ${freeUsed >= 1 ? "bi-check-circle-fill" : "bi-gift"}`} />
                    <span>Free Session 1 {freeUsed >= 1 ? "(Used)" : "(Active)"}</span>
                  </div>
                  <div className={`mc-pay-credit-pill ${freeUsed >= 2 ? "used" : "available"}`}>
                    <i className={`bi ${freeUsed >= 2 ? "bi-check-circle-fill" : "bi-gift"}`} />
                    <span>Free Session 2 {freeUsed >= 2 ? "(Used)" : (freeUsed === 1 ? "(Active)" : "(Available)")}</span>
                  </div>
                </div>

                {freeLeft > 0 ? (
                  <button
                    type="button"
                    className="mc-pay-free-btn mt-1"
                    onClick={payFree}
                    disabled={freeProcessing || processing}
                  >
                    {freeProcessing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Applying Free Credit…
                      </>
                    ) : (
                      <>
                        <i className="bi bi-gift-fill" />
                        Confirm Booking with Free Credit (Pay $0.00)
                      </>
                    )}
                  </button>
                ) : (
                  <div className="text-muted small mt-1 d-flex align-items-center gap-2">
                    <i className="bi bi-info-circle" />
                    <span>Introductory credits redeemed. Standard payment checkout applies below.</span>
                  </div>
                )}
              </div>

              {/* Patient Official Booking Receipt Card */}
              <div className="mc-receipt-card">
                {/* Header */}
                <div className="mc-receipt-header">
                  <div>
                    <div className="mc-receipt-brand">
                      <i className="bi bi-heart-pulse-fill" />
                      <h3 className="mc-receipt-title">Patient Booking Receipt</h3>
                    </div>
                    <span className="mc-receipt-ref">REF #MC-BKG-{String(sessionId).padStart(5, "0")}</span>
                  </div>
                  <span className="mc-receipt-badge">
                    {freeLeft > 0 ? "Credit Eligible" : "Payment Pending"}
                  </span>
                </div>

                <div className="mc-receipt-body">
                  {/* Patient Info Box */}
                  <div className="mc-receipt-patient-box">
                    <div className="mc-receipt-patient-info">
                      <div className="mc-receipt-patient-avatar">
                        {patientDisplayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="mc-receipt-patient-text">
                        <h4>{patientDisplayName}</h4>
                        <p>{user?.email || "Patient ID #PAT-" + (user?.id || "01")}</p>
                      </div>
                    </div>
                    <span className="mc-receipt-verified-chip">
                      <i className="bi bi-shield-check" /> Verified Patient
                    </span>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="mc-receipt-details-table">
                    <div className="mc-receipt-detail-item">
                      <span className="mc-receipt-detail-label">Assigned Clinician</span>
                      <strong className="mc-receipt-detail-value">
                        <i className="bi bi-person-badge text-primary" />
                        {session?.therapistName || "Licensed Clinician"}
                      </strong>
                    </div>

                    <div className="mc-receipt-detail-item">
                      <span className="mc-receipt-detail-label">Clinical Focus</span>
                      <strong className="mc-receipt-detail-value">
                        <i className="bi bi-heart-pulse text-primary" />
                        {THERAPY_LABELS[session?.therapyType] ? THERAPY_LABELS[session?.therapyType].split("(")[0].trim() : (session?.therapyType || "General Therapy")}
                      </strong>
                    </div>

                    <div className="mc-receipt-detail-item">
                      <span className="mc-receipt-detail-label">Appointment Date</span>
                      <strong className="mc-receipt-detail-value">
                        <i className="bi bi-calendar2-event text-primary" />
                        {formatDate(session?.sessionDate)}
                      </strong>
                    </div>

                    <div className="mc-receipt-detail-item">
                      <span className="mc-receipt-detail-label">Appointment Time</span>
                      <strong className="mc-receipt-detail-value">
                        <i className="bi bi-clock text-primary" />
                        {formatTime(session?.sessionTime)} (60 min)
                      </strong>
                    </div>

                    <div className="mc-receipt-detail-item" style={{ gridColumn: "span 2" }}>
                      <span className="mc-receipt-detail-label">Consultation Format</span>
                      <strong className="mc-receipt-detail-value">
                        <i className="bi bi-camera-video text-primary" />
                        {session?.sessionType === "ONLINE" ? "Encrypted Telehealth Video Call (WebRTC)" : "In-Person Clinical Consultation"}
                      </strong>
                    </div>
                  </div>

                  {/* Itemized Charges */}
                  <div className="mc-receipt-charges">
                    <div className="mc-receipt-line">
                      <span>Clinical Consultation (60 Min)</span>
                      <strong>${basePrice}.00</strong>
                    </div>
                    <div className="mc-receipt-line">
                      <span>Encrypted Telehealth Platform Fee</span>
                      <strong className="text-success">FREE ($0.00)</strong>
                    </div>
                    {freeLeft > 0 && (
                      <div className="mc-receipt-line credit-discount">
                        <span><i className="bi bi-gift me-1" /> Introductory Free Session Credit</span>
                        <strong>-${basePrice}.00</strong>
                      </div>
                    )}
                  </div>

                  {/* Total Due */}
                  <div className="mc-receipt-total">
                    <span className="mc-receipt-total-label">Total Amount Due</span>
                    <span className={`mc-receipt-total-amount ${freeLeft > 0 ? "zero" : ""}`}>
                      {freeLeft > 0 ? "$0.00" : `$${basePrice}.00`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Credit Card / Standard Checkout */}
            <div className="mc-pay-card">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="m-0 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                  <i className="bi bi-credit-card-2-front-fill text-primary" /> Standard Card Checkout
                </h3>
                <button
                  type="button"
                  className="mc-pay-demo-btn m-0"
                  onClick={fillDemoCard}
                  title="Fill with test card details"
                >
                  <i className="bi bi-magic" /> Demo Card
                </button>
              </div>

              {/* Interactive Card Preview */}
              <div className="mc-pay-card-preview">
                <div className="mc-pay-card-glow" />
                <div className="mc-pay-card-top">
                  <div className="mc-pay-chip" />
                  <div className="mc-pay-card-brand">
                    <i className="bi bi-cpu me-1" />
                    <span>{cardBrand}</span>
                  </div>
                </div>

                <div className="mc-pay-card-number">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>

                <div className="mc-pay-card-bottom">
                  <div>
                    <span className="mc-pay-card-holder-label">Cardholder</span>
                    <span className="mc-pay-card-holder">{cardHolder || patientDisplayName.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="mc-pay-card-exp-label">Expires</span>
                    <span className="mc-pay-card-exp">{expiry || "MM/YY"}</span>
                  </div>
                </div>
              </div>

              {/* Card Inputs Form */}
              <form onSubmit={handlePay} className="mc-pay-form">
                <div className="mc-pay-field">
                  <label className="mc-pay-label">
                    <span>Cardholder Name</span>
                  </label>
                  <div className="mc-pay-input-wrap">
                    <input
                      type="text"
                      className="mc-pay-input"
                      placeholder="e.g. Jane Doe"
                      value={cardHolder}
                      onChange={e => setCardHolder(e.target.value)}
                      required
                    />
                    <i className="bi bi-person mc-pay-icon" />
                  </div>
                </div>

                <div className="mc-pay-field">
                  <label className="mc-pay-label">
                    <span>Card Number</span>
                    <span className="text-muted small">16 digits</span>
                  </label>
                  <div className="mc-pay-input-wrap">
                    <input
                      type="text"
                      className="mc-pay-input"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={handleCardInput}
                      maxLength={19}
                      required
                    />
                    <i className="bi bi-credit-card mc-pay-icon" />
                  </div>
                </div>

                <div className="mc-pay-row-2col">
                  <div className="mc-pay-field">
                    <label className="mc-pay-label">
                      <span>Expiry Date</span>
                    </label>
                    <div className="mc-pay-input-wrap">
                      <input
                        type="text"
                        className="mc-pay-input"
                        placeholder="MM / YY"
                        value={expiry}
                        onChange={handleExpiryInput}
                        maxLength={5}
                        required
                      />
                      <i className="bi bi-calendar mc-pay-icon" />
                    </div>
                  </div>

                  <div className="mc-pay-field">
                    <label className="mc-pay-label">
                      <span>CVV / CVC</span>
                    </label>
                    <div className="mc-pay-input-wrap">
                      <input
                        type="password"
                        className="mc-pay-input"
                        placeholder="•••"
                        value={cvv}
                        onChange={handleCvvInput}
                        maxLength={4}
                        required
                      />
                      <i className="bi bi-lock mc-pay-icon" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="mc-pay-submit-btn"
                  disabled={processing || freeProcessing}
                >
                  {processing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Authorizing Payment…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-lock-fill" />
                      Pay ${basePrice}.00 & Confirm Booking
                    </>
                  )}
                </button>
              </form>

              {/* Trust Badges */}
              <div className="mc-pay-trust">
                <div className="mc-pay-trust-item">
                  <i className="bi bi-shield-check" /> 256-Bit SSL Encrypted
                </div>
                <div className="mc-pay-trust-item">
                  <i className="bi bi-award" /> Money-Back Guarantee
                </div>
                <div className="mc-pay-trust-item">
                  <i className="bi bi-patch-check" /> Stripe Verified
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
