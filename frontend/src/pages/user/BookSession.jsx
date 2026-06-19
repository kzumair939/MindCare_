import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const THERAPY_TYPES = [
  ["CBT","CBT – Cognitive Behavioural Therapy"],
  ["ACT","ACT – Acceptance & Commitment Therapy"],
  ["DBT","DBT – Dialectical Behaviour Therapy"],
  ["TRAUMA_FOCUSED","Trauma Focused Therapy"],
  ["COUPLES_FAMILY","Couples / Family Therapy"],
  ["SLEEP_CBT_I","Sleep Therapy (CBT-I)"],
  ["ADHD_COACHING","ADHD Coaching"],
  ["GENERAL_COUNSELLING","General Counselling"]
];

function today() { return new Date().toISOString().split("T")[0]; }

function formatSlotTime(time24) {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function BookSession() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [therapists, setTherapists] = useState([]);
  const [form, setForm] = useState({
    therapistId: "", therapyType: "", sessionType: "ONLINE", date: "", time: ""
  });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [slots, setSlots] = useState([]);      // [{time, available}]
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const freeLeft = Math.max(0, 2 - (user?.freeSessionsUsed || 0));

  useEffect(() => {
    api.get("/therapist/all")
      .then(r => setTherapists(r.data))
      .finally(() => setFetching(false));
  }, []);

  useEffect(() => {
    if (user?.recommendedTherapy) {
      setForm(f => ({ ...f, therapyType: user.recommendedTherapy }));
    }
  }, [user]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Load slots whenever therapist + date are both selected
  const loadSlots = useCallback(async (therapistId, date) => {
    if (!therapistId || !date) { setSlots([]); return; }
    setSlotsLoading(true);
    try {
      const { data } = await api.get(`/session/slots?therapistId=${therapistId}&date=${date}`);
      setSlots(data.slots || []);
    } catch (err) {
      console.error("Failed to load slots:", err);
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  function pick(id) {
    const t = therapists.find(t => String(t.id) === String(id)) || null;
    setForm(f => ({ ...f, therapistId: id, date: "", time: "" }));
    setSelected(t);
    setSlots([]);
    setFieldErrors(fe => ({ ...fe, therapistId: "" }));
  }

  function handleDateChange(date) {
    setForm(f => ({ ...f, date, time: "" }));
    setFieldErrors(fe => ({ ...fe, date: "" }));
    loadSlots(form.therapistId, date);
  }

  function selectSlot(slot) {
    if (!slot.available) return;
    setForm(f => ({ ...f, time: slot.time }));
    setFieldErrors(fe => ({ ...fe, time: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.therapistId) errs.therapistId = "Please select a therapist";
    if (!form.therapyType) errs.therapyType = "Please select a therapy type";
    if (!form.date) errs.date = "Please choose a date";
    if (form.date && form.date < today()) errs.date = "Date cannot be in the past";
    if (!form.time) errs.time = "Please select a time slot";
    // Validate selected day is available
    if (selected && form.date && selected.availableDays) {
      const dayName = new Date(form.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
      const days = selected.availableDays.split(",").map(d => d.trim().toUpperCase());
      if (!days.includes(dayName)) {
        errs.date = `Therapist is not available on ${dayName.charAt(0) + dayName.slice(1).toLowerCase()}s`;
      }
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/session/book", { ...form, therapistId: Number(form.therapistId) });
      nav(`/payment/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Booking failed. Please try again.");
    } finally { setLoading(false); }
  }

  const dayNames = selected?.availableDays
    ? selected.availableDays.split(",").map(d => d.trim().charAt(0) + d.trim().slice(1).toLowerCase())
    : [];

  const anim = (delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : "translateY(20px)",
    transition: `opacity 0.5s ease ${delay}s, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
  });

  return (
    <AppShell>
      <main className="mc-container">
        <section className="mc-hero" style={anim(0)}>
          <div>
            <div className="mc-kicker"><i className="bi bi-calendar2-plus me-1"/> Book Session</div>
            <h1>Reserve Your Session</h1>
            <p>Select a therapist, pick an available time slot, and begin your wellness journey.</p>
          </div>
        </section>

        {freeLeft > 0 && (
          <div className="mc-free-banner mc-animate-in" style={anim(0.1)}>
            <i className="bi bi-gift-fill me-2"/>
            <strong>{freeLeft} free session{freeLeft > 1 ? "s" : ""} remaining!</strong>
            <span className="ms-2 opacity-75">No payment needed for your first {freeLeft === 2 ? "two sessions" : "session"}.</span>
          </div>
        )}

        {error && (
          <div className="mc-alert mc-alert-danger mc-alert-animate" style={anim(0.12)}>
            <i className="bi bi-exclamation-triangle-fill me-2"/>{error}
          </div>
        )}

        <div className="mc-book-layout">
          {/* Main form */}
          <section className="mc-form-card mc-book-form" style={anim(0.15)}>
            <form onSubmit={handleSubmit}>

              {/* Step 1 – Therapist */}
              <div className="mc-book-step">
                <div className="mc-book-step-num">1</div>
                <div className="mc-book-step-body">
                  <h4>Choose a Therapist</h4>
                  {fetching ? (
                    <div className="mc-skeleton-select"/>
                  ) : (
                    <label className="mc-field">
                      <div className="mc-input-wrap">
                        <i className="bi bi-person-badge"/>
                        <select
                          required
                          value={form.therapistId}
                          onChange={e => pick(e.target.value)}
                          className={fieldErrors.therapistId ? "mc-input-error" : ""}
                        >
                          <option value="">— Select a therapist —</option>
                          {therapists.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name}{t.specialization ? ` · ${t.specialization}` : ""}{t.sessionPrice ? ` · $${t.sessionPrice}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      {fieldErrors.therapistId && <div className="mc-field-error"><i className="bi bi-exclamation-circle me-1"/>{fieldErrors.therapistId}</div>}
                    </label>
                  )}

                  {/* Therapist card */}
                  {selected && (
                    <div className="mc-therapist-card mc-animate-in">
                      <div className="mc-therapist-card-avatar">
                        {selected.profilePicturePath
                          ? <img src={`/uploads/profile-pictures/${selected.profilePicturePath.split(/[/\\]/).pop()}`} alt={selected.name} onError={e => e.target.style.display="none"}/>
                          : <i className="bi bi-person-circle"/>
                        }
                      </div>
                      <div className="mc-therapist-card-info">
                        <h5>{selected.name}</h5>
                        {selected.specialization && <p className="mc-therapist-spec">{selected.specialization}</p>}
                        <div className="mc-therapist-meta">
                          {dayNames.length > 0 && (
                            <span><i className="bi bi-calendar-check me-1"/>
                              Available: {dayNames.join(", ")}
                            </span>
                          )}
                          {selected.availableTimeStart && selected.availableTimeEnd && (
                            <span><i className="bi bi-clock me-1"/>{selected.availableTimeStart} – {selected.availableTimeEnd}</span>
                          )}
                          {selected.sessionPrice && (
                            <span className="mc-price-tag"><i className="bi bi-cash me-1"/>${selected.sessionPrice} / session</span>
                          )}
                        </div>
                        {selected.specialties && <p className="mc-therapist-bio">{selected.specialties}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2 – Type */}
              <div className="mc-book-step">
                <div className="mc-book-step-num">2</div>
                <div className="mc-book-step-body">
                  <h4>Therapy & Session Type</h4>
                  <div className="mc-form-grid">
                    <label className="mc-field">
                      <span>Therapy Type</span>
                      <div className="mc-input-wrap">
                        <i className="bi bi-heart-pulse"/>
                        <select
                          required
                          value={form.therapyType}
                          onChange={e => { setForm({ ...form, therapyType: e.target.value }); setFieldErrors(fe => ({ ...fe, therapyType: "" })); }}
                          className={fieldErrors.therapyType ? "mc-input-error" : ""}
                        >
                          <option value="">Select therapy type</option>
                          {THERAPY_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                      {fieldErrors.therapyType && <div className="mc-field-error"><i className="bi bi-exclamation-circle me-1"/>{fieldErrors.therapyType}</div>}
                    </label>

                    <label className="mc-field">
                      <span>Session Format</span>
                      <div className="mc-session-type-grid">
                        {[["ONLINE","Online (Video)","camera-video"],["IN_PERSON","In-Person","geo-alt"]].map(([v, l, icon]) => (
                          <label key={v} className={`mc-session-type-opt${form.sessionType === v ? " selected" : ""}`}>
                            <input
                              type="radio"
                              name="sessionType"
                              value={v}
                              checked={form.sessionType === v}
                              onChange={() => setForm({ ...form, sessionType: v })}
                            />
                            <i className={`bi bi-${icon}`}/>
                            <span>{l}</span>
                          </label>
                        ))}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Step 3 – Date & Time Slots */}
              <div className="mc-book-step">
                <div className="mc-book-step-num">3</div>
                <div className="mc-book-step-body">
                  <h4>Select Date & Time Slot</h4>

                  {/* Date picker */}
                  <label className="mc-field" style={{ marginBottom: 20 }}>
                    <span>Date</span>
                    <div className="mc-input-wrap">
                      <i className="bi bi-calendar-event"/>
                      <input
                        type="date"
                        required
                        value={form.date}
                        min={today()}
                        onChange={e => handleDateChange(e.target.value)}
                        className={fieldErrors.date ? "mc-input-error" : ""}
                        disabled={!form.therapistId}
                      />
                    </div>
                    {!form.therapistId && <div className="mc-field-hint"><i className="bi bi-info-circle me-1"/>Select a therapist first</div>}
                    {fieldErrors.date && <div className="mc-field-error"><i className="bi bi-exclamation-circle me-1"/>{fieldErrors.date}</div>}
                  </label>

                  {/* Slot grid */}
                  {form.therapistId && form.date && (
                    <div className="mc-slot-section mc-animate-in">
                      <div className="mc-slot-header">
                        <span className="mc-slot-title">
                          <i className="bi bi-clock me-2"/>Available Time Slots
                        </span>
                        <div className="mc-slot-legend">
                          <span className="mc-slot-legend-item">
                            <span className="mc-slot-dot mc-slot-dot-free"/>Available
                          </span>
                          <span className="mc-slot-legend-item">
                            <span className="mc-slot-dot mc-slot-dot-booked"/>Booked
                          </span>
                        </div>
                      </div>

                      {slotsLoading ? (
                        <div className="mc-slot-grid">
                          {[1,2,3,4,5,6,7,8].map(i => (
                            <div key={i} className="mc-slot-skeleton"/>
                          ))}
                        </div>
                      ) : slots.length === 0 ? (
                        <div className="mc-slot-empty">
                          <i className="bi bi-calendar-x"/>
                          <p>No slots available for this date.<br/>Please try another date.</p>
                        </div>
                      ) : (
                        <div className="mc-slot-grid">
                          {slots.map(slot => {
                            const isSelected = form.time === slot.time;
                            return (
                              <button
                                key={slot.time}
                                type="button"
                                className={[
                                  "mc-slot-btn",
                                  !slot.available && "mc-slot-btn--booked",
                                  slot.available && "mc-slot-btn--free",
                                  isSelected && "mc-slot-btn--selected",
                                ].filter(Boolean).join(" ")}
                                onClick={() => selectSlot(slot)}
                                disabled={!slot.available}
                                title={slot.available ? `Book ${formatSlotTime(slot.time)}` : "Already booked"}
                              >
                                <i className={`bi bi-${slot.available ? "clock" : "lock-fill"}`}/>
                                <span className="mc-slot-time">{formatSlotTime(slot.time)}</span>
                                {!slot.available && <span className="mc-slot-badge">Booked</span>}
                                {isSelected && <span className="mc-slot-badge mc-slot-badge--sel"><i className="bi bi-check-lg"/></span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {fieldErrors.time && (
                        <div className="mc-field-error mt-2"><i className="bi bi-exclamation-circle me-1"/>{fieldErrors.time}</div>
                      )}
                    </div>
                  )}

                  {/* Show hint if neither therapist nor date selected */}
                  {(!form.therapistId || !form.date) && (
                    <div className="mc-slot-placeholder">
                      <i className="bi bi-calendar2-week"/>
                      <p>{!form.therapistId ? "Select a therapist to see available slots" : "Pick a date to see available time slots"}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mc-book-submit-area">
                <button className="mc-btn-primary" type="submit" disabled={loading || !form.time}>
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2"/>Processing…</>
                    : <><i className="bi bi-calendar2-check me-2"/>Confirm & Proceed to Payment</>
                  }
                </button>
              </div>
            </form>
          </section>

          {/* Summary sidebar */}
          <aside className="mc-book-summary" style={anim(0.22)}>
            <div className="mc-summary-card">
              <h5><i className="bi bi-receipt me-2"/>Booking Summary</h5>
              <div className="mc-summary-row">
                <span>Therapist</span>
                <strong>{selected?.name || "—"}</strong>
              </div>
              <div className="mc-summary-row">
                <span>Therapy</span>
                <strong>{form.therapyType ? THERAPY_TYPES.find(([v]) => v === form.therapyType)?.[1]?.split("–")[0]?.trim() : "—"}</strong>
              </div>
              <div className="mc-summary-row">
                <span>Format</span>
                <strong>{form.sessionType === "ONLINE" ? "Online (Video)" : "In-Person"}</strong>
              </div>
              <div className="mc-summary-row">
                <span>Date</span>
                <strong>{form.date ? new Date(form.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "—"}</strong>
              </div>
              <div className="mc-summary-row">
                <span>Time</span>
                <strong>{form.time ? formatSlotTime(form.time) : "—"}</strong>
              </div>
              <div className="mc-summary-divider"/>
              <div className="mc-summary-row mc-summary-total">
                <span>Estimated Cost</span>
                <strong className="mc-summary-price">
                  {freeLeft > 0 ? <span className="mc-price-free"><i className="bi bi-gift me-1"/>Free</span> : selected?.sessionPrice ? `$${selected.sessionPrice}` : "—"}
                </strong>
              </div>
              {freeLeft > 0 && <div className="mc-summary-free-note"><i className="bi bi-check-circle-fill me-1"/>Free session applied</div>}
            </div>

            {/* Slot availability legend card */}
            {selected && form.date && slots.length > 0 && (
              <div className="mc-summary-card mt-3" style={{ fontSize: ".85rem" }}>
                <h5 style={{ fontSize: ".9rem", marginBottom: 12 }}><i className="bi bi-info-circle me-2"/>Slot Key</h5>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(59,107,255,.15)", border: "2px solid var(--mc-primary)", display: "grid", placeItems: "center", fontSize: ".75rem", color: "var(--mc-primary)", flexShrink: 0 }}>✓</div>
                    <span style={{ color: "var(--mc-muted)" }}>Available – click to select</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(100,116,139,.1)", border: "2px solid var(--mc-border)", display: "grid", placeItems: "center", fontSize: ".75rem", color: "var(--mc-muted)", flexShrink: 0 }}>🔒</div>
                    <span style={{ color: "var(--mc-muted)" }}>Booked – not available</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--mc-primary)", border: "2px solid var(--mc-primary)", display: "grid", placeItems: "center", fontSize: ".75rem", color: "#fff", flexShrink: 0 }}>✓</div>
                    <span style={{ color: "var(--mc-muted)" }}>Selected – your choice</span>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
