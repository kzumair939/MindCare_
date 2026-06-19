import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import api from "../../api/axios";

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    Promise.all([
      api.get("/admin/analytics").catch(() => ({ data: {} })),
      api.get("/admin/feedback").catch(() => ({ data: [] })),
    ]).then(([a, f]) => {
      setData(a.data || {});
      setFeedback(f.data || []);
    }).finally(() => setLoading(false));
  }, []);

  function StarRating({ rating }) {
    return (
      <span className="mc-star-rating">
        {[1,2,3,4,5].map(n => (
          <i key={n} className={`bi bi-star${rating >= n ? "-fill" : ""}`} style={{ color: rating >= n ? "#f59e0b" : "var(--mc-border)" }}/>
        ))}
      </span>
    );
  }

  const sessionStatusData = data ? [
    { label: "Completed", val: data.completedSessions || 0, color: "var(--mc-teal)",    icon: "check2-circle" },
    { label: "Booked",    val: data.bookedSessions || 0,    color: "var(--mc-primary)",  icon: "calendar2-check" },
    { label: "Confirmed", val: data.confirmedSessions || 0, color: "var(--mc-green)",    icon: "patch-check" },
    { label: "Cancelled", val: data.cancelledSessions || 0, color: "var(--mc-red)",      icon: "x-circle" },
  ] : [];
  const total = sessionStatusData.reduce((s, d) => s + d.val, 0) || 1;

  return (
    <AppShell>
      <main className="mc-container">
        <section className="mc-dash-hero mc-fade-up">
          <div className="mc-dash-hero-text">
            <div className="mc-kicker"><i className="bi bi-bar-chart-line me-1"/>Admin</div>
            <h1>Analytics & <span className="mc-gradient-text">Insights</span></h1>
            <p>Platform performance, session statistics, and therapist feedback.</p>
          </div>
          <Link to="/admin" className="mc-btn-hero-outline" style={{ fontSize: ".875rem", padding: "10px 20px" }}>
            <i className="bi bi-arrow-left me-2"/>Back to Dashboard
          </Link>
        </section>

        {/* Tabs */}
        <div className="mc-tab-bar mc-scroll-reveal">
          {[["overview","Overview","grid-1x2"],["feedback","Feedback","star"],["therapists","Therapist Ratings","person-badge"]].map(([id,label,icon]) => (
            <button key={id} className={`mc-tab${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>
              <i className={`bi bi-${icon} me-1`}/>{label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mc-loading"><div className="mc-spinner"/><span>Loading analytics…</span></div>
        ) : (
          <>
            {tab === "overview" && (
              <>
                {/* Key metrics */}
                <div className="mc-stat-grid-4 mc-scroll-reveal" style={{ marginTop: 24 }}>
                  {[
                    { icon:"calendar2-check",  label:"Total Sessions",   val: data?.totalSessions || 0,    color:"blue"   },
                    { icon:"people-fill",       label:"Total Users",      val: data?.totalUsers || 0,       color:"green"  },
                    { icon:"person-badge",      label:"Therapists",       val: data?.totalTherapists || 0,  color:"purple" },
                    { icon:"star-fill",         label:"Avg. Rating",      val: `${data?.averageRating || 0} / 5`, color:"orange" },
                  ].map((c, i) => (
                    <div key={c.label} className={`mc-dash-stat-card mc-card-${c.color}`} style={{ animationDelay: `${i*0.08}s` }}>
                      <div className={`mc-dash-stat-icon mc-icon-${c.color}`}><i className={`bi bi-${c.icon}`}/></div>
                      <div className="mc-dash-stat-val">{c.val}</div>
                      <div className="mc-dash-stat-label">{c.label}</div>
                    </div>
                  ))}
                </div>

                {/* Session breakdown visual */}
                <div className="mc-card mc-scroll-reveal" style={{ marginBottom: 24 }}>
                  <div className="mc-card-header">
                    <h3><i className="bi bi-pie-chart-fill me-2 text-primary"/>Session Status Breakdown</h3>
                  </div>
                  <div className="mc-analytics-bar-list">
                    {sessionStatusData.map(s => (
                      <div key={s.label} className="mc-analytics-bar-row">
                        <div className="mc-analytics-bar-label">
                          <i className={`bi bi-${s.icon} me-2`} style={{ color: s.color }}/>
                          {s.label}
                        </div>
                        <div className="mc-analytics-bar-track">
                          <div
                            className="mc-analytics-bar-fill"
                            style={{ width: `${Math.round((s.val / total) * 100)}%`, background: s.color }}
                          />
                        </div>
                        <div className="mc-analytics-bar-val">{s.val} <span>({Math.round((s.val / total) * 100)}%)</span></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feedback summary */}
                <div className="mc-card mc-scroll-reveal">
                  <div className="mc-card-header">
                    <h3><i className="bi bi-chat-square-heart me-2 text-pink"/>Feedback Summary</h3>
                  </div>
                  <div className="mc-analytics-summary-row">
                    <div className="mc-analytics-summary-stat">
                      <div className="mc-analytics-big-num">{data?.averageRating || 0}</div>
                      <StarRating rating={data?.averageRating || 0}/>
                      <div className="mc-analytics-summary-label">Average Rating</div>
                    </div>
                    <div className="mc-analytics-summary-stat">
                      <div className="mc-analytics-big-num">{data?.totalFeedback || 0}</div>
                      <div className="mc-analytics-summary-label">Total Reviews</div>
                    </div>
                    <div className="mc-analytics-summary-stat">
                      <div className="mc-analytics-big-num">
                        {feedback.filter(f => f.rating >= 4).length}
                      </div>
                      <div className="mc-analytics-summary-label">Positive Reviews (4–5★)</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === "feedback" && (
              <div className="mc-scroll-reveal" style={{ marginTop: 24 }}>
                {feedback.length === 0 ? (
                  <div className="mc-empty-page">
                    <i className="bi bi-chat-square-heart"/>
                    <h3>No feedback yet</h3>
                    <p>Session feedback will appear here after users complete sessions.</p>
                  </div>
                ) : (
                  <div className="mc-feedback-grid">
                    {feedback.map(f => (
                      <div key={f.id} className="mc-feedback-card mc-scroll-reveal">
                        <div className="mc-feedback-card-top">
                          <div className="mc-feedback-avatar"><i className="bi bi-person-circle"/></div>
                          <div>
                            <div className="mc-feedback-user">{f.userName}</div>
                            <div className="mc-feedback-therapist">Session with {f.therapistName}</div>
                          </div>
                          <StarRating rating={f.rating}/>
                        </div>
                        {f.comments && <p className="mc-feedback-comment">"{f.comments}"</p>}
                        <div className="mc-feedback-meta">
                          {f.nps != null && <span><i className="bi bi-graph-up me-1"/>NPS: {f.nps}/10</span>}
                          {f.createdAt && (
                            <span><i className="bi bi-calendar3 me-1"/>
                              {new Date(f.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "therapists" && (
              <div className="mc-scroll-reveal" style={{ marginTop: 24 }}>
                {(!data?.therapistRatings || data.therapistRatings.length === 0) ? (
                  <div className="mc-empty-page">
                    <i className="bi bi-person-badge"/>
                    <h3>No therapist ratings yet</h3>
                    <p>Ratings will appear once sessions are completed and reviewed.</p>
                  </div>
                ) : (
                  <div className="mc-card">
                    <div className="mc-card-header">
                      <h3><i className="bi bi-people-fill me-2 text-primary"/>Therapist Performance</h3>
                    </div>
                    <div className="mc-analytics-therapist-list">
                      {data.therapistRatings.sort((a, b) => b.avgRating - a.avgRating).map((t, i) => (
                        <div key={t.therapistId} className="mc-analytics-therapist-row">
                          <div className="mc-analytics-rank">#{i + 1}</div>
                          <div className="mc-session-avatar"><i className="bi bi-person-badge"/></div>
                          <div className="mc-analytics-therapist-info">
                            <strong>{t.name || `Therapist #${t.therapistId}`}</strong>
                          </div>
                          <div className="mc-analytics-rating-bar-wrap">
                            <div className="mc-analytics-bar-track">
                              <div className="mc-analytics-bar-fill" style={{ width: `${(t.avgRating / 5) * 100}%`, background: "var(--mc-green)" }}/>
                            </div>
                          </div>
                          <div className="mc-analytics-rating-num">
                            <StarRating rating={t.avgRating}/>
                            <strong>{t.avgRating}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}
