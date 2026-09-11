import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../../api/axios";
import PublicShell from "../../components/layout/PublicShell";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();

  const urlEmail = params.get("email") || "";
  const urlToken = params.get("token") || "";

  const [email, setEmail] = useState(urlEmail);
  const [otp, setOtp] = useState(urlToken.length === 6 ? urlToken : "");
  const [token, setToken] = useState(urlToken.length !== 6 ? urlToken : "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    if (urlEmail && !email) setEmail(urlEmail);
  }, [urlEmail]);

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => setResendTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  // Password strength checks
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[@#$%^&+=!._-]/.test(password);
  const isMatch = password && confirmPassword && password === confirmPassword;
  const isPasswordValid = hasLength && hasUpper && hasNumber && hasSpecial;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isPasswordValid) {
      setError("Password does not meet the security requirements.");
      return;
    }

    setLoading(true);
    try {
      const payload = {};
      if (email.trim() && otp.trim()) {
        payload.email = email.trim();
        payload.otp = otp.trim();
      } else if (token.trim()) {
        payload.token = token.trim();
      } else if (otp.trim()) {
        payload.otp = otp.trim();
      }
      payload.password = password;

      const res = await api.post("/auth/reset-password", payload);
      setSuccess(res.data?.message || "Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        nav("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password. Please verify your OTP code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!email.trim() || resendTimer > 0) return;
    setError("");
    setSuccess("");
    setResendLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      setSuccess(res.data?.message || "A new 6-digit OTP code has been sent!");
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend reset OTP.");
    } finally {
      setResendLoading(false);
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
              <h2>Create New Password</h2>
              <p>Set a strong, secure password to protect your personal mental wellness profile and session history.</p>
              <div className="mc-auth-features">
                <div className="mc-auth-feat"><i className="bi bi-shield-lock-fill" /><span>Strong cryptographic hashing</span></div>
                <div className="mc-auth-feat"><i className="bi bi-key-fill" /><span>One-Time Password verified</span></div>
                <div className="mc-auth-feat"><i className="bi bi-check2-circle" /><span>Instant session reactivation</span></div>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="mc-auth-form-panel">
            <div className="mc-auth-form-inner">
              <div className="mc-auth-logo-mobile">
                <i className="bi bi-heart-pulse-fill" /> MindCare
              </div>
              <h2 className="mc-auth-title">Reset password</h2>
              <p className="mc-auth-sub">Enter the 6-digit OTP sent to your email and your new password.</p>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e", padding: "6px 12px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: "700", width: "fit-content", marginBottom: "18px" }}>
                <i className="bi bi-shield-fill-check" /> End-to-end encrypted
              </div>

              {error && (
                <div className="mc-alert mc-alert-danger mc-alert-animate" style={{ marginBottom: "16px" }}>
                  <i className="bi bi-exclamation-circle-fill me-2" />{error}
                </div>
              )}

              {success && (
                <div className="mc-alert mc-alert-success mc-alert-animate" style={{ color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", marginBottom: "16px" }}>
                  <i className="bi bi-check-circle-fill me-2" />{success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mc-form">
                <label className="mc-field">
                  <span>Registered Email / Username</span>
                  <div className="mc-input-wrap">
                    <i className="bi bi-envelope" />
                    <input
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com or username"
                      autoComplete="username"
                    />
                  </div>
                </label>

                <label className="mc-field">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>6-Digit OTP Code</span>
                    {email.trim() && (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendTimer > 0 || resendLoading}
                        style={{
                          background: "none",
                          border: "none",
                          color: resendTimer > 0 ? "#94a3b8" : "var(--color-primary, #4f46e5)",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: resendTimer > 0 ? "default" : "pointer",
                          padding: 0
                        }}
                      >
                        {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend OTP"}
                      </button>
                    )}
                  </div>
                  <div className="mc-input-wrap">
                    <i className="bi bi-key" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                      required
                      placeholder="e.g. 582914"
                      style={{
                        letterSpacing: "0.4rem",
                        textAlign: "center",
                        fontSize: "1.2rem",
                        fontWeight: "700"
                      }}
                      autoComplete="one-time-code"
                    />
                  </div>
                </label>

                <label className="mc-field">
                  <span>New Password</span>
                  <div className="mc-input-wrap mc-pw-wrap">
                    <i className="bi bi-lock" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="At least 8 chars with uppercase, number & symbol"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="mc-pw-eye"
                      tabIndex={-1}
                      onClick={() => setShowPassword(s => !s)}
                    >
                      <i className={`bi bi-eye${showPassword ? "-slash" : ""}`} />
                    </button>
                  </div>
                </label>

                {/* Password strength checklist */}
                {password && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px",
                    background: "rgba(241,245,249,0.7)",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "0.75rem",
                    marginBottom: "12px",
                    border: "1px solid rgba(226,232,240,0.8)"
                  }}>
                    <span style={{ color: hasLength ? "#16a34a" : "#94a3b8" }}>
                      <i className={`bi bi-${hasLength ? "check-circle-fill" : "circle"} me-1`} /> 8+ Characters
                    </span>
                    <span style={{ color: hasUpper ? "#16a34a" : "#94a3b8" }}>
                      <i className={`bi bi-${hasUpper ? "check-circle-fill" : "circle"} me-1`} /> 1 Uppercase
                    </span>
                    <span style={{ color: hasNumber ? "#16a34a" : "#94a3b8" }}>
                      <i className={`bi bi-${hasNumber ? "check-circle-fill" : "circle"} me-1`} /> 1 Number
                    </span>
                    <span style={{ color: hasSpecial ? "#16a34a" : "#94a3b8" }}>
                      <i className={`bi bi-${hasSpecial ? "check-circle-fill" : "circle"} me-1`} /> 1 Special (@#$!)
                    </span>
                  </div>
                )}

                <label className="mc-field">
                  <span>Confirm New Password</span>
                  <div className="mc-input-wrap mc-pw-wrap">
                    <i className="bi bi-shield-lock" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="mc-pw-eye"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword(s => !s)}
                    >
                      <i className={`bi bi-eye${showConfirmPassword ? "-slash" : ""}`} />
                    </button>
                  </div>
                </label>

                {confirmPassword && (
                  <div style={{ fontSize: "0.78rem", marginTop: "-6px", marginBottom: "14px", color: isMatch ? "#16a34a" : "#dc2626" }}>
                    <i className={`bi bi-${isMatch ? "check-circle-fill" : "x-circle-fill"} me-1`} />
                    {isMatch ? "Passwords match" : "Passwords do not match"}
                  </div>
                )}

                <button
                  className="mc-btn-primary"
                  type="submit"
                  disabled={loading || !email.trim() || otp.length !== 6 || !isPasswordValid || !isMatch}
                >
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Resetting password…</>
                  ) : (
                    <><i className="bi bi-shield-check me-2" />Reset Password</>
                  )}
                </button>
              </form>

              <div className="mc-auth-switch" style={{ marginTop: "24px" }}>
                Remember your credentials? <Link to="/login">Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
