import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { t } from "../i18n";

/** Split auth screen: blueprint panel with the product idea + the form. */
export function AuthLayout({ children }: { children: ReactNode }) {
  const { locale } = useAuth();
  return (
    <div className="auth-split">
      <aside className="auth-aside">
        <div className="brand">
          <img src="/logo.png" alt="" />
          <div className="brand-title">
            bim<span>CRM</span>
          </div>
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
    </div>
  );
}
