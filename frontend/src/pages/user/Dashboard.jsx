import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total:0, upcoming:0, completed:0, freeLeft:2 });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get("/session/my").catch(() => ({ data: [] })),
    ]).then(([sessRes]) => {
      const all = sessRes.data || [];
      const now = new Date();
      const upcoming = all.filter(s => new Date(s.sessionDate) >= now && s.status !== "CANCELLED");
      const completed = all.filter(s => s.status === "COMPLETED");
      const used = all.filter(s => s.status !== "CANCELLED").length;
      setStats({
        total: all.length,
        upcoming: upcoming.length,
        completed: completed.length,
        freeLeft: Math.max(0, 2 - used),
      });
      setSessions(all.slice(0, 3));
    }).finally(() => setLoading(false));
  }, []);

  // Trigger entrance animations after mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const freeLeft = stats.freeLeft;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const statCards = [
    { icon:"calendar2-heart", label:"Total Sessions",    val: stats.total,     color:"blue",   link:"/my-sessions" },
    { icon:"arrow-up-right",  label:"Upcoming",         val: stats.upcoming,  color:"green",  link:"/my-sessions" },
    { icon:"check2-circle",   label:"Completed",        val: stats.completed, color:"teal",   link:"/my-sessions" },
    { icon:"gift-fill",       label:"Free Sessions Left",val: freeLeft,       color:"purple", link:"/book-session" },
  ];

  const quickLinks = [
    { to:"/book-session", icon:"calendar2-plus",   label:"Book a Session",    desc:"Find & book a therapist", color:"blue"   },
    { to:"/survey",       icon:"clipboard2-pulse", label:"Therapy Survey",    desc:"Get personalised matches", color:"purple" },
    { to:"/group",        icon:"people-fill",      label:"Group Support",     desc:"Join peer support rooms",  color:"green"  },
    { to:"/settings",     icon:"gear-fill",        label:"Account Settings",  desc:"Profile & anonymous mode", color:"orange" },
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
      <main className="mc-container" ref={mainRef}>

        {/* Hero greeting */}
        <section className="mc-dash-hero" style={anim(0)}>
          <div className="mc-dash-hero-text">
            <div className="mc-kicker"><i className="bi bi-sun me-1"/>{greeting}</div>
            <h1>Welcome back, <span className="mc-gradient-text">{user?.displayName || user?.username}</span> 👋</h1>
            <p>Your mental wellness journey continues. Here's what's happening today.</p>
          </div>
          {freeLeft > 0 && (
            <div className="mc-free-badge-hero" style={{ animation: "pulseBorder 2.5s ease-in-out infinite", ...anim(0.15) }}>
              <i className="bi bi-gift-fill"/>
              <div>
                <strong>{freeLeft} free session{freeLeft > 1 ? "s" : ""} available</strong>
                <span>Book now at no cost</span>
              </div>
              <Link to="/book-session" className="mc-btn-mini">Book Free →</Link>
            </div>
          )}
        </section>

        {/* Stat cards */}
        <section className="mc-stat-grid-4">
          {statCards.map((c, i) => (
            <Link
              to={c.link}
              key={c.label}
              className={`mc-dash-stat-card mc-card-${c.color}`}
              style={anim(0.1 + i * 0.08, { display: "flex" })}
            >
              <div className={`mc-dash-stat-icon mc-icon-${c.color}`}
                style={{ animation: visible ? `float 3.5s ease-in-out ${i * 0.4}s infinite` : "none" }}
              >
                <i className={`bi bi-${c.icon}`}/>
              </div>
              <div className="mc-dash-stat-val"
                style={{ transition: "all 0.4s ease", transform: !loading && c.val > 0 ? "scale(1.04)" : "none" }}
              >{loading ? "—" : c.val}</div>
              <div className="mc-dash-stat-label">{c.label}</div>
            </Link>
          ))}
        </section>

        <div className="mc-dash-grid">
          {/* Quick actions */}
          <section className="mc-card" style={anim(0.42)}>
            <div className="mc-card-header">
              <h3><i className="bi bi-lightning-charge-fill me-2 text-warning"/>Quick Actions</h3>
            </div>
            <div className="mc-quick-grid">
              {quickLinks.map((q, i) => (
                <Link
                  key={q.to}
                  to={q.to}
                  className={`mc-quick-card mc-quick-${q.color}`}
                  style={{
                    ...anim(0.48 + i * 0.07),
                    transition: `opacity 0.5s ease ${0.48 + i * 0.07}s, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${0.48 + i * 0.07}s, box-shadow 0.2s ease, background 0.2s ease`,
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

          {/* Recent sessions */}
          <section className="mc-card" style={anim(0.5)}>
            <div className="mc-card-header">
              <h3><i className="bi bi-calendar2-heart me-2 text-primary"/>Recent Sessions</h3>
              <Link to="/my-sessions" className="mc-link-sm">View all →</Link>
            </div>
            {loading ? (
              <div className="mc-session-skeleton">
                {[1,2,3].map(i => <div key={i} className="mc-skeleton-row"/>)}
              </div>
            ) : sessions.length === 0 ? (
              <div className="mc-empty-state">
                <i className="bi bi-calendar2-x"/>
                <p>No sessions yet</p>
                <Link to="/book-session" className="mc-btn-sm-primary">Book your first session</Link>
              </div>
            ) : (
              <div className="mc-session-list">
                {sessions.map((s, i) => (
                  <div
                    key={s.id}
                    className="mc-session-row"
                    style={anim(0.56 + i * 0.06)}
                  >
                    <div className="mc-session-avatar">
                      <i className="bi bi-person-circle"/>
                    </div>
                    <div className="mc-session-info">
                      <div className="mc-session-name">{s.therapistName || "Therapist"}</div>
                      <div className="mc-session-meta">
                        <i className="bi bi-calendar3 me-1"/>
                        {s.sessionDate ? new Date(s.sessionDate).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "—"}
                        <span className="mc-dot"/>
                        <i className="bi bi-clock me-1"/>{s.sessionTime || "—"}
                      </div>
                    </div>
                    <div>{statusBadge(s.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Wellness tip */}
        <section
          className="mc-wellness-tip"
          style={{ ...anim(0.72), animation: visible ? `fadeUp 0.55s ease ${0.72}s both` : "none" }}
        >
          <div className="mc-tip-icon" style={{ animation: "float 4s ease-in-out infinite" }}><i className="bi bi-lightbulb-fill"/></div>
          <div>
            <strong>Daily Wellness Tip</strong>
            <p>Take 5 minutes today to practise mindful breathing. Inhale for 4 counts, hold for 4, exhale for 6. Repeat 5 times.</p>
          </div>
        </section>

      </main>
    </AppShell>
  );
}
