import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import api from "../../api/axios";
import { fmt } from "../../utils/helpers";

export default function SessionSummary() {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/report/user/session/${sessionId}`)
      .then((r) => setReport(r.data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <AppShell>
        <div className="mc-loading" style={{ height: "60vh" }}>
          <div className="mc-spinner" />
          <span>Generating your progress report…</span>
        </div>
      </AppShell>
    );
  }

  // Helper to render the visual rating gauge
  const renderGauge = (rating) => {
    if (rating == null) return null;
    const percentage = (rating / 10) * 100;
    
    // Select color based on rating score
    let scoreColor = "var(--mc-red, #ef4444)";
    if (rating >= 8) scoreColor = "var(--mc-green, #22c55e)";
    else if (rating >= 5) scoreColor = "var(--mc-primary, #3b82f6)";
    else if (rating >= 3) scoreColor = "var(--mc-orange, #f97316)";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "8px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--mc-muted)" }}>Session Progress Indicator</span>
          <span style={{ fontSize: "0.95rem", fontWeight: "900", color: scoreColor }}>
            Score: {rating} / 10
          </span>
        </div>
        <div style={{ width: "100%", height: "8px", background: "var(--mc-border, #e2e8f0)", borderRadius: "99px", overflow: "hidden" }}>
          <div style={{ width: `${percentage}%`, height: "100%", background: scoreColor, borderRadius: "99px", transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }} />
        </div>
      </div>
    );
  };

  return (
    <AppShell>
      <main className="mc-container" style={{ maxWidth: "1000px", paddingBottom: "60px" }}>
        {/* Header Hero */}
        <section className="mc-dash-hero mc-fade-up" style={{ paddingBottom: "16px" }}>
          <div className="mc-dash-hero-text">
            <div className="mc-kicker">
              <i className="bi bi-file-earmark-medical me-1" /> Care Summary
            </div>
            <h1>
              Your Progress <span className="mc-gradient-text">Report</span>
            </h1>
            <p>Review key takeaways, achievement scores, and assigned exercises.</p>
          </div>
          <Link to="/my-sessions" className="mc-btn-cancel" style={{ textDecoration: "none", display: "inline-flex", gap: "6px" }}>
            <i className="bi bi-arrow-left" /> Back to My Sessions
          </Link>
        </section>

        {!report ? (
          <div className="mc-card" style={{ padding: "40px", textAlign: "center", border: "1.5px solid var(--mc-border)", borderRadius: "20px", background: "var(--mc-surface)" }}>
            <i className="bi bi-journal-x" style={{ fontSize: "2.8rem", color: "var(--mc-muted-2)", display: "block", marginBottom: "12px" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--mc-text)", marginBottom: "4px" }}>No Summary Shared Yet</h3>
            <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
              Your therapist hasn't shared a summary for this session yet. It will appear here once published.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", width: "100%" }} className="mc-form-grid-split">
            
            {/* Left Column: Progress & Core Insights */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Progress & Overview Card */}
              <div className="mc-card" style={{ padding: "28px", border: "1.5px solid var(--mc-border)", borderRadius: "20px", background: "var(--mc-surface)", display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "1.08rem", fontWeight: "700", borderBottom: "1.5px solid var(--mc-border)", paddingBottom: "12px", margin: "0", color: "var(--mc-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="bi bi-graph-up-arrow text-primary" />
                  Progress Overview
                </h3>
                {renderGauge(report.progressRating)}
              </div>

              {/* Therapist Friendly summary */}
              <div className="mc-card" style={{ padding: "28px", border: "1.5px solid var(--mc-border)", borderRadius: "20px", background: "var(--mc-surface)", display: "flex", flexDirection: "column", gap: "14px" }}>
                <h3 style={{ fontSize: "1.08rem", fontWeight: "700", borderBottom: "1.5px solid var(--mc-border)", paddingBottom: "12px", margin: "0", color: "var(--mc-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="bi bi-chat-quote-fill text-success" />
                  Therapist Summary
                </h3>
                <p style={{ fontSize: "0.92rem", lineHeight: "1.65", color: "var(--mc-text-2)", margin: 0, whiteSpace: "pre-line" }}>
                  {fmt(report.clientSummary, "Your therapist did not provide a friendly summary yet, but check other goals and plans below!")}
                </p>
              </div>
            </div>

            {/* Right Column: Active Plan & Homework */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Homework and Tasks */}
              <div className="mc-card" style={{ padding: "28px", border: "1.5px solid var(--mc-border)", borderRadius: "20px", background: "var(--mc-surface)", display: "flex", flexDirection: "column", gap: "14px" }}>
                <h3 style={{ fontSize: "1.08rem", fontWeight: "700", borderBottom: "1.5px solid var(--mc-border)", paddingBottom: "12px", margin: "0", color: "var(--mc-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="bi bi-journal-check text-warning" />
                  Homework & Exercises
                </h3>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.18)", borderRadius: "12px", padding: "14px", fontSize: "0.85rem", color: "var(--mc-text)", lineHeight: "1.5" }}>
                  <i className="bi bi-award-fill text-warning" style={{ fontSize: "1.2rem", marginTop: "-2px" }} />
                  <div>
                    <strong>Action Required:</strong>
                    <p style={{ margin: "4px 0 0 0", color: "var(--mc-muted)", fontSize: "0.82rem" }}>Practicing these exercises will help reinforce achievements made during the session.</p>
                  </div>
                </div>
                <p style={{ fontSize: "0.9rem", lineHeight: "1.6", color: "var(--mc-text-2)", margin: 0, whiteSpace: "pre-line" }}>
                  {fmt(report.homeworkExercises, "No specific exercises assigned for this session.")}
                </p>
              </div>

              {/* Goals Achieved */}
              <div className="mc-card" style={{ padding: "28px", border: "1.5px solid var(--mc-border)", borderRadius: "20px", background: "var(--mc-surface)", display: "flex", flexDirection: "column", gap: "14px" }}>
                <h3 style={{ fontSize: "1.08rem", fontWeight: "700", borderBottom: "1.5px solid var(--mc-border)", paddingBottom: "12px", margin: "0", color: "var(--mc-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="bi bi-bullseye text-danger" />
                  Session Goals
                </h3>
                <p style={{ fontSize: "0.9rem", lineHeight: "1.6", color: "var(--mc-text-2)", margin: 0, whiteSpace: "pre-line" }}>
                  {fmt(report.sessionGoals, "Not specified.")}
                </p>
              </div>

              {/* Next Steps */}
              <div className="mc-card" style={{ padding: "28px", border: "1.5px solid var(--mc-border)", borderRadius: "20px", background: "var(--mc-surface)", display: "flex", flexDirection: "column", gap: "14px" }}>
                <h3 style={{ fontSize: "1.08rem", fontWeight: "700", borderBottom: "1.5px solid var(--mc-border)", paddingBottom: "12px", margin: "0", color: "var(--mc-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="bi bi-signpost-split text-info" />
                  Next Steps
                </h3>
                <p style={{ fontSize: "0.9rem", lineHeight: "1.6", color: "var(--mc-text-2)", margin: 0, whiteSpace: "pre-line" }}>
                  {fmt(report.nextSteps, "No next steps specified.")}
                </p>
              </div>
            </div>

          </div>
        )}
      </main>
    </AppShell>
  );
}
