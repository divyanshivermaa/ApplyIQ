import { apiFetch } from "./client";

export const getInsights = () => apiFetch("/analytics/insights", { method: "GET" });
export const getOverdueByStage = () => apiFetch("/analytics/overdue-by-stage", { method: "GET" });
export const getFunnel = () => apiFetch("/analytics/funnel", { method: "GET" });
export const getWeeklyTrend = () => apiFetch("/analytics/weekly-trend", { method: "GET" });
export const getPlatformPerf = () => apiFetch("/analytics/platform-performance", { method: "GET" });
export const getResumePerf = () => apiFetch("/analytics/resume-performance", { method: "GET" });