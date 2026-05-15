import { apiFetch, setToken, clearToken } from "./client";

export async function login(email, password) {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);

  const data = await apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!data?.access_token) throw new Error("No access_token returned");
  setToken(data.access_token);
  return data;
}

export async function register(name, email, password) {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (!data?.access_token) throw new Error("Registration failed");
  setToken(data.access_token);
  return data;
}

export function logout() {
  clearToken();
}