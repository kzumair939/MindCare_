import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import PublicShell from "../components/layout/PublicShell";
import InteractiveBrain3D from "../components/common/InteractiveBrain3D";

const STATS = [
  ["500+", "Verified Clinical Therapists"],
  ["99.2%", "Diagnostic Match Accuracy"],
  ["24/7", "Confidential & Anonymous Support"],
  ["100%", "End-to-End HIPAA-Grade Privacy"]
];

const MODALITIES = [
  {
    code: "CBT",
    title: "Cognitive Behavioural Therapy",
    desc: "Restructure automatic catastrophic thought loops, lower physical anxiety, and build proactive daily coping mechanisms.",
    icon: "lightning-charge-fill",
    color: "#38bdf8",
    lobe: "Prefrontal Cortex"
  },
  {
    code: "ACT",
    title: "Acceptance & Commitment",
    desc: "Navigate emotional heaviness and lack of motivation while building purposeful habits aligned with your core values.",
    icon: "compass-fill",
    color: "#818cf8",
    lobe: "Anterior Cingulate"
  },
  {
    code: "DBT",
    title: "Dialectical Behaviour Therapy",
    desc: "Master emotional regulation, distress tolerance, crisis stabilization, and mindfulness grounding tools.",
    icon: "shield-fill-plus",
    color: "#c084fc",
    lobe: "Limbic System"
  },
  {
    code: "SLEEP_CBT_I",
    title: "Sleep & Circadian Restoration",
    desc: "CBT for Insomnia (CBT-I) to re-establish natural sleep pressure, quiet nighttime racing thoughts, and eliminate insomnia.",
    icon: "moon-stars-fill",
    color: "#34d399",
    lobe: "Hypothalamus"
  },
  {
    code: "ADHD_COACHING",
    title: "ADHD & Executive Function",
    desc: "Structured anti-procrastination frameworks, environmental optimization, and task initiation coaching.",
    icon: "bullseye",
    color: "#fbbf24",
    lobe: "Dorsolateral Prefrontal"
  },
  {
    code: "GENERAL_COUNSELLING",
    title: "Personalized Counselling",
    desc: "Empathetic, non-judgmental guidance to work through relationship strain, life transitions, and burnout.",
    icon: "heart-pulse-fill",
    color: "#f472b6",
    lobe: "Temporal / Parietal"
  }
];

const PLATFORM_FEATURES = [
  {
    icon: "gift-fill",
    title: "2 Free Sessions Guaranteed",
    desc: "Begin your therapy journey with zero financial barrier. Full access with no credit card required upfront.",
    tag: "Zero Cost"
  },
  {
    icon: "incognito",
    title: "True Anonymous Mode",
    desc: "Use an alias, turn off video, and protect your privacy in sessions and peer chat rooms.",
    tag: "100% Private"
  },
  {
    icon: "cpu-fill",
    title: "Gemini Clinical AI Intake",
    desc: "Our AI clinical advisor listens to your answers and asks adaptive questions to recommend your ideal therapy type.",
    tag: "AI Powered"
  },
  {
    icon: "people-fill",
    title: "Moderated Peer Group Rooms",
    desc: "Join safe, supportive community circles focused on anxiety, burnout, sleep, and relationships.",
    tag: "Community"
  },
  {
    icon: "calendar2-check-fill",
    title: "Real-Time Smart Scheduling",
    desc: "Instantly view verified therapists' open time slots and book in seconds without back-and-forth emails.",
    tag: "Instant Booking"
  },
  {
    icon: "file-earmark-medical-fill",
    title: "Personalized Action Plans",
    desc: "Receive customized self-care blueprints, progress tracking, and clinician summaries after each session.",
    tag: "Clinical Care"
  }
];

const STEPS = [
  {
    num: "01",
    title: "Adaptive AI Check-in",
    desc: "Answer 5 to 10 tailored intake questions generated dynamically by Gemini Clinical AI.",
    icon: "chat-left-dots-fill"
  },
  {
    num: "02",
    title: "Get Your Therapy Blueprint",
    desc: "Receive your calculated stress score, therapy modality (CBT, ACT, DBT, etc.), and immediate self-care steps.",
    icon: "clipboard2-pulse-fill"
  },
  {
    num: "03",
    title: "Match & Book Free Session",
    desc: "Choose from verified therapists specializing in your therapy modality and book your first 2 sessions free.",
    icon: "calendar-heart-fill"
  },
  {
    num: "04",
    title: "Grow & Transform",
    desc: "Attend 1-on-1 private video sessions, track your wellness progress, and participate in peer circles.",
    icon: "stars"
  }
];

export default function Landing() {
  const statsRef = useRef(null);
  const [selectedLobe, setSelectedLobe] = useState("all");

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

        {/* ── 3D NEURAL HERO SECTION ── */}
        <section className="mc-landing-hero">
          <div className="mc-landing-glow" />
          <div className="mc-landing-orb mc-orb-1" />
          <div className="mc-landing-orb mc-orb-2" />
          <div className="mc-landing-orb mc-orb-3" />

          <div className="mc-landing-content">
            {/* Left Hero Column */}
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
                  fontSize: "clamp(0.72rem, 2.8vw, 0.82rem)",
                  fontWeight: "700",
                  marginBottom: "20px",
                  backdropFilter: "blur(10px)",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  textAlign: "center",
                  lineHeight: "1.3"
                }}
              >
                <i className="bi bi-cpu-fill" style={{ color: "#38bdf8", flexShrink: 0 }} />
                <span>Next-Gen Adaptive Mental Health Ecosystem</span>
              </div>

              <h1 className="mc-landing-title mc-fade-up mc-delay-1">
                Rewire Your Mind with{" "}
                <span className="mc-gradient-text">Clinical AI &amp; Expert Care.</span>
              </h1>

              <p className="mc-landing-sub mc-fade-up mc-delay-2">
                MindCare combines real-time adaptive AI diagnostics with 500+ verified licensed therapists.
                Experience personalized psychiatric matching and start with <strong>2 confidential free sessions</strong>.
              </p>

              <div className="mc-landing-actions mc-fade-up mc-delay-3">
                <Link
                  to="/survey"
                  className="mc-btn-hero-primary"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                    color: "#ffffff",
                    padding: "14px 24px",
                    borderRadius: "14px",
                    fontWeight: "700",
                    fontSize: "0.98rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    boxShadow: "0 10px 30px rgba(79, 70, 229, 0.4)",
                    textDecoration: "none"
                  }}
                >
                  <i className="bi bi-stars" /> Take AI Assessment Free
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
                  <i className="bi bi-person-plus-fill" /> Sign Up (2 Free Sessions)
                </Link>
              </div>

              <div className="mc-trust-row mc-fade-up mc-delay-4">
                <span><i className="bi bi-shield-check" /> 100% Confidential</span>
                <span><i className="bi bi-gift-fill" /> 2 Free Sessions</span>
                <span><i className="bi bi-incognito" /> Anonymous Mode</span>
                <span><i className="bi bi-patch-check-fill" /> Licensed Clinicians</span>
              </div>
            </div>

            {/* Right Hero Column: 3D Interactive Brain Stage */}
            <div className="mc-landing-visual mc-fade-up mc-delay-2" style={{ position: "relative" }}>
              <div className="mc-3d-brain-stage">
                {/* Floating Metrics Badge 1 */}
                <div className="mc-brain-floating-badge mc-badge-top-left">
                  <div className="mc-badge-pulse-indicator" />
                  <div>
                    <div className="mc-badge-title">Prefrontal Cortex Active</div>
                    <div className="mc-badge-sub">Cognitive Restructuring Synced</div>
                  </div>
                </div>

                {/* 3D Brain Canvas */}
                <InteractiveBrain3D activeMode={selectedLobe} />

                {/* Floating Metrics Badge 2 */}
                <div className="mc-brain-floating-badge mc-badge-bottom-right">
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8" }}>
                    <i className="bi bi-stars" />
                  </div>
                  <div>
                    <div className="mc-badge-title">Gemini Clinical AI</div>
                    <div className="mc-badge-sub">Dynamic Neural Intake Ready</div>
                  </div>
                </div>
              </div>

              {/* Neural Lobe Selector Bar */}
              <div className="mc-neural-explorer-bar">
                <button
                  type="button"
                  onClick={() => setSelectedLobe("all")}
                  className={`mc-neural-tag ${selectedLobe === "all" ? "active" : ""}`}
                >
                  <i className="bi bi-globe2" /> Full Neural Network
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLobe("cbt")}
                  className={`mc-neural-tag ${selectedLobe === "cbt" ? "active" : ""}`}
                >
                  <i className="bi bi-cpu" /> Prefrontal (CBT)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLobe("act")}
                  className={`mc-neural-tag ${selectedLobe === "act" ? "active" : ""}`}
                >
                  <i className="bi bi-compass" /> Limbic (ACT)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLobe("sleep")}
                  className={`mc-neural-tag ${selectedLobe === "sleep" ? "active" : ""}`}
                >
                  <i className="bi bi-moon" /> Hypothalamus (Sleep)
                </button>
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
            <div style={{ maxWidth: "800px", margin: "0 auto 50px", textAlign: "center" }} className="mc-scroll-reveal">
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", padding: "5px 14px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: "700", marginBottom: "14px" }}>
                <i className="bi bi-lightning-charge-fill" /> Real-Time Adaptive Intake
              </div>
              <h2 className="mc-section-heading">
                An AI That Truly Listens and Adapts to You
              </h2>
              <p className="mc-section-sub">
                Unlike rigid, static questionnaires, MindCare's Gemini Clinical AI analyzes each answer in real time to ask meaningful follow-up questions — just like an empathetic clinical specialist.
              </p>
            </div>

            {/* AI Survey Simulation Card */}
            <div className="mc-scroll-reveal mc-ai-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "18px", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #4f46e5, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.2rem" }}>
                    <i className="bi bi-stars" />
                  </div>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "1rem" }}>Adaptive Neural Check-in</div>
                    <div style={{ color: "#38bdf8", fontSize: "0.8rem", fontWeight: "600" }}>Live Multi-Turn Clinical Triage</div>
                  </div>
                </div>
                <Link
                  to="/survey"
                  style={{
                    background: "rgba(56, 189, 248, 0.15)",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                    color: "#38bdf8",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    textDecoration: "none"
                  }}
                >
                  Start Assessment &rarr;
                </Link>
              </div>

              {/* Sample Dialog Preview */}
              <div style={{ display: "grid", gap: "16px" }}>
                <div className="mc-dialog-client">
                  <div style={{ fontSize: "0.78rem", color: "var(--mc-muted)", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>
                    Client Response (Turn 1)
                  </div>
                  <div style={{ fontSize: "0.95rem" }}>
                    "I have severe anxiety and racing heart spikes before team meetings in the morning."
                  </div>
                </div>

                <div className="mc-dialog-ai">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#818cf8", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>
                    <i className="bi bi-sparkles" /> AI Clinical Reflection &amp; Dynamic Follow-Up
                  </div>
                  <div style={{ color: "#93c5fd", fontStyle: "italic", fontSize: "0.9rem", marginBottom: "8px" }}>
                    "It sounds incredibly exhausting to feel that physical surge of panic right as your workday begins..."
                  </div>
                  <div style={{ fontWeight: "600", fontSize: "1rem" }}>
                    "When those sudden physical sensations occur, what thoughts typically run through your mind?"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── THERAPY MODALITIES SECTION ── */}
        <section className="mc-landing-modalities-section">
          <div className="mc-container">
            <div style={{ maxWidth: "700px", margin: "0 auto 60px", textAlign: "center" }} className="mc-scroll-reveal">
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(129, 140, 248, 0.1)", border: "1px solid rgba(129, 140, 248, 0.3)", color: "#818cf8", padding: "5px 14px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: "700", marginBottom: "14px" }}>
                <i className="bi bi-diagram-3-fill" /> Evidence-Based Modalities
              </div>
              <h2 className="mc-section-heading">
                Personalized Pathways for Every Mind
              </h2>
              <p className="mc-section-sub">
                Our clinicians specialize in gold-standard therapeutic modalities matched directly to your neurological needs.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "24px" }}>
              {MODALITIES.map((mod, idx) => (
                <div
                  key={mod.code}
                  className="mc-scroll-reveal mc-modality-card"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.borderColor = mod.color;
                    e.currentTarget.style.boxShadow = `0 16px 36px ${mod.color}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "";
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: `${mod.color}20`, color: mod.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
                      <i className={`bi bi-${mod.icon}`} />
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: mod.color, background: `${mod.color}15`, padding: "4px 10px", borderRadius: "99px", border: `1px solid ${mod.color}35` }}>
                      {mod.code}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "10px" }}>
                    {mod.title}
                  </h3>
                  <p style={{ fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "16px" }}>
                    {mod.desc}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "var(--mc-muted)", fontWeight: "600" }}>
                    <i className="bi bi-geo-alt-fill" style={{ color: mod.color }} /> Target Lobe: {mod.lobe}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PLATFORM PILLARS & FEATURES ── */}
        <section className="mc-landing-features-section">
          <div className="mc-container">
            <div style={{ maxWidth: "700px", margin: "0 auto 60px", textAlign: "center" }} className="mc-scroll-reveal">
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(52, 211, 153, 0.1)", border: "1px solid rgba(52, 211, 153, 0.3)", color: "#34d399", padding: "5px 14px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: "700", marginBottom: "14px" }}>
                <i className="bi bi-shield-lock-fill" /> Safe, Simple, Secure
              </div>
              <h2 className="mc-section-heading">
                A Comprehensive Sanctuary for Healing
              </h2>
              <p className="mc-section-sub">
                Designed from the ground up for comfort, accessibility, and strict privacy.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "24px" }}>
              {PLATFORM_FEATURES.map((feat, i) => (
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.15)", color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
                      <i className={`bi bi-${feat.icon}`} />
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#38bdf8", background: "rgba(56, 189, 248, 0.1)", padding: "3px 10px", borderRadius: "99px" }}>
                      {feat.tag}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "8px" }}>
                    {feat.title}
                  </h3>
                  <p style={{ fontSize: "0.9rem", lineHeight: "1.6", margin: 0 }}>
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS SECTION ── */}
        <section className="mc-landing-steps-section">
          <div className="mc-container">
            <div style={{ maxWidth: "700px", margin: "0 auto 60px", textAlign: "center" }} className="mc-scroll-reveal">
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.3)", color: "#fbbf24", padding: "5px 14px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: "700", marginBottom: "14px" }}>
                <i className="bi bi-clock-history" /> 4 Simple Steps
              </div>
              <h2 className="mc-section-heading">
                How Your MindCare Journey Begins
              </h2>
              <p className="mc-section-sub">
                Get started in under 3 minutes with full guidance every step of the way.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
              {STEPS.map((step, idx) => (
                <div
                  key={step.num}
                  className="mc-scroll-reveal mc-step-landing-card"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <span style={{ fontSize: "1.8rem", fontWeight: "900", color: "#4f46e5", opacity: 0.8 }}>
                      {step.num}
                    </span>
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                      <i className={`bi bi-${step.icon}`} />
                    </div>
                  </div>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "8px" }}>
                    {step.title}
                  </h4>
                  <p style={{ fontSize: "0.88rem", lineHeight: "1.6", margin: 0 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CALL TO ACTION SECTION ── */}
        <section className="mc-landing-cta-section">
          <div className="mc-container">
            <div className="mc-scroll-reveal mc-cta-card">
              <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(56, 189, 248, 0.2), transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: "-100px", left: "-100px", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(168, 85, 247, 0.2), transparent 70%)", pointerEvents: "none" }} />

              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.4)", color: "#4ade80", padding: "6px 16px", borderRadius: "99px", fontSize: "0.85rem", fontWeight: "700", marginBottom: "20px" }}>
                <i className="bi bi-gift-fill" /> Start with 2 Free Sessions Today
              </div>

              <h2 className="mc-cta-title">
                Ready to Reclaim Your Mental Clarity?
              </h2>

              <p className="mc-cta-sub">
                Take your free 3-minute adaptive clinical check-in or create an account in 30 seconds. No credit card required.
              </p>

              <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link
                  to="/survey"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                    color: "#ffffff",
                    padding: "16px 32px",
                    borderRadius: "14px",
                    fontWeight: "700",
                    fontSize: "1.05rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    boxShadow: "0 10px 30px rgba(79, 70, 229, 0.4)",
                    textDecoration: "none"
                  }}
                >
                  <i className="bi bi-stars" /> Take AI Assessment
                </Link>

                <Link
                  to="/signup"
                  className="mc-cta-btn-outline"
                  style={{
                    padding: "16px 28px",
                    borderRadius: "14px",
                    fontWeight: "600",
                    fontSize: "1.05rem",
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
                <span><i className="bi bi-incognito" style={{ color: "#c084fc" }} /> 100% Anonymous Mode</span>
              </div>
            </div>
          </div>
        </section>

      </main>
    </PublicShell>
  );
}
