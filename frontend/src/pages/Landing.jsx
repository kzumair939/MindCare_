import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import PublicShell from "../components/layout/PublicShell";
import "../styles/landing-pro.css";

// ── THERAPIST DATA ──────────────────────────────────────────────
const THERAPISTS = [
  {
    id: "alex",
    name: "Dr. Alex Morgan, MD",
    role: "Clinical Psychiatrist",
    specialty: "Anxiety, Panic & PTSD",
    category: "anxiety",
    image: "/images/therapist-alex.jpg",
    verified: true,
    rating: "4.98",
    reviews: 142,
    badge: "Verification"
  },
  {
    id: "sarah",
    name: "Sarah Jenkins, LMFT",
    role: "Licensed Family Therapist",
    specialty: "Work Burnout & Life Transitions",
    category: "burnout",
    image: "/images/therapist-sarah.jpg",
    verified: true,
    rating: "4.96",
    reviews: 198,
    badge: "Verification"
  },
  {
    id: "david",
    name: "Dr. David Cole, PsyD",
    role: "Behavioral Sleep Specialist",
    specialty: "CBT-I, Insomnia & Sleep Anxiety",
    category: "sleep",
    image: "/images/therapist-david.jpg",
    verified: true,
    rating: "4.99",
    reviews: 215,
    badge: "Verification"
  }
];

// ── THERAPY APPROACHES ──────────────────────────────────────────
const APPROACHES = [
  {
    code: "CBT",
    name: "Cognitive Behavioral Therapy",
    desc: "Connect with licensed therapists while keeping your identity private. Reframe negative thought loops and build evidence-backed daily coping habits."
  },
  {
    code: "ACT",
    name: "Acceptance & Commitment",
    desc: "Connective conversations and solution-oriented mindfulness to accept emotional struggles and commit to meaningful life actions."
  },
  {
    code: "DBT",
    name: "Dialectical Behavior Therapy",
    desc: "Professional guidance and therapeutic skills focused on distress tolerance, emotional regulation, and mindful communication."
  },
  {
    code: "CBT-I",
    name: "Circadian & Insomnia Therapy",
    desc: "Converting clinical sleep science into actionable behavioral modifications to restore natural, deep sleep cycles."
  }
];

// ── REVIEWS DATA ────────────────────────────────────────────────
const REVIEWS = [
  {
    id: 1,
    author: "Anonymous Member",
    verified: "Verified Client · 8 sessions",
    text: "The anonymous membership made me feel completely safe. Not having to disclose my real name or turn on video let me be truly honest about my anxiety for the first time.",
    rating: 5,
    tag: "Anxiety & Panic"
  },
  {
    id: 2,
    author: "Anonymous Member",
    verified: "Verified Client · 14 sessions",
    text: "MindCare paired me with Sarah in less than 24 hours. The privacy controls gave me peace of mind, and the therapy quality is the highest I've ever experienced.",
    rating: 5,
    tag: "Burnout Recovery"
  },
  {
    id: 3,
    author: "Anonymous Member",
    verified: "Verified Client · 6 sessions",
    text: "This platform is true peace of mind. Anonymous with total security and serenity on the finest scale. My sleep returned to normal within three weeks.",
    rating: 5,
    tag: "Sleep & CBT-I"
  },
  {
    id: 4,
    author: "Anonymous Member",
    verified: "Verified Client · 11 sessions",
    text: "As a working executive, privacy was my number one hesitation. MindCare eliminated all friction. My therapist Dr. Alex is exceptionally insightful.",
    rating: 5,
    tag: "Executive Stress"
  }
];

// ── FAQ DATA ────────────────────────────────────────────────────
const FAQS = [
  {
    q: "What is anonymous therapy on MindCare?",
    a: "MindCare allows you to receive professional mental health care from licensed clinicians without ever exposing your legal name, employer, or real-life identity. You can interact via encrypted text, voice, or private video with zero facial recognition or photo requirement."
  },
  {
    q: "What should I take note of on MindCare?",
    a: "All therapists on our platform are verified, licensed professionals (MD, PsyD, LMFT, LCSW). You can choose your communication medium, change therapists at any time for free, and schedule sessions that suit your time zone."
  },
  {
    q: "What do the health information systems use?",
    a: "We utilize banking-grade 256-bit AES encryption for all data in transit and at rest. Our infrastructure is HIPAA and GDPR compliant with strict zero-knowledge data retention policies."
  },
  {
    q: "What is your action orientation therapy?",
    a: "Our clinicians blend compassionate listening with structured, evidence-based methodologies such as CBT, ACT, and DBT to provide you with concrete tools and measurable weekly milestones."
  },
  {
    q: "How do I get matched with a therapist?",
    a: "Take our confidential 2-minute wellbeing survey. Our clinical matching algorithm immediately pairs you with specialized licensed therapists matching your needs and schedule."
  }
];

export default function Landing() {
  const navigate = useNavigate();

  // Anonymous Mode interactive toggle state
  const [isAnonymousActive, setIsAnonymousActive] = useState(true);
  const [anonymousDropdownOpen, setAnonymousDropdownOpen] = useState(false);

  // Anonymous Aliases pool for interactive preview
  const ANONYMOUS_ALIASES = [
    "CalmRiver#4092",
    "SilentForest#9201",
    "TranquilBreeze#1184",
    "SereneHarbor#3052",
    "GentlePine#7840",
    "QuietMeadow#6521"
  ];
  const [aliasIndex, setAliasIndex] = useState(0);
  const currentAlias = ANONYMOUS_ALIASES[aliasIndex];

  const handleRegenerateAlias = () => {
    setAliasIndex((prev) => (prev + 1) % ANONYMOUS_ALIASES.length);
  };

  // Therapist filter state
  const [therapistFilter, setTherapistFilter] = useState("all");

  const filteredTherapists = therapistFilter === "all"
    ? THERAPISTS
    : THERAPISTS.filter(t => t.category === therapistFilter);

  // Reviews carousel state
  const [reviewIndex, setReviewIndex] = useState(0);

  const nextReview = () => {
    setReviewIndex((prev) => (prev + 1) % REVIEWS.length);
  };

  const prevReview = () => {
    setReviewIndex((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  };

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <PublicShell>
      <div className="mc-ref-landing">
        
        {/* ── 1. HERO SECTION ───────────────────────────────────── */}
        <section className="mc-ref-hero">
          <div className="mc-ref-hero-container">
            
            {/* Left Hero Text */}
            <motion.div 
              className="mc-ref-hero-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="mc-ref-hero-title">
                Therapy that lets you stay yourself.
              </h1>
              <p className="mc-ref-hero-subtitle">
                Connect with licensed therapists while keeping your identity private.
              </p>
              
              <div className="mc-ref-hero-actions">
                <Link to="/survey" className="mc-ref-btn-primary">
                  <span>Start privately</span>
                  <i className="bi bi-arrow-right" aria-hidden="true" />
                </Link>
                <a href="#how-it-works" className="mc-ref-btn-outline">
                  How it works
                </a>
              </div>
            </motion.div>

            {/* Right Hero UI Dashboard Showcase Mockup */}
            <motion.div 
              className="mc-ref-hero-mockup"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              <div className="mc-hero-dashboard-window">
                
                {/* Window Topbar */}
                <div className="mc-dashboard-topbar">
                  <div className="mc-dashboard-title">
                    <span>Dashboard</span> / <span className="mc-dash-title-sub">Privacy Insights</span>
                  </div>
                  <div className="mc-dashboard-status">
                    <span className="mc-status-indicator" />
                    <span>Online</span>
                  </div>
                </div>

                {/* Dashboard 2x2 Grid */}
                <div className="mc-dashboard-grid">
                  
                  {/* Card 1: Secure Progress Overview */}
                  <div className="mc-dash-card mc-card-progress">
                    <div className="mc-dash-card-header">
                      <span className="mc-dash-card-title">Secure Progress Overview</span>
                    </div>
                    <div className="mc-gauge-container">
                      <svg viewBox="0 0 160 85" className="mc-gauge-svg">
                        <defs>
                          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#0d9488" />
                            <stop offset="100%" stopColor="#14b8a6" />
                          </linearGradient>
                        </defs>
                        {/* Background track (semi-circle) */}
                        <path
                          d="M 22 75 A 58 58 0 0 1 138 75"
                          fill="none"
                          stroke="currentColor"
                          className="mc-gauge-track"
                          strokeWidth="13"
                          strokeLinecap="round"
                        />
                        {/* Active arc (65%) */}
                        <path
                          d="M 22 75 A 58 58 0 0 1 138 75"
                          fill="none"
                          stroke="url(#gaugeGradient)"
                          strokeWidth="13"
                          strokeLinecap="round"
                          strokeDasharray="182.2"
                          strokeDashoffset="63.77"
                        />
                      </svg>
                      <div className="mc-gauge-info">
                        <span className="mc-gauge-val">65%</span>
                        <span className="mc-gauge-lbl">Session Consistency</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Anonymous Activity Flow */}
                  <div className="mc-dash-card mc-card-activity">
                    <div className="mc-dash-card-header">
                      <span className="mc-dash-card-title">Anonymous Activity Flow</span>
                    </div>
                    <div className="mc-wave-chart-container">
                      <div className="mc-chart-badge-pin">
                        <span>72%</span>
                      </div>
                      <svg viewBox="0 0 200 85" preserveAspectRatio="none" className="mc-wave-svg">
                        <defs>
                          <linearGradient id="tealWave" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="blueWave" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Background purple/blue spline */}
                        <path
                          d="M 0 60 Q 40 40, 80 52 T 160 35 T 200 45 L 200 85 L 0 85 Z"
                          fill="url(#blueWave)"
                        />
                        <path
                          d="M 0 60 Q 40 40, 80 52 T 160 35 T 200 45"
                          fill="none"
                          stroke="#a5b4fc"
                          strokeWidth="1.5"
                        />
                        {/* Foreground teal spline */}
                        <path
                          d="M 0 68 C 30 68, 45 38, 75 48 C 105 58, 130 18, 164 22 C 180 24, 190 32, 200 38 L 200 85 L 0 85 Z"
                          fill="url(#tealWave)"
                        />
                        <path
                          d="M 0 68 C 30 68, 45 38, 75 48 C 105 58, 130 18, 164 22 C 180 24, 190 32, 200 38"
                          fill="none"
                          stroke="#0d9488"
                          strokeWidth="2"
                        />
                        {/* Marker dot at 72% peak */}
                        <circle cx="164" cy="22" r="3.5" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>

                  {/* Card 3: Confidence Level */}
                  <div className="mc-dash-card mc-card-confidence">
                    <div className="mc-dash-card-header">
                      <span className="mc-dash-card-title">Confidence Level</span>
                    </div>
                    <div className="mc-confidence-body">
                      <div className="mc-confidence-icon-box">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mc-sprout-icon">
                          <path d="M7 20h10" />
                          <path d="M12 20v-8" />
                          <path d="M12 12c0-4 4-6 7-6 0 4-2 7-7 7" />
                          <path d="M12 14c0-3-3-5-6-5 0 3 2 6 6 6" />
                          <path d="M18 4l3 3-3 3" />
                        </svg>
                      </div>
                      <div className="mc-confidence-val">72%</div>
                    </div>
                  </div>

                  {/* Card 4: Wellness Trends */}
                  <div className="mc-dash-card mc-card-trends">
                    <div className="mc-dash-card-header">
                      <span className="mc-dash-card-title">Wellness Trends</span>
                    </div>
                    <div className="mc-trends-body">
                      <div className="mc-trend-bar-group">
                        <div className="mc-trend-bar-wrapper">
                          <div className="mc-trend-bar" style={{ height: "32%" }} />
                        </div>
                        <span className="mc-trend-label">1</span>
                      </div>
                      <div className="mc-trend-bar-group">
                        <div className="mc-trend-bar-wrapper">
                          <div className="mc-trend-bar" style={{ height: "52%" }} />
                        </div>
                        <span className="mc-trend-label">2</span>
                      </div>
                      <div className="mc-trend-bar-group">
                        <div className="mc-trend-bar-wrapper">
                          <div className="mc-trend-bar" style={{ height: "74%" }} />
                        </div>
                        <span className="mc-trend-label">3</span>
                      </div>
                      <div className="mc-trend-bar-group">
                        <div className="mc-trend-bar-wrapper">
                          <div className="mc-trend-bar" style={{ height: "96%" }} />
                        </div>
                        <span className="mc-trend-label">4</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer Pill */}
                <div className="mc-dashboard-footer">
                  <span className="mc-illustrative-pill">Illustrative Data only</span>
                </div>

              </div>
            </motion.div>

          </div>
        </section>

        {/* ── 2. TRUST BADGES STRIP ─────────────────────────────── */}
        <section className="mc-ref-trust-strip" aria-label="Trust and Security Badges">
          <div className="mc-ref-container">
            <div className="mc-ref-trust-grid">
              <div className="mc-trust-item">
                <i className="bi bi-lock-fill" aria-hidden="true" />
                <span>Private by design</span>
              </div>
              <div className="mc-trust-item">
                <i className="bi bi-chat-left-text-fill" aria-hidden="true" />
                <span>Secure conversations</span>
              </div>
              <div className="mc-trust-item">
                <i className="bi bi-award-fill" aria-hidden="true" />
                <span>Licensed therapists</span>
              </div>
              <div className="mc-trust-item">
                <i className="bi bi-person-bounding-box" aria-hidden="true" />
                <span>Anonymous identity</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. HOW MINDCARE WORKS ─────────────────────────────── */}
        <section className="mc-ref-section" id="how-it-works">
          <div className="mc-ref-container">
            
            <div className="mc-ref-section-header text-center">
              <h2 className="mc-ref-heading">How MindCare Works</h2>
            </div>

            <div className="mc-ref-steps-grid">
              
              {/* Step 1 */}
              <div className="mc-ref-step-card">
                <div className="mc-step-top">
                  <div className="mc-step-icon">
                    <i className="bi bi-sliders2" aria-hidden="true" />
                  </div>
                  <span className="mc-step-num">1</span>
                </div>
                <h3 className="mc-step-title">Private by design</h3>
                <p className="mc-step-desc">
                  Connect with licensed therapists while keeping your personal identity and background fully protected.
                </p>
              </div>

              {/* Step 2 */}
              <div className="mc-ref-step-card">
                <div className="mc-step-top">
                  <div className="mc-step-icon">
                    <i className="bi bi-chat-quote-fill" aria-hidden="true" />
                  </div>
                  <span className="mc-step-num">2</span>
                </div>
                <h3 className="mc-step-title">Secure conversations</h3>
                <p className="mc-step-desc">
                  Secure encrypted messaging and video rooms tailored to support your healing with zero friction.
                </p>
              </div>

              {/* Step 3 */}
              <div className="mc-ref-step-card">
                <div className="mc-step-top">
                  <div className="mc-step-icon">
                    <i className="bi bi-person-badge-fill" aria-hidden="true" />
                  </div>
                  <span className="mc-step-num">3</span>
                </div>
                <h3 className="mc-step-title">Licensed therapists</h3>
                <p className="mc-step-desc">
                  Collaborate with verified board-certified psychologists and clinicians dedicated to your wellness.
                </p>
              </div>

              {/* Step 4 */}
              <div className="mc-ref-step-card">
                <div className="mc-step-top">
                  <div className="mc-step-icon">
                    <i className="bi bi-incognito" aria-hidden="true" />
                  </div>
                  <span className="mc-step-num">4</span>
                </div>
                <h3 className="mc-step-title">Anonymous identity</h3>
                <p className="mc-step-desc">
                  Choose your alias or avatar. Take therapy entirely on your terms without ever needing a camera on.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ── 4. ANONYMOUS MODE FEATURE BLOCK ───────────────────── */}
        <section className="mc-ref-section mc-bg-subtle" id="anonymous-mode">
          <div className="mc-ref-container">
            
            <div className="mc-ref-feature-split">
              
              {/* Left Details */}
              <div className="mc-ref-feature-text">
                <span className="mc-ref-tag">Private Feature</span>
                <h2 className="mc-ref-feature-title">Anonymous Mode</h2>
                <p className="mc-ref-feature-desc">
                  MindCare connects you with licensed therapists while keeping your private profile completely hidden from third parties and employers.
                </p>
                <div className="mc-feature-action-row">
                  <button 
                    type="button" 
                    className={`mc-status-toggle-btn ${isAnonymousActive ? "active" : ""}`}
                    onClick={() => setIsAnonymousActive(!isAnonymousActive)}
                    aria-label={`Toggle Private Profile mode (currently ${isAnonymousActive ? "active" : "inactive"})`}
                  >
                    <span className="mc-status-toggle-dot" />
                    <span>{isAnonymousActive ? "Private Profile: Active" : "Private Profile: Inactive"}</span>
                  </button>
                  <Link to="/survey" className="mc-ref-btn-primary">
                    <span>Get Matched</span>
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Right Redesigned Anonymous Vault Card */}
              <div className="mc-ref-feature-card-wrapper">
                <div className="mc-vault-card">
                  
                  {/* Vault Top Status Header */}
                  <div className="mc-vault-header">
                    <div className="mc-vault-badge">
                      <i className="bi bi-shield-check" aria-hidden="true" />
                      <span>256-Bit Zero Knowledge</span>
                    </div>
                    <div className={`mc-vault-pill ${isAnonymousActive ? "active" : "disabled"}`}>
                      <span className="mc-vault-dot" />
                      <span>{isAnonymousActive ? "Shield Active" : "Standard"}</span>
                    </div>
                  </div>

                  {/* Mode Selector Switch */}
                  <div className="mc-vault-toggle-container" role="group" aria-label="Identity mode switcher">
                    <button
                      type="button"
                      className={`mc-vault-toggle-btn ${isAnonymousActive ? "selected" : ""}`}
                      onClick={() => setIsAnonymousActive(true)}
                    >
                      <i className="bi bi-incognito" aria-hidden="true" />
                      <span>Anonymous Alias</span>
                    </button>
                    <button
                      type="button"
                      className={`mc-vault-toggle-btn ${!isAnonymousActive ? "selected" : ""}`}
                      onClick={() => setIsAnonymousActive(false)}
                    >
                      <i className="bi bi-person-fill" aria-hidden="true" />
                      <span>Standard Mode</span>
                    </button>
                  </div>

                  {/* Identity Masking Box */}
                  <div className="mc-vault-identity-box">
                    <div className="mc-vault-avatar-wrap">
                      <div className={`mc-vault-avatar ${isAnonymousActive ? "incognito" : "standard"}`}>
                        <i className={`bi ${isAnonymousActive ? "bi-incognito" : "bi-person-circle"}`} aria-hidden="true" />
                      </div>
                      {isAnonymousActive && (
                        <span className="mc-vault-avatar-tag">Encrypted</span>
                      )}
                    </div>

                    <div className="mc-vault-details">
                      <div className="mc-vault-alias-row">
                        <span className="mc-vault-alias-label">Assigned Alias</span>
                        {isAnonymousActive && (
                          <button 
                            type="button" 
                            className="mc-vault-shuffle-btn"
                            onClick={handleRegenerateAlias}
                            title="Generate new random alias"
                            aria-label="Generate new random alias"
                          >
                            <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                            <span>Shuffle Alias</span>
                          </button>
                        )}
                      </div>
                      <div className="mc-vault-alias-name">
                        {isAnonymousActive ? currentAlias : "Member (Standard Identity)"}
                      </div>
                      <div className="mc-vault-identity-status">
                        <i className={`bi ${isAnonymousActive ? "bi-lock-fill text-teal" : "bi-unlock-fill text-muted"}`} aria-hidden="true" />
                        <span>{isAnonymousActive ? "Identity 100% masked from records" : "Standard identity shared with clinician"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Security Badges Checklist */}
                  <div className="mc-vault-features-list">
                    <div className="mc-vault-feat-item">
                      <i className="bi bi-check-circle-fill" aria-hidden="true" />
                      <span>Zero legal name exposure</span>
                    </div>
                    <div className="mc-vault-feat-item">
                      <i className="bi bi-check-circle-fill" aria-hidden="true" />
                      <span>Encrypted text & voice rooms</span>
                    </div>
                    <div className="mc-vault-feat-item">
                      <i className="bi bi-check-circle-fill" aria-hidden="true" />
                      <span>Zero employer or insurer sync</span>
                    </div>
                  </div>

                  {/* Privacy Strength Meter */}
                  <div className="mc-vault-strength-meter">
                    <div className="mc-strength-header">
                      <span className="mc-strength-title">Privacy Protection Score</span>
                      <span className="mc-strength-val">{isAnonymousActive ? "100% Max" : "50% Standard"}</span>
                    </div>
                    <div className="mc-strength-bar-bg" role="progressbar" aria-valuenow={isAnonymousActive ? 100 : 50} aria-valuemin="0" aria-valuemax="100">
                      <div 
                        className={`mc-strength-bar-fill ${isAnonymousActive ? "max" : "mid"}`}
                        style={{ width: isAnonymousActive ? "100%" : "50%" }}
                      />
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ── 5. THERAPIST MATCHING ─────────────────────────────── */}
        <section className="mc-ref-section" id="therapists">
          <div className="mc-ref-container">
            
            <div className="mc-ref-section-header text-center">
              <h2 className="mc-ref-heading">Therapist Matching</h2>
              <p className="mc-ref-subheading">
                Match with a therapist who understands your unique background and personal needs.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="mc-ref-filter-tabs" role="tablist" aria-label="Filter therapists by specialization">
              <button 
                role="tab"
                aria-selected={therapistFilter === "all"}
                className={`mc-filter-pill ${therapistFilter === "all" ? "active" : ""}`}
                onClick={() => setTherapistFilter("all")}
              >
                All Therapists
              </button>
              <button 
                role="tab"
                aria-selected={therapistFilter === "anxiety"}
                className={`mc-filter-pill ${therapistFilter === "anxiety" ? "active" : ""}`}
                onClick={() => setTherapistFilter("anxiety")}
              >
                Anxiety & Trauma
              </button>
              <button 
                role="tab"
                aria-selected={therapistFilter === "burnout"}
                className={`mc-filter-pill ${therapistFilter === "burnout" ? "active" : ""}`}
                onClick={() => setTherapistFilter("burnout")}
              >
                Burnout & Career
              </button>
              <button 
                role="tab"
                aria-selected={therapistFilter === "sleep"}
                className={`mc-filter-pill ${therapistFilter === "sleep" ? "active" : ""}`}
                onClick={() => setTherapistFilter("sleep")}
              >
                Sleep & CBT-I
              </button>
            </div>

            {/* Therapist Grid */}
            <div className="mc-ref-therapist-grid">
              {filteredTherapists.map((therapist) => (
                <div key={therapist.id} className="mc-therapist-card">
                  <div className="mc-therapist-img-box">
                    <img 
                      src={therapist.image} 
                      alt={`Photo of ${therapist.name}`} 
                      className="mc-therapist-photo" 
                      loading="lazy"
                    />
                    {therapist.verified && (
                      <span className="mc-verified-badge" title="Verified Licensed Clinician">
                        <i className="bi bi-patch-check-fill" aria-hidden="true" />
                      </span>
                    )}
                  </div>

                  <h3 className="mc-therapist-name">{therapist.name}</h3>
                  <p className="mc-therapist-role">{therapist.role}</p>
                  <p className="mc-therapist-spec">{therapist.specialty}</p>

                  <div className="mc-therapist-card-bottom">
                    <Link to="/book-session" className="mc-therapist-btn" aria-label={`Book session with ${therapist.name}`}>
                      <span>Book Consultation</span>
                      <i className="bi bi-arrow-right" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── 6. THERAPY EXPERIENCE ─────────────────────────────── */}
        <section className="mc-ref-section mc-bg-subtle" id="therapy-experience">
          <div className="mc-ref-container">
            
            <div className="mc-ref-exp-card">
              
              {/* Left Info */}
              <div className="mc-exp-left">
                <h3 className="mc-exp-title">Therapy Experience</h3>
                <p className="mc-exp-desc">
                  Receive licensed therapy while keeping your secure session. Real-time video with end-to-end encryption or text-only mode anytime.
                </p>
                <Link to="/book-session" className="mc-ref-btn-white">
                  <span>Secure session</span>
                  <i className="bi bi-shield-lock" aria-hidden="true" />
                </Link>
              </div>

              {/* Right Laptop Frame Mockup */}
              <div className="mc-exp-laptop">
                <div className="mc-laptop-topbar">
                  <span className="mc-laptop-camera" />
                </div>
                <div className="mc-laptop-screen">
                  <img 
                    src="/images/therapy-video.jpg" 
                    alt="Telehealth Therapy Video Consultation" 
                    className="mc-video-frame"
                  />
                  {/* Floating User Thumbnail */}
                  <div className="mc-user-thumbnail">
                    <i className="bi bi-person-fill" aria-hidden="true" />
                    <span>You (Anonymous)</span>
                  </div>
                  {/* Video Call Controls */}
                  <div className="mc-video-controls" role="toolbar" aria-label="Video session controls">
                    <button type="button" className="mc-v-btn" title="Mute Mic" aria-label="Mute microphone"><i className="bi bi-mic-fill" /></button>
                    <button type="button" className="mc-v-btn" title="Camera" aria-label="Toggle camera"><i className="bi bi-camera-video-fill" /></button>
                    <button type="button" className="mc-v-btn mc-v-end" title="End Session" aria-label="End consultation"><i className="bi bi-telephone-x-fill" /></button>
                    <button type="button" className="mc-v-btn" title="Encrypted Chat" aria-label="Open encrypted chat"><i className="bi bi-chat-text-fill" /></button>
                  </div>
                </div>
                <div className="mc-laptop-base" />
              </div>

            </div>

          </div>
        </section>

        {/* ── 7. THERAPY APPROACHES ─────────────────────────────── */}
        <section className="mc-ref-section" id="therapy-approaches">
          <div className="mc-ref-container">
            
            <div className="mc-ref-section-header text-center">
              <h2 className="mc-ref-heading">Therapy Approaches</h2>
            </div>

            <div className="mc-ref-approaches-grid">
              {APPROACHES.map((app) => (
                <div key={app.code} className="mc-approach-card">
                  <span className="mc-approach-code">{app.code}</span>
                  <h3 className="mc-approach-name">{app.name}</h3>
                  <p className="mc-approach-desc">{app.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── 8. USER REVIEWS ───────────────────────────────────── */}
        <section className="mc-ref-section mc-bg-subtle" id="reviews">
          <div className="mc-ref-container">
            
            <div className="mc-ref-section-header text-center">
              <h2 className="mc-ref-heading">User Reviews</h2>
            </div>

            <div className="mc-ref-reviews-wrapper">
              <div className="mc-ref-reviews-grid">
                {REVIEWS.slice(0, 3).map((review) => (
                  <div key={review.id} className="mc-review-card">
                    <div className="mc-review-user-row">
                      <div className="mc-review-avatar">
                        <i className="bi bi-person" aria-hidden="true" />
                      </div>
                      <div className="mc-review-user-info">
                        <h3 className="mc-review-author">{review.author}</h3>
                        <span className="mc-review-status">{review.verified}</span>
                      </div>
                    </div>
                    <p className="mc-review-text">"{review.text}"</p>
                    <div className="mc-review-stars" aria-label={`Rating: ${review.rating} out of 5 stars`}>
                      {"★".repeat(review.rating)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Carousel Pagination Arrows */}
              <div className="mc-reviews-nav-arrows">
                <button type="button" className="mc-arrow-btn" onClick={prevReview} aria-label="Previous review">
                  <i className="bi bi-chevron-left" aria-hidden="true" />
                </button>
                <button type="button" className="mc-arrow-btn" onClick={nextReview} aria-label="Next review">
                  <i className="bi bi-chevron-right" aria-hidden="true" />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* ── 9. SAFETY / CRISIS SUPPORT ────────────────────────── */}
        <section className="mc-ref-section mc-safety-section">
          <div className="mc-ref-container">
            <div className="mc-safety-card">
              <div className="mc-safety-icon-wrapper">
                <i className="bi bi-life-preserver" aria-hidden="true" />
              </div>
              <h3 className="mc-safety-title">Safety / Crisis Support</h3>
              <p className="mc-safety-desc">
                Confidential crisis support and private safety resources for individuals requiring immediate assistance.
              </p>
              <div className="mc-safety-actions">
                <a href="tel:988" className="mc-crisis-btn">
                  <i className="bi bi-telephone-fill" aria-hidden="true" /> Call or Text 988 (Lifeline)
                </a>
                <a href="sms:741741?body=HOME" className="mc-crisis-btn-outline">
                  <i className="bi bi-chat-dots-fill" aria-hidden="true" /> Crisis Text Line (741741)
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── 10. FAQ ACCORDION ─────────────────────────────────── */}
        <section className="mc-ref-section" id="faq">
          <div className="mc-ref-container mc-faq-container">
            
            <div className="mc-ref-section-header text-center">
              <h2 className="mc-ref-heading">Frequently Asked Questions</h2>
            </div>

            <div className="mc-ref-faq-list">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className={`mc-faq-item ${isOpen ? "open" : ""}`}>
                    <button 
                      type="button" 
                      className="mc-faq-question" 
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <i className={`bi bi-chevron-${isOpen ? "up" : "down"}`} aria-hidden="true" />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div 
                          className="mc-faq-answer"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <p>{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ── 11. FINAL CTA ─────────────────────────────────────── */}
        <section className="mc-ref-section mc-final-cta-section">
          <div className="mc-ref-container">
            <div className="mc-final-cta-card">
              <h2 className="mc-final-cta-title">Ready to Start Your Journey?</h2>
              <p className="mc-final-cta-sub">
                Strong, private, and trustworthy mental health care. Connect anonymously on MindCare today.
              </p>
              <Link to="/survey" className="mc-ref-btn-white-cta">
                <span>Start Free Assessment</span>
                <i className="bi bi-arrow-right" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </PublicShell>
  );
}
