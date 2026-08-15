import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import api from "../../api/axios";
import { fmt } from "../../utils/helpers";

const THERAPY_DETAILS = {
  "CBT": {
    full: "Cognitive Behavioural Therapy",
    icon: "brain-fill",
    desc: "CBT helps identify and restructure negative thought patterns, equipping you with practical coping mechanisms to handle stress and anxiety.",
    benefits: [
      "Identify negative thought loops",
      "Develop actionable coping strategies",
      "Proven effective for anxiety & mood focus"
    ]
  },
  "DBT": {
    full: "Dialectical Behaviour Therapy",
    icon: "heart-pulse-fill",
    desc: "DBT focuses on emotion regulation, mindfulness, and distress tolerance to help you navigate intense feelings calmly.",
    benefits: [
      "Master emotion regulation techniques",
      "Build mindfulness & distress tolerance",
      "Improve interpersonal effectiveness"
    ]
  },
  "ACT": {
    full: "Acceptance & Commitment Therapy",
    icon: "compass-fill",
    desc: "ACT encourages psychological flexibility, helping you accept difficult feelings while taking committed action toward your values.",
    benefits: [
      "Develop psychological resilience",
      "Clarify personal core values",
      "Reduce avoidance behaviors"
    ]
  },
  "General": {
    full: "General Counselling & Wellness",
    icon: "flower2",
    desc: "A supportive, open therapeutic environment focused on self-discovery, active listening, and stress management.",
    benefits: [
      "Safe space to express feelings",
      "Personalized wellness roadmap",
      "Guided self-exploration"
    ]
  }
};

export default function SurveyResult() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/survey")
      .then((r) => setResult(r.data))
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, []);

  const therapyKey = result?.recommendedTherapy?.toUpperCase().includes("DBT") ? "DBT"
    : result?.recommendedTherapy?.toUpperCase().includes("ACT") ? "ACT"
    : result?.recommendedTherapy?.toUpperCase().includes("CBT") ? "CBT" : "General";

  const details = THERAPY_DETAILS[therapyKey] || THERAPY_DETAILS["General"];
  const score = result?.score || 76;

  return (
    <AppShell>
      <main className="mc-container">
        {/* Hero Section */}
        <section className="mc-dash-hero mc-fade-up">
          <div className="mc-dash-hero-text">
            <div className="mc-kicker">
              <i className="bi bi-sparkles me-1" style={{ color: "#3b82f6" }} />
              Personalized Assessment Report
            </div>
            <h1>
              Your Customized <span className="mc-gradient-text">Care Plan</span>
            </h1>
            <p>
              Based on your clinical check-in responses, we’ve analyzed your wellbeing metrics and matched you with optimal care strategies.
            </p>
          </div>
        </section>

        {loading ? (
          <div className="mc-loading-state" style={{ padding: "60px 0", textAlign: "center" }}>
            <span className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }} />
            <p className="mt-3 text-muted" style={{ fontWeight: 600 }}>Analyzing your check-in responses…</p>
          </div>
        ) : (
          <div className="mc-result-layout" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Top Row: Score & Recommendation Card */}
            <div className="mc-result-top-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
              
              {/* Wellbeing Score Card */}
              <div
                className="mc-form-card mc-result-score-card mc-scroll-reveal"
                style={{
                  background: "linear-gradient(145deg, var(--mc-surface-2), var(--mc-surface))",
                  border: "1.5px solid var(--mc-border)",
                  borderRadius: "24px",
                  padding: "32px 24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.06)"
                }}
              >
                <div
                  className="mc-score-ring"
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    background: "conic-gradient(from 0deg, #3b82f6 0%, #22c55e 75%, var(--mc-border) 75%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "18px",
                    boxShadow: "0 0 24px rgba(59, 130, 246, 0.25)"
                  }}
                >
                  <div
                    style={{
                      width: "98px",
                      height: "98px",
                      borderRadius: "50%",
                      background: "var(--mc-surface)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--mc-text)"
                    }}
                  >
                    <span style={{ fontSize: "1.8rem", fontWeight: "800", lineHeight: 1 }}>{score}</span>
                    <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "var(--mc-muted)", textTransform: "uppercase" }}>Index</span>
                  </div>
                </div>

                <div className="mc-badge-status" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.25)", color: "#3b82f6", padding: "6px 14px", borderRadius: "99px", fontSize: "0.82rem", fontWeight: "700", marginBottom: "12px" }}>
                  <i className="bi bi-shield-check" />
                  {fmt(result?.category, "Anxiety & Mood Balance")}
                </div>

                <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--mc-text)", margin: "0 0 6px 0" }}>
                  Recommendation Ready
                </h3>
                <p style={{ fontSize: "0.88rem", color: "var(--mc-muted)", margin: 0, maxWidth: "260px" }}>
                  Your survey responses indicate high potential response to structured therapeutic support.
                </p>
              </div>

              {/* Recommended Therapy Showcase Card */}
              <div
                className="mc-form-card mc-result-therapy-card mc-scroll-reveal"
                style={{
                  background: "linear-gradient(145deg, rgba(59, 130, 246, 0.08), rgba(79, 70, 229, 0.04))",
                  border: "1.5px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: "24px",
                  padding: "32px 28px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 10px 32px rgba(59, 130, 246, 0.12)",
                  position: "relative"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      ★ Primary Match
                    </span>
                    <span style={{ background: "rgba(34, 197, 94, 0.14)", color: "#22c55e", padding: "4px 10px", borderRadius: "99px", fontSize: "0.72rem", fontWeight: "700" }}>
                      2 Free Sessions Left
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.4rem", flexShrink: 0 }}>
                      <i className={`bi bi-${details.icon}`} style={{ margin: "0 auto" }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--mc-text)", margin: 0, lineHeight: 1.2 }}>
                        {fmt(result?.recommendedTherapy, details.full)}
                      </h2>
                      <span style={{ fontSize: "0.82rem", color: "var(--mc-muted)", fontWeight: "500" }}>
                        {details.full}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.92rem", color: "var(--mc-text)", lineHeight: 1.5, marginBottom: "16px", opacity: 0.9 }}>
                    {details.desc}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                    {details.benefits.map((b, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--mc-text)", fontWeight: "600" }}>
                        <i className="bi bi-check-circle-fill" style={{ color: "#22c55e" }} />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  to="/book-session"
                  className="mc-btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "14px 24px",
                    borderRadius: "14px",
                    fontWeight: "700",
                    fontSize: "0.95rem",
                    boxShadow: "0 6px 20px rgba(59, 130, 246, 0.35)",
                    textDecoration: "none"
                  }}
                >
                  <i className="bi bi-calendar2-check me-2" />
                  Book Recommended Care →
                </Link>
              </div>

            </div>

            {/* Middle Grid: Key Clinical Indicators */}
            <div className="mc-form-card mc-scroll-reveal" style={{ borderRadius: "24px", padding: "28px 28px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--mc-text)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="bi bi-bar-chart-line-fill" style={{ color: "#3b82f6" }} />
                Wellbeing Indicators & Insights
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
                {/* Metric 1 */}
                <div style={{ background: "var(--mc-surface-2)", padding: "18px", borderRadius: "16px", border: "1px solid var(--mc-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: "700", color: "var(--mc-text)" }}>
                      🧠 Emotional Health
                    </span>
                    <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#3b82f6" }}>78%</span>
                  </div>
                  <div style={{ height: "8px", borderRadius: "99px", background: "var(--mc-border)", overflow: "hidden" }}>
                    <div style={{ width: "78%", height: "100%", borderRadius: "99px", background: "linear-gradient(90deg, #3b82f6, #60a5fa)" }} />
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--mc-muted)", marginTop: "8px", display: "block" }}>
                    Good baseline stability
                  </span>
                </div>

                {/* Metric 2 */}
                <div style={{ background: "var(--mc-surface-2)", padding: "18px", borderRadius: "16px", border: "1px solid var(--mc-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: "700", color: "var(--mc-text)" }}>
                      ⚡ Stress Resilience
                    </span>
                    <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#f59e0b" }}>64%</span>
                  </div>
                  <div style={{ height: "8px", borderRadius: "99px", background: "var(--mc-border)", overflow: "hidden" }}>
                    <div style={{ width: "64%", height: "100%", borderRadius: "99px", background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }} />
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--mc-muted)", marginTop: "8px", display: "block" }}>
                    Focus area for therapy sessions
                  </span>
                </div>

                {/* Metric 3 */}
                <div style={{ background: "var(--mc-surface-2)", padding: "18px", borderRadius: "16px", border: "1px solid var(--mc-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: "700", color: "var(--mc-text)" }}>
                      👥 Support Network
                    </span>
                    <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#22c55e" }}>88%</span>
                  </div>
                  <div style={{ height: "8px", borderRadius: "99px", background: "var(--mc-border)", overflow: "hidden" }}>
                    <div style={{ width: "88%", height: "100%", borderRadius: "99px", background: "linear-gradient(90deg, #22c55e, #4ade80)" }} />
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--mc-muted)", marginTop: "8px", display: "block" }}>
                    Strong connection foundation
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Next Steps Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
              <Link to="/book-session" style={{ textDecoration: "none" }}>
                <div className="mc-form-card" style={{ padding: "20px", borderRadius: "18px", display: "flex", alignItems: "center", gap: "14px", border: "1.5px solid var(--mc-border)", transition: "all 0.2s ease" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                    <i className="bi bi-person-video3" style={{ margin: "0 auto" }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--mc-text)", margin: 0 }}>Schedule Therapist Session</h4>
                    <p style={{ fontSize: "0.78rem", color: "var(--mc-muted)", margin: 0 }}>Use your 2 free sessions</p>
                  </div>
                </div>
              </Link>

              <Link to="/group" style={{ textDecoration: "none" }}>
                <div className="mc-form-card" style={{ padding: "20px", borderRadius: "18px", display: "flex", alignItems: "center", gap: "14px", border: "1.5px solid var(--mc-border)", transition: "all 0.2s ease" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(34, 197, 94, 0.12)", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                    <i className="bi bi-people-fill" style={{ margin: "0 auto" }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--mc-text)", margin: 0 }}>Join Anonymous Peer Group</h4>
                    <p style={{ fontSize: "0.78rem", color: "var(--mc-muted)", margin: 0 }}>Connect with supportive peers</p>
                  </div>
                </div>
              </Link>

              <Link to="/survey" style={{ textDecoration: "none" }}>
                <div className="mc-form-card" style={{ padding: "20px", borderRadius: "18px", display: "flex", alignItems: "center", gap: "14px", border: "1.5px solid var(--mc-border)", transition: "all 0.2s ease" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                    <i className="bi bi-arrow-repeat" style={{ margin: "0 auto" }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--mc-text)", margin: 0 }}>Retake Check-in Survey</h4>
                    <p style={{ fontSize: "0.78rem", color: "var(--mc-muted)", margin: 0 }}>Track changes over time</p>
                  </div>
                </div>
              </Link>
            </div>

          </div>
        )}
      </main>
    </AppShell>
  );
}
