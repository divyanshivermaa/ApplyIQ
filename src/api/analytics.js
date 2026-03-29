import { apiFetch } from "./client";

export function getPlatformPerf() {
  return apiFetch("/analytics/platform-performance", { method: "GET" });
}

export function getResumePerf() {
  return apiFetch("/analytics/resume-performance", { method: "GET" });
}

export function getWeeklyTrend() {
  return apiFetch("/analytics/weekly-trend", { method: "GET" });
}
