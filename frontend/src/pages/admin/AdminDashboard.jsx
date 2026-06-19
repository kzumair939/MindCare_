import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import api from "../../api/axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ therapists:0, sessions:0, users:0, revenue:0 });
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/admin/therapists").catch(() => ({ data:[] })),
      api.get("/admin/sessions").catch(() => ({ data:[] })),
      api.get("/admin/users").catch(() => ({ data:[] })),
    ]).then(([t, s, u]) => {
      const sessions = s.data || [];
      const revenue = sessions.filter(x => x.paid).reduce((sum, x) => sum + (x.amount || 0), 0);
      setStats({ therapists: (t.data||[]).length, sessions: sessions.length, users: (u.data||[]).length, revenue });
      setRecentSessions(sessions.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const cards = [
    { icon:"people-fill",      label:"Therapists",    val:stats.therapists, color:"blue",   link:"/admin/therapists", trend:"+3 this month" },
    { icon:"calendar2-check",  label:"Total Sessions",val:stats.sessions,   color:"green",  link:"/admin/sessions",   trend:"All time" },
    { icon:"person-heart-fill",label:"Users",         val:stats.users,      color:"purple", link:"/admin",            trend:"Registered" },
    { icon:"cash-coin",        label:"Revenue ($)",   val:`$${stats.revenue}`,color:"orange",link:"/admin",           trend:"Total earned" },
  ];

  function statusBadge(s) {
    const map = { BOOKED:"booked", CONFIRMED:"confirmed", COMPLETED:"completed", CANCELLED:"cancelled", PENDING:"pending" };
    return <span className={`mc-status mc-status-${map[s]||"pending"}`}>{s}</span>;
  }

  const anim = (delay = 0, extra = {}) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : "translateY(28px)",
    transition: `opacity 0.55s ease ${delay}s, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    ...extra,
  });

  return (
    <AppShell>
      <main className="mc-container">
        <section className="mc-dash-hero" style={anim(0)}>
          <div className="mc-dash-hero-text">
            <div className="mc-kicker"><i className="bi bi-shield-check me-1"/>Admin Panel</div>
            <h1>Admin <span className="mc-gradient-text">Dashboard</span></h1>
            <p>Overview of MindCare's platform activity and metrics.</p>
          </div>
          <div className="mc-admin-quick-btns">
            <Link to="/admin/therapists/new" className="mc-btn-hero-primary" style={{fontSize:".875rem",padding:"10px 20px"}}>
              <i className="bi bi-person-plus me-2"/>Add Therapist
            </Link>
          </div>
        </section>

        {/* Stat cards */}
        <section className="mc-stat-grid-4">
          {cards.map((c, i) => (
            <Link
              to={c.link}
              key={c.label}
              className={`mc-dash-stat-card mc-card-${c.color}`}
              style={anim(0.1 + i * 0.08, { display: "flex" })}
            >
              <div
                className={`mc-dash-stat-icon mc-icon-${c.color}`}
                style={{ animation: visible ? `float 3.5s ease-in-out ${i * 0.4}s infinite` : "none" }}
              >
                <i className={`bi bi-${c.icon}`}/>
              </div>
              <div
                className="mc-dash-stat-val"
                style={{ transition: "all 0.4s ease", transform: !loading ? "scale(1.04)" : "none" }}
              >{loading ? "—" : c.val}</div>
              <div className="mc-dash-stat-label">{c.label}</div>
              <div className="mc-dash-stat-trend">{c.trend}</div>
            </Link>
          ))}
        </section>

        <div className="mc-dash-grid">
          {/* Recent Sessions */}
          <section className="mc-card" style={anim(0.42)}>
            <div className="mc-card-header">
              <h3><i className="bi bi-calendar2-week me-2 text-primary"/>Recent Sessions</h3>
              <Link to="/admin/sessions" className="mc-link-sm">View all →</Link>
            </div>
            {loading ? (
              <div className="mc-session-skeleton">{[1,2,3,4,5].map(i => <div key={i} className="mc-skeleton-row"/>)}</div>
            ) : recentSessions.length === 0 ? (
              <div className="mc-empty-state"><i className="bi bi-calendar2-x"/><p>No sessions yet</p></div>
            ) : (
              <div className="mc-session-list">
                {recentSessions.map((s, i) => (
                  <div key={s.id} className="mc-session-row" style={anim(0.5 + i * 0.06)}>
                    <div className="mc-session-avatar"><i className="bi bi-calendar2"/></div>
                    <div className="mc-session-info">
                      <div className="mc-session-name">{s.userName || "User"} → {s.therapistName || "Therapist"}</div>
                      <div className="mc-session-meta">
                        <i className="bi bi-calendar3 me-1"/>
                        {s.sessionDate ? new Date(s.sessionDate).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—"}
                        <span className="mc-dot"/>
                        {s.sessionTime || "—"}
                      </div>
                    </div>
                    {statusBadge(s.status)}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick admin links */}
          <section className="mc-card" style={anim(0.5)}>
            <div className="mc-card-header">
              <h3><i className="bi bi-lightning-charge-fill me-2 text-warning"/>Admin Actions</h3>
            </div>
            <div className="mc-quick-grid">
              {[
                { to:"/admin/therapists",     icon:"people",          label:"Manage Therapists", desc:"Add, edit, remove",        color:"blue"   },
                { to:"/admin/therapists/new", icon:"person-plus-fill",label:"Add Therapist",     desc:"Create new therapist",     color:"green"  },
                { to:"/admin/sessions",       icon:"calendar2-week",  label:"All Sessions",      desc:"View & manage sessions",  color:"purple" },
                { to:"/admin/analytics",      icon:"bar-chart-line",  label:"Analytics",         desc:"Insights & feedback",     color:"teal"   },
                { to:"/admin/reports",        icon:"flag-fill",       label:"Reports",           desc:"Flagged messages",        color:"orange" },
              ].map((q, i) => (
                <Link
                  key={q.to}
                  to={q.to}
                  className={`mc-quick-card mc-quick-${q.color}`}
                  style={{
                    ...anim(0.56 + i * 0.06),
                    transition: `opacity 0.5s ease ${0.56 + i * 0.06}s, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${0.56 + i * 0.06}s, box-shadow 0.2s ease, background 0.2s ease`,
                  }}
                >
                  <div className={`mc-quick-icon mc-icon-${q.color}`}><i className={`bi bi-${q.icon}`}/></div>
                  <div>
                    <div className="mc-quick-label">{q.label}</div>
                    <div className="mc-quick-desc">{q.desc}</div>
                  </div>
                  <i className="bi bi-chevron-right mc-quick-arrow"/>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
