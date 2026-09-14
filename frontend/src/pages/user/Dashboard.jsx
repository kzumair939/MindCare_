import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { useCache } from "../../hooks/useCache";
import {
  SplineLineChart,
  RadialWellnessGauge,
  WeeklySessionBarChart
} from "../../components/dashboard/DashboardCharts";
import "../../styles/dashboard-pro.css";

function getSessionTimeDetails(session) {
  if (!session || !session.sessionDate) {
    return { formattedDate: "—", formattedTime: "—", canJoin: false, isLive: false, isPast: false, statusText: "Scheduled" };
  }

  const dateStr = session.sessionDate;
  const timeStr = session.sessionTime || "00:00:00";

  let formattedDate = dateStr;
  try {
    const d = new Date(dateStr + "T00:00:00");
    formattedDate = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch {}

  let formattedTime = timeStr;
  const [h = 0, m = 0] = timeStr.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  formattedTime = `${h12}:${String(m).padStart(2, "0")} ${ampm}`;

  const now = new Date();
  const sessionStart = new Date(`${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  const sessionEnd = new Date(sessionStart.getTime() + 60 * 60 * 1000); // 60 min duration

  // Can join starting 10 minutes prior to session start through session end
  const canJoin = now >= new Date(sessionStart.getTime() - 10 * 60 * 1000) && now <= sessionEnd;
  const isLive = now >= sessionStart && now <= sessionEnd;
  const isPast = now > sessionEnd;

  let statusText = "Upcoming";
  if (isLive) statusText = "Live Now";
  else if (canJoin) statusText = "Opens Soon";
  else if (isPast) statusText = "Passed";

  return { formattedDate, formattedTime, canJoin, isLive, isPast, statusText };
}

export default function Dashboard() {
  const { user } = useAuth();
  const { cachedFetch } = useCache();

  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, freeLeft: 2 });
  const [sessions, setSessions] = useState([]);
  const [nextSession, setNextSession] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [surveyScore, setSurveyScore] = useState(0);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [checkinMessage, setCheckinMessage] = useState("Tap an emoji to begin");
  const [trendMood, setTrendMood] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [trendEnergy, setTrendEnergy] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      cachedFetch("sessions:my", () => api.get("/session/my").then((r) => r.data || []), 60 * 1000),
      api.get("/survey").catch(() => ({ data: null })),
      cachedFetch("therapists:all", () => api.get("/therapist/all").then((r) => r.data || []), 60 * 1000)
    ])
      .then(([allSessions, surveyRes, allTherapists]) => {
        const now = new Date();
        const validSessions = allSessions || [];
        const upcoming = validSessions
          .filter((s) => {
            if (s.status === "CANCELLED" || s.status === "COMPLETED") return false;
            const sDate = s.sessionDate;
            const sTime = s.sessionTime || "23:59:59";
            const [h = 23, m = 59] = sTime.split(":").map(Number);
            const sessionEnd = new Date(`${sDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
            sessionEnd.setMinutes(sessionEnd.getMinutes() + 60);
            return sessionEnd >= now;
          })
          .sort((a, b) => {
            const aTime = a.sessionTime || "00:00:00";
            const bTime = b.sessionTime || "00:00:00";
            return new Date(`${a.sessionDate}T${aTime}`) - new Date(`${b.sessionDate}T${bTime}`);
          });
        const completed = validSessions.filter((s) => s.status === "COMPLETED");
        const used = validSessions.filter((s) => s.status !== "CANCELLED").length;

        setStats({
          total: validSessions.length,
          upcoming: upcoming.length,
          completed: completed.length,
          freeLeft: Math.max(0, 2 - used)
        });

        setSessions(validSessions);
        setNextSession(upcoming[0] || null);

        // Real Survey score
        if (surveyRes?.data && surveyRes.data.overallScore) {
          const sc = Number(surveyRes.data.overallScore) || 0;
          setSurveyScore(sc);
          setTrendMood([sc, sc, sc, sc, sc, sc, sc]);
          setTrendEnergy([sc, sc, sc, sc, sc, sc, sc]);
        } else {
          setSurveyScore(0);
          setTrendMood([0, 0, 0, 0, 0, 0, 0]);
          setTrendEnergy([0, 0, 0, 0, 0, 0, 0]);
        }

        // Real Therapists only
        setTherapists((allTherapists || []).slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cachedFetch]);

  // Compute 6-week session frequency strictly from real session data
  const weeklyCounts = [0, 0, 0, 0, 0, 0];
  if (sessions.length > 0) {
    const now = new Date();
    sessions.forEach((s) => {
      if (s.sessionDate) {
        const diffWeeks = Math.floor((now - new Date(s.sessionDate)) / (7 * 24 * 60 * 60 * 1000));
        if (diffWeeks >= 0 && diffWeeks < 6) {
          weeklyCounts[5 - diffWeeks] += 1;
        }
      }
    });
  }

  // Mood tokens with aesthetic custom SVGs and color palettes
  const moodTokens = [
    {
      id: "low",
      label: "Drained",
      score: 20,
      accent: "#6366f1",
      glow: "rgba(99, 102, 241, 0.25)",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          <line x1="8" y1="19" x2="6" y2="22" stroke="#818cf8" strokeWidth="2" />
          <line x1="12" y1="19" x2="10" y2="22" stroke="#818cf8" strokeWidth="2" />
          <line x1="16" y1="19" x2="14" y2="22" stroke="#818cf8" strokeWidth="2" />
        </svg>
      )
    },
    {
      id: "meh",
      label: "Low",
      score: 40,
      accent: "#94a3b8",
      glow: "rgba(148, 163, 184, 0.25)",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          <circle cx="17" cy="6" r="1.5" fill="currentColor" />
        </svg>
      )
    },
    {
      id: "okay",
      label: "Balanced",
      score: 60,
      accent: "#10b981",
      glow: "rgba(16, 185, 129, 0.25)",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      )
    },
    {
      id: "good",
      label: "Radiant",
      score: 80,
      accent: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.25)",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      )
    },
    {
      id: "great",
      label: "Euphoric",
      score: 100,
      accent: "#06b6d4",
      glow: "rgba(6, 182, 212, 0.3)",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" fill="currentColor" fillOpacity="0.2" />
        </svg>
      )
    }
  ];

  // Handle Mood Token Click
  const handleMoodSelect = (token, idx) => {
    setSelectedEmoji(idx);
    setCheckinMessage(`Feeling ${token.label} — Wellness score updated`);
    setSurveyScore(token.score);
    setTrendMood((prev) => {
      const arr = [...prev];
      arr[6] = token.score;
      return arr;
    });
  };

  return (
    <AppShell>
      <div className="mc-container mc-pro-dashboard">
        
        {/* ── 1. HEADER / GREETING ── */}
        <header className="mc-pro-header">
          <div className="mc-pro-header-info">
            <h1>
              Welcome back, <span className="mc-gradient-text">{user?.displayName || user?.username || "Member"}</span>
              <span className="mc-greeting-sparkle" title="Active">
                <i className="bi bi-stars" style={{ color: "#38bdf8", fontSize: "1.2rem" }} />
              </span>
            </h1>
            <p>Your mental wellness journey continues. Here's today's overview.</p>
          </div>
        </header>

        {/* ── 2. TOP 4 STAT CARDS ── */}
        <section className="mc-pro-stat-grid" aria-label="User Session Statistics">
          
          {/* Total Sessions */}
          <Link to="/my-sessions" className="mc-pro-stat-card accent-cyan">
            <div className="mc-pro-stat-top">
              <span className="mc-pro-stat-icon" style={{ color: "#06b6d4" }}>
                <i className="bi bi-calendar-range" />
              </span>
            </div>
            <div className="mc-pro-stat-value">{loading ? "—" : stats.total}</div>
            <div className="mc-pro-stat-label">Total Sessions</div>
          </Link>

          {/* Upcoming */}
          <Link to="/my-sessions" className="mc-pro-stat-card accent-blue">
            <div className="mc-pro-stat-top">
              <span className="mc-pro-stat-icon" style={{ color: "#3b82f6" }}>
                <i className="bi bi-clock-history" />
              </span>
            </div>
            <div className="mc-pro-stat-value">{loading ? "—" : stats.upcoming}</div>
            <div className="mc-pro-stat-label">Upcoming</div>
          </Link>

          {/* Completed */}
          <Link to="/my-sessions" className="mc-pro-stat-card accent-teal">
            <div className="mc-pro-stat-top">
              <span className="mc-pro-stat-icon" style={{ color: "#10b981" }}>
                <i className="bi bi-check2-circle" />
              </span>
            </div>
            <div className="mc-pro-stat-value">{loading ? "—" : stats.completed}</div>
            <div className="mc-pro-stat-label">Completed</div>
          </Link>

          {/* Free Left */}
          <Link to="/book-session" className="mc-pro-stat-card accent-purple">
            <div className="mc-pro-stat-top">
              <span className="mc-pro-stat-icon" style={{ color: "#8b5cf6" }}>
                <i className="bi bi-ticket-perforated" />
              </span>
            </div>
            <div className="mc-pro-stat-value">{loading ? "—" : stats.freeLeft}</div>
            <div className="mc-pro-stat-label">Free Left</div>
          </Link>

        </section>

        {/* ── 3. MIDDLE SECTION: WELLNESS TRENDS & SCORE ── */}
        <div className="mc-pro-grid-2">
          
          {/* Left: Wellness Trends Dual Spline Chart */}
          <section className="mc-pro-card">
            <div className="mc-pro-card-header">
              <div>
                <h2 className="mc-pro-card-title">Wellness Trends</h2>
                <span className="mc-pro-card-subtitle">Last 7 days</span>
              </div>
              <div className="mc-pro-legend">
                <span><span className="mc-pro-legend-dot" style={{ backgroundColor: "#06b6d4" }} />Mood</span>
                <span><span className="mc-pro-legend-dot" style={{ backgroundColor: "#8b5cf6" }} />Energy</span>
              </div>
            </div>

            <SplineLineChart
              series={[
                { name: "Mood", color: "#06b6d4", data: trendMood },
                { name: "Energy", color: "#8b5cf6", data: trendEnergy }
              ]}
              labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
              yMax={100}
              yMin={0}
              ySteps={[0, 25, 50, 75, 100]}
            />
          </section>

          {/* Right: Wellness Score Radial Gauge */}
          <section className="mc-pro-card">
            <div className="mc-pro-card-header">
              <div>
                <h2 className="mc-pro-card-title">Wellness Score</h2>
                <span className="mc-pro-card-subtitle">Based on your AI check-ins</span>
              </div>
            </div>

            <RadialWellnessGauge
              score={surveyScore}
              sleep={surveyScore > 0 ? Math.round(surveyScore * 0.95) : 0}
              mood={surveyScore > 0 ? surveyScore : 0}
              energy={surveyScore > 0 ? Math.round(surveyScore * 0.9) : 0}
            />
          </section>

        </div>

        {/* ── 4. MIDDLE ROW 2: FREQUENCY, NEXT SESSION, DAILY CHECK-IN ── */}
        <div className="mc-pro-grid-3">
          
          {/* Card 1: Session Frequency */}
          <section className="mc-pro-card">
            <div className="mc-pro-card-header">
              <div>
                <h2 className="mc-pro-card-title">Session Frequency</h2>
                <span className="mc-pro-card-subtitle">Last 6 weeks</span>
              </div>
            </div>
            <WeeklySessionBarChart data={weeklyCounts} labels={["W1", "W2", "W3", "W4", "W5", "W6"]} />
          </section>

          {/* Card 2: Next Session */}
          <section className="mc-pro-card">
            <div className="mc-pro-card-header">
              <div>
                <h2 className="mc-pro-card-title">Next Session</h2>
              </div>
            </div>

            {nextSession ? (() => {
              const { formattedDate, formattedTime, canJoin, isLive, isPast, statusText } = getSessionTimeDetails(nextSession);
              return (
                <>
                  <div className="mc-next-session-box">
                    <div className="mc-next-doc-avatar">
                      {nextSession.therapistPicturePath ? (
                        <img src={nextSession.therapistPicturePath} alt={nextSession.therapistName} style={{ width: "100%", height: "100%", borderRadius: "12px", objectFit: "cover" }} />
                      ) : (
                        <i className="bi bi-person-fill" />
                      )}
                    </div>
                    <div className="mc-next-doc-info">
                      <div className="mc-next-doc-name">
                        {nextSession.therapistName || "Therapist"}
                      </div>
                      <div className="mc-next-doc-spec">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <i className="bi bi-camera-video text-info" /> {nextSession.sessionType === "ONLINE" ? "Online Video Call" : "In-Person Session"}
                        </span>
                      </div>
                      <div className="mc-next-doc-time" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <i className="bi bi-calendar2-event text-primary" />
                        <strong style={{ color: "var(--mc-db-text-primary)" }}>{formattedDate}</strong>
                        <span>•</span>
                        <i className="bi bi-clock text-primary" />
                        <strong style={{ color: "var(--mc-db-text-primary)" }}>{formattedTime}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mc-next-actions">
                    {canJoin ? (
                      <Link to={`/session/${nextSession.id}/online`} className="mc-btn-join">
                        <i className="bi bi-camera-video-fill" />
                        <span>Join Call</span>
                        {isLive && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "inline-block", marginLeft: 4 }} />}
                      </Link>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(59,107,255,0.08)", border: "1px solid rgba(59,107,255,0.2)", borderRadius: "var(--mc-radius-sm)", color: "var(--mc-db-text-muted)", fontSize: "0.82rem", flex: 1, fontWeight: 600 }}>
                        <i className="bi bi-clock-history text-primary" style={{ fontSize: "1rem" }} />
                        <span>Call unlocks at {formattedTime}</span>
                      </div>
                    )}
                    <Link to="/book-session" className="mc-btn-reschedule">
                      <i className="bi bi-arrow-repeat" />
                      <span>Reschedule</span>
                    </Link>
                  </div>
                </>
              );
            })() : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "1.5rem 0", textAlign: "center", color: "var(--mc-db-text-muted)" }}>
                <i className="bi bi-calendar-check" style={{ fontSize: "2rem", marginBottom: "0.4rem" }} />
                <p style={{ margin: 0, fontWeight: 700, color: "var(--mc-db-text-primary)", fontSize: "0.9rem" }}>
                  No Upcoming Sessions
                </p>
                <Link to="/book-session" className="mc-btn-join" style={{ marginTop: "1rem", width: "100%" }}>
                  Book a Session
                </Link>
              </div>
            )}
          </section>

          {/* Card 3: Daily Check-in with Aesthetic Mood Tokens */}
          <section className="mc-pro-card">
            <div className="mc-pro-card-header">
              <div>
                <h2 className="mc-pro-card-title">Daily Check-in</h2>
                <span className="mc-pro-card-subtitle">How are you feeling right now?</span>
              </div>
            </div>

            <div className="mc-checkin-tokens">
              {moodTokens.map((token, idx) => (
                <button
                  key={token.id}
                  type="button"
                  className={`mc-mood-token ${selectedEmoji === idx ? "active" : ""}`}
                  style={{
                    "--token-color": token.accent,
                    "--token-glow": token.glow
                  }}
                  onClick={() => handleMoodSelect(token, idx)}
                  title={token.label}
                  aria-label={token.label}
                >
                  <span className="mc-mood-token-icon">{token.icon}</span>
                  <span className="mc-mood-token-label">{token.label}</span>
                </button>
              ))}
            </div>

            <div className="mc-checkin-caption">
              <i className="bi bi-activity" style={{ color: "#06b6d4" }} />
              <span>{checkinMessage}</span>
            </div>
          </section>

        </div>

        {/* ── 5. LOWER ROW: MATCHED THERAPISTS & QUICK ACTIONS ── */}
        <div className="mc-pro-grid-2-even">
          
          {/* Matched Therapists */}
          <section className="mc-pro-card">
            <div className="mc-pro-card-header">
              <h2 className="mc-pro-card-title">Matched Therapists</h2>
              <Link to="/book-session" style={{ color: "#06b6d4", textDecoration: "none", fontSize: "0.84rem", fontWeight: 700 }}>
                View all →
              </Link>
            </div>

            {therapists.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", textAlign: "center", color: "var(--mc-db-text-muted)" }}>
                <i className="bi bi-people" style={{ fontSize: "2rem", marginBottom: "0.4rem" }} />
                <p style={{ margin: 0, fontWeight: 700, color: "var(--mc-db-text-primary)", fontSize: "0.9rem" }}>
                  No Therapists Available Currently
                </p>
              </div>
            ) : (
              <div className="mc-item-list">
                {therapists.map((th) => (
                  <div key={th.id} className="mc-list-row">
                    <div className="mc-list-left">
                      <div className="mc-avatar-initials">
                        {(th.name || "Dr").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="mc-row-title">{th.name}</div>
                        <div className="mc-row-sub">{th.specialization || "Licensed Clinician"}</div>
                      </div>
                    </div>
                    <div className="mc-row-meta-right">
                      <div className="mc-rating-pill">
                        ★ {th.rating || "5.0"}
                      </div>
                      <span style={{ fontSize: "0.74rem", color: "var(--mc-db-text-secondary)" }}>
                        {th.active ? "Available" : "Offline"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="mc-pro-card">
            <div className="mc-pro-card-header">
              <h2 className="mc-pro-card-title" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <i className="bi bi-lightning-charge-fill" style={{ color: "#f59e0b" }} /> Quick Actions
              </h2>
            </div>

            <div className="mc-item-list">
              <Link to="/book-session" className="mc-action-tile">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div className="mc-action-tile-icon blue">
                    <i className="bi bi-calendar-plus" />
                  </div>
                  <div>
                    <div className="mc-row-title">Book a Session</div>
                    <div className="mc-row-sub">Find &amp; book a therapist</div>
                  </div>
                </div>
                <i className="bi bi-chevron-right" style={{ color: "var(--mc-db-text-muted)" }} />
              </Link>

              <Link to="/survey" className="mc-action-tile">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div className="mc-action-tile-icon pink">
                    <i className="bi bi-clipboard2-pulse" />
                  </div>
                  <div>
                    <div className="mc-row-title">AI Check-in Survey</div>
                    <div className="mc-row-sub">Get personalised matches</div>
                  </div>
                </div>
                <i className="bi bi-chevron-right" style={{ color: "var(--mc-db-text-muted)" }} />
              </Link>

              <Link to="/group" className="mc-action-tile">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div className="mc-action-tile-icon purple">
                    <i className="bi bi-people-fill" />
                  </div>
                  <div>
                    <div className="mc-row-title">Group Support</div>
                    <div className="mc-row-sub">Join peer support rooms</div>
                  </div>
                </div>
                <i className="bi bi-chevron-right" style={{ color: "var(--mc-db-text-muted)" }} />
              </Link>
            </div>
          </section>

        </div>

      </div>
    </AppShell>
  );
}
