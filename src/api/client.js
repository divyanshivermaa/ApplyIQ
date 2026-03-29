// Simple API client for your FastAPI backend.
// English comments inside code as requested.

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Token storage helpers (keep simple)
export function getToken() {
  return localStorage.getItem("access_token");
}

export function setToken(token) {
  localStorage.setItem("access_token", token);
}

export function clearToken() {
  localStorage.removeItem("access_token");
}

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  // Attach Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Attempt JSON parsing; fall back to text
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = (data && data.detail) ? data.detail : `Request failed: ${res.status}`;
    throw new Error(message);
  }

  return data;
}
