import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AppShell from "../../components/layout/AppShell";

export default function Signup() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username:"", email:"", password:"" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function passwordStrength(p) {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  }
  const strength = passwordStrength(form.password);
  const strengthLabel = ["","Weak","Fair","Good","Strong"][strength];
  const strengthClass = ["","weak","fair","good","strong"][strength];

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      nav(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch(err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <AppShell>
      <main className="mc-auth-main">
        <div className="mc-auth-container">
          <div className="mc-auth-side">
            <div className="mc-auth-side-orb mc-orb-a"/>
            <div className="mc-auth-side-orb mc-orb-b"/>
            <div className="mc-auth-side-content">
              <div className="mc-auth-brand">
                <i className="bi bi-heart-pulse-fill"/>
                <span>MindCare</span>
              </div>
              <h2>Start your wellness journey</h2>
              <p>Join thousands of people improving their mental health with personalised, private support.</p>
              <div className="mc-auth-features">
                <div className="mc-auth-feat"><i className="bi bi-gift-fill"/><span>2 free sessions included</span></div>
                <div className="mc-auth-feat"><i className="bi bi-shield-lock-fill"/><span>Fully encrypted & private</span></div>
                <div className="mc-auth-feat"><i className="bi bi-people-fill"/><span>Join peer support groups</span></div>
                <div className="mc-auth-feat"><i className="bi bi-stars"/><span>AI-matched therapists</span></div>
              </div>
            </div>
          </div>

          <div className="mc-auth-form-panel">
            <div className="mc-auth-form-inner">
              <div className="mc-auth-logo-mobile">
                <i className="bi bi-heart-pulse-fill"/> MindCare
              </div>
              <h2 className="mc-auth-title">Create account</h2>
              <p className="mc-auth-sub">First 2 sessions free. No credit card required.</p>

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
                  <span>Username</span>
                  <div className="mc-input-wrap">
                    <i className="bi bi-person"/>
                    <input
                      type="text"
                      value={form.username}
                      onChange={e => setForm({...form, username: e.target.value})}
                      required
                      placeholder="Choose a username"
                      autoComplete="username"
                    />
                  </div>
                </label>

                <label className="mc-field">
                  <span>Email Address</span>
                  <div className="mc-input-wrap">
                    <i className="bi bi-envelope"/>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                      required
                      placeholder="you@email.com"
                      autoComplete="email"
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
                      placeholder="Min 8 chars, uppercase & number"
                      autoComplete="new-password"
                    />
                    <button type="button" className="mc-pw-eye" tabIndex={-1} onClick={() => setShow(s => !s)}>
                      <i className={`bi bi-eye${show ? "-slash" : ""}`}/>
                    </button>
                  </div>
                  {form.password && (
                    <div className="mc-strength-bar">
                      <div className={`mc-strength-fill mc-strength-${strengthClass}`} style={{width: `${strength * 25}%`}}/>
                    </div>
                  )}
                  {form.password && <div className={`mc-strength-label mc-strength-${strengthClass}`}>{strengthLabel} password</div>}
                </label>

                <button className="mc-btn-primary" type="submit" disabled={loading}>
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2"/>Creating account…</>
                    : <><i className="bi bi-person-plus me-2"/>Create free account</>
                  }
                </button>
              </form>

              <div className="mc-auth-switch">
                Already have an account? <Link to="/login">Sign in</Link>
              </div>

              <p className="mc-auth-terms">
                By creating an account you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
