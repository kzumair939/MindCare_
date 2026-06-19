import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import api from "../../api/axios";

export default function MySessions() {
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("LATEST"); // "LATEST" | "OLDEST"
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // fits well for visual grid cards layout

  useEffect(() => {
    api.get("/session/my").catch(() => ({ data: [] }))
      .then(r => setSessions(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  // Reset page when filter or sort order changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, sortOrder]);

  const tabs = ["ALL","BOOKED","CONFIRMED","COMPLETED","CANCELLED"];
  
  // 1. Filter
  const filtered = filter === "ALL" ? sessions : sessions.filter(s => s.status === filter);
  
  // 2. Sort (Latest vs Oldest by date and time)
  const sorted = [...filtered].sort((a, b) => {
    const dateTimeA = new Date(`${a.sessionDate || "1970-01-01"}T${a.sessionTime || "00:00"}`);
    const dateTimeB = new Date(`${b.sessionDate || "1970-01-01"}T${b.sessionTime || "00:00"}`);
    return sortOrder === "LATEST" ? dateTimeB - dateTimeA : dateTimeA - dateTimeB;
  });

  // 3. Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSessions = sorted.slice(startIndex, startIndex + itemsPerPage);

  const now = new Date();

  function isJoinable(s) {
    if (s.sessionType !== "ONLINE") return false;
    if (!["BOOKED","CONFIRMED"].includes(s.status)) return false;
    const dt = new Date(`${s.sessionDate}T${s.sessionTime||"00:00"}`);
    const diff = (dt - now) / 60000;
    return diff <= 60 && diff >= -120;
  }

  function statusBadge(s) {
    const map = {BOOKED:"booked",CONFIRMED:"confirmed",COMPLETED:"completed",CANCELLED:"cancelled",PENDING:"pending"};
    return <span className={`mc-status mc-status-${map[s]||"pending"}`}>{s}</span>;
  }

  return (
    <AppShell>
      <main className="mc-container">
        <section className="mc-dash-hero mc-fade-up">
          <div className="mc-dash-hero-text">
            <div className="mc-kicker"><i className="bi bi-calendar2-heart me-1"/>My Sessions</div>
            <h1>Your <span className="mc-gradient-text">Sessions</span></h1>
            <p>Track and manage all your therapy appointments.</p>
          </div>
          <Link to="/book-session" className="mc-btn-hero-primary" style={{fontSize:".875rem",padding:"11px 22px"}}>
            <i className="bi bi-plus-circle me-2"/>Book New Session
          </Link>
        </section>

        <div className="mc-controls-row mc-scroll-reveal">
          <div className="mc-tab-bar" style={{ margin: 0 }}>
            {tabs.map(t => (
              <button key={t} className={`mc-tab${filter===t?" active":""}`} onClick={() => setFilter(t)}>
                {t==="ALL" ? `All (${sessions.length})` : t.charAt(0)+t.slice(1).toLowerCase()}
                {t!=="ALL" && <span className="mc-tab-count">{sessions.filter(s=>s.status===t).length}</span>}
              </button>
            ))}
          </div>
          
          <div className="mc-sort-toggle">
            <button
              type="button"
              className={`mc-sort-btn${sortOrder === "LATEST" ? " active" : ""}`}
              onClick={() => setSortOrder("LATEST")}
              title="Newest sessions first"
            >
              <i className="bi bi-sort-down me-1"/> Latest First
            </button>
            <button
              type="button"
              className={`mc-sort-btn${sortOrder === "OLDEST" ? " active" : ""}`}
              onClick={() => setSortOrder("OLDEST")}
              title="Oldest sessions first"
            >
              <i className="bi bi-sort-up me-1"/> Oldest First
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mc-loading"><div className="mc-spinner"/><span>Loading sessions…</span></div>
        ) : paginatedSessions.length === 0 ? (
          <div className="mc-empty-page">
            <i className="bi bi-calendar2-x"/>
            <h3>No sessions found</h3>
            <p>{filter==="ALL" ? "You haven't booked any sessions yet." : `No ${filter.toLowerCase()} sessions.`}</p>
            {filter==="ALL" && <Link to="/book-session" className="mc-btn-sm-primary">Book your first session</Link>}
          </div>
        ) : (
          <>
            <div className="mc-sessions-grid">
              {paginatedSessions.map(s => (
                <div key={s.id} className="mc-session-card mc-scroll-reveal">
                  <div className="mc-session-card-top">
                    <div className="mc-session-card-avatar">
                      {s.therapistPicturePath
                        ? <img src={`/uploads/profile-pictures/${s.therapistPicturePath.split(/[/\\]/).pop()}`} alt="" onError={e=>e.target.style.display="none"}/>
                        : <i className="bi bi-person-circle"/>}
                    </div>
                    <div className="mc-session-card-info">
                      <h4>{s.therapistName || "Therapist"}</h4>
                      <p className="mc-session-therapy-type">{s.therapyType?.replace(/_/g," ") || "General Counselling"}</p>
                    </div>
                    {statusBadge(s.status)}
                  </div>

                  <div className="mc-session-card-meta">
                    <span><i className="bi bi-calendar3"/>{s.sessionDate ? new Date(s.sessionDate).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}) : "—"}</span>
                    <span><i className="bi bi-clock"/>{s.sessionTime||"—"}</span>
                    <span><i className={`bi bi-${s.sessionType==="ONLINE"?"camera-video":"geo-alt"}`}/>{s.sessionType==="ONLINE"?"Online":"In-Person"}</span>
                    {s.amount && <span><i className="bi bi-cash"/>${s.amount}</span>}
                  </div>

                  <div className="mc-session-card-actions">
                    {isJoinable(s) && (
                      <Link to={`/session/${s.id}/online`} className="mc-btn-join">
                        <i className="bi bi-camera-video-fill me-1"/>Join Session
                      </Link>
                    )}
                    {s.status==="COMPLETED" && (
                      <>
                        <Link to={`/sessions/${s.id}/summary`} className="mc-btn-confirm" style={{ textDecoration: "none", marginRight: "8px" }}>
                          <i className="bi bi-file-earmark-text me-1"/>View Report
                        </Link>
                        <Link to={`/feedback/${s.id}`} className="mc-btn-feedback">
                          <i className="bi bi-star me-1"/>Leave Feedback
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mc-pagination mc-scroll-reveal">
                <button
                  type="button"
                  className="mc-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <i className="bi bi-chevron-left"/> Prev
                </button>
                <span className="mc-page-info">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (Total {sorted.length} sessions)
                </span>
                <button
                  type="button"
                  className="mc-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Next <i className="bi bi-chevron-right"/>
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}
