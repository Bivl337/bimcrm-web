import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { t } from "../i18n";
import type { CustomField } from "../lib/types";

export function SettingsPage() {
  const { locale, me, canWrite } = useAuth();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState<"deal" | "contact" | "company">("deal");

  const load = async () => setFields(await api<CustomField[]>("/api/custom-fields"));
  useEffect(() => {
    load().catch(console.error);
  }, []);

  const create = async () => {
    await api("/api/custom-fields", {
      method: "POST",
      body: JSON.stringify({ name, entity_type: entityType, field_type: "text" }),
    });
    setName("");
    await load();
  };

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
            <button className="btn" onClick={create} disabled={!name.trim() || !canWrite}>
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