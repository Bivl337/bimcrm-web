import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { t } from "../i18n";
import { FeedbackWidget } from "./FeedbackWidget";

/** Renders a phrase where [word] is underlined, e.g. "Система под [любые] Ваши процессы". */
export function Emphasis({ text }: { text: string }) {
  const parts = text.split(/\[([^\]]+)\]/);
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <u key={i} className="u-emph">{part}</u> : part))}
    </>
  );
}

/** Split auth screen: blueprint panel with the product idea + the form. */
export function AuthLayout({ children }: { children: ReactNode }) {
  const { locale } = useAuth();
  return (
    <div className="auth-split">
      <aside className="auth-aside">
        <div className="auth-logo-tile">
          <img src="/logo-wide.png" alt="bimCRM" />
        </div>
        <div className="auth-plan">
          <h2>{t(locale, "authHeadline")}</h2>
          <p>{t(locale, "authText")}</p>
          <div className="auth-sketch" aria-hidden="true">
            <div>
              <span />
              <span />
              <span />
            </div>
            <div>
              <span />
              <span />
            </div>
            <div>
              <span />
            </div>
          </div>
        </div>
        <div className="auth-foot">{t(locale, "authFoot")}</div>
      </aside>
      <main className="auth-main">{children}</main>
      <FeedbackWidget />
    </div>
  );
}
