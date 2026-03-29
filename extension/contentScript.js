
console.log("🔥 CONTENT SCRIPT LOADED:", location.href);

// contentScript.js - Non-modular version for content script injection
console.log("[II] contentScript injected ✅", location.href);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "PING") {
    sendResponse({ ok: true });
    return true;
  }
  
  if (msg?.type === "CAPTURE") {
    (async () => {
      try {
        const data = await captureAll();
        sendResponse({ ok: true, data });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true;
  }
});

// Simple confidence ranking
const CONF_RANK = { none: 0, low: 1, medium: 2, high: 3 };

function confRank(v) {
  return CONF_RANK[v || "none"] ?? 0;
}

function shouldOverride(oldConf, newConf, oldVal, newVal) {
  if (!newVal) return false;
  if (!oldVal) return true;
  return confRank(newConf) > confRank(oldConf);
}

// Simple normalize functions
function cleanCompanyName(name) {
  if (!name) return "";
  return name
    .replace(/\bActively Hiring\b/ig, "")
    .replace(/\bUrgently Hiring\b/ig, "")
    .replace(/\bHiring\b/ig, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeJobType(v) {
  if (!v) return "";
  const s = String(v).toUpperCase();

  if (s.includes("INTERN")) return "Internship";
  if (s.includes("FULL_TIME") || s.includes("FULL TIME")) return "Full-time";
  if (s.includes("PART_TIME") || s.includes("PART TIME")) return "Part-time";
  if (s.includes("CONTRACT")) return "Contract";

  return String(v).replace(/_/g, " ").trim();
}

function normalizeWorkMode(v) {
  if (!v) return "";
  const s = String(v).toLowerCase();

  if (s.includes("remote")) return "Remote";
  if (s.includes("hybrid")) return "Hybrid";
  if (s.includes("on-site") || s.includes("onsite") || s.includes("in office")) return "On-site";

  return String(v).trim();
}

function cleanLocation(v) {
  if (!v) return "";
  return String(v).split("·")[0].trim();
}

// Layer 1: Safe Meta
function captureSafeMeta() {
  const url = window.location.href;
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "";
  const platform = location.hostname;

  const ogTitle = document.querySelector('meta[property="og:title"]')?.content || "";
  const twTitle = document.querySelector('meta[name="twitter:title"]')?.content || "";
  const docTitle = (document.title || "").replace(/\(\d+\)\s*LinkedIn/ig, "").trim();

  let roleTitle = ogTitle || twTitle || docTitle;
  let roleConf = ogTitle || twTitle ? "high" : roleTitle ? "medium" : "low";

  const selectedText = window.getSelection()?.toString()?.trim() || "";

  return {
    url,
    canonical_url: canonical,
    platform,
    role_title: roleTitle,
    company_name: "",
    location: "",
    job_type: "",
    work_mode: "",
    selectedText,
    title: roleTitle,
    confidence: {
      role_title: roleConf,
      company_name: "low",
      location: "low",
      job_type: "low",
      work_mode: "low",
      selectedText: selectedText ? "high" : "none"
    },
    sources: {
      role_title: ogTitle ? "meta:og:title" : twTitle ? "meta:twitter:title" : "document.title",
      company_name: "meta/company",
      location: "meta/location",
      job_type: "meta/job_type",
      work_mode: "meta/work_mode",
      selectedText: selectedText ? "user-selection" : "none"
    }
  };
}

// LinkedIn Adapter
function linkedinAdapter() {
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

  const title = txt(document.querySelector("h1"));
  if (title) {
    out.role_title = title;
    out.confidence.role_title = "high";
  }

  const company = txt(
    document.querySelector(".job-details-jobs-unified-top-card__company-name a") ||
    document.querySelector(".job-details-jobs-unified-top-card__company-name")
  );
  if (company) {
    out.company_name = company;
    out.confidence.company_name = "high";
  }

  const rawLocLine = txt(
    document.querySelector(".job-details-jobs-unified-top-card__primary-description-container") ||
    document.querySelector(".job-details-jobs-unified-top-card__bullet")
  );
  const loc = cleanLocation(rawLocLine);
  if (loc) {
    out.location = loc;
    out.confidence.location = "high";
  }

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
    if (t.length > 25) continue;
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

// Main capture function
async function captureAll() {
  // Layer 1
  let result = captureSafeMeta();

  // Layer 3 - Run adapters
  // ✅ Simple Hindi: adapter runner global hai, isliye window se call karo
  if (typeof window.runAdapters === "function") {
    result = await window.runAdapters(result);
  }

  // Final polish
  result.company_name = cleanCompanyName(result.company_name);
  result.location = cleanLocation(result.location);
  result.job_type = normalizeJobType(result.job_type);
  result.work_mode = normalizeWorkMode(result.work_mode);

  return result;
}

// Helper functions for data extraction
function extractCompanyName() {
  // Try common selectors for company name
  const selectors = [
    'meta[property="og:site_name"]',
    '[data-company]',
    '.company-name',
    '.employer-name',
    'h1[class*="company"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent || element.content || element.getAttribute('content');
    }
  }
  return "";
}

function extractLocation() {
  // Try common selectors for location
  const selectors = [
    '[data-location]',
    '.job-location',
    '.location',
    '[class*="location"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent.trim();
    }
  }
  return "";
}

function extractJobType() {
  // Try common selectors for job type
  const selectors = [
    '[data-job-type]',
    '.job-type',
    '.employment-type',
    '[class*="job-type"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent.trim();
    }
  }
  return "";
}

function extractWorkMode() {
  // Try common selectors for work mode
  const selectors = [
    '[data-work-mode]',
    '.work-mode',
    '[class*="remote"], [class*="hybrid"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent.trim();
    }
  }
  return "";
}

function detectPlatform() {
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.includes('linkedin')) return 'linkedin';
  if (hostname.includes('indeed')) return 'indeed';
  if (hostname.includes('glassdoor')) return 'glassdoor';
  if (hostname.includes('ziprecruiter')) return 'ziprecruiter';
  if (hostname.includes('monster')) return 'monster';
  if (hostname.includes('careerbuilder')) return 'careerbuilder';
  
  return 'unknown';
}
