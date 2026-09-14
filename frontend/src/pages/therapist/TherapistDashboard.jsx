import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import {
  SplineLineChart,
  MonthlyRevenueBarChart
} from "../../components/dashboard/DashboardCharts";
import "../../styles/dashboard-pro.css";

export default function TherapistDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ activeClients: 0, todaySessions: 0, completionRate: 0, revenue: 0 });
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [activeClients, setActiveClients] = useState([]);
  const [weeklySessions, setWeeklySessions] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [weeklyCompleted, setWeeklyCompleted] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([0, 0, 0, 0, 0, 0]);
  const [monthLabels, setMonthLabels] = useState(["Apr", "May", "Jun", "Jul", "Aug", "Sep"]);
  const [loading, setLoading] = useState(true);

  const todayDateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

  useEffect(() => {
    // Generate dynamic month names
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const dynamicMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      dynamicMonths.push(monthNames[d.getMonth()]);
    }
    setMonthLabels(dynamicMonths);

    api
      .get("/session/therapist")
      .catch(() => ({ data: [] }))
      .then((r) => {
        const all = r.data || [];
        const todayStr = now.toISOString().slice(0, 10);

        const todayList = all.filter((s) => s.sessionDate && s.sessionDate.startsWith(todayStr));
        const completed = all.filter((s) => s.status === "COMPLETED");
        const uniqueClientsMap = new Map();
        
        all.forEach((s) => {
          const clientId = s.userId || s.userName;
          if (clientId && !uniqueClientsMap.has(clientId)) {
            uniqueClientsMap.set(clientId, {
              initials: (s.userName || "P").slice(0, 2).toUpperCase(),
              alias: s.userName || `Client#${s.userId || "101"}`,
              condition: s.sessionType || "General Therapy",
              progress: s.status === "COMPLETED" ? 100 : 50,
              next: s.sessionDate ? new Date(s.sessionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Upcoming",
              isNew: false
            });
          }
        });

        const totalPaid = all
          .filter((s) => s.paid || s.status === "COMPLETED")
          .reduce((acc, s) => acc + (s.amount || 0), 0);
        const rate = all.length > 0 ? Math.round((completed.length / all.length) * 100) : 0;

        setStats({
          activeClients: uniqueClientsMap.size,
          todaySessions: todayList.length,
          completionRate: rate,
          revenue: totalPaid
        });

        setTodaySchedule(todayList);
        setActiveClients(Array.from(uniqueClientsMap.values()));

        // Calculate actual weekly counts Mon-Sun
        const wSess = [0, 0, 0, 0, 0, 0, 0];
        const wComp = [0, 0, 0, 0, 0, 0, 0];
        const currentDayIndex = (now.getDay() + 6) % 7; // Mon=0 .. Sun=6

        all.forEach((s) => {
          if (s.sessionDate) {
            const d = new Date(s.sessionDate);
            const dayIdx = (d.getDay() + 6) % 7;
            const diffTime = Math.abs(now - d);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) {
              wSess[dayIdx] += 1;
              if (s.status === "COMPLETED") wComp[dayIdx] += 1;
            }
          }
        });

        setWeeklySessions(wSess);
        setWeeklyCompleted(wComp);

        // Monthly revenue
        const mRev = [0, 0, 0, 0, 0, 0];
        all.forEach((s) => {
          if (s.sessionDate && (s.paid || s.status === "COMPLETED")) {
            const d = new Date(s.sessionDate);
            const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
            if (diff >= 0 && diff < 6) {
              mRev[5 - diff] += s.amount || 0;
            }
          }
        });
        setMonthlyRevenue(mRev);
      })
      .finally(() => setLoading(false));
  }, []);

  const maxWeeklyVal = Math.max(5, ...weeklySessions, ...weeklyCompleted);

  return (
    <AppShell>
      <div className="mc-container mc-pro-dashboard">
        
        {/* ── 1. HEADER ── */}
        <header className="mc-pro-header">
          <div className="mc-pro-header-info">
            <div style={{ marginBottom: "0.35rem" }}>
              <span className="mc-pro-status-pill">
                <span className="mc-pro-status-dot" />
                <span>Available</span>
              </span>
            </div>
            <h1>
              Dr. <span className="mc-gradient-text">{user?.displayName || user?.username || "Clinician"}</span>
            </h1>
            <p>{user?.specialization || "Licensed Mental Health Clinician"}</p>
          </div>
        </header>

        {/* ── 2. TOP 4 STAT CARDS ── */}
        <section className="mc-pro-stat-grid" aria-label="Therapist Key Metrics">
          
          {/* Active Clients */}
          <div className="mc-pro-stat-card accent-purple">
            <div className="mc-pro-stat-top">
              <span className="mc-pro-stat-icon" style={{ color: "#8b5cf6" }}>
                <i className="bi bi-people-fill" />
              </span>
            </div>
            <div className="mc-pro-stat-value">{loading ? "—" : stats.activeClients}</div>
            <div className="mc-pro-stat-label">Active Clients</div>
          </div>

          {/* Today's Sessions */}
          <div className="mc-pro-stat-card accent-cyan">
            <div className="mc-pro-stat-top">
              <span className="mc-pro-stat-icon" style={{ color: "#06b6d4" }}>
                <i className="bi bi-calendar-event" />
              </span>
            </div>
            <div className="mc-pro-stat-value">{loading ? "—" : stats.todaySessions}</div>
            <div className="mc-pro-stat-label">Today's Sessions</div>
          </div>

          {/* Completion Rate */}
          <div className="mc-pro-stat-card accent-teal">
            <div className="mc-pro-stat-top">
              <span className="mc-pro-stat-icon" style={{ color: "#10b981" }}>
                <i className="bi bi-graph-up-arrow" />
              </span>
            </div>
            <div className="mc-pro-stat-value">{loading ? "—" : `${stats.completionRate}%`}</div>
            <div className="mc-pro-stat-label">Completion Rate</div>
          </div>

          {/* Monthly Revenue */}
          <div className="mc-pro-stat-card accent-amber">
            <div className="mc-pro-stat-top">
              <span className="mc-pro-stat-icon" style={{ color: "#f59e0b" }}>
                <i className="bi bi-wallet2" />
              </span>
            </div>
            <div className="mc-pro-stat-value">
              {loading ? "—" : `$${stats.revenue}`}
            </div>
            <div className="mc-pro-stat-label">Monthly Revenue</div>
          </div>

        </section>

        {/* ── 3. MIDDLE SECTION: WEEKLY SESSIONS & REVENUE CHARTS ── */}
        <div className="mc-pro-grid-2">
          
          {/* Left: Weekly Sessions Spline Chart */}
          <section className="mc-pro-card">
            <div className="mc-pro-card-header">
              <div>
                <h2 className="mc-pro-card-title">Weekly Sessions</h2>
                <span className="mc-pro-card-subtitle">This week's activity</span>
              </div>
              <div className="mc-pro-legend">
                <span><span className="mc-pro-legend-dot" style={{ backgroundColor: "#8b5cf6" }} />Sessions</span>
                <span><span className="mc-pro-legend-dot" style={{ backgroundColor: "#14b8a6" }} />Completed</span>
              </div>
            </div>

            <SplineLineChart
              series={[
                { name: "Sessions", color: "#8b5cf6", data: weeklySessions },
                { name: "Completed", color: "#14b8a6", data: weeklyCompleted }
              ]}
              labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
              yMax={maxWeeklyVal}
              yMin={0}
            />
          </section>

          {/* Right: Revenue Bar Chart */}
          <section className="mc-pro-card">
            <div className="mc-pro-card-header">
              <div>
                <h2 className="mc-pro-card-title">Revenue</h2>
                <span className="mc-pro-card-subtitle">Last 6 months</span>
              </div>
            </div>

            <MonthlyRevenueBarChart
              data={monthlyRevenue}
              labels={monthLabels}
              unit="$"
            />
          </section>

        </div>

        {/* ── 4. LOWER ROW: TODAY'S SCHEDULE & ACTIVE CLIENTS ── */}
        <div className="mc-pro-grid-2-even">
          
          {/* Today's Schedule */}
          <section className="mc-pro-card">
            <div className="mc-pro-card-header">
              <h2 className="mc-pro-card-title">Today's Schedule</h2>
              <span className="mc-pro-stat-badge">
                {todayDateFormatted}
              </span>
            </div>

            {todaySchedule.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2.5rem 1rem", textAlign: "center", color: "var(--mc-db-text-muted)" }}>
                <i className="bi bi-calendar2-check" style={{ fontSize: "2.2rem", color: "var(--mc-db-text-muted)", marginBottom: "0.5rem" }} />
                <p style={{ margin: 0, fontWeight: 700, color: "var(--mc-db-text-primary)", fontSize: "0.95rem" }}>
                  No Sessions Scheduled for Today
                </p>
                <span style={{ fontSize: "0.8rem", color: "var(--mc-db-text-secondary)" }}>
                  Your schedule is clear.
                </span>
              </div>
            ) : (
              <div className="mc-item-list">
                {todaySchedule.map((s) => (
                  <div key={s.id} className="mc-list-row">
                    <div className="mc-list-left">
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--mc-db-text-muted)", width: "45px" }}>
                        {s.sessionTime || "10:00"}
                      </span>
                      <div>
                        <div className="mc-row-title">{s.userName || `Client#${s.userId || "101"}`}</div>
                        <div className="mc-row-sub">{s.sessionType || "General Therapy"} · 50 min</div>
                      </div>
                    </div>

                    <div>
                      {s.status === "COMPLETED" ? (
                        <span style={{ color: "#10b981", fontSize: "1.1rem", fontWeight: 800 }}>✓</span>
                      ) : (
                        <Link to={`/session/${s.id}`} className="mc-btn-start">
                          Start
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Active Clients */}
          <section className="mc-pro-card">
            <div className="mc-pro-card-header">
              <h2 className="mc-pro-card-title">Active Clients</h2>
              <Link to="/therapist/sessions" style={{ color: "#06b6d4", textDecoration: "none", fontSize: "0.84rem", fontWeight: 700 }}>
                View all →
              </Link>
            </div>

            {activeClients.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2.5rem 1rem", textAlign: "center", color: "var(--mc-db-text-muted)" }}>
                <i className="bi bi-people" style={{ fontSize: "2.2rem", color: "var(--mc-db-text-muted)", marginBottom: "0.5rem" }} />
                <p style={{ margin: 0, fontWeight: 700, color: "var(--mc-db-text-primary)", fontSize: "0.95rem" }}>
                  No Active Clients Yet
                </p>
                <span style={{ fontSize: "0.8rem", color: "var(--mc-db-text-secondary)" }}>
                  Clients will appear here once sessions are booked.
                </span>
              </div>
            ) : (
              <div className="mc-item-list">
                {activeClients.map((client) => (
                  <div key={client.alias} className="mc-list-row">
                    <div className="mc-list-left">
                      <div className="mc-avatar-initials">
                        {client.initials}
                      </div>
                      <div>
                        <div className="mc-row-title">
                          <span>{client.alias}</span>
                        </div>
                        <div className="mc-row-sub">{client.condition}</div>
                      </div>
                    </div>

                    <div className="mc-row-meta-right">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div className="mc-progress-bar-wrap">
                          <div className="mc-progress-bar-fill" style={{ width: `${client.progress}%` }} />
                        </div>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--mc-db-text-secondary)" }}>
                          {client.progress}%
                        </span>
                      </div>
                      <span style={{ fontSize: "0.74rem", color: "var(--mc-db-text-muted)" }}>
                        {client.next}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

      </div>
    </AppShell>
  );
}
