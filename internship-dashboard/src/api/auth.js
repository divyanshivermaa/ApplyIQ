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

export function logout() {
  clearToken();
}