import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { t } from "../i18n";
import type { Member, Project } from "../lib/types";
import { MarkdownView } from "../components/MarkdownView";

export function ProjectsPage() {
  const { locale, canWrite } = useAuth();
  const [items, setItems] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "archived">("active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [responsible, setResponsible] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const [p, m] = await Promise.all([
      api<Project[]>("/api/projects"),
      api<Member[]>("/api/members"),
    ]);
    setItems(p);
    setMembers(m);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setStatus("active");
    setStartDate("");
    setEndDate("");
    setResponsible("");
    setEdit(null);
    setError("");
  };

  const openCreate = () => {
    resetForm();
    setShow(true);
  };

  const openEdit = (p: Project) => {
    setEdit(p);
    setName(p.name);
    setDescription(p.description || "");
    setStatus(p.status);
    setStartDate(p.start_date || "");
    setEndDate(p.end_date || "");
    setResponsible(p.responsible_user_id ? String(p.responsible_user_id) : "");
    setShow(true);
  };

  const save = async () => {
    setError("");
    const body: Record<string, unknown> = {
      name,
      description: description || null,
      status,
      start_date: startDate || null,
      end_date: endDate || null,
      responsible_user_id: responsible ? Number(responsible) : null,
    };
    try {
      if (edit) {
        await api(`/api/projects/${edit.id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await api("/api/projects", { method: "POST", body: JSON.stringify(body) });
      }
      setShow(false);
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const archive = async (p: Project) => {
    await api(`/api/projects/${p.id}/archive`, { method: "POST" });
    await load();
  };

  const remove = async (p: Project) => {
    if (!confirm(t(locale, "delete") + "?")) return;
    try {
      await api(`/api/projects/${p.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const memberName = (id: number | null) =>
    id ? members.find((m) => m.user_id === id)?.full_name || `#${id}` : "—";

  return (
    <div>
      <div className="topbar">
        <h1>{t(locale, "projects")}</h1>
        {canWrite && (
          <button className="btn" onClick={openCreate}>
            {t(locale, "createProject")}
          </button>
        )}
      </div>
      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="card" style={{ overflow: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>{t(locale, "title")}</th>
              <th>{t(locale, "status")}</th>
              <th>{t(locale, "responsible")}</th>
              <th>{t(locale, "startDate")}</th>
              <th>{t(locale, "endDate")}</th>
              {canWrite && <th />}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">
                  {t(locale, "noData")}
                </td>
              </tr>
            )}
            {items.map((p) => (
              <tr key={p.id}>
                <td>
                  <button className="btn secondary" style={{ padding: "4px 8px" }} onClick={() => openEdit(p)}>
                    {p.name}
                  </button>
                </td>
                <td>
                  <span className="chip">
                    {p.status === "active" ? t(locale, "active") : t(locale, "archived")}
                  </span>
                </td>
                <td>{memberName(p.responsible_user_id)}</td>
                <td>{p.start_date || "—"}</td>
                <td>{p.end_date || "—"}</td>
                {canWrite && (
                  <td className="row">
                    {p.status !== "archived" && (
                      <button className="btn secondary" onClick={() => archive(p)}>
                        {t(locale, "archive")}
                      </button>
                    )}
                    <button className="btn danger" onClick={() => remove(p)}>
                      {t(locale, "delete")}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="modal-backdrop" onClick={() => setShow(false)}>
          <div className="card modal form-grid" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: 0 }}>{edit ? t(locale, "editProject") : t(locale, "createProject")}</h2>
            <label className="label">
              {t(locale, "title")}
              <input className="input" value={name} disabled={!canWrite} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="label">
              {t(locale, "description")}
              <textarea
                className="textarea"
                rows={6}
                value={description}
                disabled={!canWrite}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Markdown"
              />
            </label>
            {description && (
              <div className="card" style={{ padding: 12 }}>
                <div className="muted" style={{ marginBottom: 8 }}>
                  Preview
                </div>
                <MarkdownView text={description} />
              </div>
            )}
            <label className="label">
              {t(locale, "status")}
              <select
                className="select"
                value={status}
                disabled={!canWrite}
                onChange={(e) => setStatus(e.target.value as "active" | "archived")}
              >
                <option value="active">{t(locale, "active")}</option>
                <option value="archived">{t(locale, "archived")}</option>
              </select>
            </label>
            <label className="label">
              {t(locale, "responsible")}
              <select
                className="select"
                value={responsible}
                disabled={!canWrite}
                onChange={(e) => setResponsible(e.target.value)}
              >
                <option value="">—</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            </label>
            <div className="row">
              <label className="label" style={{ flex: 1 }}>
                {t(locale, "startDate")}
                <input
                  className="input"
                  type="date"
                  value={startDate}
                  disabled={!canWrite}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="label" style={{ flex: 1 }}>
                {t(locale, "endDate")}
                <input
                  className="input"
                  type="date"
                  value={endDate}
                  disabled={!canWrite}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </div>
            {error && <div className="error">{error}</div>}
            <div className="row">
              {canWrite && (
                <button className="btn" onClick={save} disabled={!name.trim()}>
                  {t(locale, "save")}
                </button>
              )}
              <button className="btn secondary" onClick={() => setShow(false)}>
                {t(locale, "cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}