import { FormEvent, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { t } from "../i18n";
import { IconChat, IconClose } from "./Icons";

type Status = "idle" | "sending" | "sent";

/** Corner lead form: contact + need -> POST /api/feedback -> owner's Telegram. */
export function FeedbackWidget() {
  const { locale } = useAuth();
  // Open by default on wide screens; on phones it would cover the login form, so it starts collapsed.
  const [open, setOpen] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  );
  // Don't steal focus from the login form when the panel is open on page load.
  const openedByUser = useRef(false);
  const [contact, setContact] = useState("");
  const [need, setNeed] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, hidden from people
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({ contact: false, need: false });

  const toggleRef = useRef<HTMLButtonElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);

  const contactError = contact.trim().length < 3 ? t(locale, "fbContactError") : "";
  const needError = need.trim().length < 3 ? t(locale, "fbNeedError") : "";

  useEffect(() => {
    if (!open) return;
    if (openedByUser.current) contactRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    if (openedByUser.current) toggleRef.current?.focus();
    openedByUser.current = true;
    if (status === "sent") {
      setStatus("idle");
      setContact("");
      setNeed("");
      setTouched({ contact: false, need: false });
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ contact: true, need: true });
    if (contactError || needError) return;
    setStatus("sending");
    setError("");
    try {
      await api("/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          contact: contact.trim(),
          need: need.trim(),
          page: window.location.pathname,
          website,
        }),
      });
      setStatus("sent");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : t(locale, "fbSendError"));
    }
  };

  return (
    <div className="feedback">
      {open && (
        <section className="feedback-panel card" role="dialog" aria-labelledby="feedback-title">
          <div className="feedback-head">
            <h2 id="feedback-title">{t(locale, "fbTitle")}</h2>
            <button type="button" className="icon-btn" aria-label={t(locale, "fbClose")} onClick={close}>
              <IconClose size={18} />
            </button>
          </div>

          {status === "sent" ? (
            <div className="feedback-done" role="status">
              <p className="feedback-done-title">{t(locale, "fbSentTitle")}</p>
              <p className="muted">{t(locale, "fbSentText")}</p>
              <button type="button" className="btn secondary" onClick={close}>
                {t(locale, "fbClose")}
              </button>
            </div>
          ) : (
            <form className="form-grid" onSubmit={onSubmit} noValidate>
              <p className="muted feedback-lead">{t(locale, "fbLead")}</p>
              <label className="label">
                {t(locale, "fbContact")}
                <input
                  ref={contactRef}
                  className="input"
                  value={contact}
                  maxLength={200}
                  autoComplete="tel"
                  placeholder={t(locale, "fbContactHint")}
                  aria-invalid={touched.contact && !!contactError}
                  disabled={status === "sending"}
                  onChange={(e) => setContact(e.target.value)}
                  onBlur={() => setTouched((v) => ({ ...v, contact: true }))}
                />
                {touched.contact && contactError && <span className="field-error">{contactError}</span>}
              </label>
              <label className="label">
                {t(locale, "fbNeed")}
                <textarea
                  className="textarea"
                  rows={4}
                  value={need}
                  maxLength={2000}
                  aria-invalid={touched.need && !!needError}
                  disabled={status === "sending"}
                  onChange={(e) => setNeed(e.target.value)}
                  onBlur={() => setTouched((v) => ({ ...v, need: true }))}
                />
                {touched.need && needError && <span className="field-error">{needError}</span>}
              </label>
              {/* Honeypot: invisible to people, bots fill it and get ignored by the API. */}
              <input
                className="feedback-hp"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
              {error && (
                <div className="error" role="alert">
                  {error}
                </div>
              )}
              <button className="btn" disabled={status === "sending"}>
                {status === "sending" ? (
                  <span className="btn-loading">
                    <span className="btn-spinner" aria-hidden />
                    {t(locale, "fbSending")}
                  </span>
                ) : (
                  t(locale, "fbSubmit")
                )}
              </button>
            </form>
          )}
        </section>
      )}

      <button
        ref={toggleRef}
        type="button"
        className="feedback-toggle"
        aria-expanded={open}
        onClick={() => {
          openedByUser.current = true;
          if (open) close();
          else setOpen(true);
        }}
      >
        <IconChat size={18} />
        {t(locale, "fbOpen")}
      </button>
    </div>
  );
}
