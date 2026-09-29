import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";
import { t } from "../i18n";
import { AuthLayout } from "../components/AuthLayout";

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
      if (err instanceof ApiError && err.status === 401) {
        setError(locale === "en" ? "Wrong email or password" : "Неверный email или пароль");
      } else {
        setError(err instanceof Error ? err.message : "Error");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <form className="card auth-card form-grid" onSubmit={onSubmit}>
        <div className="auth-logo">
          <h1>{t(locale, "login")}</h1>
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
        <div className="auth-alt">
          {t(locale, "noAccount")}{" "}
          {busy ? t(locale, "register") : <Link to="/register">{t(locale, "register")}</Link>}
        </div>
      </form>
    </AuthLayout>
  );
}