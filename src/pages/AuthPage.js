import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import NexusLogo from "../components/shared/NexusLogo";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const friendlyError = (code) => ({
    "auth/email-already-in-use": "Email already registered.",
    "auth/invalid-email": "Invalid email address.",
    "auth/weak-password": "Password needs 6+ characters.",
    "auth/user-not-found": "No account found.",
    "auth/wrong-password": "Wrong password.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/too-many-requests": "Too many attempts.",
    "username-taken": "Username already taken.",
  })[code] || "Something went wrong.";

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        if (form.username.length < 3) { setError("Username must be at least 3 characters."); setLoading(false); return; }
        if (!/^[a-zA-Z0-9_]+$/.test(form.username)) { setError("Username: letters, numbers, underscores only."); setLoading(false); return; }
        await register(form.username, form.email, form.password);
      }
    } catch (err) { setError(friendlyError(err.code)); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-glow auth-glow-2" />
      <div className="auth-box">
        <div className="auth-logo-wrap">
          <div className="auth-logo-icon">
            <NexusLogo size={36} />
          </div>
          <div>
            <h1 className="auth-logo-name">Nexus</h1>
            <p className="auth-logo-sub">Chat · Share · Connect</p>
          </div>
        </div>
        <div className="auth-toggle">
          <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>Sign up</button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="auth-field">
              <label>Username</label>
              <input type="text" placeholder="yourhandle" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required minLength={3} autoFocus />
              <span className="auth-field-hint">How people find you on Nexus</span>
            </div>
          )}
          <div className="auth-field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        <p className="auth-footer">By joining you agree to have a great time 🔥</p>
      </div>
    </div>
  );
}
