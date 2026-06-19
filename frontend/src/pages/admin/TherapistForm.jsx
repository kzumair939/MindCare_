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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const picRef = useRef();

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
          if (t.availableDays) setSelectedDays(t.availableDays.split(",").map(d=>d.trim()));
        }
      });
    }
  }, [id]);

  function toggleDay(day) {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d=>d!==day) : [...prev, day]);
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setError("");
    if (!isEdit && !form.username) { setError("Username is required"); setSaving(false); return; }
    if (!isEdit && !form.password) { setError("Password is required"); setSaving(false); return; }
    const payload = { ...form, availableDays: selectedDays.join(",") };
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
              {[
                ["name","Full Name","person",true,"e.g. Dr. Sarah Ahmed"],
                ["email","Email Address","envelope",true,"therapist@email.com"],
                ["specialization","Specialization","heart-pulse",true,"e.g. Anxiety & Depression"],
                ["languages","Languages","translate",false,"e.g. English, Urdu"],
                ["sessionPrice","Session Price ($)","cash",false,"e.g. 50"],
              ].map(([key,label,icon,req,ph]) => (
                <label key={key} className="mc-field">
                  <span>{label}{req && <span className="mc-required">*</span>}</span>
                  <div className="mc-input-wrap">
                    <i className={`bi bi-${icon}`}/>
                    <input
                      required={req}
                      placeholder={ph}
                      value={form[key]}
                      onChange={e => setForm({...form, [key]: e.target.value})}
                    />
                  </div>
                </label>
              ))}
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
              <label className="mc-field span-12">
                <span>Profile Picture (JPG/PNG)</span>
                <div className="mc-input-wrap">
                  <i className="bi bi-camera"/>
                  <input type="file" accept="image/*" ref={picRef} onChange={e => setPicFile(e.target.files[0])}/>
                </div>
                {picFile && <div className="mc-file-preview"><i className="bi bi-check-circle-fill text-success me-1"/>{picFile.name}</div>}
              </label>
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
