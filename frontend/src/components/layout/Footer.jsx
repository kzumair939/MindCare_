import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Footer() {
  const { user } = useAuth();

  const platformLinks = user
    ? user.role === "ROLE_ADMIN"
      ? [
          { to: "/admin",              label: "Dashboard" },
          { to: "/admin/therapists",   label: "Manage Therapists" },
          { to: "/admin/sessions",     label: "All Sessions" },
          { to: "/admin/analytics",    label: "Analytics" },
        ]
      : user.role === "ROLE_THERAPIST"
      ? [
          { to: "/therapist",          label: "My Dashboard" },
          { to: "/therapist/sessions", label: "My Sessions" },
          { to: "/group",              label: "Group Rooms" },
        ]
      : [
          { to: "/dashboard",    label: "My Dashboard" },
          { to: "/book-session", label: "Book a Session" },
          { to: "/my-sessions",  label: "My Sessions" },
          { to: "/survey",       label: "Wellbeing Survey" },
        ]
    : [
        { to: "/login",   label: "Log in" },
        { to: "/signup",  label: "Sign up free" },
        { to: "/survey",  label: "Wellbeing survey" },
      ];

  return (
    <footer className="mc-footer">
      <div className="mc-footer-inner">
        <div className="mc-footer-brand">
          <span className="mc-footer-logo"><i className="bi bi-heart-pulse-fill"/> MindCare</span>
          <p>Your trusted space for mental wellness. Private, secure, and always here for you.</p>
          <div className="mc-footer-social">
            <a href="https://github.com/kzumair939" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i className="bi bi-github"/></a>
            <a href="https://www.linkedin.com/in/umairkhan28/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i className="bi bi-linkedin"/></a>
            <a href="mailto:kzumair939@gmail.com" aria-label="Email"><i className="bi bi-envelope-fill"/></a>
          </div>
        </div>
        <div className="mc-footer-col">
          <h6>Platform</h6>
          {platformLinks.map(l => (
            <Link key={l.to} to={l.to}>{l.label}</Link>
          ))}
        </div>
        <div className="mc-footer-col">
          <h6>Contact</h6>
          <a href="mailto:kzumair939@gmail.com"><i className="bi bi-envelope"/> kzumair939@gmail.com</a>
          <a href="tel:03142712220"><i className="bi bi-telephone"/> 0314 2712220</a>
          <a href="https://github.com/kzumair939" target="_blank" rel="noopener noreferrer"><i className="bi bi-github"/> GitHub Profile</a>
        </div>
        <div className="mc-footer-col">
          <h6>Legal</h6>
          <a href="#">Privacy policy</a>
          <a href="#">Terms of service</a>
          <a href="#">Cookie policy</a>
        </div>
      </div>
      <div className="mc-footer-bottom">
        <span>© {new Date().getFullYear()} MindCare. All rights reserved.</span>
        {user && (
          <span className="mc-footer-user-status">
            Signed in as <strong>{user.displayName || user.username}</strong>
            {" "}· {user.role?.replace("ROLE_", "")}
          </span>
        )}
      </div>
    </footer>
  );
}
