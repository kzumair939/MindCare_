import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import api from "../../api/axios";

export default function TherapistReport() {
  const { sessionId } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState({
    symptomsSummary: "",
    sessionGoals: "",
    progressRating: 5,
    nextSteps: "",
    clientSummary: "",
    privateNotes: "",
    homeworkExercises: "",
    sharedWithClient: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    api
      .get(`/report/session/${sessionId}`)
      .then((r) => {
        if (r.data) {
          setForm({
            symptomsSummary: r.data.symptomsSummary || "",
            sessionGoals: r.data.sessionGoals || "",
            progressRating: r.data.progressRating || 5,
            nextSteps: r.data.nextSteps || "",
            clientSummary: r.data.clientSummary || "",
            privateNotes: r.data.privateNotes || "",
            homeworkExercises: r.data.homeworkExercises || "",
            sharedWithClient: r.data.sharedWithClient || false,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    try {
      await api.post(`/report/session/${sessionId}`, form);
      nav("/therapist/sessions?reported");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to save the report. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mc-loading" style={{ height: "60vh" }}>
          <div className="mc-spinner" />
          <span>Loading session details…</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mc-container" style={{ maxWidth: "1000px", paddingBottom: "60px" }}>
        {/* Hero Area */}
        <section className="mc-dash-hero mc-fade-up" style={{ paddingBottom: "16px" }}>
          <div className="mc-dash-hero-text">
            <div className="mc-kicker">
              <i className="bi bi-file-earmark-medical me-1" /> Clinical Documentation
            </div>
            <h1>
              Session <span className="mc-gradient-text">Report Editor</span>
            </h1>
            <p>Draft professional summaries, track progress, and assign activities.</p>
          </div>
          <Link to="/therapist/sessions" className="mc-btn-cancel" style={{ textDecoration: "none", display: "inline-flex", gap: "6px" }}>
            <i className="bi bi-arrow-left" /> Back to Sessions
          </Link>
        </section>

        {errorMsg && (
          <div className="mc-alert mc-alert-danger mc-alert-animate mb-4" style={{ borderRadius: "12px" }}>
            <i className="bi bi-exclamation-circle-fill me-2" />
            {errorMsg}
          </div>
        )}

        {/* Redesigned Premium Cards Form */}
        <form onSubmit={handleSubmit} className="mc-form" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", width: "100%" }} className="mc-form-grid-split">
            {/* Left Card: Clinical Observations */}
            <div className="mc-card" style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "28px", border: "1.5px solid var(--mc-border)", borderRadius: "20px", background: "var(--mc-surface)" }}>
              <h3 style={{ fontSize: "1.08rem", fontWeight: "700", borderBottom: "1.5px solid var(--mc-border)", paddingBottom: "12px", marginBottom: "8px", color: "var(--mc-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="bi bi-clipboard2-pulse text-primary" />
                Clinical Observation
              </h3>

              <label className="mc-field span-12" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--mc-text)" }}>Symptoms Summary</span>
                <textarea
                  rows={3}
                  placeholder="Analyze presenting symptoms, mood shifts, or psychological triggers…"
                  value={form.symptomsSummary}
                  onChange={(e) => setForm({ ...form, symptomsSummary: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid var(--mc-border)", background: "var(--mc-surface-2)", color: "var(--mc-text)", resize: "none", fontSize: "0.88rem", transition: "border-color 0.2s" }}
                />
              </label>

              <label className="mc-field span-12" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--mc-text)" }}>Session Goals Achieved</span>
                <textarea
                  rows={3}
                  placeholder="Outline clinical goals discussed and check off achievements…"
                  value={form.sessionGoals}
                  onChange={(e) => setForm({ ...form, sessionGoals: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid var(--mc-border)", background: "var(--mc-surface-2)", color: "var(--mc-text)", resize: "none", fontSize: "0.88rem", transition: "border-color 0.2s" }}
                />
              </label>

              <label className="mc-field span-12" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--mc-text)" }}>Private Clinical Notes (Internal Only)</span>
                <textarea
                  rows={4}
                  placeholder="Record private clinical hypothesis, diagnoses, or notes. This will NEVER be shared with the patient."
                  value={form.privateNotes}
                  onChange={(e) => setForm({ ...form, privateNotes: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid var(--mc-border)", background: "var(--mc-surface-2)", color: "var(--mc-text)", resize: "none", fontSize: "0.88rem", transition: "border-color 0.2s" }}
                />
              </label>
            </div>

            {/* Right Card: Patient Plan & Sharing */}
            <div className="mc-card" style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "28px", border: "1.5px solid var(--mc-border)", borderRadius: "20px", background: "var(--mc-surface)" }}>
              <h3 style={{ fontSize: "1.08rem", fontWeight: "700", borderBottom: "1.5px solid var(--mc-border)", paddingBottom: "12px", marginBottom: "8px", color: "var(--mc-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="bi bi-send text-success" />
                Patient Plan & Guidance
              </h3>

              <label className="mc-field span-12" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--mc-text)" }}>Client Summary (Friendly Report)</span>
                <textarea
                  rows={3}
                  placeholder="Write a supportive, non-technical overview of the session for the patient…"
                  value={form.clientSummary}
                  onChange={(e) => setForm({ ...form, clientSummary: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid var(--mc-border)", background: "var(--mc-surface-2)", color: "var(--mc-text)", resize: "none", fontSize: "0.88rem", transition: "border-color 0.2s" }}
                />
              </label>

              <label className="mc-field span-12" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--mc-text)" }}>Homework & Homework Exercises</span>
                <textarea
                  rows={3}
                  placeholder="Assign specific therapeutic exercises, readings, or journal prompts…"
                  value={form.homeworkExercises}
                  onChange={(e) => setForm({ ...form, homeworkExercises: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid var(--mc-border)", background: "var(--mc-surface-2)", color: "var(--mc-text)", resize: "none", fontSize: "0.88rem", transition: "border-color 0.2s" }}
                />
              </label>

              <label className="mc-field span-12" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--mc-text)" }}>Next Practical Steps</span>
                <textarea
                  rows={3}
                  placeholder="E.g., schedule weekly sessions, continue deep breathing logs…"
                  value={form.nextSteps}
                  onChange={(e) => setForm({ ...form, nextSteps: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid var(--mc-border)", background: "var(--mc-surface-2)", color: "var(--mc-text)", resize: "none", fontSize: "0.88rem", transition: "border-color 0.2s" }}
                />
              </label>
            </div>
          </div>

          {/* Bottom Card: Rating & Sharing Toggle */}
          <div className="mc-card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", padding: "28px", border: "1.5px solid var(--mc-border)", borderRadius: "20px", background: "var(--mc-surface)" }} className="mc-form-grid-split">
            {/* Progress Rating Slider */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--mc-text)" }}>Progress Rating</span>
                <span style={{ padding: "4px 10px", borderRadius: "8px", background: "rgba(59,107,255,0.1)", color: "var(--mc-primary)", fontWeight: "700", fontSize: "0.85rem" }}>
                  Score: {form.progressRating} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={form.progressRating}
                onChange={(e) => setForm({ ...form, progressRating: +e.target.value })}
                style={{ width: "100%", cursor: "pointer", height: "6px", accentColor: "var(--mc-primary)", borderRadius: "4px" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--mc-muted)" }}>
                <span>1 - Minimal Progress</span>
                <span>10 - Fully Achieved</span>
              </div>
            </div>

            {/* Sharing toggle */}
            <label style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "rgba(59,107,255,0.05)", border: "1.5px dashed rgba(59,107,255,0.25)", borderRadius: "14px", cursor: "pointer", userSelect: "none" }}>
              <input
                type="checkbox"
                checked={form.sharedWithClient}
                onChange={(e) => setForm({ ...form, sharedWithClient: e.target.checked })}
                style={{ width: "22px", height: "22px", cursor: "pointer", flexShrink: 0 }}
              />
              <div>
                <strong style={{ display: "block", fontSize: "0.9rem", color: "var(--mc-text)" }}>Share Report with Patient</strong>
                <span style={{ display: "block", fontSize: "0.76rem", color: "var(--mc-muted)", marginTop: "2px", lineHeight: "1.4" }}>
                  Enables patient visibility for progress summaries, next steps, and homework tasks. Private notes remain secure.
                </span>
              </div>
            </label>
          </div>

          {/* Form Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "14px", marginTop: "8px" }}>
            <Link to="/therapist/sessions" className="mc-btn-cancel-outline" style={{ textDecoration: "none", padding: "12px 28px", borderRadius: "10px", fontWeight: "600", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              Cancel
            </Link>
            <button className="mc-btn-primary" type="submit" disabled={saving} style={{ padding: "12px 32px", borderRadius: "10px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "8px", width: "auto" }}>
              {saving ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-save" />}
              Save Document
            </button>
          </div>
        </form>
      </main>
    </AppShell>
  );
}
