console.log("[II] indeed.js loaded ✅");

// extension/adapters/indeed.js
// Simple Hindi: Indeed ke 2 layouts hote hain: full job page ya feed + right panel
// Isliye hum multiple selectors + fallback parse use karte hain.

function pickText(el) {
  return (el?.textContent || "").replace(/\s+/g, " ").trim();
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    const t = (v || "").trim();
    if (t) return t;
  }
  return "";
}

function detectJobTypeAndWorkMode() {
  // Simple Hindi: chips text collect karo (limited scope)
  const chipNodes = Array.from(document.querySelectorAll("button, span, li"))
    .slice(0, 400); // safety cap

  const chipsText = chipNodes.map(n => pickText(n)).filter(Boolean).join(" | ");

  let job_type = "";
  if (/internship/i.test(chipsText)) job_type = "Internship";
  else if (/full[-\s]?time/i.test(chipsText)) job_type = "Full-time";
  else if (/part[-\s]?time/i.test(chipsText)) job_type = "Part-time";
  else if (/contract/i.test(chipsText)) job_type = "Contract";

  let work_mode = "";
  if (/\bremote\b/i.test(chipsText)) work_mode = "Remote";
  else if (/\bhybrid\b/i.test(chipsText)) work_mode = "Hybrid";
  else if (/\bon[-\s]?site\b|\bin[-\s]?office\b/i.test(chipsText)) work_mode = "On-site";

  return { job_type, work_mode };
}

function parseFromJobDescriptionText() {
  // Indeed description container (commonly)
  const box =
    document.querySelector("#jobDescriptionText") ||
    document.querySelector('[data-testid="jobDescriptionText"]');

  if (!box) return null;

  const full = (box.innerText || "").trim();
  if (!full) return null;

  // Simple Hindi: first line ko title maan lo (fallback)
  const firstLine = full.split("\n").map(s => s.trim()).filter(Boolean)[0] || "";

  // Simple Hindi: kabhi "Company:" / "Location:" lines mil jati hain
  const companyMatch = full.match(/Company:\s*([^\n\r]+)/i);
  const locationMatch = full.match(/Location:\s*([^\n\r]+)/i);

  return {
    title: firstLine,
    company: companyMatch ? companyMatch[1].trim() : "",
    location: locationMatch ? locationMatch[1].trim() : ""
  };
}

function readIndeedFieldsOnce() {
  // Title
  const title = firstNonEmpty(
    pickText(document.querySelector("h1")),
    pickText(document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')),
    pickText(document.querySelector('[data-testid="jobTitle"]'))
  );

  // Company
  const company = firstNonEmpty(
    pickText(document.querySelector('[data-testid="inlineHeader-companyName"]')),
    pickText(document.querySelector('[data-testid="company-name"]')),
    pickText(document.querySelector('[data-company-name="true"]')),
    pickText(document.querySelector(".jobsearch-InlineCompanyRating div"))
  );

  // Location
  const location = firstNonEmpty(
    pickText(document.querySelector('[data-testid="inlineHeader-companyLocation"]')),
    pickText(document.querySelector('[data-testid="job-location"]')),
    pickText(document.querySelector(".jobsearch-JobInfoHeader-subtitle span"))
  );

  // type/mode
  const { job_type, work_mode } = detectJobTypeAndWorkMode();

  let finalTitle = title;
  let finalCompany = company;
  let finalLocation = location;

  // Fallback parse from description if some are missing
  if (!finalTitle || !finalCompany || !finalLocation) {
    const parsed = parseFromJobDescriptionText();
    if (parsed) {
      finalTitle = firstNonEmpty(finalTitle, parsed.title);
      finalCompany = firstNonEmpty(finalCompany, parsed.company);
      finalLocation = firstNonEmpty(finalLocation, parsed.location);
    }
  }

  // If truly nothing found, return null
  if (!finalTitle && !finalCompany && !finalLocation && !job_type && !work_mode) return null;

  return {
    role_title: finalTitle,
    company_name: finalCompany,
    location: finalLocation,
    job_type,
    work_mode
  };
}

// Simple Hindi: chhota retry because Indeed DOM late load hota hai
window.adaptIndeed = function adaptIndeed() {
  const outBase = {
    role_title: "",
    company_name: "",
    location: "",
    job_type: "",
    work_mode: "",
    confidence: {
      role_title: "low",
      company_name: "low",
      location: "low",
      job_type: "low",
      work_mode: "low"
    },
    source: "adapter:indeed",
    sources: {}
  };

  // Try immediate
  const got = readIndeedFieldsOnce();
  if (!got) return null;

  const out = { ...outBase, ...got };

  if (out.role_title) out.confidence.role_title = "high";
  if (out.company_name) out.confidence.company_name = "high";
  if (out.location) out.confidence.location = "high";
  if (out.job_type) out.confidence.job_type = "high";
  if (out.work_mode) out.confidence.work_mode = "high";

  out.sources = {
    role_title: out.role_title ? "indeed:adapter" : "none",
    company_name: out.company_name ? "indeed:adapter" : "none",
    location: out.location ? "indeed:adapter" : "none",
    job_type: out.job_type ? "indeed:adapter" : "none",
    work_mode: out.work_mode ? "indeed:adapter" : "none"
  };

  console.log("[II] adaptIndeed OUT", out);
  return out;
};
