import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { t } from "../i18n";
import type { Member, Task } from "../lib/types";

type TaskStatus = "todo" | "in_progress" | "done";

const COLUMNS: { id: TaskStatus; labelKey: "todo" | "inProgress" | "done"; color: string }[] = [
  { id: "todo", labelKey: "todo", color: "#94A3B8" },
  { id: "in_progress", labelKey: "inProgress", color: "#4A76FD" },
  { id: "done", labelKey: "done", color: "#22C55E" },
];

function normalizeStatus(s: string): TaskStatus {
  if (s === "open") return "todo";
  if (s === "in_progress" || s === "done" || s === "todo") return s;
  return "todo";
}

function fmtDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString(locale === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function memberName(members: Member[], userId: number | null | undefined) {
  if (!userId) return "—";
  return members.find((m) => m.user_id === userId)?.full_name || `#${userId}`;
}

function Column({
  id,
  title,
  color,
  count,
  children,
}: {
  id: string;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="column" ref={setNodeRef} style={{ outline: isOver ? `2px solid ${color}` : undefined }}>
      <div className="column-head">
        <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
          <span style={{ width: 10, height: 10, borderRadius: 99, background: color, display: "inline-block" }} />
          {title}
        </h3>
        <span className="pill">{count}</span>
      </div>
      <div className="column-body">{children}</div>
    </div>
  );
}

function TaskCard({
  task,
  members,
  locale,
  disabled,
  onOpen,
}: {
  task: Task;
  members: Member[];
  locale: "ru" | "en";
  disabled?: boolean;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    disabled,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div className={`deal-card ${isDragging ? "dragging" : ""}`} onClick={onOpen}>
        <div style={{ fontWeight: 700 }}>{task.title}</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
          {t(locale, "assignee")}: {memberName(members, task.assignee_id)}
        </div>
        <div className="muted" style={{ fontSize: 12 }}>
          {t(locale, "due")}: {fmtDate(task.due_at, locale)}
        </div>
        {task.estimate_hours != null && (
          <div className="muted" style={{ fontSize: 12 }}>
            {t(locale, "estimateHours")}: {task.estimate_hours}
          </div>
        )}
      </div>
    </div>
  );
}

export function TasksPage() {
  const { locale, canWrite, me } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [active, setActive] = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [edit, setEdit] = useState<Task | null>(null);

  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueAt, setDueAt] = useState("");
  const [estimate, setEstimate] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const load = async () => {
    const q = filterAssignee === "all" ? "" : `?assignee_id=${filterAssignee}`;
    const [ts, ms] = await Promise.all([
      api<Task[]>(`/api/tasks${q}`),
      api<Member[]>("/api/members"),
    ]);
    setTasks(ts.map((x) => ({ ...x, status: normalizeStatus(x.status) })));
    setMembers(ms);
    if (!assigneeId && me) setAssigneeId(String(me.user.id));
  };

  useEffect(() => {
    load().catch(console.error);
  }, [filterAssignee]);

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const task of tasks) map[normalizeStatus(task.status)].push(task);
    return map;
  }, [tasks]);

  const onDragEnd = async (event: DragEndEvent) => {
    setActive(null);
    if (!canWrite) return;
    const taskId = Number(String(event.active.id).replace("task-", ""));
    const over = event.over?.id ? String(event.over.id) : "";
    if (!COLUMNS.some((c) => c.id === over)) return;
    const status = over as TaskStatus;
    const task = tasks.find((x) => x.id === taskId);
    if (!task || normalizeStatus(task.status) === status) return;

    setTasks((prev) => prev.map((x) => (x.id === taskId ? { ...x, status } : x)));
    try {
      const updated = await api<Task>(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setTasks((prev) =>
        prev.map((x) => (x.id === taskId ? { ...updated, status: normalizeStatus(updated.status) } : x))
      );
    } catch (e) {
      await load();
      console.error(e);
    }
  };

  const create = async () => {
    const body: Record<string, unknown> = {
      title,
      assignee_id: Number(assigneeId || me?.user.id),
      status: "todo",
    };
    if (dueAt) body.due_at = new Date(dueAt).toISOString();
    if (estimate !== "") body.estimate_hours = Number(estimate);
    await api("/api/tasks", { method: "POST", body: JSON.stringify(body) });
    setShowCreate(false);
    setTitle("");
    setDueAt("");
    setEstimate("");
    await load();
  };

  const saveEdit = async () => {
    if (!edit) return;
    const body: Record<string, unknown> = {
      title: edit.title,
      assignee_id: edit.assignee_id,
      status: normalizeStatus(edit.status),
      estimate_hours: edit.estimate_hours,
      due_at: edit.due_at,
    };
    const updated = await api<Task>(`/api/tasks/${edit.id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    setEdit(null);
    setTasks((prev) =>
      prev.map((x) => (x.id === updated.id ? { ...updated, status: normalizeStatus(updated.status) } : x))
    );
  };

  return (
    <div>
      <div className="topbar">
        <h1>{t(locale, "tasks")}</h1>
        <div className="row">
          <label className="label" style={{ margin: 0, minWidth: 220 }}>
            {t(locale, "filterAssignee")}
            <select className="select" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
              <option value="all">{t(locale, "allAssignees")}</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name}
                </option>
              ))}
            </select>
          </label>
          {canWrite && (
            <button className="btn" onClick={() => setShowCreate(true)}>
              {t(locale, "createTask")}
            </button>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e) => {
          const id = Number(String(e.active.id).replace("task-", ""));
          setActive(tasks.find((x) => x.id === id) || null);
        }}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActive(null)}
      >
        <div className="kanban">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              title={t(locale, col.labelKey)}
              color={col.color}
              count={byStatus[col.id].length}
            >
              {byStatus[col.id].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  members={members}
                  locale={locale}
                  disabled={!canWrite}
                  onOpen={() => setEdit(task)}
                />
              ))}
            </Column>
          ))}
        </div>
        <DragOverlay>
          {active ? (
            <div className="deal-card">
              <div style={{ fontWeight: 700 }}>{active.title}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="card modal form-grid" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: 0 }}>{t(locale, "createTask")}</h2>
            <label className="label">
              {t(locale, "title")}
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="label">
              {t(locale, "assignee")}
              <select className="select" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="label">
              {t(locale, "due")}
              <input className="input" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </label>
            <label className="label">
              {t(locale, "estimateHours")}
              <input className="input" type="number" min={0} step={0.5} value={estimate} onChange={(e) => setEstimate(e.target.value)} />
            </label>
            <div className="row">
              <button className="btn" onClick={create} disabled={!title.trim()}>
                {t(locale, "save")}
              </button>
              <button className="btn secondary" onClick={() => setShowCreate(false)}>
                {t(locale, "cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {edit && (
        <div className="modal-backdrop" onClick={() => setEdit(null)}>
          <div className="card modal form-grid" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: 0 }}>{edit.title}</h2>
            <label className="label">
              {t(locale, "title")}
              <input
                className="input"
                value={edit.title}
                disabled={!canWrite}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              />
            </label>
            <label className="label">
              {t(locale, "assignee")}
              <select
                className="select"
                disabled={!canWrite}
                value={edit.assignee_id ?? ""}
                onChange={(e) => setEdit({ ...edit, assignee_id: Number(e.target.value) })}
              >
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="label">
              {t(locale, "status")}
              <select
                className="select"
                disabled={!canWrite}
                value={normalizeStatus(edit.status)}
                onChange={(e) => setEdit({ ...edit, status: e.target.value as TaskStatus })}
              >
                <option value="todo">{t(locale, "todo")}</option>
                <option value="in_progress">{t(locale, "inProgress")}</option>
                <option value="done">{t(locale, "done")}</option>
              </select>
            </label>
            <label className="label">
              {t(locale, "due")}
              <input
                className="input"
                type="datetime-local"
                disabled={!canWrite}
                value={edit.due_at ? edit.due_at.slice(0, 16) : ""}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    due_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
              />
            </label>
            <label className="label">
              {t(locale, "estimateHours")}
              <input
                className="input"
                type="number"
                min={0}
                step={0.5}
                disabled={!canWrite}
                value={edit.estimate_hours ?? ""}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    estimate_hours: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            <div className="muted">
              {t(locale, "createdBy")}: {memberName(members, edit.created_by_id)}
            </div>
            <div className="muted">
              {t(locale, "createdAt")}: {fmtDate(edit.created_at, locale)}
            </div>
            <div className="muted">
              {t(locale, "startedAt")}: {fmtDate(edit.started_at, locale)}
            </div>
            {canWrite && (
              <div className="row">
                <button className="btn" onClick={saveEdit}>
                  {t(locale, "save")}
                </button>
                <button className="btn secondary" onClick={() => setEdit(null)}>
                  {t(locale, "cancel")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}