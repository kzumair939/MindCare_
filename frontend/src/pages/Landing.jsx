import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";

const FEATURES = [
  ["gift-fill","2 Free Sessions","Start with zero cost. No card required.","green"],
  ["incognito","Anonymous Mode","Stay completely private in sessions & chats.","purple"],
  ["people-fill","Group Support","Connect with peers in safe, moderated rooms.","blue"],
  ["calendar2-check","Smart Scheduling","Only available therapist slots are shown.","teal"],
  ["stars","Personalised Match","Survey-based therapy type recommendation.","pink"],
  ["credit-card","Secure Payments","Transparent pricing with encrypted checkout.","orange"],
];

const STATS = [
  ["500+","Verified therapists"],
  ["98%","Client satisfaction"],
  ["24/7","Support available"],
  ["100%","Privacy guaranteed"],
];

const STEPS = [
  ["person-plus-fill","Create Account","Sign up in 30 seconds. No credit card needed."],
  ["clipboard2-pulse-fill","Take Survey","Answer a short assessment for personalised matches."],
  ["calendar-heart-fill","Book Session","Choose a therapist and book your free session."],
  ["heart-pulse-fill","Begin Healing","Start your journey with expert, compassionate care."],
];

export default function Landing() {
  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("mc-visible");
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll(".mc-scroll-reveal").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <AppShell hideFooter={false}>
      <main>
        {/* ── HERO ── */}
        <section className="mc-landing-hero">
          <div className="mc-landing-glow"/>
          <div className="mc-landing-orb mc-orb-1"/>
          <div className="mc-landing-orb mc-orb-2"/>
          <div className="mc-landing-orb mc-orb-3"/>

          <div className="mc-landing-content">
            <div className="mc-landing-text">
              <div className="mc-kicker mc-kicker-glow mc-fade-up">
                <i className="bi bi-stars me-1"/> Mental wellness, redefined
              </div>
              <h1 className="mc-landing-title mc-fade-up mc-delay-1">
                Your care, your pace.<br/>
                <span className="mc-gradient-text">Private &amp; personal.</span>
              </h1>
              <p className="mc-landing-sub mc-fade-up mc-delay-2">
                MindCare connects you with verified therapists, supports anonymous sessions,
                and gives you a safe space to grow — starting with <strong>2 free sessions</strong>.
              </p>
              <div className="mc-landing-actions mc-fade-up mc-delay-3">
                <Link to="/signup" className="mc-btn-hero-primary">
                  <i className="bi bi-heart-pulse me-2"/> Get started free
                </Link>
                <Link to="/login" className="mc-btn-hero-outline">
                  <i className="bi bi-box-arrow-in-right me-2"/> Sign in
                </Link>
              </div>
              <div className="mc-trust-row mc-fade-up mc-delay-4">
                <span><i className="bi bi-shield-check"/> 100% secure</span>
                <span><i className="bi bi-gift"/> 2 free sessions</span>
                <span><i className="bi bi-patch-check"/> Verified therapists</span>
                <span><i className="bi bi-lock"/> Anonymous mode</span>
              </div>
            </div>

            <div className="mc-landing-visual mc-fade-up mc-delay-2">
              <div className="mc-hero-card">
                <div className="mc-hero-card-header">
                  <div className="mc-hero-avatar"><i className="bi bi-person-circle"/></div>
                  <div>
                    <div className="mc-hero-card-name">Your Session</div>
                    <div className="mc-hero-card-sub">Today, 3:00 PM</div>
                  </div>
                  <div className="mc-hero-live-badge"><span className="mc-live-dot"/>Live</div>
                </div>
                <div className="mc-hero-card-body">
                  <div className="mc-hero-wave">
                    {[...Array(20)].map((_,i) => (
                      <div key={i} className="mc-wave-bar" style={{animationDelay:`${i*0.08}s`, height:`${20+Math.sin(i)*14}px`}}/>
                    ))}
                  </div>
                  <p className="mc-hero-quote">"You're making real progress. I'm proud of you."</p>
                </div>
                <div className="mc-hero-card-chips">
                  <span className="mc-chip mc-chip-green"><i className="bi bi-shield-check"/> Private</span>
                  <span className="mc-chip mc-chip-blue"><i className="bi bi-camera-video"/> HD Video</span>
                  <span className="mc-chip mc-chip-purple"><i className="bi bi-incognito"/> Anonymous</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="mc-stats-section" ref={statsRef}>
          <div className="mc-container">
            <div className="mc-stats-grid">
              {STATS.map(([num, label]) => (
                <div key={label} className="mc-stat-item mc-scroll-reveal">
                  <div className="mc-stat-num">{num}</div>
                  <div className="mc-stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="mc-features">
          <div className="mc-container">
            <div className="mc-section-header mc-scroll-reveal">
              <div className="mc-kicker">Everything you need</div>
              <h2>A complete mental health platform</h2>
              <p>Everything you need to start and sustain your wellness journey, in one place.</p>
            </div>
            <div className="mc-feature-grid">
              {FEATURES.map(([icon, title, body, color], i) => (
                <div
                  key={title}
                  className={`mc-feature-card mc-feature-${color} mc-scroll-reveal`}
                  style={{ transitionDelay: `${i * 0.07}s` }}
                >
                  <div className="mc-feature-icon"><i className={`bi bi-${icon}`}/></div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="mc-how-section">
          <div className="mc-container">
            <div className="mc-section-header mc-scroll-reveal">
              <div className="mc-kicker">Simple process</div>
              <h2>Start in minutes</h2>
              <p>Getting the help you need has never been this easy.</p>
            </div>
            <div className="mc-steps-grid">
              {STEPS.map(([icon, title, body], i) => (
                <div key={title} className="mc-step mc-scroll-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                  <div className="mc-step-num">{i + 1}</div>
                  <div className="mc-step-icon"><i className={`bi bi-${icon}`}/></div>
                  <h4>{title}</h4>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="mc-cta-section">
          <div className="mc-container">
            <div className="mc-cta-box mc-scroll-reveal">
              <div className="mc-cta-glow"/>
              <div className="mc-cta-badge"><i className="bi bi-gift-fill me-1"/> Free to start</div>
              <h2>Ready to begin your wellness journey?</h2>
              <p>Create your account in 30 seconds. First 2 sessions are completely free.</p>
              <div className="mc-cta-actions">
                <Link to="/signup" className="mc-btn-hero-primary">
                  <i className="bi bi-arrow-right-circle me-2"/> Create free account
                </Link>
                <Link to="/login" className="mc-btn-hero-outline">
                  Sign in instead
                </Link>
              </div>
              <div className="mc-cta-trust">
                <span><i className="bi bi-lock-fill"/> No credit card</span>
                <span><i className="bi bi-shield-fill-check"/> Cancel anytime</span>
                <span><i className="bi bi-eye-slash-fill"/> 100% private</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
