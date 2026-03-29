import { apiFetch } from "./client";

export const fetchPendingExpanded = (limit = 50) =>
  apiFetch(`/status-suggestions/pending-expanded?limit=${limit}`, { method: "GET" });

export const confirmSuggestion = (id) =>
  apiFetch(`/status-suggestions/${id}/confirm`, { method: "POST" });

export const dismissSuggestion = (id) =>
  apiFetch(`/status-suggestions/${id}/dismiss`, { method: "POST" });