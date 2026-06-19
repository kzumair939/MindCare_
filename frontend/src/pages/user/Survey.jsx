import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import api from "../../api/axios";

const QUESTIONS = [
  { q: "How often have you felt anxious or worried?",         low: "Never", high: "Very often" },
  { q: "How often have you felt low or hopeless?",            low: "Never", high: "Very often" },
  { q: "How well have you been sleeping?",                    low: "Very poorly", high: "Very well" },
  { q: "How difficult is it to focus during the day?",        low: "Not at all", high: "Extremely" },
  { q: "How often do you feel overwhelmed?",                  low: "Never", high: "Always" },
  { q: "How supported do you feel by people around you?",     low: "Not at all", high: "Very supported" },
  { q: "How often do you avoid daily responsibilities?",      low: "Never", high: "Very often" },
  { q: "How intense are your stress symptoms?",               low: "None", high: "Very intense" },
  { q: "How often do you feel safe and in control?",          low: "Never", high: "Always" },
  { q: "How urgently do you need support?",                   low: "Not urgent", high: "Very urgent" },
];

const SCORE_LABELS = ["", "1 — Low", "2", "3 — Moderate", "4", "5 — High"];
const SCORE_COLORS = ["", "mc-score-1", "mc-score-2", "mc-score-3", "mc-score-4", "mc-score-5"];

export default function Survey() {
  const nav = useNavigate();
  const [answers, setAnswers] = useState(Array(10).fill(3));
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);

  const answered = answers.filter((a, i) => a > 0).length;
  const progress = Math.round((answered / 10) * 100);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const body = {};
    answers.forEach((v, i) => body[`q${i + 1}`] = v);
    try {
      await api.post("/survey", body);
      nav("/survey/result");
    } catch {
      setLoading(false);
    }
  }

  function setScore(qi, score) {
    const a = [...answers];
    a[qi] = score;
    setAnswers(a);
    // Auto advance to next question after a short delay
    if (qi < 9) setTimeout(() => setCurrent(qi + 1), 300);
  }

  return (
    <AppShell>
      <main className="mc-container">
        <section className="mc-dash-hero mc-fade-up">
          <div className="mc-dash-hero-text">
            <div className="mc-kicker"><i className="bi bi-clipboard2-pulse me-1"/>Wellbeing Check-in</div>
            <h1>Answer gently and <span className="mc-gradient-text">honestly.</span></h1>
            <p>Rate each question from 1 (low) to 5 (high). You can retake this anytime.</p>
          </div>
        </section>

        {/* Progress bar */}
        <div className="mc-survey-progress-wrap">
          <div className="mc-survey-progress-bar">
            <div className="mc-survey-progress-fill" style={{ width: `${progress}%` }}/>
          </div>
          <span className="mc-survey-progress-label">{answered} / 10 answered</span>
        </div>

        {/* Question navigator */}
        <div className="mc-survey-nav-dots">
          {QUESTIONS.map((_, i) => (
            <button
              key={i}
              className={`mc-survey-dot${i === current ? " active" : ""}${answers[i] > 0 ? " done" : ""}`}
              onClick={() => setCurrent(i)}
              title={`Question ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mc-survey-cards">
            {QUESTIONS.map((item, i) => (
              <div
                key={i}
                className={`mc-survey-card${i === current ? " mc-survey-card-active" : ""}`}
                style={{ display: i === current ? "block" : "none" }}
              >
                <div className="mc-survey-card-header">
                  <span className="mc-survey-num">{i + 1}</span>
                  <div className="mc-survey-q-text">
                    <h3>{item.q}</h3>
                    <p>Rate from 1 (low) to 5 (high)</p>
                  </div>
                </div>

                <div className="mc-survey-scale-row">
                  <span className="mc-survey-scale-label">{item.low}</span>
                  <div className="mc-survey-scale">
                    {[1, 2, 3, 4, 5].map(score => (
                      <label key={score} className={`mc-scale-option${answers[i] === score ? " mc-scale-selected" : ""}`}>
                        <input
                          type="radio"
                          name={`q${i}`}
                          checked={answers[i] === score}
                          onChange={() => setScore(i, score)}
                        />
                        <span className={`mc-scale-dot ${answers[i] === score ? SCORE_COLORS[score] : ""}`}>{score}</span>
                      </label>
                    ))}
                  </div>
                  <span className="mc-survey-scale-label">{item.high}</span>
                </div>

                {answers[i] > 0 && (
                  <div className={`mc-survey-selected-label ${SCORE_COLORS[answers[i]]}`}>
                    <i className="bi bi-check-circle-fill me-1"/>
                    Selected: {SCORE_LABELS[answers[i]]}
                  </div>
                )}

                <div className="mc-survey-card-actions">
                  {i > 0 && (
                    <button type="button" className="mc-survey-nav-btn" onClick={() => setCurrent(i - 1)}>
                      <i className="bi bi-arrow-left me-1"/>Previous
                    </button>
                  )}
                  {i < 9 ? (
                    <button
                      type="button"
                      className={`mc-survey-nav-btn mc-survey-nav-next${answers[i] > 0 ? " active" : ""}`}
                      onClick={() => setCurrent(i + 1)}
                    >
                      Next<i className="bi bi-arrow-right ms-1"/>
                    </button>
                  ) : (
                    <button
                      className="mc-btn-primary mc-survey-submit-btn"
                      type="submit"
                      disabled={loading || answered < 10}
                    >
                      {loading
                        ? <><span className="spinner-border spinner-border-sm me-2"/>Submitting…</>
                        : <><i className="bi bi-clipboard2-check me-2"/>Submit Survey</>
                      }
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Submit available from anywhere when all answered */}
          {answered === 10 && current < 9 && (
            <div className="mc-survey-all-done">
              <i className="bi bi-check-circle-fill me-2 text-success"/>All questions answered!
              <button className="mc-btn-primary ms-3" type="submit" disabled={loading} style={{ width: "auto", minWidth: 160 }}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2"/>Submitting…</> : <><i className="bi bi-clipboard2-check me-2"/>Submit Survey</>}
              </button>
            </div>
          )}
        </form>
      </main>
    </AppShell>
  );
}
