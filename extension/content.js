// =========================
// Utils + Confidence
// =========================

const CONF_RANK = { low: 1, medium: 2, high: 3 };

function shouldOverride(oldConf, newConf) {
  return (CONF_RANK[newConf] || 0) > (CONF_RANK[oldConf] || 0);
}

function cleanText(s) {
  if (s == null) return "";
  if (typeof s === "string") return s.replace(/\s+/g, " ").trim();
  if (typeof s === "number" || typeof s === "boolean" || typeof s === "bigint") {
    return String(s).replace(/\s+/g, " ").trim();
  }
  if (Array.isArray(s)) {
    return s.map((x) => cleanText(x)).filter(Boolean).join(", ").replace(/\s+/g, " ").trim();
  }
  return "";
}

function normalizeSpaces(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function cleanRoleTitle(text) {
  let value = normalizeSpaces(text);

  value = value
    .replace(/\s*-\s*Indeed\.com\s*$/i, "")
    .replace(/\s*-\s*Remote\s*-\s*Indeed\.com\s*$/i, "")
    .replace(/\s*-\s*Hybrid\s*-\s*Indeed\.com\s*$/i, "")
    .replace(/\s*-\s*On-?site\s*-\s*Indeed\.com\s*$/i, "")
    .trim();

  return value;
}

function cleanLocation(text) {
  let value = normalizeSpaces(text);

  value = value.replace(/^location\s*:\s*/i, "").trim();
  value = value.replace(/\s*\(as applicable\)\s*$/i, "").trim();
  value = value.split(/\n/)[0].trim();
  value = value.split(/\s+Working Days\s*:/i)[0].trim();

  const lower = value.toLowerCase();
  const badMarkers = [
    "dear candidate",
    "role overview",
    "key responsibilities",
    "deadline",
    "form link",
    "technical assignment",
    "submit your solution",
    "attached test document"
  ];

  if (value.length > 80) return "";
  if (badMarkers.some((marker) => lower.includes(marker))) return "";

  return value;
}

function guardStructuredField(value, maxLen = 120) {
  if (!value) return "";
  const text = value.trim();

  if (text.length > maxLen) return "";
  if (text.split("\n").length > 2) return "";

  return text;
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    const t = cleanText(v);
    if (t) return t;
  }
  return "";
}

function cleanCompanyName(name) {
  let s = cleanText(name);
  s = s.replace(/\bActively Hiring\b/gi, "").trim();
  s = s.replace(/\bUrgently Hiring\b/gi, "").trim();
  s = s.replace(/\bHiring\b/gi, "").trim();
  return cleanText(s);
}

function normalizeJobType(s) {
  const t = cleanText(s).toLowerCase();
  if (!t) return "";
  if (t.includes("intern")) return "Internship";
  if (t.includes("full")) return "Full-time";
  if (t.includes("part")) return "Part-time";
  if (t.includes("contract")) return "Contract";
  return cleanText(s);
}

function normalizeWorkMode(s) {
  const t = cleanText(s).toLowerCase();
  if (!t) return "";
  const hasRemote = t.includes("remote") || t.includes("work from home");
  const hasOnsite = t.includes("on-site") || t.includes("onsite") || t.includes("in office") || t.includes("in-office");
  if (hasRemote && hasOnsite) return "Hybrid";
  if (t.includes("hybrid")) return "Hybrid";
  if (hasRemote) return "Remote";
  if (hasOnsite) return "On-site";
  return cleanText(s);
}

function isBadGenericTitle(host, title) {
  const h = host || "";
  const t = (title || "").toLowerCase();

  if (h.includes("indeed.") && t.includes("job search") && t.includes("indeed")) return true;
  if (h.includes("google.com") && (t === "google" || t.length < 6)) return true;
  if (h.includes("wellfound.com") && (t === "startup jobs" || t.startsWith("jobs at "))) return true;

  return false;
}

function extractLabeledValueExact(labelText) {
  const target = cleanText(labelText).toLowerCase();
  if (!target) return "";

  const nodes = Array.from(document.querySelectorAll("h1, h2, h3, h4, strong, b, dt, th, div, span, p, li"));
  for (const n of nodes) {
    const txt = cleanText(n.innerText).toLowerCase();
    if (!txt || txt !== target) continue;

    const next = cleanText(n.nextElementSibling?.innerText);
    if (next && next.toLowerCase() !== target) return next;

    const parent = cleanText(n.parentElement?.innerText);
    if (parent) {
      const stripped = cleanText(parent.replace(new RegExp("^" + target + "\\s*", "i"), ""));
      if (stripped && stripped.toLowerCase() !== target) return stripped;
    }
  }
  return "";
}

function extractLabeledValue(labelRegex) {
  const nodes = Array.from(
    document.querySelectorAll("p, div, span, li, h1, h2, h3, h4, strong, b")
  );

  for (const node of nodes) {
    const text = (node.innerText || "").trim();
    if (!text) continue;

    // Case 1: whole text in one line: "Location: Remote / On-site"
    if (labelRegex.test(text)) {
      const sameNodeParts = text.split(/:\s*/);
      if (sameNodeParts.length >= 2) {
        return sameNodeParts.slice(1).join(": ").trim();
      }

      // Case 2: label node followed by sibling value
      const next = node.nextElementSibling;
      if (next) {
        const nextText = normalizeSpaces(next.innerText || "");
        if (nextText && nextText.length < 80) {
          return nextText;
        }
      }

      // Case 3: label inside parent like:
      // <p><strong>Location:</strong> Remote / On-site</p>
      const parent = node.parentElement;
      if (parent) {
        const parentText = (parent.innerText || "").trim();
        const parentParts = parentText.split(/:\s*/);
        if (parentParts.length >= 2) {
          const joined = parentParts.slice(1).join(": ").trim();
          const firstLine = joined.split(/\n/)[0];
          const beforeWorkingDays = firstLine.split(/\s+Working Days\s*:/i)[0];
          return beforeWorkingDays.trim();
        }
      }
    }
  }

  return "";
}

// =========================
// Layer 1: Universal Safe Capture
// =========================
function captureSafeMeta() {
  const url = window.location.href;
  const canonical = document.querySelector('link[rel="canonical"]')?.href || "";
  const platform = location.hostname;

  const ogTitle = document.querySelector('meta[property="og:title"]')?.content || "";
  const twTitle = document.querySelector('meta[name="twitter:title"]')?.content || "";
  const docTitle = document.title || "";

  let role_title = cleanText(ogTitle || twTitle || docTitle);
  let roleConf = ogTitle || twTitle ? "high" : (docTitle ? "medium" : "low");
  let roleSource = ogTitle ? "meta:og:title" : (twTitle ? "meta:twitter:title" : "document.title");

  if (isBadGenericTitle(platform, role_title)) {
    roleConf = "low";
    roleSource = "meta:generic_downgraded";
  }

  const ogDesc = document.querySelector('meta[property="og:description"]')?.content || "";
  const desc = document.querySelector('meta[name="description"]')?.content || "";
  const meta_description = cleanText(ogDesc || desc);

  let selectedText = "";
  try {
    selectedText = cleanText(window.getSelection()?.toString() || "");
  } catch {}

  return {
    data: {
      url,
      canonical_url: canonical,
      platform,
      role_title,
      company_name: "",
      location: "",
      job_type: "",
      work_mode: "",
      meta_description,
      selectedText
    },
    confidence: {
      role_title: roleConf,
      company_name: "low",
      location: "low",
      job_type: "low",
      work_mode: "low"
    },
    sources: {
      role_title: roleSource,
      company_name: "none",
      location: "none",
      job_type: "none",
      work_mode: "none"
    }
  };
}

// =========================
// Layer 2: JSON-LD JobPosting
// =========================
function captureJsonLdJobPosting() {
  const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  if (!scripts.length) return null;

  const candidates = [];

  for (const sc of scripts) {
    const raw = sc.textContent || "";
    if (!raw.trim()) continue;

    try {
      const parsed = JSON.parse(raw);
      const stack = Array.isArray(parsed) ? parsed : [parsed];

      while (stack.length) {
        const node = stack.shift();
        if (!node) continue;

        if (Array.isArray(node)) {
          stack.push(...node);
          continue;
        }

        if (typeof node === "object") {
          if (Array.isArray(node["@graph"])) stack.push(...node["@graph"]);
          const type = node["@type"];
          if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) {
            candidates.push(node);
          }
        }
      }
    } catch {
      // ignore invalid json
    }
  }

  if (!candidates.length) return null;

  const jp = candidates[0];
  const title = cleanText(jp.title);
  const org = cleanText(jp.hiringOrganization?.name || jp.hiringOrganization);
  const emp = cleanText(jp.employmentType);

  let loc = "";
  const jl = jp.jobLocation;
  const addr = Array.isArray(jl) ? jl[0]?.address : jl?.address;

  if (typeof addr === "string") {
    loc = cleanText(addr);
  } else if (addr && typeof addr === "object") {
    const parts = [addr.addressLocality, addr.addressRegion, addr.addressCountry].map(cleanText).filter(Boolean);
    loc = cleanText(parts.join(", "));
  } else if (typeof jl === "string") {
    loc = cleanText(jl);
  }

  const finalTitle = guardStructuredField(cleanRoleTitle(title), 150);
  const finalLoc = guardStructuredField(cleanLocation(loc), 80);

  return {
    data: {
      role_title: finalTitle,
      company_name: org,
      location: finalLoc,
      job_type: emp
    },
    confidence: {
      role_title: title ? "high" : "low",
      company_name: org ? "high" : "low",
      location: loc ? "high" : "low",
      job_type: emp ? "high" : "low"
    },
    sources: {
      role_title: "jsonld:JobPosting.title",
      company_name: "jsonld:JobPosting.hiringOrganization",
      location: "jsonld:JobPosting.jobLocation",
      job_type: "jsonld:JobPosting.employmentType"
    }
  };
}

// =========================
// Layer 3: Adapters
// =========================
function linkedInAdapter() {
  const title = cleanText(document.querySelector("h1")?.innerText || "");
  const company = firstNonEmpty(
    document.querySelector('a[data-control-name="company_link"]')?.innerText,
    document.querySelector(".job-details-jobs-unified-top-card__company-name a")?.innerText,
    document.querySelector(".job-details-jobs-unified-top-card__company-name")?.innerText
  );

  const locLine = firstNonEmpty(
    document.querySelector(".job-details-jobs-unified-top-card__bullet")?.innerText,
    document.querySelector(".job-details-jobs-unified-top-card__primary-description-container")?.innerText
  );

  let location = "";
  if (locLine) location = cleanText((locLine.split(/[|\u00B7]/)[0] || "").replace(/\(.*?\)/g, ""));

  const topCard = document.querySelector(".job-details-jobs-unified-top-card");
  const chips = cleanText(Array.from(document.querySelectorAll(".job-details-jobs-unified-top-card__job-insight, .job-details-jobs-unified-top-card__job-insight-text")).map((n) => n.innerText).join(" | "));
  const headerBlob = cleanText(topCard?.innerText || "");
  const chipBlob = firstNonEmpty(chips, headerBlob).toLowerCase();

  let job_type = "";
  if (chipBlob.includes("intern")) job_type = "Internship";
  else if (chipBlob.includes("full-time")) job_type = "Full-time";
  else if (chipBlob.includes("part-time")) job_type = "Part-time";
  else if (chipBlob.includes("contract")) job_type = "Contract";
  else if (title.toLowerCase().includes("intern")) job_type = "Internship";

  const explicitWorkModeText = firstNonEmpty(
    document.querySelector(".jobs-unified-top-card__workplace-type")?.innerText,
    document.querySelector(".job-details-jobs-unified-top-card__workplace-type")?.innerText,
    document.querySelector('[class*="workplace-type"]')?.innerText
  );

  // LinkedIn often shows "(On-site/Remote/Hybrid)" only in active left-list card.
  const activeCardBlob = firstNonEmpty(
    document.querySelector(".jobs-search-results-list__list-item--active")?.innerText,
    document.querySelector(".jobs-search-results__list-item--active")?.innerText,
    document.querySelector(".job-card-list--is-active")?.innerText
  );

  let work_mode = "";
  const workBlob = firstNonEmpty(explicitWorkModeText, chipBlob, locLine, headerBlob, activeCardBlob).toLowerCase();
  if (workBlob.includes("hybrid")) work_mode = "Hybrid";
  else if (workBlob.includes("on-site") || workBlob.includes("onsite")) work_mode = "On-site";
  else if (workBlob.includes("remote")) work_mode = "Remote";
  else if (locLine.toLowerCase().includes("(hybrid)")) work_mode = "Hybrid";
  else if (locLine.toLowerCase().includes("(on-site)")) work_mode = "On-site";
  else if (locLine.toLowerCase().includes("(remote)")) work_mode = "Remote";

  if (work_mode === "Remote" && (chipBlob.includes("on-site") || chipBlob.includes("onsite"))) work_mode = "Hybrid";
  if (work_mode === "On-site" && chipBlob.includes("remote")) work_mode = "Hybrid";

  return {
    data: { role_title: title, company_name: company, location, job_type, work_mode },
    confidence: {
      role_title: title ? "high" : "low",
      company_name: company ? "high" : "low",
      location: location ? "high" : "low",
      job_type: job_type ? (chips ? "high" : "medium") : "low",
      work_mode: work_mode ? (chips ? "high" : "medium") : "low"
    },
    sources: {
      role_title: "li:dom:h1",
      company_name: "li:dom:company",
      location: "li:dom:topcard_split_dot",
      job_type: chips ? "li:dom:chips" : "li:dom:header_fallback",
      work_mode: chips ? "li:dom:chips" : "li:dom:header_fallback"
    }
  };
}

function internshalaAdapter() {
  const title = firstNonEmpty(
    document.querySelector("h1.heading_2_4")?.innerText,
    document.querySelector("h1")?.innerText
  );

  const company = firstNonEmpty(
    document.querySelector(".company .heading_6")?.innerText,
    document.querySelector(".company_name")?.innerText
  );

  const location = firstNonEmpty(
    document.querySelector(".location_link")?.innerText,
    document.querySelector(".individual_internship_details .location")?.innerText
  );

  const tagBlob = cleanText(document.querySelector(".tags_container_outer")?.innerText || "");
  const job_type = normalizeJobType(tagBlob);
  const modeBlob = firstNonEmpty(
    location,
    document.querySelector(".individual_internship_details")?.innerText,
    document.querySelector(".text-container")?.innerText,
    tagBlob
  );
  const work_mode = normalizeWorkMode(modeBlob);

  return {
    data: { role_title: title, company_name: company, location, job_type, work_mode },
    confidence: {
      role_title: title ? "high" : "low",
      company_name: company ? "high" : "low",
      location: location ? "high" : "low",
      job_type: job_type ? "medium" : "low",
      work_mode: work_mode ? "medium" : "low"
    },
    sources: {
      role_title: "internshala:h1",
      company_name: "internshala:company",
      location: "internshala:location",
      job_type: "internshala:tags",
      work_mode: "internshala:details_blob"
    }
  };
}

function indeedAdapter() {
  function extractIndeedFields() {
    let roleTitle = "";
    let location = "";

    // 1) Best: explicit label-value extraction from JD section
    roleTitle = extractLabeledValue(/^job title\s*:?/i);

    // 2) Fallback title from heading
    if (!roleTitle) {
      const h1 = document.querySelector("h1");
      roleTitle = normalizeSpaces(h1?.innerText || "");
    }

    // 3) Final fallback from document.title
    if (!roleTitle) {
      roleTitle = normalizeSpaces(document.title || "");
    }

    // Location: prefer header/company location first (more reliable than JD blob)
    location = firstNonEmpty(
      document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.innerText,
      document.querySelector('[data-testid="job-location"]')?.innerText
    );
    if (!location) {
      location = extractLabeledValue(/^location\s*:?/i);
    }

    roleTitle = cleanRoleTitle(roleTitle);
    location = cleanLocation(location);

    // Hard guard against bad structured captures
    roleTitle = guardStructuredField(roleTitle, 150);
    location = guardStructuredField(location, 80);

    // Guard: if location accidentally matches title, drop it
    const titleLow = (roleTitle || "").toLowerCase();
    const locLow = (location || "").toLowerCase();
    if (location && (locLow === titleLow || titleLow.includes(locLow) || locLow.includes(titleLow))) {
      location = "";
    }

    return {
      role_title: roleTitle,
      location: location,
    };
  }

  function isLikelyIndeedTitle(v) {
    const t = cleanText(v);
    if (!t) return false;
    const low = t.toLowerCase();
    if (low.includes("job title")) return false;
    if (low.includes("shift available")) return false;
    if (low.includes("paid time off")) return false;
    if (low.includes("easy apply")) return false;
    if (low.includes("hiring multiple candidates")) return false;
    if (t.length < 3 || t.length > 120) return false;
    return /[a-z]/i.test(t);
  }

  const extracted = extractIndeedFields();

  const titleCandidates = [
    document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.innerText,
    document.querySelector('[data-testid="viewJobTitle"]')?.innerText,
    document.querySelector("#viewJobSSRRoot h1")?.innerText,
    document.querySelector("#viewJobSSRRoot h2")?.innerText,
    document.querySelector(".jobsearch-JobInfoHeader-title")?.innerText,
    document.querySelector("h1")?.innerText,
    document.querySelector("h2")?.innerText,
    // selected card title fallback
    document.querySelector('[data-testid="slider_item"] [data-testid="jobTitle"]')?.innerText,
    document.querySelector(".job_seen_beacon h2 a span")?.innerText
  ];

  let title = extracted.role_title || "";
  if (!title) {
    for (const c of titleCandidates) {
      if (isLikelyIndeedTitle(c)) {
        title = cleanText(c);
        break;
      }
    }
    title = guardStructuredField(cleanRoleTitle(title), 150);
  }

  const descText = cleanText(document.querySelector("#jobDescriptionText")?.innerText || "");

  const company = firstNonEmpty(
    document.querySelector('[data-testid="inlineHeader-companyName"]')?.innerText,
    document.querySelector('[data-testid="companyName"]')?.innerText,
    document.querySelector("#viewJobSSRRoot [data-testid='company-name']")?.innerText,
    descText.match(/Company:\s*([^\n\r]+)/i)?.[1]
  );

  let location = extracted.location || "";
  if (!location) {
    location = firstNonEmpty(
      document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.innerText,
      document.querySelector('[data-testid="job-location"]')?.innerText,
      descText.match(/Location:\s*([^\n\r]+)/i)?.[1]
    );
    location = guardStructuredField(cleanLocation(location), 80);
  }

  const jobTypeBlob = firstNonEmpty(
    document.querySelector('[aria-label="Job type"]')?.innerText,
    document.querySelector('[data-testid="jobsearch-JobInfoHeader-container"]')?.innerText
  );

  let work_mode = "";
  const pageBlob = (document.body?.innerText || "").toLowerCase();
  if (pageBlob.includes("\nremote\n") || pageBlob.includes(" remote ")) work_mode = "Remote";

  return {
    data: {
      role_title: title,
      company_name: company,
      location,
      job_type: normalizeJobType(jobTypeBlob || "Internship"),
      work_mode: normalizeWorkMode(work_mode)
    },
    confidence: {
      role_title: title ? "high" : "low",
      company_name: company ? "high" : "low",
      location: location ? "high" : "low",
      job_type: "high",
      work_mode: work_mode ? "medium" : "low"
    },
    sources: {
      role_title: "indeed:dom:title",
      company_name: "indeed:dom:company",
      location: "indeed:dom:location",
      job_type: "indeed:dom:jobtype",
      work_mode: "indeed:heuristic"
    }
  };
}

function wellfoundAdapter() {
  function fromSlugTitle() {
    try {
      const p = window.location.pathname || "";
      const m = p.match(/job_listing_slug-([^/?#]+)/i);
      if (!m?.[1]) return "";
      return cleanText(m[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
    } catch {
      return "";
    }
  }

  function extractCompanyFromHero() {
    const hero = Array.from(document.querySelectorAll("h1, h2, h3, div, span"))
      .map((n) => cleanText(n.innerText))
      .find((t) => t && /actively hiring/i.test(t));
    if (!hero) return "";
    return cleanText(hero.replace(/Actively Hiring/ig, "").replace(/[•·]/g, " "));
  }

  const ogTitle = cleanText(document.querySelector('meta[property="og:title"]')?.content || "");
  const rawTitle = firstNonEmpty(
    document.querySelector("main h2")?.innerText,
    document.querySelector("main h1")?.innerText,
    document.querySelector("[data-testid='job-title']")?.innerText,
    document.querySelector("h1")?.innerText,
    ogTitle.split("|")[0],
    fromSlugTitle()
  );

  let title = cleanText(rawTitle);
  let company = "";

  if (/ at /i.test(title)) {
    const parts = title.split(/\s+at\s+/i);
    title = cleanText(parts[0]);
    company = cleanText(parts.slice(1).join(" at "));
  }

  if (!title || /^(startup jobs|search for jobs)$/i.test(title)) {
    title = firstNonEmpty(
      document.querySelector("main h2")?.innerText,
      document.querySelector("main h1")?.innerText,
      fromSlugTitle()
    );
  }

  company = firstNonEmpty(
    company,
    extractCompanyFromHero(),
    document.querySelector("a[href^='/company/']")?.innerText,
    document.querySelector("a[href^='/companies/']")?.innerText,
    document.querySelector("[data-testid='company-name']")?.innerText,
    ogTitle.match(/ at ([^|]+)/i)?.[1]
  );

  const pageText = document.body?.innerText || "";

  const location = firstNonEmpty(
    extractLabeledValueExact("Job Location"),
    extractLabeledValueExact("Location"),
    document.querySelector("a[href^='/location/']")?.innerText,
    pageText.match(/\bLocation:\s*([^\n\r]+)/i)?.[1]
  );

  const job_type = normalizeJobType(firstNonEmpty(
    document.querySelector("main")?.innerText.match(/\b(Internship|Full[-\s]?time|Part[-\s]?time|Contract)\b/i)?.[1],
    extractLabeledValueExact("Job type"),
    pageText.match(/\bEmployment Type:\s*([^\n\r]+)/i)?.[1],
    pageText.match(/\bJob type:\s*([^\n\r]+)/i)?.[1]
  ));

  const work_mode = normalizeWorkMode(firstNonEmpty(
    extractLabeledValueExact("Remote work policy"),
    pageText.match(/\bRemote work policy:\s*([^\n\r]+)/i)?.[1]
  ));

  return {
    data: {
      role_title: title,
      company_name: cleanCompanyName(company),
      location,
      job_type,
      work_mode
    },
    confidence: {
      role_title: title ? "high" : "low",
      company_name: company ? "high" : "low",
      location: location ? "high" : "low",
      job_type: job_type ? "high" : "low",
      work_mode: work_mode ? "high" : "low"
    },
    sources: {
      role_title: "wellfound:title",
      company_name: "wellfound:company",
      location: "wellfound:label_location",
      job_type: "wellfound:label_job_type",
      work_mode: "wellfound:label_remote_policy"
    }
  };
}

function googleCareersAdapter() {
  const title = firstNonEmpty(
    document.querySelector("h2.p1N2lc")?.innerText,
    document.querySelector("h1")?.innerText
  );

  const company = firstNonEmpty(
    document.querySelector("span.RPZSMd")?.innerText,
    "Google"
  );

  let location = "";
  const placeIcon = Array.from(document.querySelectorAll("i.google-material-icons"))
    .find((i) => cleanText(i.innerText) === "place");

  if (placeIcon) {
    const container = placeIcon.closest("span")?.parentElement;
    const locSpan = container?.querySelector("span.r0wI0f");
    location = cleanText(locSpan?.innerText || "");
  }

  return {
    data: { role_title: title, company_name: company, location },
    confidence: {
      role_title: title ? "high" : "low",
      company_name: "high",
      location: location ? "high" : "low"
    },
    sources: {
      role_title: "googlecareers:h2",
      company_name: "googlecareers:company",
      location: "googlecareers:place_icon_anchor"
    }
  };
}

// =========================
// Adapter dispatcher
// =========================
function runAdapters(host) {
  const h = host || "";

  if (h.includes("linkedin.com")) return linkedInAdapter();
  if (h.endsWith(".indeed.com") || h === "indeed.com") return indeedAdapter();
  if (h.includes("wellfound.com")) return wellfoundAdapter();
  if (h.includes("internshala.com")) return internshalaAdapter();
  if (h.includes("google.com") && h.includes("careers")) return googleCareersAdapter();

  return null;
}

// =========================
// Merge logic
// =========================
function merge(base, patch) {
  if (!patch) return base;

  const out = JSON.parse(JSON.stringify(base));

  for (const key of ["role_title", "company_name", "location", "job_type", "work_mode"]) {
    const newVal = cleanText(patch.data?.[key] || "");
    if (!newVal) continue;

    const oldVal = cleanText(out.data?.[key] || "");
    const oldConf = out.confidence?.[key] || "low";
    const newConf = patch.confidence?.[key] || "low";

    const allow = !oldVal || shouldOverride(oldConf, newConf);
    if (allow) {
      out.data[key] = newVal;
      out.confidence[key] = newConf;
      out.sources[key] = patch.sources?.[key] || "unknown";
    }
  }

  out.data.company_name = cleanCompanyName(out.data.company_name);
  out.data.role_title = guardStructuredField(cleanRoleTitle(out.data.role_title), 150);
  out.data.location = guardStructuredField(cleanLocation(out.data.location), 80);
  out.data.job_type = normalizeJobType(out.data.job_type);
  out.data.work_mode = normalizeWorkMode(out.data.work_mode);

  const titleLow = (out.data.role_title || "").toLowerCase();
  const locLow = (out.data.location || "").toLowerCase();
  if (out.data.location && (locLow === titleLow || titleLow.includes(locLow) || locLow.includes(titleLow))) {
    out.data.location = "";
  }

  return out;
}

// =========================
// Main capture pipeline
// =========================
function captureAll() {
  const safe = captureSafeMeta();
  const jsonld = captureJsonLdJobPosting();
  const adapter = runAdapters(location.hostname);

  let merged = safe;
  if (jsonld) merged = merge(merged, jsonld);
  if (adapter) merged = merge(merged, adapter);

  if (merged.data.location && merged.data.location.length > 80) {
    merged.data.location = "";
  }

  if (
    merged.data.location &&
    /dear candidate|role overview|key responsibilities|deadline|form link/i.test(merged.data.location)
  ) {
    merged.data.location = "";
  }

  return merged;
}

// =========================
// Messaging: Popup -> Content
// =========================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "CAPTURE") {
    try {
      const result = captureAll();
      sendResponse({
        ok: true,
        data: result.data,
        debug: { confidence: result.confidence, sources: result.sources }
      });
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
  }
});
