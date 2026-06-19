import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AppShell from "../../components/layout/AppShell";

export default function VerifyOtp() {
  const { verifyOtp, resendOtp } = useAuth();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    if (!email) {
      setError("No email address provided. Please sign up first.");
    }
  }, [email]);

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer(t => t - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await verifyOtp(email, otp);
      setSuccess("Account verified successfully! Redirecting...");
      setTimeout(() => {
        nav("/dashboard");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email || resendTimer > 0) return;
    setError("");
    setSuccess("");
    try {
      await resendOtp(email);
      setSuccess("A new verification code has been sent to your email.");
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend verification code. Please try again.");
    }
  }

  return (
    <AppShell>
      <main className="mc-auth-main">
        <div className="mc-auth-container">
          {/* Left decorative panel */}
          <div className="mc-auth-side">
            <div className="mc-auth-side-orb mc-orb-a"/>
            <div className="mc-auth-side-orb mc-orb-b"/>
            <div className="mc-auth-side-content">
              <div className="mc-auth-brand">
                <i className="bi bi-heart-pulse-fill"/>
                <span>MindCare</span>
              </div>
              <h2>Verify your email</h2>
              <p>We've sent a 6-digit One-Time Password to your email. Enter it to activate your account and start your journey.</p>
              <div className="mc-auth-features">
                <div className="mc-auth-feat"><i className="bi bi-envelope-check-fill"/><span>Secure OTP Verification</span></div>
                <div className="mc-auth-feat"><i className="bi bi-shield-fill-check"/><span>Fully encrypted & private</span></div>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="mc-auth-form-panel">
            <div className="mc-auth-form-inner">
              <div className="mc-auth-logo-mobile">
                <i className="bi bi-heart-pulse-fill"/> MindCare
              </div>
              <h2 className="mc-auth-title">Enter Verification Code</h2>
              <p className="mc-auth-sub">
                Sent to: <strong style={{ color: "var(--color-primary, #4f46e5)" }}>{email || "unknown"}</strong>
              </p>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e", padding: "6px 12px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: "700", width: "fit-content", marginBottom: "18px" }}>
                <i className="bi bi-shield-fill-check"/> End-to-end encrypted
              </div>

              {error && (
                <div className="mc-alert mc-alert-danger mc-alert-animate">
                  <i className="bi bi-exclamation-circle-fill me-2"/>{error}
                </div>
              )}

              {success && (
                <div className="mc-alert mc-alert-success mc-alert-animate" style={{ color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
                  <i className="bi bi-check-circle-fill me-2"/>{success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mc-form">
                <label className="mc-field">
                  <span>6-Digit Code</span>
                  <div className="mc-input-wrap">
                    <i className="bi bi-key"/>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                      required
                      placeholder="e.g. 123456"
                      style={{
                        letterSpacing: "0.5rem",
                        textAlign: "center",
                        fontSize: "1.25rem",
                        fontWeight: "700"
                      }}
                      autoComplete="one-time-code"
                    />
                  </div>
                </label>

                <button className="mc-btn-primary" type="submit" disabled={loading || !email || otp.length !== 6}>
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2"/>Verifying code…</>
                    : <><i className="bi bi-patch-check me-2"/>Verify & Continue</>
                  }
                </button>
              </form>

              <div className="mc-auth-switch" style={{ marginTop: "20px", textAlign: "center" }}>
                Didn't receive the email?{" "}
                {resendTimer > 0 ? (
                  <span style={{ opacity: 0.6 }}>Resend in {resendTimer}s</span>
                ) : (
                  <button
                    onClick={handleResend}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-primary, #4f46e5)",
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: 600,
                      textDecoration: "underline"
                    }}
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <div className="mc-auth-switch" style={{ marginTop: "12px", textAlign: "center" }}>
                <Link to="/login" style={{ fontSize: "0.875rem" }}>Back to Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
