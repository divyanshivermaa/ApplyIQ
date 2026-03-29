import { apiFetch } from "./client";

const api = {
  get: async (path) => ({ data: await apiFetch(path, { method: "GET" }) }),
  post: async (path, body) => ({
    data: await apiFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  }),
};

export default api;
