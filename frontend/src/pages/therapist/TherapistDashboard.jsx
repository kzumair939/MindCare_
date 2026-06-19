import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

export default function TherapistDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total:0, upcoming:0, completed:0, earnings:0 });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    api.get("/session/therapist").catch(() => ({ data:[] })).then(r => {
      const all = r.data || [];
      const now = new Date();
      const upcoming = all.filter(s => new Date(s.sessionDate) >= now && s.status !== "CANCELLED");
      const completed = all.filter(s => s.status === "COMPLETED");
      const earnings = completed.reduce((sum, s) => sum + (s.amount || 0), 0);
      setStats({ total:all.length, upcoming:upcoming.length, completed:completed.length, earnings });
      setSessions(all.slice(0,5));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const cards = [
    { icon:"calendar2-heart",  label:"Total Sessions",  val:stats.total,     color:"blue"   },
    { icon:"arrow-up-right",   label:"Upcoming",        val:stats.upcoming,  color:"green"  },
    { icon:"check2-circle",    label:"Completed",       val:stats.completed, color:"teal"   },
    { icon:"cash-coin",        label:"Earnings ($)",    val:`$${stats.earnings}`,color:"purple"},
  ];

  function statusBadge(s) {
    const map = { BOOKED:"booked",CONFIRMED:"confirmed",COMPLETED:"completed",CANCELLED:"cancelled",PENDING:"pending" };
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
            <div className="mc-kicker"><i className="bi bi-person-badge me-1"/>Therapist Portal</div>
            <h1>{greeting}, <span className="mc-gradient-text">Dr. {user?.displayName || user?.username}</span> 👋</h1>
            <p>Here's your session overview and today's schedule.</p>
          </div>
        </section>

        <section className="mc-stat-grid-4">
          {cards.map((c, i) => (
            <div
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
            </div>
          ))}
        </section>

        <div className="mc-dash-grid">
          <section className="mc-card" style={anim(0.42)}>
            <div className="mc-card-header">
              <h3><i className="bi bi-calendar2-check me-2 text-primary"/>Upcoming Sessions</h3>
              <Link to="/therapist/sessions" className="mc-link-sm">View all →</Link>
            </div>
            {loading ? (
              <div className="mc-session-skeleton">{[1,2,3].map(i=><div key={i} className="mc-skeleton-row"/>)}</div>
            ) : sessions.length === 0 ? (
              <div className="mc-empty-state"><i className="bi bi-calendar2-x"/><p>No sessions yet</p></div>
            ) : (
              <div className="mc-session-list">
                {sessions.map((s, i) => (
                  <div key={s.id} className="mc-session-row" style={anim(0.5 + i * 0.07)}>
                    <div className="mc-session-avatar"><i className="bi bi-person-circle"/></div>
                    <div className="mc-session-info">
                      <div className="mc-session-name">{s.userName || "Patient"}</div>
                      <div className="mc-session-meta">
                        <i className="bi bi-calendar3 me-1"/>
                        {s.sessionDate ? new Date(s.sessionDate).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "—"}
                        <span className="mc-dot"/>{s.sessionTime || "—"}
                        {s.sessionType && <><span className="mc-dot"/>{s.sessionType === "ONLINE" ? "Online" : "In-Person"}</>}
                      </div>
                    </div>
                    {statusBadge(s.status)}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mc-card" style={anim(0.5)}>
            <div className="mc-card-header">
              <h3><i className="bi bi-lightning-charge-fill me-2 text-warning"/>Quick Actions</h3>
            </div>
            <div className="mc-quick-grid">
              {[
                { to:"/therapist/sessions", icon:"calendar2-week", label:"My Sessions",     desc:"View & manage sessions", color:"blue"   },
                { to:"/group",              icon:"people-fill",    label:"Group Rooms",     desc:"Moderate support groups",color:"green"  },
                { to:"/therapist/sessions", icon:"bar-chart-fill", label:"Session Reports", desc:"View & manage sessions",  color:"purple" },
              ].map((q, i) => (
                <Link
                  key={q.to + i}
                  to={q.to}
                  className={`mc-quick-card mc-quick-${q.color}`}
                  style={{
                    ...anim(0.56 + i * 0.07),
                    transition: `opacity 0.5s ease ${0.56 + i * 0.07}s, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${0.56 + i * 0.07}s, box-shadow 0.2s ease, background 0.2s ease`,
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
