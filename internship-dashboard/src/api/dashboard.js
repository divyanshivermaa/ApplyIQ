import { apiFetch } from "./client";

export const getDashboardOverview = () =>
  apiFetch("/dashboard/overview", { method: "GET" });
