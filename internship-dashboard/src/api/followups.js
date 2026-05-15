import { apiFetch } from "./client";

export const fetchPendingFollowups = () =>
  apiFetch("/followups/pending", { method: "GET" });
