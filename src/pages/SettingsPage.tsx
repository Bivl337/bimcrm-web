import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { t } from "../i18n";
import type { CustomField, Member, Role } from "../lib/types";

export function SettingsPage() {
  const { locale, me, canWrite } = useAuth();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState<"deal" | "contact" | "company">("deal");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("manager");
  const [error, setError] = useState("");

  const load = async () => {
    const [f, m] = await Promise.all([
      api<CustomField[]>("/api/custom-fields"),
      api<Member[]>("/api/members"),
    ]);
    setFields(f);
    setMembers(m);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const createField = async () => {
    await api("/api/custom-fields", {
      method: "POST",
      body: JSON.stringify({ name, entity_type: entityType, field_type: "text" }),
    });
    setName("");
    await load();
  };

  const addMember = async () => {
    setError("");
    try {
      await api("/api/members", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          role,
        }),
      });
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("manager");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const changeRole = async (membershipId: number, next: Role) => {
    await api(`/api/members/${membershipId}`, {
      method: "PATCH",
      body: JSON.stringify({ role: next }),
    });
    await load();
  };

  const removeMember = async (membershipId: number) => {
    if (!confirm(t(locale, "removeMember") + "?")) return;
    try {
      await api(`/api/members/${membershipId}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const roleLabel = (r: Role) => t(locale, r);

  return (
    <div>
      <div className="topbar">
        <h1>{t(locale, "settings")}</h1>
      </div>
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div>
          <strong>{me?.organization.name}</strong>
        </div>
        <div className="muted" style={{ marginTop: 6 }}>
          {me?.user.email} · {me?.role}
        </div>
        <div className="muted" style={{ marginTop: 6 }}>
          {t(locale, "currency")}: {me?.organization.currency}
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>{t(locale, "team")}</h3>
        {me?.role === "admin" && (
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="row">
              <input
                className="input"
                placeholder={t(locale, "fullName")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <input
                className="input"
                placeholder={t(locale, "email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="row">
              <input
                className="input"
                type="password"
                placeholder={t(locale, "tempPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <select className="select" style={{ width: 160 }} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="admin">{t(locale, "admin")}</option>
                <option value="manager">{t(locale, "manager")}</option>
                <option value="viewer">{t(locale, "viewer")}</option>
              </select>
              <button
                className="btn"
                onClick={addMember}
                disabled={!fullName.trim() || !email.trim() || password.length < 6}
              >
                {t(locale, "addMember")}
              </button>
            </div>
            {error && <div className="error">{error}</div>}
          </div>
        )}
        <table className="table">
          <thead>
            <tr>
              <th>{t(locale, "fullName")}</th>
              <th>{t(locale, "email")}</th>
              <th>{t(locale, "role")}</th>
              {me?.role === "admin" && <th />}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.membership_id}>
                <td>{m.full_name}</td>
                <td>{m.email}</td>
                <td>
                  {me?.role === "admin" ? (
                    <select
                      className="select"
                      style={{ width: 140 }}
                      value={m.role}
                      onChange={(e) => changeRole(m.membership_id, e.target.value as Role)}
                    >
                      <option value="admin">{t(locale, "admin")}</option>
                      <option value="manager">{t(locale, "manager")}</option>
                      <option value="viewer">{t(locale, "viewer")}</option>
                    </select>
                  ) : (
                    roleLabel(m.role)
                  )}
                </td>
                {me?.role === "admin" && (
                  <td>
                    {m.user_id !== me.user.id && (
                      <button className="btn danger" onClick={() => removeMember(m.membership_id)}>
                        {t(locale, "removeMember")}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <h3 style={{ marginTop: 0 }}>Custom fields</h3>
        {me?.role === "admin" && (
          <div className="row" style={{ marginBottom: 14 }}>
            <select
              className="select"
              style={{ width: 160 }}
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as typeof entityType)}
            >
              <option value="deal">deal</option>
              <option value="contact">contact</option>
              <option value="company">company</option>
            </select>
            <input
              className="input"
              style={{ flex: 1 }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Field name"
            />
            <button className="btn" onClick={createField} disabled={!name.trim() || !canWrite}>
              {t(locale, "save")}
            </button>
          </div>
        )}
        <table className="table">
          <thead>
            <tr>
              <th>Entity</th>
              <th>Name</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 && (
              <tr>
                <td colSpan={3} className="empty">
                  {t(locale, "noData")}
                </td>
              </tr>
            )}
            {fields.map((f) => (
              <tr key={f.id}>
                <td>{f.entity_type}</td>
                <td>{f.name}</td>
                <td>{f.field_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}