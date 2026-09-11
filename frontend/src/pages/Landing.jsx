import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import PublicShell from "../components/layout/PublicShell";

const STATS = [
  ["500+", "Verified Therapists"],
  ["99.2%", "Match Accuracy"],
  ["24/7", "Private Support"],
  ["100%", "Confidential Care"]
];

const MODALITIES = [
  {
    code: "CBT",
    title: "Cognitive Behavioural Therapy",
    desc: "Break negative thought loops and overcome daily anxiety with actionable cognitive tools.",
    icon: "lightning-charge-fill",
    color: "#38bdf8"
  },
  {
    code: "ACT",
    title: "Acceptance & Commitment",
    desc: "Navigate heavy emotions and build mindful habits true to your core values.",
    icon: "compass-fill",
    color: "#818cf8"
  },
  {
    code: "DBT",
    title: "Dialectical Behaviour Therapy",
    desc: "Build emotional resilience, distress tolerance, and calming grounding techniques.",
    icon: "shield-fill-plus",
    color: "#c084fc"
  },
  {
    code: "SLEEP_CBT_I",
    title: "Sleep & Circadian Restoration",
    desc: "Reset natural sleep rhythms and quiet racing nighttime thoughts.",
    icon: "moon-stars-fill",
    color: "#34d399"
  },
  {
    code: "ADHD_COACHING",
    title: "ADHD & Executive Function",
    desc: "Practical anti-procrastination routines and focus frameworks.",
    icon: "bullseye",
    color: "#fbbf24"
  },
  {
    code: "GENERAL_COUNSELLING",
    title: "Personalized Counselling",
    desc: "Compassionate guidance for relationships, burnout, and life transitions.",
    icon: "heart-pulse-fill",
    color: "#f472b6"
  }
];

const PLATFORM_FEATURES = [
  {
    icon: "gift-fill",
    title: "2 Free Sessions",
    desc: "Start your therapy journey with zero cost. No credit card required.",
    tag: "Free Start"
  },
  {
    icon: "incognito",
    title: "100% Anonymous Mode",
    desc: "Use an alias and camera-off mode to protect your complete privacy.",
    tag: "Private"
  },
  {
    icon: "cpu-fill",
    title: "Adaptive Clinical AI",
    desc: "Intelligent intake check-in that matches your specific mental health goals.",
    tag: "AI Powered"
  },
  {
    icon: "people-fill",
    title: "Support Circles",
    desc: "Moderated peer group rooms for anxiety, burnout, and shared healing.",
    tag: "Community"
  },
  {
    icon: "calendar2-check-fill",
    title: "Instant Scheduling",
    desc: "Book live HD video sessions instantly at your convenience.",
    tag: "Instant"
  },
  {
    icon: "file-earmark-medical-fill",
    title: "Personal Action Plans",
    desc: "Personalized self-care routines and progress insights after every session.",
    tag: "Clinical Care"
  }
];

const STEPS = [
  {
    num: "01",
    title: "AI Check-in",
    desc: "Complete a 3-minute adaptive intake questionnaire.",
    icon: "chat-left-dots-fill"
  },
  {
    num: "02",
    title: "Therapy Blueprint",
    desc: "Get your personalized stress profile and therapy match.",
    icon: "clipboard2-pulse-fill"
  },
  {
    num: "03",
    title: "Book Free Session",
    desc: "Choose a verified therapist and book 2 free sessions.",
    icon: "calendar-heart-fill"
  },
  {
    num: "04",
    title: "Heal & Transform",
    desc: "Attend private 1-on-1 sessions with guided continuous care.",
    icon: "stars"
  }
];

export default function Landing() {
  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("mc-visible");
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".mc-scroll-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <PublicShell hideFooter={false}>
      <main className="mc-landing-main">

        {/* ── HERO SECTION ── */}
        <section className="mc-landing-hero">
          <div className="mc-landing-glow" />
          <div className="mc-landing-orb mc-orb-1" />
          <div className="mc-landing-orb mc-orb-2" />
          <div className="mc-landing-orb mc-orb-3" />

          <div className="mc-landing-content">
            {/* Left Hero Text */}
            <div className="mc-landing-text" style={{ zIndex: 5 }}>
              <div
                className="mc-fade-up mc-hero-badge"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "6px 14px",
                  borderRadius: "99px",
                  fontSize: "clamp(0.74rem, 2.8vw, 0.84rem)",
                  fontWeight: "700",
                  marginBottom: "20px",
                  backdropFilter: "blur(10px)",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  textAlign: "center"
                }}
              >
                <i className="bi bi-stars" style={{ color: "#38bdf8", flexShrink: 0 }} />
                <span>Modern Mental Wellness Ecosystem</span>
              </div>

              <h1 className="mc-landing-title mc-fade-up mc-delay-1">
                Rewire Your Mind with{" "}
                <span className="mc-gradient-text">Clinical AI &amp; Expert Care.</span>
              </h1>

              <p className="mc-landing-sub mc-fade-up mc-delay-2">
                Adaptive AI diagnostics paired with 500+ licensed therapists.
                Start your journey today with <strong>2 confidential free sessions</strong>.
              </p>

              <div className="mc-landing-actions mc-fade-up mc-delay-3">
                <Link
                  to="/survey"
                  className="mc-btn-hero-primary"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                    color: "#ffffff",
                    padding: "14px 26px",
                    borderRadius: "14px",
                    fontWeight: "700",
                    fontSize: "0.98rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    boxShadow: "0 10px 30px rgba(79, 70, 229, 0.35)",
                    textDecoration: "none"
                  }}
                >
                  <i className="bi bi-stars" /> Start Free Assessment
                </Link>

                <Link
                  to="/signup"
                  className="mc-btn-hero-outline"
                  style={{
                    padding: "14px 22px",
                    borderRadius: "14px",
                    fontWeight: "600",
                    fontSize: "0.98rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    backdropFilter: "blur(10px)",
                    textDecoration: "none"
                  }}
                >
                  <i className="bi bi-person-plus-fill" /> Sign Up Free
                </Link>
              </div>

              <div className="mc-trust-row mc-fade-up mc-delay-4">
                <span><i className="bi bi-shield-check" /> 100% Confidential</span>
                <span><i className="bi bi-gift-fill" /> 2 Free Sessions</span>
                <span><i className="bi bi-incognito" /> Anonymous Mode</span>
                <span><i className="bi bi-patch-check-fill" /> Verified Clinicians</span>
              </div>
            </div>

            {/* Right Hero Column: Sleek, Minimalist & Aesthetic Session Card */}
            <div className="mc-landing-visual mc-fade-up mc-delay-2">
              <div className="mc-hero-floating-container">
                <div className="mc-hero-card-glow" />

                <div className="mc-hero-interactive-card">
                  {/* Therapist Header */}
                  <div className="mc-hero-card-header">
                    <div className="mc-hero-clinician-info">
                      <div className="mc-hero-avatar-wrap">
                        <div className="mc-hero-avatar-gradient">
                          <i className="bi bi-person-fill" />
                        </div>
                        <span className="mc-hero-avatar-status" />
                      </div>
                      <div>
                        <div className="mc-hero-clinician-name">
                          <span>Dr. Sarah Jenkins</span>
                          <i className="bi bi-patch-check-fill mc-verified-badge" title="Verified Licensed Clinician" />
                        </div>
                        <div className="mc-hero-clinician-role">Clinical Psychologist • CBT</div>
                      </div>
                    </div>

                    <div className="mc-hero-live-pill">
                      <span className="mc-live-ping-dot" />
                      <span>Live Session</span>
                    </div>
                  </div>

                  {/* Clean Voice Waveform */}
                  <div className="mc-hero-wave-section">
                    <div className="mc-hero-wave-header">
                      <span><i className="bi bi-soundwave" /> Voice Resonance</span>
                      <span className="mc-hero-wave-latency">Encrypted HD</span>
                    </div>
                    <div className="mc-hero-audio-wave">
                      {[35, 60, 80, 45, 90, 65, 40, 85, 55, 75, 50, 65].map((h, i) => (
                        <div
                          key={i}
                          className="mc-hero-wave-bar"
                          style={{
                            animationDelay: `${(i % 6) * 0.15}s`,
                            height: `${h}%`
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Aesthetic Therapeutic Message */}
                  <div className="mc-hero-dialogue-box">
                    <p className="mc-hero-dialogue-text">
                      "Take a slow breath. You are safe, heard, and supported here."
                    </p>
                    <div className="mc-hero-dialogue-footer">
                      <span className="mc-stress-shift-badge">
                        <i className="bi bi-shield-check" /> 100% Confidential
                      </span>
                      <span className="mc-dialogue-modality">CBT Care</span>
                    </div>
                  </div>

                  {/* Minimalist Assurances */}
                  <div className="mc-hero-card-chips">
                    <span className="mc-hero-chip mc-chip-privacy">
                      <i className="bi bi-incognito" /> Anonymous
                    </span>
                    <span className="mc-hero-chip mc-chip-video">
                      <i className="bi bi-gift-fill" /> 2 Free Sessions
                    </span>
                    <span className="mc-hero-chip mc-chip-rating">
                      <i className="bi bi-star-fill" /> 4.95 Rating
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS SECTION ── */}
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

        {/* ── GEMINI CLINICAL AI DIAGNOSTIC SHOWCASE ── */}
        <section className="mc-landing-ai-section">
          <div className="mc-container">
            <div style={{ maxWidth: "700px", margin: "0 auto 40px", textAlign: "center" }} className="mc-scroll-reveal">
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", padding: "5px 14px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: "700", marginBottom: "14px" }}>
                <i className="bi bi-lightning-charge-fill" /> Adaptive Intake
              </div>
              <h2 className="mc-section-heading">
                AI That Truly Listens &amp; Adapts
              </h2>
              <p className="mc-section-sub">
                MindCare's Clinical AI analyzes each answer in real time to ask meaningful follow-up questions tailored to your needs.
              </p>
            </div>

            {/* AI Survey Simulation Card */}
            <div className="mc-scroll-reveal mc-ai-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "16px", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #4f46e5, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.2rem" }}>
                    <i className="bi bi-stars" />
                  </div>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "0.98rem" }}>Adaptive Neural Check-in</div>
                    <div style={{ color: "#38bdf8", fontSize: "0.8rem", fontWeight: "600" }}>Live Clinical Triage</div>
                  </div>
                </div>
                <Link
                  to="/survey"
                  style={{
                    background: "rgba(56, 189, 248, 0.15)",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                    color: "#38bdf8",
                    padding: "7px 16px",
                    borderRadius: "10px",
                    fontSize: "0.84rem",
                    fontWeight: "700",
                    textDecoration: "none"
                  }}
                >
                  Start Assessment &rarr;
                </Link>
              </div>

              {/* Sample Dialog Preview */}
              <div style={{ display: "grid", gap: "14px" }}>
                <div className="mc-dialog-client">
                  <div style={{ fontSize: "0.76rem", color: "var(--mc-muted)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
                    Your Response
                  </div>
                  <div style={{ fontSize: "0.92rem" }}>
                    "I feel sudden anxiety spikes and racing heart before morning team meetings."
                  </div>
                </div>

                <div className="mc-dialog-ai">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.76rem", color: "#818cf8", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
                    <i className="bi bi-sparkles" /> AI Clinical Reflection &amp; Follow-up
                  </div>
                  <div style={{ color: "#93c5fd", fontStyle: "italic", fontSize: "0.88rem", marginBottom: "6px" }}>
                    "It sounds exhausting to experience physical anxiety right as your workday starts..."
                  </div>
                  <div style={{ fontWeight: "600", fontSize: "0.94rem" }}>
                    "When these sensations occur, what thoughts typically run through your mind?"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── THERAPY MODALITIES SECTION ── */}
        <section className="mc-landing-modalities-section">
          <div className="mc-container">
            <div style={{ maxWidth: "700px", margin: "0 auto 48px", textAlign: "center" }} className="mc-scroll-reveal">
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(129, 140, 248, 0.1)", border: "1px solid rgba(129, 140, 248, 0.3)", color: "#818cf8", padding: "5px 14px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: "700", marginBottom: "14px" }}>
                <i className="bi bi-diagram-3-fill" /> Proven Modalities
              </div>
              <h2 className="mc-section-heading">
                Personalized Care Pathways
              </h2>
              <p className="mc-section-sub">
                Evidence-based therapeutic modalities matched to your personal goals.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "20px" }}>
              {MODALITIES.map((mod) => (
                <div
                  key={mod.code}
                  className="mc-scroll-reveal mc-modality-card"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.borderColor = mod.color;
                    e.currentTarget.style.boxShadow = `0 14px 30px ${mod.color}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "";
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: `${mod.color}20`, color: mod.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                      <i className={`bi bi-${mod.icon}`} />
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: mod.color, background: `${mod.color}15`, padding: "4px 10px", borderRadius: "99px", border: `1px solid ${mod.color}35` }}>
                      {mod.code}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.12rem", fontWeight: "800", marginBottom: "8px" }}>
                    {mod.title}
                  </h3>
                  <p style={{ fontSize: "0.88rem", lineHeight: "1.6", margin: 0 }}>
                    {mod.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PLATFORM FEATURES ── */}
        <section className="mc-landing-features-section">
          <div className="mc-container">
            <div style={{ maxWidth: "700px", margin: "0 auto 48px", textAlign: "center" }} className="mc-scroll-reveal">
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(52, 211, 153, 0.1)", border: "1px solid rgba(52, 211, 153, 0.3)", color: "#34d399", padding: "5px 14px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: "700", marginBottom: "14px" }}>
                <i className="bi bi-shield-lock-fill" /> Platform Highlights
              </div>
              <h2 className="mc-section-heading">
                A Safe Sanctuary for Healing
              </h2>
              <p className="mc-section-sub">
                Designed for maximum privacy, comfort, and verified clinical guidance.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "20px" }}>
              {PLATFORM_FEATURES.map((feat) => (
                <div
                  key={feat.title}
                  className="mc-scroll-reveal mc-feature-landing-card"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.15)", color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                      <i className={`bi bi-${feat.icon}`} />
                    </div>
                    <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#38bdf8", background: "rgba(56, 189, 248, 0.1)", padding: "3px 10px", borderRadius: "99px" }}>
                      {feat.tag}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "6px" }}>
                    {feat.title}
                  </h3>
                  <p style={{ fontSize: "0.88rem", lineHeight: "1.6", margin: 0 }}>
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="mc-landing-steps-section">
          <div className="mc-container">
            <div style={{ maxWidth: "700px", margin: "0 auto 48px", textAlign: "center" }} className="mc-scroll-reveal">
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.3)", color: "#fbbf24", padding: "5px 14px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: "700", marginBottom: "14px" }}>
                <i className="bi bi-clock-history" /> 4 Simple Steps
              </div>
              <h2 className="mc-section-heading">
                Start in Under 3 Minutes
              </h2>
              <p className="mc-section-sub">
                Begin your journey with clear, guided steps from day one.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
              {STEPS.map((step) => (
                <div
                  key={step.num}
                  className="mc-scroll-reveal mc-step-landing-card"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <span style={{ fontSize: "1.6rem", fontWeight: "900", color: "#4f46e5", opacity: 0.85 }}>
                      {step.num}
                    </span>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.05rem" }}>
                      <i className={`bi bi-${step.icon}`} />
                    </div>
                  </div>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: "800", marginBottom: "6px" }}>
                    {step.title}
                  </h4>
                  <p style={{ fontSize: "0.86rem", lineHeight: "1.55", margin: 0 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CALL TO ACTION ── */}
        <section className="mc-landing-cta-section">
          <div className="mc-container">
            <div className="mc-scroll-reveal mc-cta-card">
              <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(56, 189, 248, 0.2), transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: "-100px", left: "-100px", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(168, 85, 247, 0.2), transparent 70%)", pointerEvents: "none" }} />

              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.4)", color: "#4ade80", padding: "6px 16px", borderRadius: "99px", fontSize: "0.84rem", fontWeight: "700", marginBottom: "18px" }}>
                <i className="bi bi-gift-fill" /> 2 Free Sessions Included
              </div>

              <h2 className="mc-cta-title">
                Ready to Reclaim Your Mental Clarity?
              </h2>

              <p className="mc-cta-sub">
                Take your free 3-minute intake check-in or create an account in seconds.
              </p>

              <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link
                  to="/survey"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                    color: "#ffffff",
                    padding: "15px 30px",
                    borderRadius: "14px",
                    fontWeight: "700",
                    fontSize: "1.02rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    boxShadow: "0 10px 30px rgba(79, 70, 229, 0.35)",
                    textDecoration: "none"
                  }}
                >
                  <i className="bi bi-stars" /> Take AI Assessment
                </Link>

                <Link
                  to="/signup"
                  className="mc-cta-btn-outline"
                  style={{
                    padding: "15px 26px",
                    borderRadius: "14px",
                    fontWeight: "600",
                    fontSize: "1.02rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    textDecoration: "none"
                  }}
                >
                  Create Free Account
                </Link>
              </div>

              <div className="mc-cta-trust-row">
                <span><i className="bi bi-lock-fill" style={{ color: "#38bdf8" }} /> No Card Needed</span>
                <span><i className="bi bi-shield-fill-check" style={{ color: "#34d399" }} /> Cancel Anytime</span>
                <span><i className="bi bi-incognito" style={{ color: "#c084fc" }} /> Anonymous Mode</span>
              </div>
            </div>
          </div>
        </section>

      </main>
    </PublicShell>
  );
}
