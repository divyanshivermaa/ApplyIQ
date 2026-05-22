// Single source of truth for extension API URLs.
// Change PRODUCTION_API when your Render URL changes.
const PRODUCTION_API = "https://applyiq-03hm.onrender.com";
const LOCAL_API = "http://127.0.0.1:8000";

export const API_ROOT = PRODUCTION_API;

// Production first; local fallbacks for dev only.
export const API_BASES = [
  PRODUCTION_API,
  LOCAL_API,
  "http://localhost:8000",
];

export const DASHBOARD_URL = PRODUCTION_API;
