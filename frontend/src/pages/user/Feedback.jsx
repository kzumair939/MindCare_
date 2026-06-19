import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import api from "../../api/axios";

export default function Feedback() {
  const { sessionId } = useParams(); const nav = useNavigate();
  const [form, setForm] = useState({ rating:5, nps:8, comments:"" });
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError("");
    try { await api.post(`/feedback/${sessionId}`, form); nav("/my-sessions?feedback"); }
    catch(e) { setError(e.response?.data?.error||"Submission failed"); setLoading(false); }
  }
  async function skip() {
    await api.post(`/feedback/${sessionId}/skip`); nav("/my-sessions");
  }

  return (
    <AppShell>
      <main className="mc-container">
        <section className="mc-hero"><div><div className="mc-kicker">Feedback</div><h1>How did the session feel?</h1><p>Your feedback improves care quality.</p></div></section>
        {error && <div className="alert alert-danger">{error}</div>}
        <section className="mc-form-card">
          <form onSubmit={handleSubmit} className="mc-form-grid">
            <label className="mc-field"><span>Rating (1–5)</span>
              <div className="mc-input-wrap"><i className="bi bi-star"/>
                <input type="number" min={1} max={5} value={form.rating} onChange={e=>setForm({...form,rating:+e.target.value})} required/>
              </div>
            </label>
            <label className="mc-field"><span>NPS (0–10)</span>
              <div className="mc-input-wrap"><i className="bi bi-speedometer"/>
                <input type="number" min={0} max={10} value={form.nps} onChange={e=>setForm({...form,nps:+e.target.value})}/>
              </div>
            </label>
            <label className="mc-field span-12"><span>Comments</span>
              <textarea rows={4} value={form.comments} onChange={e=>setForm({...form,comments:e.target.value})} className="w-100 p-2" style={{borderRadius:8,border:"1.5px solid var(--mc-border)",background:"var(--mc-surface-2)",color:"var(--mc-text)"}}/>
            </label>
            <button className="btn btn-primary span-12" type="submit" disabled={loading}>
              {loading?<span className="spinner-border spinner-border-sm me-2"/>:<i className="bi bi-send me-2"/>}Submit feedback
            </button>
          </form>
          <button className="btn btn-outline-secondary mt-3" onClick={skip}>Skip for now</button>
        </section>
      </main>
    </AppShell>
  );
}
