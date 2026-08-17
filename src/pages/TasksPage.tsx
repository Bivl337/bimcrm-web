import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { t } from "../i18n";
import type { Task } from "../lib/types";

export function TasksPage() {
  const { locale, canWrite } = useAuth();
  const [items, setItems] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);

  const load = async () => setItems(await api<Task[]>("/api/tasks"));
  useEffect(() => {
    load().catch(console.error);
  }, []);

  const create = async () => {
    await api("/api/tasks", { method: "POST", body: JSON.stringify({ title }) });
    setTitle("");
    setOpen(false);
    await load();
  };

  const toggle = async (task: Task) => {
    await api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: task.status === "open" ? "done" : "open" }),
    });
    await load();
  };

  return (
    <div>
      <div className="topbar">
        <h1>{t(locale, "tasks")}</h1>
        {canWrite && (
          <button className="btn" onClick={() => setOpen(true)}>
            {t(locale, "createTask")}
          </button>
        )}
      </div>
      <div className="card" style={{ overflow: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>{t(locale, "title")}</th>
              <th>{t(locale, "status")}</th>
              <th />
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
            {items.map((task) => (
              <tr key={task.id}>
                <td style={{ textDecoration: task.status === "done" ? "line-through" : "none" }}>
                  {task.title}
                </td>
                <td>
                  <span className="chip">{task.status === "open" ? t(locale, "open") : t(locale, "done")}</span>
                </td>
                <td>
                  {canWrite && (
                    <button className="btn secondary" onClick={() => toggle(task)}>
                      {task.status === "open" ? t(locale, "markDone") : t(locale, "open")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="card modal form-grid" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: 0 }}>{t(locale, "createTask")}</h2>
            <label className="label">
              {t(locale, "title")}
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <div className="row">
              <button className="btn" onClick={create} disabled={!title.trim()}>
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