// simple Hindi: company name me "Actively Hiring" jaisa text hatao
export function cleanCompanyName(name) {
  if (!name) return "";
  return name
    .replace(/\bActively Hiring\b/ig, "")
    .replace(/\bUrgently Hiring\b/ig, "")
    .replace(/\bHiring\b/ig, "")
    .replace(/\s+/g, " ")
    .trim();
}

// simple Hindi: job type ko readable bana do
export function normalizeJobType(v) {
  if (!v) return "";
  const s = String(v).toUpperCase();

  // common mappings
  if (s.includes("INTERN")) return "Internship";
  if (s.includes("FULL_TIME") || s.includes("FULL TIME")) return "Full-time";
  if (s.includes("PART_TIME") || s.includes("PART TIME")) return "Part-time";
  if (s.includes("CONTRACT")) return "Contract";

  // default: title case-ish
  return String(v).replace(/_/g, " ").trim();
}

// simple Hindi: work mode ko normalize karte hain
export function normalizeWorkMode(v) {
  if (!v) return "";
  const s = String(v).toLowerCase();

  if (s.includes("remote")) return "Remote";
  if (s.includes("hybrid")) return "Hybrid";
  if (s.includes("on-site") || s.includes("onsite") || s.includes("in office")) return "On-site";

  return String(v).trim();
}

// simple Hindi: location se "· 4 weeks ago · ..." wala extra part hatao
export function cleanLocation(v) {
  if (!v) return "";
  
  // LinkedIn style "Delhi, India · 4 weeks ago · Over 100 people..."
  return String(v).split("·")[0].trim();
}
