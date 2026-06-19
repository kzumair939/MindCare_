import React, { useState, useRef } from "react";
import AppShell from "../../components/layout/AppShell";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const TABS = [
  { id:"profile",   icon:"person-circle",    label:"Profile"      },
  { id:"anonymous", icon:"incognito",         label:"Anonymous"    },
  { id:"security",  icon:"shield-lock",       label:"Security"     },
  { id:"notifs",    icon:"bell",              label:"Notifications"},
];

export default function Settings() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState({ displayName:user?.displayName||"", email:user?.email||"", bio:"" });
  const [passForm, setPassForm] = useState({ current:"", newPass:"", confirm:"" });
  const [anon, setAnon] = useState(user?.anonymousMode||false);
  const [showPw, setShowPw] = useState({c:false,n:false,cf:false});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const picRef = useRef();

  function flash(text, type="success") { setMsg({text,type}); setTimeout(()=>setMsg(null),3500); }

  async function saveProfile(e) {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await api.put("/user/profile", form);
      setUser(u => ({...u, ...data}));
      flash("Profile updated successfully!");
    } catch { flash("Failed to update profile","danger"); }
    finally { setSaving(false); }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (passForm.newPass !== passForm.confirm) { flash("Passwords do not match","danger"); return; }
    if (passForm.newPass.length < 8) { flash("Password must be at least 8 characters","danger"); return; }
    setSaving(true);
    try {
      await api.put("/user/password", { currentPassword:passForm.current, newPassword:passForm.newPass });
      setPassForm({ current:"", newPass:"", confirm:"" });
      flash("Password changed successfully!");
    } catch(err) { flash(err.response?.data?.error||"Failed to change password","danger"); }
    finally { setSaving(false); }
  }

  async function toggleAnon() {
    const next = !anon; setAnon(next);
    try {
      const { data } = await api.post("/user/toggle-anonymous");
      setUser(u => ({...u, anonymousMode: data.anonymousMode, anonymousAlias: data.anonymousAlias}));
      setAnon(data.anonymousMode);
      flash(data.anonymousMode ? "Anonymous mode enabled" : "Anonymous mode disabled");
    } catch { setAnon(!next); flash("Failed to update setting","danger"); }
  }

  async function uploadPic(e) {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append("profilePicture", file);
    setSaving(true);
    try {
      const { data } = await api.post("/user/profile-picture", fd);
      setUser(u => ({...u, profilePicturePath: data.path}));
      flash("Profile picture updated!");
    } catch { flash("Failed to upload picture","danger"); }
    finally { setSaving(false); }
  }

  return (
    <AppShell>
      <main className="mc-container">
        <section className="mc-dash-hero mc-fade-up">
          <div className="mc-dash-hero-text">
            <div className="mc-kicker"><i className="bi bi-gear me-1"/>Settings</div>
            <h1>Account <span className="mc-gradient-text">Settings</span></h1>
            <p>Manage your profile, privacy and security preferences.</p>
          </div>
        </section>

        {msg && (
          <div className={`mc-alert mc-alert-${msg.type} mc-alert-animate`}>
            <i className={`bi bi-${msg.type==="success"?"check-circle-fill":"exclamation-circle-fill"} me-2`}/>
            {msg.text}
          </div>
        )}

        <div className="mc-settings-layout">
          {/* Sidebar tabs */}
          <aside className="mc-settings-nav mc-scroll-reveal">
            {TABS.map(t => (
              <button key={t.id} className={`mc-settings-tab${tab===t.id?" active":""}`} onClick={()=>setTab(t.id)}>
                <i className={`bi bi-${t.icon}`}/> {t.label}
              </button>
            ))}
          </aside>

          {/* Content */}
          <div className="mc-settings-content">

            {/* PROFILE */}
            {tab==="profile" && (
              <div className="mc-form-card mc-scroll-reveal">
                <div className="mc-form-section-title"><i className="bi bi-person-circle me-2"/>Profile Information</div>
                {/* Avatar */}
                <div className="mc-avatar-section">
                  <div className="mc-avatar-wrap">
                    {user?.profilePicturePath
                      ? <img src={`/uploads/profile-pictures/${user.profilePicturePath.split(/[/\\]/).pop()}`} alt="" className="mc-avatar-img"/>
                      : <div className="mc-avatar-placeholder"><i className="bi bi-person-fill"/></div>}
                    <button className="mc-avatar-edit-btn" onClick={()=>picRef.current.click()}>
                      <i className="bi bi-camera-fill"/>
                    </button>
                    <input type="file" ref={picRef} accept="image/*" hidden onChange={uploadPic}/>
                  </div>
                  <div>
                    <p className="mc-avatar-name">{user?.displayName||user?.username}</p>
                    <p className="mc-avatar-email">{user?.email}</p>
                    <p className="mc-avatar-role">{user?.role?.replace("ROLE_","")}</p>
                  </div>
                </div>
                <form onSubmit={saveProfile} className="mc-form">
                  <div className="mc-form-grid">
                    <label className="mc-field">
                      <span>Display Name</span>
                      <div className="mc-input-wrap"><i className="bi bi-person"/>
                        <input value={form.displayName} onChange={e=>setForm({...form,displayName:e.target.value})} placeholder="Your name"/>
                      </div>
                    </label>
                    <label className="mc-field">
                      <span>Email Address</span>
                      <div className="mc-input-wrap"><i className="bi bi-envelope"/>
                        <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@example.com"/>
                      </div>
                    </label>
                    <label className="mc-field span-12">
                      <span>Bio</span>
                      <textarea className="mc-textarea" rows={3} value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="A short bio about yourself…"/>
                    </label>
                  </div>
                  <div className="mc-form-actions">
                    <button className="mc-btn-primary" type="submit" disabled={saving} style={{width:"auto",minWidth:160}}>
                      {saving ? <><span className="spinner-border spinner-border-sm me-2"/>Saving…</> : <><i className="bi bi-save me-2"/>Save Profile</>}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ANONYMOUS */}
            {tab==="anonymous" && (
              <div className="mc-form-card mc-scroll-reveal">
                <div className="mc-form-section-title"><i className="bi bi-incognito me-2"/>Anonymous Mode</div>
                <div className="mc-anon-feature-card">
                  <div className="mc-anon-feature-icon"><i className="bi bi-eye-slash-fill"/></div>
                  <div>
                    <h4>Go Anonymous</h4>
                    <p>When enabled, your real name and profile picture are hidden from therapists and group chat members. Your sessions remain fully private.</p>
                    <ul className="mc-anon-list">
                      <li><i className="bi bi-check-circle-fill text-success me-2"/>Name replaced with "Anonymous User"</li>
                      <li><i className="bi bi-check-circle-fill text-success me-2"/>Profile picture hidden</li>
                      <li><i className="bi bi-check-circle-fill text-success me-2"/>Full session privacy maintained</li>
                      <li><i className="bi bi-info-circle me-2 text-primary"/>Admin can still see your account</li>
                    </ul>
                  </div>
                </div>
                <div className="mc-anon-toggle-row">
                  <div>
                    <strong>Anonymous Mode</strong>
                    <p>{anon ? "Currently active — your identity is hidden" : "Currently inactive — your name is visible"}</p>
                  </div>
                  <label className="mc-toggle-switch">
                    <input type="checkbox" checked={anon} onChange={toggleAnon}/>
                    <span className="mc-toggle-track">
                      <span className="mc-toggle-thumb"/>
                    </span>
                  </label>
                </div>
                <div className={`mc-anon-status ${anon?"active":""}`}>
                  <i className={`bi bi-${anon?"shield-fill-check":"shield"}`}/>
                  {anon ? "Anonymous mode is ON — You are hidden." : "Anonymous mode is OFF — Your name is visible."}
                </div>
              </div>
            )}

            {/* SECURITY */}
            {tab==="security" && (
              <div className="mc-form-card mc-scroll-reveal">
                <div className="mc-form-section-title"><i className="bi bi-shield-lock me-2"/>Change Password</div>
                <form onSubmit={savePassword} className="mc-form">
                  {[
                    ["current","Current Password","c"],
                    ["newPass","New Password","n"],
                    ["confirm","Confirm New Password","cf"],
                  ].map(([key,label,k]) => (
                    <label key={key} className="mc-field">
                      <span>{label}</span>
                      <div className="mc-input-wrap mc-pw-wrap">
                        <i className="bi bi-lock"/>
                        <input
                          type={showPw[k]?"text":"password"}
                          value={passForm[key]}
                          onChange={e=>setPassForm({...passForm,[key]:e.target.value})}
                          placeholder={label}
                          required
                        />
                        <button type="button" className="mc-pw-eye" onClick={()=>setShowPw(p=>({...p,[k]:!p[k]}))}>
                          <i className={`bi bi-eye${showPw[k]?"-slash":""}`}/>
                        </button>
                      </div>
                    </label>
                  ))}
                  <div className="mc-form-actions">
                    <button className="mc-btn-primary" type="submit" disabled={saving} style={{width:"auto",minWidth:180}}>
                      {saving ? <><span className="spinner-border spinner-border-sm me-2"/>Updating…</> : <><i className="bi bi-lock me-2"/>Change Password</>}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {tab==="notifs" && (
              <div className="mc-form-card mc-scroll-reveal">
                <div className="mc-form-section-title"><i className="bi bi-bell me-2"/>Notification Preferences</div>
                <div className="mc-notif-list">
                  {[
                    ["Session reminders","Get reminded 30 mins before a session"],
                    ["Session confirmations","When therapist confirms your booking"],
                    ["New messages","Group chat and session messages"],
                    ["Promotions","Special offers and wellness tips"],
                  ].map(([title, desc]) => (
                    <div key={title} className="mc-notif-row">
                      <div>
                        <strong>{title}</strong>
                        <p>{desc}</p>
                      </div>
                      <label className="mc-toggle-switch">
                        <input type="checkbox" defaultChecked={title!=="Promotions"}/>
                        <span className="mc-toggle-track"><span className="mc-toggle-thumb"/></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
