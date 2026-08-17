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
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { t } from "../i18n";
import type { Deal, Pipeline } from "../lib/types";
import { DealModal } from "../components/DealModal";

function formatMoney(amount: string | number, currency: string) {
  const n = Number(amount || 0);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "RUB",
    maximumFractionDigits: 0,
  }).format(n);
}

function StageColumn({
  stageId,
  title,
  color,
  count,
  sumLabel,
  children,
}: {
  stageId: number;
  title: string;
  color: string;
  count: number;
  sumLabel: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stageId}` });
  return (
    <div className="column" ref={setNodeRef} style={{ outline: isOver ? `2px solid ${color}` : undefined }}>
      <div className="column-head">
        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{ width: 10, height: 10, borderRadius: 99, background: color, display: "inline-block" }}
            />
            {title}
          </h3>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {sumLabel}
          </div>
        </div>
        <span className="pill">{count}</span>
      </div>
      <div className="column-body">{children}</div>
    </div>
  );
}

function DraggableDeal({
  deal,
  currency,
  onOpen,
  disabled,
}: {
  deal: Deal;
  currency: string;
  onOpen: () => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `deal-${deal.id}`,
    disabled,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : { opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div
        className={`deal-card ${isDragging ? "dragging" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
      >
        <div style={{ fontWeight: 700 }}>{deal.title}</div>
        <div className="deal-amount">{formatMoney(deal.amount, deal.currency || currency)}</div>
      </div>
    </div>
  );
}

export function PipelinePage() {
  const { locale, me, canWrite } = useAuth();
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0");
  const [error, setError] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const load = async () => {
    const [p, d] = await Promise.all([
      api<Pipeline>("/api/pipelines/default"),
      api<Deal[]>("/api/deals"),
    ]);
    setPipeline(p);
    setDeals(d);
  };

  useEffect(() => {
    load().catch((e) => setError(String(e.message || e)));
  }, []);

  const byStage = useMemo(() => {
    const map: Record<number, Deal[]> = {};
    for (const s of pipeline?.stages || []) map[s.id] = [];
    for (const d of deals) {
      if (!map[d.stage_id]) map[d.stage_id] = [];
      map[d.stage_id].push(d);
    }
    for (const id of Object.keys(map)) {
      map[Number(id)].sort((a, b) => a.position - b.position || b.id - a.id);
    }
    return map;
  }, [pipeline, deals]);

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveDeal(null);
    if (!canWrite) return;
    const dealId = Number(String(event.active.id).replace("deal-", ""));
    const overId = event.over?.id ? String(event.over.id) : "";
    if (!overId.startsWith("stage-")) return;
    const stageId = Number(overId.replace("stage-", ""));
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage_id === stageId) return;

    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage_id: stageId } : d)));
    try {
      const updated = await api<Deal>(`/api/deals/${dealId}/move`, {
        method: "POST",
        body: JSON.stringify({ stage_id: stageId, position: 0 }),
      });
      setDeals((prev) => prev.map((d) => (d.id === dealId ? updated : d)));
    } catch (e) {
      await load();
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const createDeal = async () => {
    if (!canWrite) return;
    const created = await api<Deal>("/api/deals", {
      method: "POST",
      body: JSON.stringify({ title, amount: Number(amount || 0) }),
    });
    setDeals((prev) => [created, ...prev]);
    setShowCreate(false);
    setTitle("");
    setAmount("0");
  };

  if (!pipeline) {
    return <div>{error || t(locale, "loading")}</div>;
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>{pipeline.name}</h1>
          <div className="muted">{me?.organization.name}</div>
        </div>
        <div className="row">
          {canWrite && (
            <button className="btn" onClick={() => setShowCreate(true)}>
              {t(locale, "createDeal")}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={(e) => {
          const id = Number(String(e.active.id).replace("deal-", ""));
          setActiveDeal(deals.find((d) => d.id === id) || null);
        }}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveDeal(null)}
      >
        <div className="kanban">
          {pipeline.stages.map((stage) => {
            const list = byStage[stage.id] || [];
            const sum = list.reduce((acc, d) => acc + Number(d.amount || 0), 0);
            return (
              <StageColumn
                key={stage.id}
                stageId={stage.id}
                title={stage.name}
                color={stage.color}
                count={list.length}
                sumLabel={formatMoney(sum, me?.organization.currency || "RUB")}
              >
                {list.map((deal) => (
                  <DraggableDeal
                    key={deal.id}
                    deal={deal}
                    currency={me?.organization.currency || "RUB"}
                    onOpen={() => setSelectedId(deal.id)}
                    disabled={!canWrite}
                  />
                ))}
              </StageColumn>
            );
          })}
        </div>
        <DragOverlay>
          {activeDeal ? (
            <div className="deal-card">
              <div style={{ fontWeight: 700 }}>{activeDeal.title}</div>
              <div className="deal-amount">
                {formatMoney(activeDeal.amount, activeDeal.currency || me?.organization.currency || "RUB")}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="card modal form-grid" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: 0 }}>{t(locale, "createDeal")}</h2>
            <label className="label">
              {t(locale, "title")}
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="label">
              {t(locale, "amount")}
              <input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <div className="row">
              <button className="btn" onClick={createDeal} disabled={!title.trim()}>
                {t(locale, "save")}
              </button>
              <button className="btn secondary" onClick={() => setShowCreate(false)}>
                {t(locale, "cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedId && <DealModal dealId={selectedId} onClose={() => setSelectedId(null)} onChanged={load} />}
    </div>
  );
}