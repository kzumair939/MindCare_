import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import api from "../../api/axios";

export default function Survey() {
  const nav = useNavigate();
  const [currentStep, setCurrentStep] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [customText, setCustomText] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");

  // Start the interactive AI assessment on mount
  useEffect(() => {
    async function startSurvey() {
      try {
        setLoading(true);
        const res = await api.post("/survey/interactive/start");
        setCurrentStep(res.data);
      } catch (err) {
        setError("Failed to initialize AI assessment. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }
    startSurvey();
  }, []);

  async function handleNext(e) {
    if (e) e.preventDefault();
    const finalAnswer = showCustomInput && customText.trim()
      ? customText.trim()
      : selectedOption;

    if (!finalAnswer) return;

    setError("");
    setSubmitting(true);

    const newHistory = [
      ...history,
      {
        questionNumber: currentStep?.questionNumber || history.length + 1,
        question: currentStep?.question || "Question",
        answer: finalAnswer
      }
    ];
    setHistory(newHistory);
    setSelectedOption("");
    setCustomText("");
    setShowCustomInput(false);

    try {
      const res = await api.post("/survey/interactive/next", newHistory);
      const nextStep = res.data;
      setCurrentStep(nextStep);

      const isDone = Boolean(nextStep?.isCompleted || nextStep?.completed);
      if (isDone) {
        setTimeout(() => {
          nav("/survey/result");
        }, 1500);
      }
    } catch (err) {
      setError("AI analysis encountered a temporary glitch. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isStepCompleted = Boolean(currentStep?.isCompleted || currentStep?.completed);
  const qNum = currentStep?.questionNumber || (history.length + 1);
  const totalEst = currentStep?.totalEstimated || 7;
  const progressPercent = isStepCompleted
    ? 100
    : Math.min(95, Math.round(((history.length) / Math.max(totalEst, 5)) * 100));

  return (
    <AppShell>
      <main className="mc-container" style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Hero Section */}
        <section className="mc-dash-hero mc-fade-up" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.3)", color: "#4f46e5", padding: "6px 14px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: "700", marginBottom: "14px" }}>
            <i className="bi bi-stars" /> Powered by Gemini Clinical AI
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: "800", marginBottom: "0.5rem" }}>
            Adaptive Wellbeing <span className="mc-gradient-text">Check-in</span>
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem", maxWidth: "600px", margin: "0 auto" }}>
            Our AI clinical advisor listens to your answers and dynamically asks 5 to 10 tailored questions to pinpoint your ideal therapy approach.
          </p>
        </section>

        {/* Progress Bar & Indicators */}
        <div style={{ background: "white", padding: "16px 20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#334155" }}>
              {isStepCompleted ? (
                <span><i className="bi bi-check-circle-fill text-success me-1" /> Intake Assessment Complete</span>
              ) : (
                <span><i className="bi bi-chat-heart-fill me-1 text-primary" /> Question {qNum} of ~{totalEst}</span>
              )}
            </span>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>
              {history.length} answered • {progressPercent}% Completed
            </span>
          </div>
          <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                background: isStepCompleted ? "#16a34a" : "linear-gradient(90deg, #4f46e5, #3b82f6)",
                borderRadius: "99px",
                transition: "width 0.4s ease"
              }}
            />
          </div>
        </div>

        {error && (
          <div className="mc-alert mc-alert-danger mc-alert-animate" style={{ marginBottom: "1.5rem" }}>
            <i className="bi bi-exclamation-circle-fill me-2" />{error}
          </div>
        )}

        {/* Question Card or AI Thinking Loading State */}
        {loading ? (
          <div style={{ background: "white", padding: "4rem 2rem", borderRadius: "20px", border: "1px solid #e2e8f0", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
            <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem", marginBottom: "1rem" }} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1e293b" }}>Initializing AI Clinical Intake…</h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Preparing personalized diagnostic questions</p>
          </div>
        ) : submitting ? (
          <div style={{ background: "white", padding: "4rem 2rem", borderRadius: "20px", border: "1px solid #e2e8f0", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: "1.5rem" }}>
              <div className="spinner-grow text-primary" style={{ width: "3.5rem", height: "3.5rem", opacity: 0.7 }} />
              <i className="bi bi-stars" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "1.5rem", color: "#4f46e5" }} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#1e293b", marginBottom: "6px" }}>Gemini AI is Analyzing Your Response…</h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", maxWidth: "420px", margin: "0 auto" }}>
              Evaluating clinical patterns to formulate the next tailored follow-up question.
            </p>
          </div>
        ) : isStepCompleted ? (
          <div style={{ background: "white", padding: "4rem 2rem", borderRadius: "20px", border: "1px solid #22c55e", textAlign: "center", boxShadow: "0 4px 20px rgba(34, 197, 94, 0.1)" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(34, 197, 94, 0.1)", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", margin: "0 auto 1.5rem" }}>
              <i className="bi bi-check2-all" />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#16a34a", marginBottom: "8px" }}>Assessment Complete!</h2>
            <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
              Gemini AI has analyzed your answers, diagnosed your primary wellness focus, and generated your clinical treatment action plan.
            </p>
            <button className="mc-btn-primary" onClick={() => nav("/survey/result")} style={{ width: "auto", minWidth: 220 }}>
              View Clinical Results & Matches <i className="bi bi-arrow-right ms-2" />
            </button>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "2.5rem 2rem", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            {/* AI Reflection Snippet */}
            {currentStep?.contextSnippet && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 14px", borderRadius: "12px", fontSize: "0.85rem", color: "#475569", marginBottom: "1.25rem", fontStyle: "italic" }}>
                <i className="bi bi-quote" style={{ color: "#4f46e5", fontSize: "1.1rem" }} />
                <span>{currentStep.contextSnippet}</span>
              </div>
            )}

            {/* Question Text */}
            <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#0f172a", lineHeight: "1.4", marginBottom: "1.5rem" }}>
              {currentStep?.question}
            </h2>

            {/* Option Chips */}
            <div style={{ display: "grid", gap: "10px", marginBottom: "1.5rem" }}>
              {currentStep?.options?.map((opt, idx) => {
                const isSelected = selectedOption === opt && !showCustomInput;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedOption(opt);
                      setShowCustomInput(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      textAlign: "left",
                      padding: "14px 18px",
                      borderRadius: "14px",
                      border: isSelected ? "2px solid #4f46e5" : "1px solid #e2e8f0",
                      background: isSelected ? "rgba(79, 70, 229, 0.05)" : "#ffffff",
                      color: isSelected ? "#4f46e5" : "#1e293b",
                      fontSize: "0.95rem",
                      fontWeight: isSelected ? "700" : "500",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          border: isSelected ? "6px solid #4f46e5" : "2px solid #cbd5e1",
                          background: "#ffffff"
                        }}
                      />
                      <span>{opt}</span>
                    </div>
                    {isSelected && <i className="bi bi-check-circle-fill text-primary" />}
                  </button>
                );
              })}

              {/* Custom Free-Text Input Option */}
              {currentStep?.allowsFreeText && (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    textAlign: "left",
                    padding: "12px 18px",
                    borderRadius: "14px",
                    border: showCustomInput ? "2px solid #4f46e5" : "1px dashed #cbd5e1",
                    background: showCustomInput ? "rgba(79, 70, 229, 0.04)" : "#f8fafc",
                    color: showCustomInput ? "#4f46e5" : "#64748b",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <i className="bi bi-pencil-square" />
                  <span>Other / Answer in your own words...</span>
                </button>
              )}
            </div>

            {/* Custom Text Area when active */}
            {showCustomInput && (
              <div style={{ marginBottom: "1.5rem" }}>
                <textarea
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #4f46e5",
                    fontSize: "0.95rem",
                    outline: "none",
                    fontFamily: "inherit",
                    boxShadow: "0 0 0 3px rgba(79, 70, 229, 0.1)"
                  }}
                />
              </div>
            )}

            {/* Next / Submit Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", borderTop: "1px solid #f1f5f9", paddingTop: "1.5rem" }}>
              {history.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowHistory(s => !s)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <i className={`bi bi-${showHistory ? "chevron-up" : "clock-history"}`} />
                  {showHistory ? "Hide Responses" : `View Responses (${history.length})`}
                </button>
              ) : <div />}

              <button
                type="button"
                className="mc-btn-primary"
                onClick={handleNext}
                disabled={submitting || (!selectedOption && (!showCustomInput || !customText.trim()))}
                style={{ width: "auto", minWidth: 170 }}
              >
                Continue <i className="bi bi-arrow-right ms-2" />
              </button>
            </div>

            {/* History Review Collapsible */}
            {showHistory && history.length > 0 && (
              <div style={{ marginTop: "1.5rem", background: "#f8fafc", padding: "16px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Your Assessment History
                </h4>
                <div style={{ display: "grid", gap: "10px" }}>
                  {history.map((item, i) => (
                    <div key={i} style={{ background: "white", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.85rem" }}>
                      <div style={{ fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                        Q{i + 1}: {item.question}
                      </div>
                      <div style={{ color: "#4f46e5", fontWeight: "600" }}>
                        &rarr; {item.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}
