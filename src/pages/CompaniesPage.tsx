import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { t } from "../i18n";
import type { Company } from "../lib/types";

export function CompaniesPage() {
  const { locale, canWrite } = useAuth();
  const [items, setItems] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  const load = async () => setItems(await api<Company[]>("/api/companies"));
  useEffect(() => {
    load().catch(console.error);
  }, []);

  const create = async () => {
    await api("/api/companies", {
      method: "POST",
      body: JSON.stringify({
        name,
        phone: phone || null,
        email: email || null,
        website: website || null,
      }),
    });
    setOpen(false);
    setName("");
    setPhone("");
    setEmail("");
    setWebsite("");
    await load();
  };

  return (
    <div>
      <div className="topbar">
        <h1>{t(locale, "companies")}</h1>
        {canWrite && (
          <button className="btn" onClick={() => setOpen(true)}>
            {t(locale, "createCompany")}
          </button>
        )}
      </div>
      <div className="card" style={{ overflow: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>{t(locale, "title")}</th>
              <th>{t(locale, "phone")}</th>
              <th>{t(locale, "email")}</th>
              <th>{t(locale, "website")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  {t(locale, "noData")}
                </td>
              </tr>
            )}
            {items.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.phone || "—"}</td>
                <td>{c.email || "—"}</td>
                <td>{c.website || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="card modal form-grid" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: 0 }}>{t(locale, "createCompany")}</h2>
            <label className="label">
              {t(locale, "title")}
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="label">
              {t(locale, "phone")}
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="label">
              {t(locale, "email")}
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="label">
              {t(locale, "website")}
              <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
            <div className="row">
              <button className="btn" onClick={create} disabled={!name.trim()}>
                {t(locale, "save")}
              </button>
              <button className="btn secondary" onClick={() => setOpen(false)}>
                {t(locale, "cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}