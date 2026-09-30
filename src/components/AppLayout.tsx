import { useEffect, useState } from "react";
import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { t, type DictKey } from "../i18n";
import {
  IconAnalytics,
  IconClose,
  IconCompanies,
  IconContacts,
  IconLogout,
  IconMenu,
  IconPipeline,
  IconProjects,
  IconSettings,
  IconTaskAnalytics,
  IconTasks,
  initials,
} from "./Icons";

type NavItem = { to: string; label: DictKey; Icon: (p: { size?: number }) => JSX.Element };

const NAV: { group: DictKey; items: NavItem[] }[] = [
  {
    group: "navWork",
    items: [
      { to: "/tasks", label: "tasks", Icon: IconTasks },
      { to: "/projects", label: "projects", Icon: IconProjects },
    ],
  },
  {
    group: "navSales",
    items: [
      { to: "/pipeline", label: "pipeline", Icon: IconPipeline },
      { to: "/contacts", label: "contacts", Icon: IconContacts },
      { to: "/companies", label: "companies", Icon: IconCompanies },
    ],
  },
  {
    group: "navReports",
    items: [
      { to: "/analytics", label: "analytics", Icon: IconAnalytics },
      { to: "/task-analytics", label: "taskAnalytics", Icon: IconTaskAnalytics },
    ],
  },
];

function Brand({ org }: { org?: string }) {
  return (
    <div className="brand">
      <img className="brand-logo" src="/logo-wide.png" alt="bimCRM" />
      {org && <div className="brand-org">{org}</div>}
    </div>
  );
}

export function AppLayout() {
  const { me, loading, logout, locale, setLocale } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu after navigating and on Escape.
  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  if (loading) return <div className="auth-page">{t(locale, "loading")}</div>;
  if (!me) return <Navigate to="/login" replace />;

  const roleKey = (["admin", "manager", "viewer"].includes(me.role) ? me.role : "viewer") as DictKey;

  return (
    <div className="app-shell">
      <header className="mobile-bar">
        <Brand />
        <button
          className="icon-btn"
          aria-label={t(locale, "openMenu")}
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
          onClick={() => setMenuOpen(true)}
        >
          <IconMenu size={20} />
        </button>
      </header>

      {menuOpen && <div className="sidebar-scrim" onClick={() => setMenuOpen(false)} />}

      <aside id="app-sidebar" className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
          <Brand org={me.organization.name} />
          {menuOpen && (
            <button className="icon-btn" aria-label={t(locale, "closeMenu")} onClick={() => setMenuOpen(false)}>
              <IconClose size={20} />
            </button>
          )}
        </div>

        <nav className="nav">
          {NAV.map((section) => (
            <div key={section.group} style={{ display: "contents" }}>
              <div className="nav-group">{t(locale, section.group)}</div>
              {section.items.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to}>
                  <Icon size={18} />
                  {t(locale, label)}
                </NavLink>
              ))}
            </div>
          ))}
          <div className="nav-group" aria-hidden="true" />
          <NavLink to="/settings">
            <IconSettings size={18} />
            {t(locale, "settings")}
          </NavLink>
        </nav>

        <div className="sidebar-foot">
          <div className="user-block">
            <span className="avatar">{initials(me.user.full_name)}</span>
            <div>
              <div className="user-name">{me.user.full_name}</div>
              <div className="user-role">{t(locale, roleKey)}</div>
            </div>
          </div>
          <div className="sidebar-actions">
            <select
              className="select"
              aria-label={t(locale, "language")}
              value={locale}
              onChange={(e) => setLocale(e.target.value as "ru" | "en")}
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
            <button className="icon-btn" onClick={logout} aria-label={t(locale, "logout")} title={t(locale, "logout")}>
              <IconLogout size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
