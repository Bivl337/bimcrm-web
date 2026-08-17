import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { t } from "../i18n";
import type { Contact } from "../lib/types";

export function ContactsPage() {
  const { locale, canWrite } = useAuth();
  const [items, setItems] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const load = async () => setItems(await api<Contact[]>("/api/contacts"));
  useEffect(() => {
    load().catch(console.error);
  }, []);

  const create = async () => {
    await api("/api/contacts", {
      method: "POST",
      body: JSON.stringify({ full_name: fullName, phone: phone || null, email: email || null }),
    });
    setOpen(false);
    setFullName("");
    setPhone("");
    setEmail("");
    await load();
  };

  return (
    <div>
      <div className="topbar">
        <h1>{t(locale, "contacts")}</h1>
        {canWrite && (
          <button className="btn" onClick={() => setOpen(true)}>
            {t(locale, "createContact")}
          </button>
        )}
      </div>
      <div className="card" style={{ overflow: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>{t(locale, "fullName")}</th>
              <th>{t(locale, "phone")}</th>
              <th>{t(locale, "email")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="empty">
                  {t(locale, "noData")}
                </td>
              </tr>
            )}
            {items.map((c) => (
              <tr key={c.id}>
                <td>{c.full_name}</td>
                <td>{c.phone || "—"}</td>
                <td>{c.email || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="card modal form-grid" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: 0 }}>{t(locale, "createContact")}</h2>
            <label className="label">
              {t(locale, "fullName")}
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>
            <label className="label">
              {t(locale, "phone")}
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="label">
              {t(locale, "email")}
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <div className="row">
              <button className="btn" onClick={create} disabled={!fullName.trim()}>
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