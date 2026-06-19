import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import api from "../../api/axios";

function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"; }
function fmtTime(t) { return t || "—"; }
function fmt(s) { return s ? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ") : "—"; }
function statusClass(s) {
  const map = { BOOKED: "booked", CONFIRMED: "confirmed", COMPLETED: "completed", CANCELLED: "cancelled", PENDING: "pending" };
  return `mc-status mc-status-${map[s?.toUpperCase()] || "pending"}`;
}

export default function AdminSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("LATEST"); // "LATEST" | "OLDEST"
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    api.get("/session/admin/all")
      .then(r => setSessions(r.data || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  // Reset page on search, filter, or sort order change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search, sortOrder]);

  const tabs = ["ALL", "BOOKED", "CONFIRMED", "COMPLETED", "CANCELLED"];
  
  // 1. Filter
  const filtered = sessions.filter(s => {
    const matchStatus = filter === "ALL" || s.status === filter;
    const matchSearch = !search ||
      s.clientUsername?.toLowerCase().includes(search.toLowerCase()) ||
      s.therapistName?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

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

  return (
    <AppShell>
      <main className="mc-container">
        <section className="mc-dash-hero mc-fade-up">
          <div className="mc-dash-hero-text">
            <div className="mc-kicker"><i className="bi bi-calendar2-week me-1"/>Admin</div>
            <h1>All <span className="mc-gradient-text">Sessions</span></h1>
            <p>View and monitor all therapy sessions across the platform.</p>
          </div>
          <Link to="/admin/analytics" className="mc-btn-hero-primary" style={{ fontSize: ".875rem", padding: "10px 20px" }}>
            <i className="bi bi-bar-chart-line me-2"/>Analytics
          </Link>
        </section>

        {/* Filter tabs */}
        <div className="mc-tab-bar mc-scroll-reveal">
          {tabs.map(t => (
            <button key={t} className={`mc-tab${filter === t ? " active" : ""}`} onClick={() => setFilter(t)}>
              {t === "ALL" ? `All (${sessions.length})` : fmt(t)}
              {t !== "ALL" && <span className="mc-tab-count">{sessions.filter(s => s.status === t).length}</span>}
            </button>
          ))}
        </div>

        {/* Search & Sort Row */}
        <div className="mc-controls-row mc-scroll-reveal">
          <div className="mc-input-wrap" style={{ maxWidth: 380, flex: 1 }}>
            <i className="bi bi-search"/>
            <input
              placeholder="Search by patient or therapist…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
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
            <p>{search ? "Try a different search term." : "No sessions to show for the selected filter."}</p>
          </div>
        ) : (
          <>
            <section className="mc-table-card mc-scroll-reveal">
              <div className="table-responsive">
                <table className="table align-middle mc-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Patient</th>
                      <th>Therapist</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSessions.map((s, i) => (
                      <tr key={s.id}>
                        <td className="text-muted" style={{ fontSize: ".8rem" }}>{s.id}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{s.clientUsername || "—"}</div>
                          {s.anonymous && <span className="mc-anon-tag">anon</span>}
                        </td>
                        <td>{s.therapistName || "—"}</td>
                        <td>{fmtDate(s.sessionDate)}</td>
                        <td>{fmtTime(s.sessionTime)}</td>
                        <td><span className="mc-badge mc-badge-blue">{fmt(s.sessionType)}</span></td>
                        <td><span className={statusClass(s.status)}>{fmt(s.status)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

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
