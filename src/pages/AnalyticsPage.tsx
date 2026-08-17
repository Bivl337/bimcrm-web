import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { t } from "../i18n";
import type { Analytics } from "../lib/types";

function formatMoney(amount: string | number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "RUB",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

export function AnalyticsPage() {
  const { locale, me } = useAuth();
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    api<Analytics>("/api/analytics/summary").then(setData).catch(console.error);
  }, []);

  if (!data) return <div>{t(locale, "loading")}</div>;

  const currency = me?.organization.currency || "RUB";

  return (
    <div>
      <div className="topbar">
        <h1>{t(locale, "analytics")}</h1>
      </div>
      <div className="stats">
        <div className="card stat">
          <div className="muted">{t(locale, "totalDeals")}</div>
          <div className="value">{data.total_deals}</div>
        </div>
        <div className="card stat">
          <div className="muted">{t(locale, "totalAmount")}</div>
          <div className="value">{formatMoney(data.total_amount, currency)}</div>
        </div>
        <div className="card stat">
          <div className="muted">{t(locale, "openTasks")}</div>
          <div className="value">{data.open_tasks}</div>
        </div>
      </div>
      <div className="card" style={{ overflow: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>{t(locale, "pipeline")}</th>
              <th>{t(locale, "totalDeals")}</th>
              <th>{t(locale, "amount")}</th>
            </tr>
          </thead>
          <tbody>
            {data.by_stage.map((s) => (
              <tr key={s.stage_id}>
                <td>{s.stage_name}</td>
                <td>{s.deals_count}</td>
                <td>{formatMoney(s.amount_sum, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}