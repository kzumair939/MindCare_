import React, { useState, useEffect } from "react";
import AppShell from "../../components/layout/AppShell";
import api from "../../api/axios";

const ACTION_LABELS = {
  dismiss:       { label: "Dismiss",       icon: "x-circle",         cls: "mc-btn-outline-muted" },
  "warn-user":   { label: "Warn User",     icon: "exclamation-circle",cls: "mc-btn-warn" },
  "block-user":  { label: "Block User",    icon: "person-slash",      cls: "mc-btn-danger" },
  "delete-message": { label: "Delete Msg", icon: "trash",            cls: "mc-btn-danger-soft" },
};

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [selected, setSelected] = useState(null); // expanded report card

  useEffect(() => {
    api.get("/admin/reports")
      .then(r => setReports(r.data || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(reportId, action) {
    setActing(`${reportId}-${action}`);
    try {
      await api.post(`/admin/reports/${reportId}/${action}`);
      setReports(prev => prev.filter(r => r.id !== reportId));
      if (selected?.id === reportId) setSelected(null);
    } catch (err) {
      alert(err.response?.data?.message || "Action failed. Please try again.");
    } finally {
      setActing(null);
    }
  }

  return (
    <AppShell>
      <main className="mc-container">
        <section className="mc-dash-hero mc-fade-up">
          <div className="mc-dash-hero-text">
            <div className="mc-kicker"><i className="bi bi-flag-fill me-1"/>Moderation</div>
            <h1>Reported <span className="mc-gradient-text">Messages</span></h1>
            <p>Review flagged messages from group chat rooms and take appropriate action.</p>
          </div>
          {reports.length > 0 && (
            <div className="mc-report-count-badge">
              <i className="bi bi-flag-fill me-1"/>
              {reports.length} open {reports.length === 1 ? "report" : "reports"}
            </div>
          )}
        </section>

        {loading ? (
          <div className="mc-loading"><div className="mc-spinner"/><span>Loading reports…</span></div>
        ) : reports.length === 0 ? (
          <div className="mc-empty-page">
            <i className="bi bi-shield-check"/>
            <h3>No pending reports</h3>
            <p>All reported messages have been reviewed. The platform is clean!</p>
          </div>
        ) : (
          <div className="mc-reports-grid">
            {reports.map(r => (
              <div
                key={r.id}
                className={`mc-report-card mc-scroll-reveal${selected?.id === r.id ? " mc-report-card-expanded" : ""}`}
                onClick={() => setSelected(selected?.id === r.id ? null : r)}
              >
                {/* Card header */}
                <div className="mc-report-card-header">
                  <div className="mc-report-card-room">
                    <i className="bi bi-people-fill me-1"/>
                    {r.roomName || "Group Room"}
                  </div>
                  <span className="mc-report-status-badge">
                    <i className="bi bi-flag-fill me-1"/>Flagged
                  </span>
                </div>

                {/* Message preview */}
                <div className="mc-report-message-preview">
                  <i className="bi bi-chat-quote me-2"/>
                  <blockquote className="mc-report-quote">
                    {r.content?.startsWith("[Message removed")
                      ? <em style={{ color: "var(--mc-muted)" }}>[Message already removed]</em>
                      : `"${r.content?.slice(0, 200)}${r.content?.length > 200 ? "…" : ""}"`}
                  </blockquote>
                </div>

                {/* Sender info */}
                <div className="mc-report-sender-row">
                  <div className="mc-report-sender">
                    <div className="mc-report-sender-avatar">
                      {r.anonymous ? <i className="bi bi-incognito"/> : <i className="bi bi-person-circle"/>}
                    </div>
                    <div>
                      <div className="mc-report-sender-name">
                        {r.senderName || "Unknown User"}
                        {r.senderBlocked && <span className="mc-blocked-tag ms-2">Blocked</span>}
                      </div>
                      <div className="mc-report-sender-meta">@{r.senderUsername}</div>
                    </div>
                  </div>
                  {r.sentAt && (
                    <div className="mc-report-time">
                      <i className="bi bi-clock me-1"/>
                      {new Date(r.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>

                {/* Report reason */}
                {r.reportReason && (
                  <div className="mc-report-reason">
                    <i className="bi bi-chat-text me-2"/>
                    <strong>Reason: </strong>{r.reportReason}
                  </div>
                )}

                {/* Actions — always visible */}
                <div className="mc-report-actions" onClick={e => e.stopPropagation()}>
                  {Object.entries(ACTION_LABELS).map(([action, cfg]) => (
                    <button
                      key={action}
                      className={`mc-report-action-btn ${cfg.cls}`}
                      disabled={acting === `${r.id}-${action}` || r.senderBlocked && action === "block-user"}
                      onClick={() => handleAction(r.id, action)}
                      title={cfg.label}
                    >
                      {acting === `${r.id}-${action}`
                        ? <span className="spinner-border spinner-border-sm me-1"/>
                        : <i className={`bi bi-${cfg.icon} me-1`}/>
                      }
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
