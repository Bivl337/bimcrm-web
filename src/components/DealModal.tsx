import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { t } from "../i18n";
import type { Activity, Deal, Task } from "../lib/types";

function formatMoney(amount: string | number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "RUB",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

export function DealModal({
  dealId,
  onClose,
  onChanged,
}: {
  dealId: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { locale, canWrite, me } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [note, setNote] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [amount, setAmount] = useState("0");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const [d, a, ts] = await Promise.all([
      api<Deal>(`/api/deals/${dealId}`),
      api<Activity[]>(`/api/activities?deal_id=${dealId}`),
      api<Task[]>(`/api/tasks?deal_id=${dealId}`),
    ]);
    setDeal(d);
    setTitle(d.title);
    setAmount(String(d.amount));
    setActivities(a);
    setTasks(ts);
  };

  useEffect(() => {
    load().catch((e) => setError(String(e.message || e)));
  }, [dealId]);

  const saveDeal = async () => {
    if (!canWrite) return;
    await api(`/api/deals/${dealId}`, {
      method: "PATCH",
      body: JSON.stringify({ title, amount: Number(amount || 0) }),
    });
    await load();
    onChanged();
  };

  const addActivity = async (type: "note" | "call") => {
    if (!canWrite || !note.trim()) return;
    await api("/api/activities", {
      method: "POST",
      body: JSON.stringify({ deal_id: dealId, body: note, type }),
    });
    setNote("");
    await load();
  };

  const addTask = async () => {
    if (!canWrite || !taskTitle.trim()) return;
    await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title: taskTitle, deal_id: dealId }),
    });
    setTaskTitle("");
    await load();
    onChanged();
  };

  const toggleTask = async (task: Task) => {
    if (!canWrite) return;
    const next = task.status === "done" ? "todo" : "done";
    await api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    await load();
    onChanged();
  };

  const remove = async () => {
    if (!canWrite) return;
    if (!confirm("Delete deal?")) return;
    await api(`/api/deals/${dealId}`, { method: "DELETE" });
    onChanged();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        {!deal ? (
          <div>{error || t(locale, "loading")}</div>
        ) : (
          <div className="form-grid">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0 }}>{t(locale, "deal")}</h2>
              <button className="btn secondary" onClick={onClose}>
                ✕
              </button>
            </div>

            <label className="label">
              {t(locale, "title")}
              <input className="input" value={title} disabled={!canWrite} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="label">
              {t(locale, "amount")}
              <input
                className="input"
                type="number"
                value={amount}
                disabled={!canWrite}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <div className="muted">
              {formatMoney(deal.amount, deal.currency || me?.organization.currency || "RUB")}
            </div>

            {canWrite && (
              <div className="row">
                <button className="btn" onClick={saveDeal}>
                  {t(locale, "save")}
                </button>
                <button className="btn danger" onClick={remove}>
                  {t(locale, "delete")}
                </button>
              </div>
            )}

            <h3 style={{ marginBottom: 0 }}>{t(locale, "tasks")}</h3>
            {tasks.map((task) => (
              <div key={task.id} className="row" style={{ justifyContent: "space-between" }}>
                <span style={{ textDecoration: task.status === "done" ? "line-through" : "none" }}>
                  {task.title}
                </span>
                {canWrite && (
                  <button className="btn secondary" onClick={() => toggleTask(task)}>
                    {task.status === "done" ? t(locale, "todo") : t(locale, "markDone")}
                  </button>
                )}
              </div>
            ))}
            {canWrite && (
              <div className="row">
                <input
                  className="input"
                  placeholder={t(locale, "createTask")}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
                <button className="btn secondary" onClick={addTask}>
                  +
                </button>
              </div>
            )}

            <h3 style={{ marginBottom: 0 }}>{t(locale, "activity")}</h3>
            {canWrite && (
              <>
                <textarea className="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="row">
                  <button className="btn secondary" onClick={() => addActivity("note")}>
                    {t(locale, "addNote")}
                  </button>
                  <button className="btn secondary" onClick={() => addActivity("call")}>
                    {t(locale, "addCall")}
                  </button>
                </div>
              </>
            )}
            {activities.map((a) => (
              <div key={a.id} className="activity">
                <div className="chip">{a.type}</div>
                <div style={{ marginTop: 6 }}>{a.body}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}