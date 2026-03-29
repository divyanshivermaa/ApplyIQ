// simple Hindi: JSON-LD me JobPosting dhoondo
export function captureJsonLdJobPosting() {
  const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  if (!scripts.length) return null;

  function tryParse(jsonText) {
    try { return JSON.parse(jsonText); } catch { return null; }
  }

  // simple Hindi: JSON-LD kabhi array me bhi aata hai
  const all = [];
  for (const s of scripts) {
    const obj = tryParse(s.textContent || "");
    if (!obj) continue;
    if (Array.isArray(obj)) all.push(...obj);
    else all.push(obj);
  }

  // helper: @graph handle
  const expanded = [];
  for (const item of all) {
    if (item && item["@graph"] && Array.isArray(item["@graph"])) {
      expanded.push(...item["@graph"]);
    }
  }

  const job = expanded.find(x => {
    const t = x?.["@type"];
    if (!t) return false;
    if (Array.isArray(t)) return t.includes("JobPosting");
    return t === "JobPosting";
  });

  if (!job) return null;

  const title = job.title || "";
  const company = job.hiringOrganization?.name || "";
  const empType = job.employmentType || "";
  const locObj = job.jobLocation?.[0]?.address || {};

  // simple Hindi: location object ko string me convert
  let location = "";
  if (typeof locObj === "string") location = locObj;
  else if (locObj) {
    const parts = [
      locObj.addressLocality,
      locObj.addressRegion,
      locObj.addressCountry
    ].filter(Boolean);
    location = parts.join(", ");
  }

  return {
    role_title: title,
    company_name: company,
    location,
    job_type: empType,
    work_mode: "",
    confidence: {
      role_title: title ? "high" : "none",
      company_name: company ? "high" : "none",
      location: location ? "high" : "none",
      job_type: empType ? "high" : "none",
      work_mode: "none"
    },
    sources: {
      role_title: "jsonld:JobPosting.title",
      company_name: "jsonld:JobPosting.hiringOrganization.name",
      location: "jsonld:JobPosting.jobLocation.address",
      job_type: "jsonld:JobPosting.employmentType",
      work_mode: "none"
    }
  };
}
