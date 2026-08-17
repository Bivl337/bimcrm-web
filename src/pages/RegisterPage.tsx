import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { t, type Locale } from "../i18n";

export function RegisterPage() {
  const { register, me, loading, locale, setLocale } = useAuth();
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && me) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register({
        email,
        password,
        full_name: fullName,
        organization_name: orgName,
        locale,
      });
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
          {t(locale, "fullName")}
          <input className="input" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label className="label">
          {t(locale, "orgName")}
          <input className="input" required value={orgName} onChange={(e) => setOrgName(e.target.value)} />
        </label>
        <label className="label">
          {t(locale, "email")}
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="label">
          {t(locale, "password")}
          <input
            className="input"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="label">
          {t(locale, "language")}
          <select
            className="select"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </label>
        {error && <div className="error">{error}</div>}
        <button className="btn" disabled={busy}>
          {t(locale, "register")}
        </button>
        <div className="muted" style={{ textAlign: "center" }}>
          {t(locale, "haveAccount")} <Link to="/login">{t(locale, "login")}</Link>
        </div>
      </form>
    </div>
  );
}