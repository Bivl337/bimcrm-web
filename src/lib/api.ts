const TOKEN_KEY = "bimcrm_token";

/** External API base URL for production (browser → Amvera). Empty in local dev = Vite proxy. */
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const RETRY_DELAYS_MS = [800, 2000];
const REQUEST_TIMEOUT_MS = 20000;
const NETWORK_ERROR_MESSAGE =
  "Нет связи с сервером. Проверьте интернет или попробуйте ещё раз через несколько секунд.";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Requests that are safe to repeat automatically (no risk of creating duplicates). */
function isRetryable(method: string, path: string): boolean {
  return method === "GET" || method === "HEAD" || path.startsWith("/api/auth/login");
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: init.signal ?? controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const method = (options.method || "GET").toUpperCase();
  const canRetry = isRetryable(method, path);

  let res: Response | null = null;
  for (let attempt = 0; ; attempt++) {
    try {
      res = await fetchWithTimeout(url, { ...options, headers });
    } catch {
      // Network error / CORS-less gateway error / timeout -> "Failed to fetch"
      if (canRetry && attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw new ApiError(0, NETWORK_ERROR_MESSAGE);
    }
    // 503 with Retry-After comes from our API while it is starting — request was not processed.
    const serverStarting = res.status === 503 && res.headers.has("Retry-After");
    const gatewayError = res.status === 502 || res.status === 503 || res.status === 504;
    if ((serverStarting || (canRetry && gatewayError)) && attempt < RETRY_DELAYS_MS.length) {
      await sleep(RETRY_DELAYS_MS[attempt]);
      continue;
    }
    break;
  }

  if (!res) throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || JSON.stringify(data);
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, String(detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
