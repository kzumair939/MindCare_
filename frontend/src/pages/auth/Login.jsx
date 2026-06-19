import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AppShell from "../../components/layout/AppShell";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username:"", password:"" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const user = await login(form.username, form.password);
      if (user.role === "ROLE_ADMIN") nav("/admin");
      else if (user.role === "ROLE_THERAPIST") nav("/therapist");
      else nav("/dashboard");
    } catch(err) {
      if (err.response?.data?.requiresVerification) {
        const unverifiedEmail = err.response.data.email || "";
        nav(`/verify-otp?email=${encodeURIComponent(unverifiedEmail)}`);
      } else {
        setError(err.response?.data?.error || "Invalid credentials. Please try again.");
      }
    } finally { setLoading(false); }
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
              <h2>Welcome back</h2>
              <p>Continue your mental wellness journey with personalised care and verified therapists.</p>
              <div className="mc-auth-features">
                <div className="mc-auth-feat"><i className="bi bi-shield-check-fill"/><span>End-to-end encrypted</span></div>
                <div className="mc-auth-feat"><i className="bi bi-patch-check-fill"/><span>Verified therapists</span></div>
                <div className="mc-auth-feat"><i className="bi bi-incognito"/><span>Anonymous mode available</span></div>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="mc-auth-form-panel">
            <div className="mc-auth-form-inner">
              <div className="mc-auth-logo-mobile">
                <i className="bi bi-heart-pulse-fill"/> MindCare
              </div>
              <h2 className="mc-auth-title">Sign in</h2>
              <p className="mc-auth-sub">Enter your credentials to access your account.</p>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e", padding: "6px 12px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: "700", width: "fit-content", marginBottom: "18px" }}>
                <i className="bi bi-shield-fill-check"/> End-to-end encrypted
              </div>

              {error && (
                <div className="mc-alert mc-alert-danger mc-alert-animate">
                  <i className="bi bi-exclamation-circle-fill me-2"/>{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mc-form">
                <label className="mc-field">
                  <span>Username or Email</span>
                  <div className="mc-input-wrap">
                    <i className="bi bi-person"/>
                    <input
                      type="text"
                      value={form.username}
                      onChange={e => setForm({...form, username: e.target.value})}
                      required
                      placeholder="Enter username or email"
                      autoComplete="username"
                    />
                  </div>
                </label>

                <label className="mc-field">
                  <span>Password</span>
                  <div className="mc-input-wrap mc-pw-wrap">
                    <i className="bi bi-lock"/>
                    <input
                      type={show ? "text" : "password"}
                      value={form.password}
                      onChange={e => setForm({...form, password: e.target.value})}
                      required
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button type="button" className="mc-pw-eye" tabIndex={-1} onClick={() => setShow(s => !s)}>
                      <i className={`bi bi-eye${show ? "-slash" : ""}`}/>
                    </button>
                  </div>
                </label>

                <Link to="/forgot-password" className="mc-forgot-link">Forgot password?</Link>

                <button className="mc-btn-primary" type="submit" disabled={loading}>
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2"/>Signing in…</>
                    : <><i className="bi bi-box-arrow-in-right me-2"/>Sign in</>
                  }
                </button>
              </form>

              <div className="mc-divider"><span>or continue with</span></div>

              <a className="mc-btn-google" href="/oauth2/authorization/google">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </a>

              <div className="mc-auth-switch">
                Don't have an account? <Link to="/signup">Sign up free</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
