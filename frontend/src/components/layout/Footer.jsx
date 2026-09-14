import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Footer() {
  const { user } = useAuth();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="mc-footer">
      <div className="mc-footer-inner">
        <div className="mc-footer-brand">
          <span className="mc-footer-logo">
            <i className="bi bi-shield-heart-fill"/> MindCare
          </span>
          <p>
            Connect with licensed therapists while keeping your identity private. Safe, confidential mental health care.
          </p>
          <div className="mc-footer-social">
            <a href="https://github.com/kzumair939" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i className="bi bi-github"/></a>
            <a href="https://www.linkedin.com/in/umairkhan28/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i className="bi bi-linkedin"/></a>
            <a href="mailto:kzumair939@gmail.com" aria-label="Email"><i className="bi bi-envelope-fill"/></a>
          </div>
        </div>

        <div className="mc-footer-col">
          <h3>Platform</h3>
          <a href="#how-it-works">How It Works</a>
          <a href="#therapy-approaches">Therapy</a>
          <a href="#anonymous-mode">Privacy Policy</a>
          <Link to="/survey">Overview Data</Link>
        </div>

        <div className="mc-footer-col">
          <h3>Resources</h3>
          <Link to="/survey">About</Link>
          <Link to="/dashboard">Care-hub</Link>
          <a href="#therapists">Therapists</a>
          <a href="#therapy-approaches">Conditions</a>
        </div>

        <div className="mc-footer-col">
          <h3>Company</h3>
          <Link to="/survey">About</Link>
          <a href="mailto:kzumair939@gmail.com">Contact</a>
          <a href="#therapists">Team</a>
          <a href="#faq">Licensing Information</a>
        </div>
      </div>

      <div className="mc-footer-bottom">
        <span>Copyright © 2026 MindCare. All rights reserved.</span>
        <div className="mc-footer-bottom-links">
          <a href="#anonymous-mode">Privacy</a>
          <span>·</span>
          <a href="#faq">Terms</a>
          <span>·</span>
          <button type="button" onClick={scrollToTop} className="mc-back-to-top">
            Top of page <i className="bi bi-arrow-up-short" />
          </button>
        </div>
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
