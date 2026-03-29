const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function getToken() {
  return localStorage.getItem("access_token");
}
export function setToken(token) {
  localStorage.setItem("access_token", token);
}
export function clearToken() {
  localStorage.removeItem("access_token");
}

// Convert FastAPI error payload into readable text
function toErrorMessage(data, fallback) {
  if (!data) return fallback;

  // FastAPI sometimes returns: { detail: "..." }
  if (typeof data.detail === "string") return data.detail;

  // Or: { detail: [ { msg: "...", loc: [...] }, ... ] }
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((e) => {
        const loc = Array.isArray(e.loc) ? e.loc.join(".") : "";
        const msg = e.msg || JSON.stringify(e);
        return loc ? `${loc}: ${msg}` : msg;
      })
      .join(" | ");
  }

  // If server returned something else
  if (typeof data === "string") return data;

  try {
    return JSON.stringify(data);
  } catch {
    return fallback;
  }
}

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (res.status === 401) {
    clearToken();
    if (window.location.pathname !== "/") window.location.href = "/";
    throw new Error("Session expired / invalid token. Please login again.");
  }

  if (!res.ok) {
    throw new Error(toErrorMessage(data, `Request failed (${res.status})`));
  }

  return data;
}
