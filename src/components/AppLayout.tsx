import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { t } from "../i18n";

export function AppLayout() {
  const { me, loading, logout, locale, setLocale } = useAuth();

  if (loading) return <div className="auth-page">{t(locale, "loading")}</div>;
  if (!me) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/logo.png" alt="bimCRM" />
          <div>
            <div className="brand-title">
              bim<span>CRM</span>
            </div>
            <div className="muted" style={{ color: "rgba(255,255,255,.55)", fontSize: 12 }}>
              {me.organization.name}
            </div>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/" end>
            {t(locale, "pipeline")}
          </NavLink>
          <NavLink to="/contacts">{t(locale, "contacts")}</NavLink>
          <NavLink to="/companies">{t(locale, "companies")}</NavLink>
          <NavLink to="/tasks">{t(locale, "tasks")}</NavLink>
          <NavLink to="/analytics">{t(locale, "analytics")}</NavLink>
          <NavLink to="/settings">{t(locale, "settings")}</NavLink>
        </nav>
        <div style={{ marginTop: "auto", display: "grid", gap: 10 }}>
          <select
            className="select"
            value={locale}
            onChange={(e) => setLocale(e.target.value as "ru" | "en")}
            style={{ background: "#111827", color: "#fff", borderColor: "#374151" }}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)" }}>{me.user.full_name}</div>
          <button className="btn ghost" onClick={logout}>
            {t(locale, "logout")}
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}