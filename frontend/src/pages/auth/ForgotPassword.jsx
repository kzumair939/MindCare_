import React,{useState} from "react";
import {Link} from "react-router-dom";
import api from "../../api/axios";
import AppShell from "../../components/layout/AppShell";

export default function ForgotPassword() {
  const [email,setEmail]=useState(""); const [msg,setMsg]=useState(""); const [err,setErr]=useState("");
  async function handleSubmit(e) {
    e.preventDefault(); setErr(""); setMsg("");
    try { await api.post("/auth/forgot-password",{email}); setMsg("Reset link sent! Check your email."); }
    catch(e) { setErr(e.response?.data?.error||"Error sending link"); }
  }
  return <AppShell><main className="mc-auth-main"><div className="mc-auth-container" style={{gridTemplateColumns:"1fr"}}>
    <div className="mc-auth-form-panel"><div className="mc-auth-form-inner">
      <h2 className="mc-auth-title">Forgot password</h2>
      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-danger">{err}</div>}
      <form onSubmit={handleSubmit} className="mc-form">
        <label className="mc-field"><span>Email</span>
          <div className="mc-input-wrap"><i className="bi bi-envelope"/>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="your@email.com"/>
          </div>
        </label>
        <button className="btn btn-primary w-100" type="submit">Send reset link</button>
      </form>
      <div className="mc-auth-switch"><Link to="/login">Back to login</Link></div>
    </div></div>
  </div></main></AppShell>;
}
