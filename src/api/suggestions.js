import { apiFetch } from "./client";

export function fetchPendingSuggestions(limit = 50) {
  return apiFetch(`/status-suggestions/pending?limit=${limit}`, { method: "GET" });
}

export function fetchPendingSuggestionsExpanded(limit = 50) {
  return apiFetch(`/status-suggestions/pending-expanded?limit=${limit}`, { method: "GET" });
}

export function fetchPendingExpanded(limit = 50) {
  return fetchPendingSuggestionsExpanded(limit);
}

export function confirmSuggestion(id) {
  return apiFetch(`/status-suggestions/${id}/confirm`, { method: "POST" });
}

export function dismissSuggestion(id) {
  return apiFetch(`/status-suggestions/${id}/dismiss`, { method: "POST" });
}
