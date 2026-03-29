import { apiFetch } from "./client";

export const seedResumes = () => apiFetch("/resumes/seed", { method: "POST" });
export const listResumes = () => apiFetch("/resumes", { method: "GET" });
