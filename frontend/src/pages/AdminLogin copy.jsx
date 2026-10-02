import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CakeSlice, LockKeyhole } from "lucide-react";
import { useApp } from "../context/AppContext";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export default function AdminLogin() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");

  const submit = async e => {
    e.preventDefault(); setError("");
    if (isSupabaseConfigured) {
      // Production: Username should be mapped to the matching AdminUsers/Auth email
      // by the protected backend login flow. Do not verify passwords in the browser.
      setError("Supabase Auth is configured. Connect this form to the protected login Edge Function before using production credentials.");
      return;
    }
    const demo = {
      admin:{password:"abi123",role:"admin",name:"Administrator"},
      client:{password:"client123",role:"client",name:"Client"}
    }[username.toLowerCase()];
    if (!demo || demo.password !== password) { setError("Demo login: admin / abi123 or client / client123"); return; }
    login({role:demo.role,name:demo.name,username:username.toLowerCase(),demo:true});
    navigate("/admin");
  };

  return <section className="admin-login"><div className="admin-login-card"><Link to="/" className="brand"><span className="brand-mark"><CakeSlice size={22}/></span><span><strong>Oh My Cake</strong><small>Dashboard</small></span></Link><div className="login-heading"><LockKeyhole/><span className="eyebrow">Shared dashboard</span><h1>Welcome back.</h1><p>One login for Admin and Client. Your role controls what you can see.</p></div><form onSubmit={submit}><label>Username<input value={username} onChange={e=>setUsername(e.target.value)} placeholder="admin or client" autoComplete="username"/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"/></label>{error&&<div className="form-error">{error}</div>}<button className="btn btn-primary wide">Log in</button></form><Link to="/" className="back-home">← Back to shop</Link></div></section>;
}
