// simple Hindi: sabse safe layer - meta + title + url + selected text
import { cleanCompanyName } from "../utils/normalize.js";

export function captureSafeMeta() {
  const url = window.location.href;

  const canonical =
    document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "";

  const ogTitle = document.querySelector('meta[property="og:title"]')?.content || "";
  const twTitle = document.querySelector('meta[name="twitter:title"]')?.content || "";
  const docTitle = (document.title || "").replace(/\(\d+\)\s*LinkedIn/ig, "").trim();

  let roleTitle = ogTitle || twTitle || docTitle;
  let roleConf = ogTitle || twTitle ? "high" : roleTitle ? "medium" : "low";
  let roleSrc = ogTitle ? "meta:og:title" : twTitle ? "meta:twitter:title" : "document.title";

  // If Indeed feed title, don't use it as role title
  if (/Job Search/i.test(roleTitle) && location.hostname.includes("indeed.com")) {
    roleTitle = "";
    roleConf = "none";
    roleSrc = "blocked:indeed_feed_title";
  }

  const ogDesc = document.querySelector('meta[property="og:description"]')?.content || "";
  const desc = document.querySelector('meta[name="description"]')?.content || "";
  const metaDesc = ogDesc || desc;

  const selectedText = window.getSelection()?.toString()?.trim() || "";

  return {
    url,
    canonical_url: canonical,
    platform: location.hostname,
    role_title: roleTitle,
    company_name: "",
    location: "",
    job_type: "",
    work_mode: "",
    selectedText,

    title: roleTitle, // you had "title" in sources earlier
    confidence: {
      role_title: roleConf,
      company_name: "low",
      location: "low",
      job_type: "low",
      work_mode: "low",
      selectedText: selectedText ? "high" : "none"
    },
    sources: {
      role_title: roleSrc,
      company_name: "meta/company",
      location: "meta/location",
      job_type: "meta/job_type",
      work_mode: "meta/work_mode",
      selectedText: selectedText ? "user-selection" : "none"
    },
    meta_description: metaDesc
  };
}
