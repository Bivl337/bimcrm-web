import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { t } from "../i18n";
import type { TaskAnalytics } from "../lib/types";

export function TaskAnalyticsPage() {
  const { locale } = useAuth();
  const [tab, setTab] = useState<"person" | "project">("person");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState<TaskAnalytics | null>(null);

  const load = async () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("date_from", new Date(dateFrom).toISOString());
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      params.set("date_to", end.toISOString());
    }
    const q = params.toString() ? `?${params}` : "";
    setData(await api<TaskAnalytics>(`/api/analytics/tasks${q}`));
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  return (
    <div>
      <div className="topbar">
        <h1>{t(locale, "taskAnalytics")}</h1>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="row">
          <label className="label">
            {t(locale, "dateFrom")}
            <input className="input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>
          <label className="label">
            {t(locale, "dateTo")}
            <input className="input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </label>
          <button className="btn" style={{ alignSelf: "end" }} onClick={() => load().catch(console.error)}>
            {t(locale, "applyFilter")}
          </button>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        <button className={`btn ${tab === "person" ? "" : "secondary"}`} onClick={() => setTab("person")}>
          {t(locale, "byPerson")}
        </button>
        <button className={`btn ${tab === "project" ? "" : "secondary"}`} onClick={() => setTab("project")}>
          {t(locale, "byProject")}
        </button>
      </div>

      {!data ? (
        <div>{t(locale, "loading")}</div>
      ) : (
        <div className="card" style={{ overflow: "auto" }}>
          {tab === "person" ? (
            <table className="table">
              <thead>
                <tr>
                  <th>{t(locale, "assignee")}</th>
                  <th>{t(locale, "doneCount")}</th>
                  <th>{t(locale, "avgHoursToDone")}</th>
                  <th>{t(locale, "avgEstimate")}</th>
                </tr>
              </thead>
              <tbody>
                {data.by_person.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">
                      {t(locale, "noData")}
                    </td>
                  </tr>
                )}
                {data.by_person.map((row) => (
                  <tr key={row.user_id}>
                    <td>{row.full_name}</td>
                    <td>{row.done_count}</td>
                    <td>{row.avg_hours_to_done ?? "—"}</td>
                    <td>{row.avg_estimate_hours ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t(locale, "project")}</th>
                  <th>{t(locale, "doneCount")}</th>
                  <th>{t(locale, "avgHoursToDone")}</th>
                  <th>{t(locale, "avgEstimate")}</th>
                </tr>
              </thead>
              <tbody>
                {data.by_project.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">
                      {t(locale, "noData")}
                    </td>
                  </tr>
                )}
                {data.by_project.map((row) => (
                  <tr key={String(row.project_id)}>
                    <td>{row.project_name}</td>
                    <td>{row.done_count}</td>
                    <td>{row.avg_hours_to_done ?? "—"}</td>
                    <td>{row.avg_estimate_hours ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}