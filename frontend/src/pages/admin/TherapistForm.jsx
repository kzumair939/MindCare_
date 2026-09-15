import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import api from "../../api/axios";

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];

export default function TherapistForm() {
  const { id } = useParams(); const nav = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState({
    name:"", email:"", specialization:"", languages:"",
    sessionPrice:"", availableDays:"", availableTimeStart:"",
    availableTimeEnd:"", specialties:"",
    username:"", password:""
  });
  const [selectedDays, setSelectedDays] = useState([]);
  const [picFile, setPicFile] = useState(null);
  const [existingPic, setExistingPic] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const picRef = useRef();

  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [langQuery, setLangQuery] = useState("");

  const ALL_LANGUAGES = [
    "English", "Urdu", "Spanish", "Arabic", "Hindi", "French", "German", "Mandarin",
    "Punjabi", "Bengali", "Russian", "Portuguese", "Italian", "Turkish", "Persian (Farsi)",
    "Japanese", "Korean", "Dutch", "Polish", "Swedish", "Vietnamese", "Tagalog", "Pashto",
    "Sindhi", "Gujarati", "Marathi", "Tamil", "Telugu", "Malayalam", "Greek", "Hebrew",
    "Indonesian", "Thai", "Ukrainian", "Romanian", "Czech", "Hungarian", "Danish", "Norwegian"
  ];

  const CATEGORY_SUGGESTIONS = [
    "CBT", "ACT", "DBT", "TRAUMA_FOCUSED", "COUPLES_FAMILY", "SLEEP_CBT_I", "ADHD_COACHING", "GENERAL_COUNSELLING", "Depression & Anxiety"
  ];

  useEffect(() => {
    if (isEdit) {
      api.get(`/admin/therapists`).then(r => {
        const t = r.data.find(x => String(x.id) === String(id));
        if (t) {
          setForm({
            name: t.name||"", email: t.email||"",
            specialization: t.specialization||"", languages: t.languages||"",
            sessionPrice: t.sessionPrice||"", availableDays: t.availableDays||"",
            availableTimeStart: t.availableTimeStart||"",
            availableTimeEnd: t.availableTimeEnd||"",
            specialties: t.specialties||"",
            username: t.username||"", password:""
          });
          if (t.languages) {
            const parsed = t.languages.split(",").map(l => l.trim()).filter(Boolean);
            setSelectedLanguages(parsed);
          }
          if (t.profilePicturePath) setExistingPic(t.profilePicturePath);
          if (t.availableDays) setSelectedDays(t.availableDays.split(",").map(d=>d.trim()));
        }
      });
    }
  }, [id]);

  function toggleDay(day) {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d=>d!==day) : [...prev, day]);
  }

  function addLanguage(lang) {
    const trimmed = lang.trim();
    if (!trimmed) return;
    if (!selectedLanguages.some(l => l.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...selectedLanguages, trimmed];
      setSelectedLanguages(updated);
      setForm(f => ({ ...f, languages: updated.join(", ") }));
    }
    setLangQuery("");
  }

  function removeLanguage(lang) {
    const updated = selectedLanguages.filter(l => l !== lang);
    setSelectedLanguages(updated);
    setForm(f => ({ ...f, languages: updated.join(", ") }));
  }

  function handleLangKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (filteredLanguages.length > 0) {
        addLanguage(filteredLanguages[0]);
      } else if (langQuery.trim()) {
        addLanguage(langQuery.trim());
      }
    }
  }

  // Filter languages that start with the query characters (e.g. typing "ur" matches "Urdu")
  const filteredLanguages = langQuery.trim()
    ? ALL_LANGUAGES.filter(lang =>
        lang.toLowerCase().startsWith(langQuery.toLowerCase().trim()) &&
        !selectedLanguages.includes(lang)
      )
    : ALL_LANGUAGES.filter(lang => !selectedLanguages.includes(lang)).slice(0, 8);

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setError("");
    if (!isEdit && !form.username) { setError("Username is required"); setSaving(false); return; }
    if (!isEdit && !form.password) { setError("Password is required"); setSaving(false); return; }
    const payload = {
      ...form,
      languages: selectedLanguages.join(", "),
      availableDays: selectedDays.join(",")
    };
    try {
      let saved;
      if (isEdit) {
        const { data } = await api.put(`/therapist/admin/${id}`, payload); saved = data;
        // Update account credentials if provided
        if (form.username || form.password) {
          await api.post(`/admin/therapists/${id}/account`, {
            username: form.username || undefined,
            password: form.password || undefined
          }).catch(() => {}); // non-fatal
        }
      } else {
        const { data } = await api.post(`/therapist/admin/create`, payload); saved = data;
        // Create login account for new therapist
        if (saved?.id && form.username && form.password) {
          await api.post(`/admin/therapists/${saved.id}/account`, {
            username: form.username,
            password: form.password
          });
        }
      }
      if (picFile && saved?.id) {
        const fd = new FormData(); fd.append("profilePicture", picFile);
        await api.post(`/therapist/admin/${saved.id}/picture`, fd);
      }
      nav("/admin/therapists?saved");
    } catch(err) {
      setError(err.response?.data?.error || "Save failed");
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <main className="mc-container">
        <section className="mc-hero">
          <div>
            <div className="mc-kicker">Admin</div>
            <h1>{isEdit ? "Edit" : "Add"} Therapist</h1>
            <p>{isEdit ? "Update therapist details and credentials." : "Fill in all details. A login account will be created automatically."}</p>
          </div>
        </section>
        {error && <div className="alert alert-danger mc-alert-animate"><i className="bi bi-exclamation-triangle-fill me-2"/>{error}</div>}

        <section className="mc-form-card">
          <form onSubmit={handleSubmit}>
            {/* Section: Basic Info */}
            <div className="mc-form-section-title"><i className="bi bi-person-badge me-2"/>Therapist Information</div>
            <div className="mc-form-grid">
              <label className="mc-field">
                <span>Full Name<span className="mc-required">*</span></span>
                <div className="mc-input-wrap">
                  <i className="bi bi-person"/>
                  <input
                    required
                    placeholder="e.g. Dr. Sarah Ahmed"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
                </div>
              </label>

              <label className="mc-field">
                <span>Email Address<span className="mc-required">*</span></span>
                <div className="mc-input-wrap">
                  <i className="bi bi-envelope"/>
                  <input
                    type="email"
                    required
                    placeholder="therapist@email.com"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                  />
                </div>
              </label>

              <label className="mc-field">
                <span>Category / Therapy Type<span className="mc-required">*</span></span>
                <div className="mc-input-wrap">
                  <i className="bi bi-heart-pulse"/>
                  <input
                    required
                    placeholder="e.g. CBT, Anxiety & Depression, DBT"
                    value={form.specialization}
                    onChange={e => setForm({...form, specialization: e.target.value})}
                  />
                </div>
                <div className="mc-preset-row mt-1" style={{ flexWrap: "wrap", gap: "6px" }}>
                  {CATEGORY_SUGGESTIONS.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      className="mc-preset-btn"
                      style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                      onClick={() => setForm(f => ({ ...f, specialization: cat }))}
                    >
                      {cat.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </label>

              {/* Categorized Languages with Prefix Filter (e.g. "ur" -> "Urdu") */}
              <div className="mc-field span-12">
                <span>Languages Spoken<span className="mc-required">*</span></span>
                
                {/* Active Selected Language Badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px", minHeight: selectedLanguages.length > 0 ? "auto" : "0" }}>
                  {selectedLanguages.map(lang => (
                    <span
                      key={lang}
                      className="badge bg-primary d-inline-flex align-items-center gap-1 px-2 py-1"
                      style={{ fontSize: "0.82rem", borderRadius: "6px" }}
                    >
                      <i className="bi bi-translate me-1" />
                      {lang}
                      <button
                        type="button"
                        onClick={() => removeLanguage(lang)}
                        style={{ background: "none", border: "none", color: "inherit", padding: 0, marginLeft: "4px", cursor: "pointer", display: "flex", alignItems: "center" }}
                        title={`Remove ${lang}`}
                      >
                        <i className="bi bi-x-circle-fill" style={{ fontSize: "0.85rem" }} />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Filter / Search Input */}
                <div className="mc-input-wrap">
                  <i className="bi bi-translate" />
                  <input
                    type="text"
                    placeholder="Filter language by starting letters (e.g. type 'ur' for Urdu, 'en' for English)..."
                    value={langQuery}
                    onChange={e => setLangQuery(e.target.value)}
                    onKeyDown={handleLangKeyDown}
                  />
                  {langQuery && (
                    <button
                      type="button"
                      onClick={() => addLanguage(langQuery)}
                      className="btn btn-sm btn-primary"
                      style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", padding: "3px 10px", fontSize: "0.75rem" }}
                    >
                      Add "{langQuery}"
                    </button>
                  )}
                </div>

                {/* Matching Filtered Suggestions starting with typed letters */}
                <div className="mt-2">
                  <div className="text-muted small mb-1" style={{ fontSize: "0.74rem" }}>
                    {langQuery.trim() ? (
                      filteredLanguages.length > 0 ? (
                        <span><i className="bi bi-filter me-1" />Languages starting with "<strong>{langQuery}</strong>":</span>
                      ) : (
                        <span>No standard language starts with "<strong>{langQuery}</strong>". Press Enter or click Add to use custom.</span>
                      )
                    ) : (
                      <span><i className="bi bi-lightning-charge me-1" />Popular Languages:</span>
                    )}
                  </div>
                  <div className="mc-preset-row" style={{ flexWrap: "wrap", gap: "6px" }}>
                    {filteredLanguages.map(lang => (
                      <button
                        key={lang}
                        type="button"
                        className="mc-preset-btn"
                        style={{
                          fontSize: "0.75rem",
                          padding: "4px 10px",
                          fontWeight: langQuery && lang.toLowerCase().startsWith(langQuery.toLowerCase()) ? 700 : 500,
                          borderColor: langQuery && lang.toLowerCase().startsWith(langQuery.toLowerCase()) ? "var(--mc-primary)" : "var(--mc-border)"
                        }}
                        onClick={() => addLanguage(lang)}
                      >
                        <i className="bi bi-plus-sm me-1" />{lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label className="mc-field">
                <span>Session Price ($)</span>
                <div className="mc-input-wrap">
                  <i className="bi bi-cash"/>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                    value={form.sessionPrice}
                    onChange={e => setForm({...form, sessionPrice: e.target.value})}
                  />
                </div>
              </label>
            </div>

            {/* Section: Login Credentials */}
            <div className="mc-form-section-title mt-4"><i className="bi bi-shield-lock me-2"/>Login Credentials</div>
            <div className="mc-credential-notice">
              <i className="bi bi-info-circle-fill me-2"/>
              {isEdit
                ? "Leave password blank to keep the existing password."
                : "These credentials allow the therapist to log in to MindCare."}
            </div>
            <div className="mc-form-grid">
              <label className="mc-field">
                <span>Username<span className="mc-required">{!isEdit ? "*" : ""}</span></span>
                <div className="mc-input-wrap">
                  <i className="bi bi-at"/>
                  <input
                    required={!isEdit}
                    placeholder="Choose a username"
                    value={form.username}
                    onChange={e => setForm({...form, username: e.target.value})}
                    autoComplete="new-password"
                  />
                </div>
              </label>
              <label className="mc-field">
                <span>Password<span className="mc-required">{!isEdit ? "*" : ""}</span></span>
                <div className="mc-input-wrap mc-pw-wrap">
                  <i className="bi bi-lock"/>
                  <input
                    type={showPass ? "text" : "password"}
                    required={!isEdit}
                    placeholder={isEdit ? "Leave blank to keep current" : "Min 8 characters"}
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    autoComplete="new-password"
                  />
                  <button type="button" className="mc-pw-eye" onClick={() => setShowPass(s => !s)}>
                    <i className={`bi bi-eye${showPass ? "-slash" : ""}`}/>
                  </button>
                </div>
              </label>
            </div>

            {/* Section: Availability */}
            <div className="mc-form-section-title mt-4"><i className="bi bi-calendar-week me-2"/>Availability & Hours</div>
            <div className="mc-form-grid">
              <div className="mc-field span-12">
                <span>Available Days</span>
                <div className="mc-day-grid">
                  {DAYS.map(day => (
                    <label
                      key={day}
                      className={`mc-day-btn${selectedDays.includes(day) ? " checked" : ""}`}
                      onClick={() => toggleDay(day)}
                    >
                      {day.slice(0,3)}
                    </label>
                  ))}
                </div>
                <div className="mc-preset-row mt-2">
                  <button type="button" className="mc-preset-btn" onClick={() => setSelectedDays(DAYS)}>Select All Days</button>
                  <button type="button" className="mc-preset-btn" onClick={() => setSelectedDays(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"])}>Weekdays (Mon–Fri)</button>
                  <button type="button" className="mc-preset-btn" onClick={() => setSelectedDays(["SATURDAY", "SUNDAY"])}>Weekends Only</button>
                  <button type="button" className="mc-preset-btn" onClick={() => setSelectedDays([])}>Clear All</button>
                </div>
              </div>
              <label className="mc-field">
                <span>Available From</span>
                <div className="mc-input-wrap">
                  <i className="bi bi-clock"/>
                  <input type="time" value={form.availableTimeStart} onChange={e => setForm({...form, availableTimeStart: e.target.value})}/>
                </div>
              </label>
              <label className="mc-field">
                <span>Available Until</span>
                <div className="mc-input-wrap">
                  <i className="bi bi-clock-fill"/>
                  <input type="time" value={form.availableTimeEnd} onChange={e => setForm({...form, availableTimeEnd: e.target.value})}/>
                </div>
              </label>
              <div className="mc-field span-12 mt-1">
                <span>Quick Hours Presets</span>
                <div className="mc-preset-row">
                  <button type="button" className="mc-preset-btn" onClick={() => setForm(f => ({ ...f, availableTimeStart: "09:00", availableTimeEnd: "17:00" }))}>Standard (9:00 AM – 5:00 PM)</button>
                  <button type="button" className="mc-preset-btn" onClick={() => setForm(f => ({ ...f, availableTimeStart: "08:00", availableTimeEnd: "14:00" }))}>Morning (8:00 AM – 2:00 PM)</button>
                  <button type="button" className="mc-preset-btn" onClick={() => setForm(f => ({ ...f, availableTimeStart: "14:00", availableTimeEnd: "22:00" }))}>Evening (2:00 PM – 10:00 PM)</button>
                  <button type="button" className="mc-preset-btn" onClick={() => setForm(f => ({ ...f, availableTimeStart: "09:00", availableTimeEnd: "21:00" }))}>Full Day (9:00 AM – 9:00 PM)</button>
                </div>
              </div>
            </div>

            {/* Section: Additional */}
            <div className="mc-form-section-title mt-4"><i className="bi bi-stars me-2"/>Additional Details</div>
            <div className="mc-form-grid">
              <label className="mc-field span-12">
                <span>Specialties / Bio</span>
                <textarea
                  rows={3}
                  placeholder="Describe the therapist's specialties, approach, and background…"
                  value={form.specialties}
                  onChange={e => setForm({...form, specialties: e.target.value})}
                  className="mc-textarea"
                />
              </label>
              <div className="mc-field span-12">
                <span>Profile Picture (JPG / PNG)</span>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "6px" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", background: "var(--mc-surface-2)", border: "2px solid var(--mc-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {picFile ? (
                      <img src={URL.createObjectURL(picFile)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : existingPic ? (
                      <img
                        src={existingPic.startsWith("/") || existingPic.startsWith("http") ? existingPic : `/uploads/profile-pictures/${existingPic.split(/[/\\]/).pop()}`}
                        alt="Current"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || "Therapist")}&background=3b82f6&color=fff&bold=true`;
                        }}
                      />
                    ) : (
                      <i className="bi bi-person-circle" style={{ fontSize: "2rem", color: "var(--mc-muted)" }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="mc-input-wrap">
                      <i className="bi bi-camera"/>
                      <input type="file" accept="image/*" ref={picRef} onChange={e => setPicFile(e.target.files[0])}/>
                    </div>
                    {picFile && <div className="mc-file-preview mt-1"><i className="bi bi-check-circle-fill text-success me-1"/>Selected: {picFile.name}</div>}
                    {!picFile && existingPic && <div className="text-muted" style={{ fontSize: "0.78rem", marginTop: "4px" }}>Current photo active. Select a new file to change.</div>}
                  </div>
                </div>
              </div>
            </div>

            <div className="mc-form-actions">
              <button type="button" className="btn btn-outline-secondary" onClick={() => nav("/admin/therapists")}>
                <i className="bi bi-x-lg me-2"/>Cancel
              </button>
              <button className="btn btn-primary mc-save-btn" type="submit" disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2"/> : <i className="bi bi-save me-2"/>}
                {isEdit ? "Save changes" : "Create therapist"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </AppShell>
  );
}
