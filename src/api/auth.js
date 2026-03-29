import { apiFetch, setToken, clearToken } from "./client";

// Login using OAuth2PasswordRequestForm
// It requires application/x-www-form-urlencoded (not JSON)
export async function login(email, password) {
  // OAuth2PasswordRequestForm uses "username" field (can be email)
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);

  const data = await apiFetch("/auth/login", {
    method: "POST",
    headers: {
      // Important: form-data encoded
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!data?.access_token) {
    throw new Error("Login failed: access_token not returned");
  }

  setToken(data.access_token);
  return data;
}

export function logout() {
  clearToken();
}
