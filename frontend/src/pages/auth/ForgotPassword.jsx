import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import PublicShell from "../../components/layout/PublicShell";

export default function ForgotPassword() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      setMsg(res.data?.message || "Password reset OTP sent to your email!");
      setTimeout(() => {
        nav(`/reset-password?email=${encodeURIComponent(email.trim())}`);
      }, 1200);
    } catch (e) {
      setErr(e.response?.data?.error || "Unable to send reset code. Please check your email or username.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <main className="mc-auth-main">
        <div className="mc-auth-container">
          {/* Left decorative panel */}
          <div className="mc-auth-side">
            <div className="mc-auth-side-orb mc-orb-a" />
            <div className="mc-auth-side-orb mc-orb-b" />
            <div className="mc-auth-side-content">
              <div className="mc-auth-brand">
                <i className="bi bi-heart-pulse-fill" />
                <span>MindCare</span>
              </div>
              <h2>Account Recovery</h2>
              <p>Forgot your password? No worries! We'll send a secure 6-digit OTP code to verify your identity.</p>
              <div className="mc-auth-features">
                <div className="mc-auth-feat"><i className="bi bi-shield-lock-fill" /><span>Instant 6-Digit OTP Recovery</span></div>
                <div className="mc-auth-feat"><i className="bi bi-patch-check-fill" /><span>Zero-knowledge security</span></div>
                <div className="mc-auth-feat"><i className="bi bi-clock-history" /><span>15-minute secure window</span></div>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="mc-auth-form-panel">
            <div className="mc-auth-form-inner">
              <div className="mc-auth-logo-mobile">
                <i className="bi bi-heart-pulse-fill" /> MindCare
              </div>
              <h2 className="mc-auth-title">Forgot password</h2>
              <p className="mc-auth-sub">Enter your email or username to receive a 6-digit password reset code.</p>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e", padding: "6px 12px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: "700", width: "fit-content", marginBottom: "18px" }}>
                <i className="bi bi-shield-fill-check" /> End-to-end encrypted
              </div>

              {msg && (
                <div className="mc-alert mc-alert-success mc-alert-animate" style={{ color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", marginBottom: "16px" }}>
                  <i className="bi bi-check-circle-fill me-2" />{msg}
                </div>
              )}

              {err && (
                <div className="mc-alert mc-alert-danger mc-alert-animate" style={{ marginBottom: "16px" }}>
                  <i className="bi bi-exclamation-circle-fill me-2" />{err}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mc-form">
                <label className="mc-field">
                  <span>Email or Username</span>
                  <div className="mc-input-wrap">
                    <i className="bi bi-envelope" />
                    <input
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="Enter registered email or username"
                      autoComplete="email"
                    />
                  </div>
                </label>

                <button className="mc-btn-primary" type="submit" disabled={loading || !email.trim()}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Sending OTP Code…</>
                  ) : (
                    <><i className="bi bi-send-fill me-2" />Send Reset Code</>
                  )}
                </button>
              </form>

              <div className="mc-auth-switch" style={{ marginTop: "24px" }}>
                Remember your password? <Link to="/login">Sign in</Link>
              </div>

              <div className="mc-auth-switch" style={{ marginTop: "8px", fontSize: "0.85rem" }}>
                Already have an OTP code? <Link to="/reset-password">Enter Code & Reset</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
