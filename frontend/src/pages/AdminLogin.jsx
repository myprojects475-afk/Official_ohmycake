import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CakeSlice, LockKeyhole } from "lucide-react";
import { useApp } from "../context/AppContext";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export default function AdminLogin() {
  const { login } = useApp();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error: functionError } =
        await supabase.functions.invoke("admin-login", {
          body: {
            username: username.trim(),
            password,
          },
        });

      if (functionError) {
        console.error("admin-login error:", functionError);
        setError("Invalid username or password.");
        return;
      }

      if (!data?.session || !data?.dashboard) {
        setError("Login response was incomplete.");
        return;
      }

      const { session, dashboard } = data;

      /*
       * Store the Supabase Auth session in the browser.
       */
      const { error: sessionError } =
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

      if (sessionError) {
        console.error("Session error:", sessionError);
        setError("Unable to establish your login session.");
        return;
      }

      /*
       * Store the dashboard session using the existing
       * AppContext/session system.
       */
      login({
        role: dashboard.role,
        username: dashboard.username,
        name:
          dashboard.role === "admin"
            ? "Administrator"
            : "Client",
        demo: false,
        authUserId: session.user?.id || null,
        email: session.user?.email || null,
      });

      navigate(
        dashboard.role === "admin"
          ? "/admin"
          : "/dashboard"
      );
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to connect to the login service.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="admin-login">
      <div className="admin-login-card">

        <Link to="/" className="brand">
          <span className="brand-mark">
            <CakeSlice size={22} />
          </span>

          <span>
            <strong>Oh My Cake</strong>
            <small>Dashboard</small>
          </span>
        </Link>

        <div className="login-heading">
          <LockKeyhole />

          <span className="eyebrow">
            Shared dashboard
          </span>

          <h1>Welcome back.</h1>

          <p>
            One login for Admin and Client.
            Your role controls what you can see.
          </p>
        </div>

        <form onSubmit={submit}>

          <label>
            Username

            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin_shop or client_shop"
              autoComplete="username"
              disabled={submitting}
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={submitting}
            />
          </label>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <button
            className="btn btn-primary wide"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>

        </form>

        <Link to="/" className="back-home">
          ← Back to shop
        </Link>

      </div>
    </section>
  );
}