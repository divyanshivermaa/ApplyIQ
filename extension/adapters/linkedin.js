// LinkedIn adapter - chips + location cleaner

// Simple Hindi: location se "· 4 weeks ago · ..." wala extra part hatao
function cleanLocation(v) {
  if (!v) return "";
  
  // LinkedIn style "Delhi, India · 4 weeks ago · Over 100 people..."
  return String(v).split("·")[0].trim();
}

window.linkedinAdapter = function linkedinAdapter() {
  const out = {
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
      work_mode: "low",
    },
    sources: {
      role_title: "adapter:linkedin",
      company_name: "adapter:linkedin",
      location: "adapter:linkedin",
      job_type: "adapter:linkedin",
      work_mode: "adapter:linkedin",
    }
  };

  const txt = (el) => (el?.textContent || "").trim();

  // title
  const title = txt(document.querySelector("h1"));
  if (title) {
    out.role_title = title;
    out.confidence.role_title = "high";
  }

  // company (best effort)
  const company = txt(
    document.querySelector(".job-details-jobs-unified-top-card__company-name a") ||
    document.querySelector(".job-details-jobs-unified-top-card__company-name")
  );
  if (company) {
    out.company_name = company;
    out.confidence.company_name = "high";
  }

  // location (parse only first segment before "·")
  const rawLocLine = txt(
    document.querySelector(".job-details-jobs-unified-top-card__primary-description-container") ||
    document.querySelector(".job-details-jobs-unified-top-card__bullet")
  );
  const loc = cleanLocation(rawLocLine);
  if (loc) {
    out.location = loc;
    out.confidence.location = "high";
  }

  // chips for job_type + work_mode
  const allowed = new Set([
    "On-site", "Remote", "Hybrid",
    "Internship", "Full-time", "Part-time", "Contract"
  ]);

  const top = document.querySelector(".job-details-jobs-unified-top-card") || document.body;
  const nodes = Array.from(top.querySelectorAll("button, span, li, a"));

  const hits = [];
  for (const n of nodes) {
    const t = txt(n.innerText);
    if (!t) continue;
    if (t.length > 25) continue; // avoid long lines
    if (allowed.has(t)) hits.push(t);
  }

  const chips = Array.from(new Set(hits));
  const lower = chips.map(c => c.toLowerCase());

  let workMode = "";
  if (lower.includes("on-site")) workMode = "On-site";
  else if (lower.includes("remote")) workMode = "Remote";
  else if (lower.includes("hybrid")) workMode = "Hybrid";

  let jobType = "";
  if (lower.includes("internship")) jobType = "Internship";
  else if (lower.includes("full-time")) jobType = "Full-time";
  else if (lower.includes("part-time")) jobType = "Part-time";
  else if (lower.includes("contract")) jobType = "Contract";

  if (jobType) {
    out.job_type = jobType;
    out.confidence.job_type = "high";
  }
  if (workMode) {
    out.work_mode = workMode;
    out.confidence.work_mode = "high";
  }

  return out;
}
