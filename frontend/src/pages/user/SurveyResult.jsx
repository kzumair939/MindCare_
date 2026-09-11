import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import api from "../../api/axios";
import { fmt } from "../../utils/helpers";

const THERAPY_DETAILS = {
  "CBT": {
    full: "Cognitive Behavioural Therapy (CBT)",
    icon: "brain-fill",
    desc: "CBT helps identify and restructure negative thought patterns, equipping you with practical coping mechanisms to handle stress, anxiety, and panic loops.",
    benefits: [
      "Identify automated negative thoughts & cognitive distortions",
      "Develop actionable coping strategies & grounding routines",
      "Clinically proven for anxiety, panic, and stress reduction"
    ]
  },
  "DBT": {
    full: "Dialectical Behaviour Therapy (DBT)",
    icon: "heart-pulse-fill",
    desc: "DBT focuses on emotion regulation, distress tolerance, and mindfulness to help you navigate overwhelming feelings with calm and stability.",
    benefits: [
      "Master distress tolerance & crisis survival skills",
      "Build deep mindfulness & emotional regulation",
      "Improve relationship boundaries and communication"
    ]
  },
  "ACT": {
    full: "Acceptance & Commitment Therapy (ACT)",
    icon: "compass-fill",
    desc: "ACT encourages psychological flexibility, helping you accept difficult emotions while taking committed action aligned with your core values.",
    benefits: [
      "Cultivate psychological flexibility & resilience",
      "Clarify personal values and purposeful goals",
      "Reduce behavioral avoidance and procrastination"
    ]
  },
  "TRAUMA_FOCUSED": {
    full: "Trauma-Focused Cognitive Therapy",
    icon: "shield-shaded",
    desc: "Trauma-informed care that helps process distressing memories safely and rebuild feelings of security, control, and autonomy.",
    benefits: [
      "Safe processing of acute stress triggers",
      "Somatic grounding and nervous system regulation",
      "Restoration of emotional safety and peace"
    ]
  },
  "SLEEP_CBT_I": {
    full: "CBT for Insomnia (CBT-I)",
    icon: "moon-stars-fill",
    desc: "Evidence-based non-pharmacological treatment for sleep difficulties that resets sleep conditioning and improves restful sleep.",
    benefits: [
      "Reset circadian rhythm & sleep schedule",
      "Eliminate racing bedtime thoughts",
      "Enhance daytime energy and mental alertness"
    ]
  },
  "ADHD_COACHING": {
    full: "ADHD & Executive Function Coaching",
    icon: "lightning-charge-fill",
    desc: "Structured behavioural support designed to overcome executive dysfunction, organize daily tasks, and eliminate chronic overwhelm.",
    benefits: [
      "Develop practical task-chunking workflows",
      "Reduce sensory overload and analysis paralysis",
      "Strengthen daily focus and habits"
    ]
  },
  "COUPLES_FAMILY": {
    full: "Couples & Interpersonal Therapy",
    icon: "people-fill",
    desc: "Specialized therapy aimed at resolving interpersonal strain, improving communication, and deepening relational support.",
    benefits: [
      "Constructive conflict resolution methods",
      "Enhanced active listening & empathy",
      "Strengthen mutual trust and bonding"
    ]
  },
  "GENERAL_COUNSELLING": {
    full: "General Counselling & Holistic Wellness",
    icon: "flower2",
    desc: "A supportive, open therapeutic environment focused on self-discovery, active listening, and sustainable stress management.",
    benefits: [
      "Safe, non-judgmental space to express feelings",
      "Personalized holistic wellness roadmap",
      "Guided self-exploration and burnout prevention"
    ]
  }
};

export default function SurveyResult() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionPlanList, setActionPlanList] = useState([]);
  const [completedTasks, setCompletedTasks] = useState({});

  useEffect(() => {
    api.get("/survey")
      .then((r) => {
        setResult(r.data);
        if (r.data?.actionPlan) {
          try {
            const parsed = typeof r.data.actionPlan === "string" 
              ? JSON.parse(r.data.actionPlan) 
              : r.data.actionPlan;
            if (Array.isArray(parsed)) {
              setActionPlanList(parsed);
            }
          } catch (e) {
            setActionPlanList([]);
          }
        }
      })
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, []);

  const therapyKey = result?.recommendedTherapy ? result.recommendedTherapy.toUpperCase().trim() : "GENERAL_COUNSELLING";
  const details = THERAPY_DETAILS[therapyKey] || 
                  THERAPY_DETAILS[Object.keys(THERAPY_DETAILS).find(k => therapyKey.includes(k)) || "GENERAL_COUNSELLING"] || 
                  THERAPY_DETAILS["GENERAL_COUNSELLING"];

  const stressScore = result?.stressScore || 72;
  const isCrisis = result?.crisisFlag === true;

  const toggleTask = (index) => {
    setCompletedTasks(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <AppShell>
      <main className="mc-container" style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 16px" }}>
        
        {/* Hero Section */}
        <section className="mc-dash-hero mc-fade-up" style={{ marginBottom: "28px" }}>
          <div className="mc-dash-hero-text">
            <div className="mc-kicker" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(99, 102, 241, 0.12)", color: "#6366f1", padding: "6px 14px", borderRadius: "99px", fontWeight: "700", fontSize: "0.85rem" }}>
              <i className="bi bi-stars" />
              AI Clinical Assessment • Google Gemini
            </div>
            <h1 style={{ marginTop: "12px", fontSize: "2.3rem", fontWeight: "800" }}>
              Your Personalized <span className="mc-gradient-text">Care Plan</span>
            </h1>
            <p style={{ fontSize: "1rem", color: "var(--mc-muted)", maxWidth: "680px" }}>
              Our Gemini-powered AI engine evaluated your check-in metrics against clinical frameworks to formulate tailored recommendations and self-care steps.
            </p>
          </div>
        </section>

        {/* Crisis Emergency Banner */}
        {isCrisis && (
          <div className="mc-fade-up" style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(220, 38, 38, 0.05))",
            border: "1.5px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "18px",
            padding: "20px 24px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "flex-start",
            gap: "16px"
          }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>
              <i className="bi bi-exclamation-triangle-fill" />
            </div>
            <div>
              <h4 style={{ margin: "0 0 6px 0", color: "#ef4444", fontWeight: "800", fontSize: "1.1rem" }}>
                Immediate Support & Care Notice
              </h4>
              <p style={{ margin: "0 0 10px 0", fontSize: "0.92rem", color: "var(--mc-text)" }}>
                Your responses indicate you may be navigating severe distress. If you or someone you know is in crisis or danger, please reach out to immediate emergency services or dial <strong>988</strong> (Suicide & Crisis Lifeline).
              </p>
              <Link to="/book-session" className="btn btn-sm btn-danger" style={{ fontWeight: "700", borderRadius: "8px" }}>
                <i className="bi bi-shield-fill-plus me-1" /> Connect with Priority Support
              </Link>
            </div>
          </div>
        )}

        {loading ? (
          <div className="mc-loading-state" style={{ padding: "80px 0", textAlign: "center" }}>
            <span className="spinner-border text-primary" role="status" style={{ width: "3.5rem", height: "3.5rem" }} />
            <p className="mt-3 text-muted" style={{ fontWeight: 600, fontSize: "1.1rem" }}>Synthesizing Gemini AI clinical insights…</p>
          </div>
        ) : (
          <div className="mc-result-layout" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Top Row: AI Score & Matched Therapy Card */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
              
              {/* Wellbeing & Stress Index Card */}
              <div
                className="mc-form-card mc-result-score-card"
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
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.06)"
                }}
              >
                <div
                  style={{
                    width: "128px",
                    height: "128px",
                    borderRadius: "50%",
                    background: `conic-gradient(from 0deg, #6366f1 0%, #3b82f6 ${stressScore}%, var(--mc-border) ${stressScore}%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "18px",
                    boxShadow: "0 0 24px rgba(99, 102, 241, 0.25)"
                  }}
                >
                  <div
                    style={{
                      width: "104px",
                      height: "104px",
                      borderRadius: "50%",
                      background: "var(--mc-surface)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--mc-text)"
                    }}
                  >
                    <span style={{ fontSize: "1.9rem", fontWeight: "800", lineHeight: 1 }}>{stressScore}</span>
                    <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "var(--mc-muted)", textTransform: "uppercase" }}>Stress Index</span>
                  </div>
                </div>

                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.25)", color: "#3b82f6", padding: "6px 14px", borderRadius: "99px", fontSize: "0.84rem", fontWeight: "700", marginBottom: "12px" }}>
                  <i className="bi bi-shield-check" />
                  {fmt(result?.category, "Anxiety & Mood Balance")}
                </div>

                <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--mc-text)", margin: "0 0 6px 0" }}>
                  Assessment Generated
                </h3>
                <p style={{ fontSize: "0.88rem", color: "var(--mc-muted)", margin: 0, maxWidth: "280px" }}>
                  Matched based on your emotional patterns, focus ratings, and recovery indicators.
                </p>
              </div>

              {/* Recommended Therapy Showcase Card */}
              <div
                className="mc-form-card"
                style={{
                  background: "linear-gradient(145deg, rgba(99, 102, 241, 0.08), rgba(59, 130, 246, 0.04))",
                  border: "1.5px solid rgba(99, 102, 241, 0.3)",
                  borderRadius: "24px",
                  padding: "32px 28px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 10px 32px rgba(99, 102, 241, 0.12)"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="bi bi-award-fill" /> Primary Recommended Modality
                    </span>
                    <span style={{ background: "rgba(34, 197, 94, 0.14)", color: "#22c55e", padding: "4px 10px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: "700" }}>
                      2 Free Sessions Available
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
                    <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: "linear-gradient(135deg, #6366f1, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.5rem", flexShrink: 0 }}>
                      <i className={`bi bi-${details.icon}`} style={{ margin: "0 auto" }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--mc-text)", margin: 0, lineHeight: 1.2 }}>
                        {details.full}
                      </h2>
                      <span style={{ fontSize: "0.82rem", color: "var(--mc-muted)", fontWeight: "600" }}>
                        Therapy Code: {therapyKey}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.92rem", color: "var(--mc-text)", lineHeight: 1.55, marginBottom: "16px", opacity: 0.9 }}>
                    {details.desc}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                    {details.benefits.map((b, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.86rem", color: "var(--mc-text)", fontWeight: "600" }}>
                        <i className="bi bi-check-circle-fill" style={{ color: "#22c55e", marginTop: "3px", flexShrink: 0 }} />
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
                    boxShadow: "0 6px 20px rgba(99, 102, 241, 0.35)",
                    textDecoration: "none"
                  }}
                >
                  <i className="bi bi-calendar2-check me-2" />
                  Book Matched Therapist →
                </Link>
              </div>

            </div>

            {/* AI Clinical Reasoning Callout */}
            {result?.aiAnalysis && (
              <div
                className="mc-form-card"
                style={{
                  borderRadius: "24px",
                  padding: "26px 28px",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(59, 130, 246, 0.03))",
                  border: "1.5px solid rgba(99, 102, 241, 0.25)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.1rem" }}>
                    <i className="bi bi-stars" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--mc-text)", margin: 0 }}>
                      AI Clinical Synthesis & Rationale
                    </h3>
                    <span style={{ fontSize: "0.75rem", color: "var(--mc-muted)", fontWeight: "600" }}>
                      Formulated by Google Gemini based on your self-reported indicators
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: "0.95rem", lineHeight: 1.65, color: "var(--mc-text)", margin: 0, opacity: 0.95 }}>
                  {result.aiAnalysis}
                </p>
              </div>
            )}

            {/* Personalized 3-Step Action Plan */}
            {actionPlanList.length > 0 && (
              <div className="mc-form-card" style={{ borderRadius: "24px", padding: "28px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--mc-text)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="bi bi-list-check" style={{ color: "#6366f1" }} />
                    Recommended Action Plan & Self-Care Steps
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "var(--mc-muted)", fontWeight: "600" }}>
                    Interactive Checklist
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {actionPlanList.map((step, idx) => {
                    const isDone = completedTasks[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleTask(idx)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          padding: "16px 18px",
                          borderRadius: "16px",
                          background: isDone ? "rgba(34, 197, 94, 0.08)" : "var(--mc-surface-2)",
                          border: `1.5px solid ${isDone ? "rgba(34, 197, 94, 0.3)" : "var(--mc-border)"}`,
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "8px",
                          border: `2px solid ${isDone ? "#22c55e" : "var(--mc-muted)"}`,
                          background: isDone ? "#22c55e" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "0.9rem",
                          flexShrink: 0
                        }}>
                          {isDone && <i className="bi bi-check-lg" />}
                        </div>
                        <span style={{
                          fontSize: "0.92rem",
                          fontWeight: isDone ? "500" : "600",
                          color: "var(--mc-text)",
                          textDecoration: isDone ? "line-through" : "none",
                          opacity: isDone ? 0.75 : 1
                        }}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Action Navigation */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
              <Link to="/book-session" style={{ textDecoration: "none" }}>
                <div className="mc-form-card" style={{ padding: "20px", borderRadius: "18px", display: "flex", alignItems: "center", gap: "14px", border: "1.5px solid var(--mc-border)", transition: "all 0.2s ease" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "rgba(99, 102, 241, 0.12)", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
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
                  <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "rgba(34, 197, 94, 0.12)", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
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
                  <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
                    <i className="bi bi-arrow-repeat" style={{ margin: "0 auto" }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--mc-text)", margin: 0 }}>Retake Check-in Survey</h4>
                    <p style={{ fontSize: "0.78rem", color: "var(--mc-muted)", margin: 0 }}>Re-analyze metrics with AI</p>
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
