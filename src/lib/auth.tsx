import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "./api";
import type { Locale } from "../i18n";
import type { Me } from "./types";

interface AuthState {
  me: Me | null;
  loading: boolean;
  locale: Locale;
  setLocale: (l: Locale) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    organization_name: string;
    locale: Locale;
  }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  canWrite: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocaleState] = useState<Locale>(
    (localStorage.getItem("bimcrm_locale") as Locale) || "ru"
  );

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("bimcrm_locale", l);
  };

  const refresh = async () => {
    if (!getToken()) {
      setMe(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api<Me>("/api/auth/me");
      setMe(data);
      if (data.user.locale === "ru" || data.user.locale === "en") {
        setLocale(data.user.locale);
      }
    } catch {
      setToken(null);
      setMe(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api<{ access_token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(res.access_token);
    await refresh();
  };

  const register = async (data: {
    email: string;
    password: string;
    full_name: string;
    organization_name: string;
    locale: Locale;
  }) => {
    const res = await api<{ access_token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setToken(res.access_token);
    await refresh();
  };

  const logout = () => {
    setToken(null);
    setMe(null);
  };

  const value = useMemo(
    () => ({
      me,
      loading,
      locale,
      setLocale,
      login,
      register,
      logout,
      refresh,
      canWrite: me ? me.role !== "viewer" : false,
    }),
    [me, loading, locale]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}