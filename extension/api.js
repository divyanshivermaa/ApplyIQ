// api.js
import { API_ROOT } from "./config.js";
import { getAuth, clearAuth } from "./storage.js";

// Calls API with Bearer token if present.
// Essential: Extension remains lightweight and does not handle credentials.
export async function fetchWithAuth(path, options = {}) {
  const auth = await getAuth();
  if (!auth?.token) {
    throw new Error("NOT_LOGGED_IN");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${auth.token}`);

  const res = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    await clearAuth();
    throw new Error("SESSION_EXPIRED");
  }

  return res;
}

// Optional small check to show status in popup.
// If token exists and /auth/me works => logged in.
export async function checkLoggedIn() {
  try {
    const res = await fetchWithAuth("/auth/me", { method: "GET" });
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: true, email: data.email };
  } catch (e) {
    if (e.message === "NOT_LOGGED_IN") return { ok: false, reason: "no_token" };
    if (e.message === "SESSION_EXPIRED") return { ok: false, reason: "expired" };
    return { ok: false, reason: "error" };
  }
}
