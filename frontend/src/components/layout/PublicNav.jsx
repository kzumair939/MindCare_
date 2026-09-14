import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function PublicNav() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const home = user?.role === "ROLE_ADMIN" ? "/admin"
    : user?.role === "ROLE_THERAPIST" ? "/therapist"
    : user ? "/dashboard" : "/";

  const scrollToSection = (id) => {
    setOpen(false);
    if (location.pathname !== "/") {
      navigate("/#" + id);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="mc-public-nav">
      <Link to={home} className="mc-brand" onClick={() => setOpen(false)}>
        <span className="mc-brand-icon-wrapper">
          <i className="bi bi-shield-heart-fill mc-brand-mark" />
        </span>
        <span className="mc-brand-text">
          MindCare
          {user && (
            <span className="mc-brand-role">
              {" · "}{user.role === "ROLE_ADMIN" ? "Admin" : user.role === "ROLE_THERAPIST" ? "Therapist" : ""}
            </span>
          )}
        </span>
      </Link>

      <div className="mc-nav-center-links">
        <button type="button" className="mc-nav-link" onClick={() => scrollToSection("how-it-works")}>
          How It Works
        </button>
        <button type="button" className="mc-nav-link" onClick={() => scrollToSection("therapy-approaches")}>
          Therapy
        </button>
        <button type="button" className="mc-nav-link" onClick={() => scrollToSection("anonymous-mode")}>
          Privacy
        </button>
      </div>

      <div className={`mc-public-nav-actions${open ? " open" : ""}`}>
        {user ? (
          <>
            <Link to={home} className="mc-btn-nav-outline active" onClick={() => setOpen(false)}>
              <i className="bi bi-grid-1x2" /> <span>Dashboard</span>
            </Link>
            <button className="mc-btn-nav-outline mc-logout" onClick={logout}>
              <i className="bi bi-box-arrow-right" /> <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="mc-btn-nav-login"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
            <Link
              to="/survey"
              className="mc-btn-nav-getstarted"
              onClick={() => setOpen(false)}
            >
              Get Started
            </Link>
          </>
        )}

        <button 
          className="mc-theme-btn" 
          onClick={toggle} 
          title={theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
          aria-label="Toggle Theme"
        >
          <i className={`bi bi-${theme === "dark" ? "sun-fill" : "moon-stars-fill"}`} />
        </button>
      </div>

      <div className="mc-public-nav-mobile">
        <button className="mc-theme-btn" onClick={toggle} title="Toggle theme">
          <i className={`bi bi-${theme === "dark" ? "sun-fill" : "moon-stars-fill"}`} />
        </button>
        <button className="mc-hamburger" onClick={() => setOpen((o) => !o)} title="Toggle menu">
          <i className={`bi bi-${open ? "x-lg" : "list"}`} />
        </button>
      </div>
    </nav>
  );
}
