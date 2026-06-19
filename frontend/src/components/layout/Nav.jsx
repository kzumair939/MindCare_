import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function Nav() {
  const { user, logout, unreadGroups } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const location = useLocation();

  const links = user?.role === "ROLE_ADMIN" ? [
    { to:"/admin",              label:"Dashboard",  icon:"grid-1x2" },
    { to:"/admin/therapists",   label:"Therapists", icon:"people" },
    { to:"/admin/sessions",     label:"Sessions",   icon:"calendar2-week" },
    { to:"/admin/analytics",    label:"Analytics",  icon:"bar-chart-line" },
    { to:"/admin/reports",      label:"Reports",    icon:"flag" },
  ] : user?.role === "ROLE_THERAPIST" ? [
    { to:"/therapist",          label:"Dashboard",  icon:"grid-1x2" },
    { to:"/therapist/sessions", label:"Sessions",   icon:"calendar2-check" },
    { to:"/group",              label:"Groups",     icon:"people" },
  ] : user ? [
    { to:"/dashboard",    label:"Dashboard", icon:"grid-1x2" },
    { to:"/book-session", label:"Book",      icon:"plus-circle" },
    { to:"/my-sessions",  label:"Sessions",  icon:"calendar2-heart" },
    { to:"/survey",       label:"Survey",    icon:"clipboard2-pulse" },
    { to:"/group",        label:"Groups",    icon:"people" },
    { to:"/settings",     label:"Settings",  icon:"gear" },
  ] : [
    { to:"/login",  label:"Sign in", icon:"box-arrow-in-right" },
    { to:"/signup", label:"Sign up", icon:"person-plus" },
  ];

  const home = user?.role === "ROLE_ADMIN" ? "/admin"
    : user?.role === "ROLE_THERAPIST" ? "/therapist"
    : user ? "/dashboard" : "/";

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + "/");

  function handleLogout() {
    setLogoutConfirm(false);
    setOpen(false);
    logout();
  }

  return (
    <>
      <nav className="mc-nav">
        <Link to={home} className="mc-brand" onClick={() => setOpen(false)}>
          <i className="bi bi-heart-pulse-fill mc-brand-mark"/>
          <span className="mc-brand-text">
            MindCare
            {user && (
              <span className="mc-brand-role">
                {" · "}{user.role === "ROLE_ADMIN" ? "Admin" : user.role === "ROLE_THERAPIST" ? "Therapist" : ""}
              </span>
            )}
          </span>
        </Link>

        <div className={`mc-nav-actions${open ? " open" : ""}`}>
          {links.map(l => {
            const isGroupsLink = l.to === "/group";
            const hasUnread = isGroupsLink && unreadGroups && unreadGroups.length > 0;
            return (
              <Link
                key={l.to} to={l.to}
                className={`mc-nav-link${isActive(l.to) ? " active" : ""}${hasUnread ? " mc-unread-link" : ""}`}
                onClick={() => setOpen(false)}
              >
                <i className={`bi bi-${l.icon}`} style={hasUnread ? { color: "#3b82f6" } : {}}/>
                <span>{l.label}</span>
                {hasUnread && <span className="mc-unread-dot" />}
              </Link>
            );
          })}
          {user && (
            <button className="mc-nav-link mc-logout" onClick={() => setLogoutConfirm(true)}>
              <i className="bi bi-box-arrow-right"/> <span>Logout</span>
            </button>
          )}
          <button className="mc-theme-btn" onClick={toggle} title="Toggle theme">
            <i className={`bi bi-${theme === "dark" ? "sun-fill" : "moon-stars-fill"}`}/>
          </button>
        </div>

        <div className="mc-nav-right-mobile">
          <button className="mc-theme-btn" onClick={toggle}>
            <i className={`bi bi-${theme === "dark" ? "sun-fill" : "moon-stars-fill"}`}/>
          </button>
          <button className="mc-hamburger" onClick={() => setOpen(o => !o)}>
            <i className={`bi bi-${open ? "x-lg" : "list"}`}/>
          </button>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {logoutConfirm && (
        <div className="mc-modal-overlay" onClick={() => setLogoutConfirm(false)}>
          <div className="mc-modal-box mc-logout-modal" onClick={e => e.stopPropagation()}>
            <div className="mc-logout-modal-icon">
              <i className="bi bi-box-arrow-right"/>
            </div>
            <h3>Sign out of MindCare?</h3>
            <p>You'll need to sign in again to access your account and sessions.</p>
            <div className="mc-logout-modal-actions">
              <button className="mc-btn-cancel-outline" onClick={() => setLogoutConfirm(false)}>
                <i className="bi bi-x-lg me-1"/>Stay logged in
              </button>
              <button className="mc-btn-logout-confirm" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-1"/>Yes, sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
