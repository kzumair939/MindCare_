import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function Nav() {
  const { user, logout, unreadGroups } = useAuth();
  const { theme, toggle } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const location = useLocation();

  // Desktop All Links
  const desktopLinks = user?.role === "ROLE_ADMIN" ? [
    { to: "/admin",              label: "Dashboard",  icon: "grid-1x2" },
    { to: "/admin/therapists",   label: "Therapists", icon: "people" },
    { to: "/admin/sessions",     label: "Sessions",   icon: "calendar2-week" },
    { to: "/admin/analytics",    label: "Analytics",  icon: "bar-chart-line" },
    { to: "/admin/reports",      label: "Reports",    icon: "flag" },
  ] : user?.role === "ROLE_THERAPIST" ? [
    { to: "/therapist",          label: "Dashboard",  icon: "grid-1x2" },
    { to: "/therapist/sessions", label: "Sessions",   icon: "calendar2-check" },
    { to: "/group",              label: "Groups",     icon: "people" },
  ] : user ? [
    { to: "/dashboard",    label: "Dashboard", icon: "grid-1x2" },
    { to: "/book-session", label: "Book",      icon: "plus-circle" },
    { to: "/my-sessions",  label: "Sessions",  icon: "calendar2-heart" },
    { to: "/survey",       label: "Survey",    icon: "clipboard2-pulse" },
    { to: "/group",        label: "Groups",    icon: "people" },
    { to: "/settings",     label: "Settings",  icon: "gear" },
  ] : [
    { to: "/login",  label: "Sign in", icon: "box-arrow-in-right" },
    { to: "/signup", label: "Sign up", icon: "person-plus" },
  ];

  // Mobile Bottom Bar Primary Tabs vs More Sheet Secondary Items
  const mobilePrimaryTabs = user?.role === "ROLE_ADMIN" ? [
    { to: "/admin",              label: "Home",       icon: "grid-1x2" },
    { to: "/admin/therapists",   label: "Therapists", icon: "people" },
    { to: "/admin/sessions",     label: "Sessions",   icon: "calendar2-week" },
    { to: "/admin/analytics",    label: "Analytics",  icon: "bar-chart-line" },
  ] : user?.role === "ROLE_THERAPIST" ? [
    { to: "/therapist",          label: "Home",       icon: "grid-1x2" },
    { to: "/therapist/sessions", label: "Sessions",   icon: "calendar2-check" },
    { to: "/group",              label: "Groups",     icon: "people" },
  ] : user ? [
    { to: "/dashboard",    label: "Home",     icon: "grid-1x2" },
    { to: "/book-session", label: "Book",     icon: "plus-circle" },
    { to: "/my-sessions",  label: "Sessions", icon: "calendar2-heart" },
    { to: "/survey",       label: "Survey",   icon: "clipboard2-pulse" },
  ] : [
    { to: "/login",  label: "Sign in", icon: "box-arrow-in-right" },
    { to: "/signup", label: "Sign up", icon: "person-plus" },
  ];

  const mobileMoreItems = user?.role === "ROLE_ADMIN" ? [
    { to: "/admin/reports", label: "Reports", icon: "flag" },
  ] : user?.role === "ROLE_THERAPIST" ? [
    // Therapist secondary items if any
  ] : user ? [
    { to: "/group",    label: "Groups",   icon: "people", hasUnread: unreadGroups && unreadGroups.length > 0 },
    { to: "/settings", label: "Settings", icon: "gear" },
  ] : [];

  const home = user?.role === "ROLE_ADMIN" ? "/admin"
    : user?.role === "ROLE_THERAPIST" ? "/therapist"
    : user ? "/dashboard" : "/";

  const isActive = (to) => location.pathname === to || (to !== "/" && location.pathname.startsWith(to + "/"));

  function handleLogout() {
    setLogoutConfirm(false);
    setMoreOpen(false);
    logout();
  }

  return (
    <>
      {/* Desktop Left Collapsible Sidebar (>= 992px) */}
      <aside className="mc-sidebar">
        <div className="mc-sidebar-inner">
          {/* Brand Header */}
          <Link to={home} className="mc-sidebar-brand" title="MindCare">
            <div className="mc-brand-icon-wrapper">
              <i className="bi bi-heart-pulse-fill mc-brand-mark" />
            </div>
            <div className="mc-brand-details">
              <span className="mc-brand-title">MindCare</span>
              {user && (
                <span className="mc-brand-badge">
                  {user.role === "ROLE_ADMIN" ? "Admin" : user.role === "ROLE_THERAPIST" ? "Therapist" : "User"}
                </span>
              )}
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="mc-sidebar-nav">
            {desktopLinks.map((l) => {
              const isGroupsLink = l.to === "/group";
              const hasUnread = isGroupsLink && unreadGroups && unreadGroups.length > 0;
              const active = isActive(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`mc-sidebar-link${active ? " active" : ""}${hasUnread ? " mc-unread-link" : ""}`}
                >
                  {active && <span className="mc-active-indicator" />}
                  <div className="mc-sidebar-icon">
                    <i className={`bi bi-${l.icon}`} style={hasUnread ? { color: "#3b82f6" } : {}} />
                    {hasUnread && <span className="mc-unread-dot" />}
                  </div>
                  <span className="mc-sidebar-label">{l.label}</span>
                  <span className="mc-sidebar-tooltip">{l.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions: Theme Toggle & Logout */}
          <div className="mc-sidebar-footer">
            <button className="mc-sidebar-action-btn mc-theme-toggle" onClick={toggle} title="Toggle theme">
              <div className="mc-sidebar-icon">
                <i className={`bi bi-${theme === "dark" ? "sun-fill" : "moon-stars-fill"}`} />
              </div>
              <span className="mc-sidebar-label">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              <span className="mc-sidebar-tooltip">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>

            {user && (
              <button
                className="mc-sidebar-action-btn mc-logout"
                onClick={() => setLogoutConfirm(true)}
                title="Logout"
              >
                <div className="mc-sidebar-icon">
                  <i className="bi bi-box-arrow-right" />
                </div>
                <span className="mc-sidebar-label">Logout</span>
                <span className="mc-sidebar-tooltip">Logout</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Streamlined Top Header (< 992px) */}
      <header className="mc-mobile-header">
        <Link to={home} className="mc-mobile-brand">
          <i className="bi bi-heart-pulse-fill mc-brand-mark" />
          <span className="mc-brand-title">MindCare</span>
          {user && (
            <span className="mc-mobile-role-pill">
              {user.role === "ROLE_ADMIN" ? "Admin" : user.role === "ROLE_THERAPIST" ? "Therapist" : ""}
            </span>
          )}
        </Link>

        <div className="mc-mobile-header-actions">
          <button className="mc-mobile-icon-btn" onClick={toggle} title="Toggle theme">
            <i className={`bi bi-${theme === "dark" ? "sun-fill" : "moon-stars-fill"}`} />
          </button>
          {unreadGroups && unreadGroups.length > 0 && (
            <Link to="/group" className="mc-mobile-icon-btn mc-notif-btn" title="Unread groups">
              <i className="bi bi-bell-fill" style={{ color: "#3b82f6" }} />
              <span className="mc-unread-badge-dot" />
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Dedicated Floating Bottom Dock (< 992px) */}
      <div className="mc-mobile-bottom-dock">
        <div className="mc-dock-inner">
          {mobilePrimaryTabs.map((tab) => {
            const active = isActive(tab.to);
            const isGroupsLink = tab.to === "/group";
            const hasUnread = isGroupsLink && unreadGroups && unreadGroups.length > 0;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`mc-dock-item${active ? " active" : ""}`}
                onClick={() => setMoreOpen(false)}
              >
                {active && <span className="mc-dock-active-pill" />}
                <div className="mc-dock-icon">
                  <i className={`bi bi-${tab.icon}`} />
                  {hasUnread && <span className="mc-dock-unread-dot" />}
                </div>
                <span className="mc-dock-label">{tab.label}</span>
              </Link>
            );
          })}

          {/* More Button (if user is logged in or has secondary options) */}
          {user && (
            <button
              className={`mc-dock-item mc-dock-more${moreOpen ? " active" : ""}`}
              onClick={() => setMoreOpen((o) => !o)}
            >
              {moreOpen && <span className="mc-dock-active-pill" />}
              <div className="mc-dock-icon">
                <i className="bi bi-three-dots" />
                {unreadGroups && unreadGroups.length > 0 && (
                  <span className="mc-dock-unread-dot" />
                )}
              </div>
              <span className="mc-dock-label">More</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile "More" Action Glass Bottom Sheet */}
      {moreOpen && (
        <div className="mc-mobile-sheet-overlay" onClick={() => setMoreOpen(false)}>
          <div className="mc-mobile-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mc-sheet-handle" />
            <div className="mc-sheet-header">
              <span className="mc-sheet-title">More Actions</span>
              <button className="mc-sheet-close" onClick={() => setMoreOpen(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="mc-sheet-body">
              {mobileMoreItems.map((item) => {
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`mc-sheet-item${active ? " active" : ""}`}
                    onClick={() => setMoreOpen(false)}
                  >
                    <div className="mc-sheet-item-icon">
                      <i className={`bi bi-${item.icon}`} />
                      {item.hasUnread && <span className="mc-unread-dot" />}
                    </div>
                    <span className="mc-sheet-item-label">{item.label}</span>
                    <i className="bi bi-chevron-right mc-sheet-arrow" />
                  </Link>
                );
              })}

              <button
                className="mc-sheet-item mc-sheet-theme-item"
                onClick={() => {
                  toggle();
                }}
              >
                <div className="mc-sheet-item-icon">
                  <i className={`bi bi-${theme === "dark" ? "sun-fill" : "moon-stars-fill"}`} />
                </div>
                <span className="mc-sheet-item-label">
                  {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </span>
              </button>

              {user && (
                <button
                  className="mc-sheet-item mc-sheet-logout"
                  onClick={() => {
                    setLogoutConfirm(true);
                  }}
                >
                  <div className="mc-sheet-item-icon">
                    <i className="bi bi-box-arrow-right" />
                  </div>
                  <div className="mc-sheet-logout-text">
                    <span className="mc-sheet-item-label">Logout</span>
                    <span className="mc-sheet-item-sub">Sign out of your account</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {logoutConfirm && (
        <div className="mc-modal-overlay" onClick={() => setLogoutConfirm(false)}>
          <div className="mc-modal-box mc-logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mc-logout-modal-icon">
              <i className="bi bi-box-arrow-right" />
            </div>
            <h3>Sign out of MindCare?</h3>
            <p>You'll need to sign in again to access your account and sessions.</p>
            <div className="mc-logout-modal-actions">
              <button className="mc-btn-cancel-outline" onClick={() => setLogoutConfirm(false)}>
                <i className="bi bi-x-lg me-1" />Stay logged in
              </button>
              <button className="mc-btn-logout-confirm" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-1" />Yes, sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


