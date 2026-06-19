import React,{useState} from "react";
import {useNavigate,useSearchParams} from "react-router-dom";
import api from "../../api/axios";
import AppShell from "../../components/layout/AppShell";

export default function ResetPassword() {
  const [params]=useSearchParams(); const nav=useNavigate();
  const [pw,setPw]=useState(""); const [cpw,setCpw]=useState(""); const [err,setErr]=useState(""); const [show,setShow]=useState(false);
  async function handleSubmit(e) {
    e.preventDefault(); if(pw!==cpw){setErr("Passwords do not match");return;}
    try { await api.post("/auth/reset-password",{token:params.get("token"),password:pw}); nav("/login?reset"); }
    catch(e) { setErr(e.response?.data?.error||"Reset failed"); }
  }
  return <AppShell><main className="mc-auth-main"><div className="mc-auth-container" style={{gridTemplateColumns:"1fr"}}>
    <div className="mc-auth-form-panel"><div className="mc-auth-form-inner">
      <h2 className="mc-auth-title">Reset password</h2>
      {err && <div className="alert alert-danger">{err}</div>}
      <form onSubmit={handleSubmit} className="mc-form">
        <label className="mc-field"><span>New password</span>
          <div className="mc-input-wrap mc-pw-wrap"><i className="bi bi-lock"/>
            <input type={show?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)} required/>
            <button type="button" className="mc-pw-eye" onClick={()=>setShow(s=>!s)}><i className={`bi bi-eye${show?"-slash":""}`}/></button>
          </div>
        </label>
        <label className="mc-field"><span>Confirm password</span>
          <div className="mc-input-wrap"><i className="bi bi-lock-fill"/>
            <input type="password" value={cpw} onChange={e=>setCpw(e.target.value)} required/>
          </div>
        </label>
        <button className="btn btn-primary w-100" type="submit">Reset password</button>
      </form>
    </div></div>
  </div></main></AppShell>;
}
