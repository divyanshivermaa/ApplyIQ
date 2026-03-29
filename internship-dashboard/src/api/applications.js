import { apiFetch } from "./client";

export const listApplications = () => apiFetch("/applications", { method: "GET" });

export const createApplication = (payload) =>
  apiFetch("/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const addStage = (appId, payload) =>
  apiFetch(`/applications/${appId}/stages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const deleteApplication = (appId) =>
  apiFetch(`/applications/${appId}`, { method: "DELETE" });

export const updateApplication = (appId, payload) =>
  apiFetch(`/applications/${appId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
