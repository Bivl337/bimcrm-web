import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { t } from "../i18n";

export function LoginPage() {
  const { login, me, loading, locale } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && me) return <Navigate to="/tasks" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card form-grid" onSubmit={onSubmit}>
        <div className="auth-logo">
          <img src="/logo.png" alt="bimCRM" />
          <div className="brand-title" style={{ fontSize: 22 }}>
            bim<span>CRM</span>
          </div>
          <div className="muted">{t(locale, "welcome")}</div>
        </div>
        <label className="label">
          {t(locale, "email")}
          <input
            className="input"
            type="email"
            required
            disabled={busy}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="label">
          {t(locale, "password")}
          <input
            className="input"
            type="password"
            required
            disabled={busy}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button className="btn" disabled={busy}>
          {busy ? (
            <span className="btn-loading">
              <span className="btn-spinner" aria-hidden />
              {t(locale, "loggingIn")}
            </span>
          ) : (
            t(locale, "login")
          )}
        </button>
        <div className="muted" style={{ textAlign: "center" }}>
          {t(locale, "noAccount")}{" "}
          {busy ? t(locale, "register") : <Link to="/register">{t(locale, "register")}</Link>}
        </div>
      </form>
    </div>
  );
}