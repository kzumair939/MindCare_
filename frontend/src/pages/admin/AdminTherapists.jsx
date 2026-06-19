import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import api from "../../api/axios";

export default function AdminTherapists() {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/therapists").then(r=>setTherapists(r.data)).finally(()=>setLoading(false));
  },[]);

  async function toggle(t) {
    if (t.active) await api.post(`/therapist/admin/${t.id}/deactivate`);
    else          await api.post(`/therapist/admin/${t.id}/activate`);
    setTherapists(ts => ts.map(x => x.id===t.id ? {...x, active:!x.active} : x));
  }

  return (
    <AppShell>
      <main className="mc-container">
        <section className="mc-hero">
          <div><div className="mc-kicker">Admin</div><h1>Therapists</h1></div>
          <Link to="/admin/therapists/new" className="btn btn-primary"><i className="bi bi-person-plus me-2"/>Add therapist</Link>
        </section>
        {loading ? <div className="mc-loading"><div className="mc-spinner"/></div> : (
          <section className="mc-table-card">
            <div className="table-responsive">
              <table className="table align-middle mc-table">
                <thead><tr><th>Photo</th><th>Name</th><th>Email</th><th>Specialization</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {therapists.length===0 && <tr><td colSpan={7} className="text-center text-muted p-4">No therapists yet.</td></tr>}
                  {therapists.map(t=>(
                    <tr key={t.id}>
                      <td>{t.profilePicturePath
                        ? <img src={`/uploads/profile-pictures/${t.profilePicturePath.split(/[/\\]/).pop()}`} alt={t.name} style={{width:40,height:40,borderRadius:"50%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
                        : <div style={{width:40,height:40,borderRadius:"50%",background:"var(--mc-surface-2)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--mc-muted)"}}><i className="bi bi-person-circle"/></div>}</td>
                      <td className="fw-medium">{t.name}</td>
                      <td>{t.email}</td>
                      <td>{t.specialization||"—"}</td>
                      <td>{t.sessionPrice?`$${t.sessionPrice}`:"—"}</td>
                      <td><span className={`mc-status mc-status-${t.active?"booked":"cancelled"}`}>{t.active?"Active":"Inactive"}</span></td>
                      <td>
                        <div className="mc-row-actions compact">
                          <Link to={`/admin/therapists/${t.id}/edit`} className="btn btn-outline-secondary btn-sm"><i className="bi bi-pencil"/> Edit</Link>
                          <button className={`btn btn-sm ${t.active?"btn-outline-danger":"btn-outline-success"}`} onClick={()=>toggle(t)}>
                            <i className={`bi bi-${t.active?"pause-circle":"play-circle"} me-1`}/>{t.active?"Deactivate":"Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}
