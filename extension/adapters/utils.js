// extension/adapters/utils.js

function norm(s) {
    return (s || "").replace(/\s+/g, " ").trim();
}

function getElementText(selector) {
    return norm(document.querySelector(selector)?.innerText);
}

function shouldOverride(oldConf, newConf) {
    const rank = { low: 1, medium: 2, high: 3 };
    return (rank[newConf] || 0) > (rank[oldConf] || 0);
}

function cleanCompanyName(name) {
    if (!name) return "";
    return name
        .replace(/Actively Hiring/gi, "")
        .replace(/Urgently Hiring/gi, "")
        .replace(/\bHiring\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeJobType(s) {
    const t = (s || "").toLowerCase();
    if (t.includes("intern")) return "Internship";
    if (t.includes("full")) return "Full-time";
    if (t.includes("part")) return "Part-time";
    if (t.includes("contract")) return "Contract";
    return s;
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

// Make functions available globally
window.norm = norm;
window.getElementText = getElementText;
window.shouldOverride = shouldOverride;
window.cleanCompanyName = cleanCompanyName;
window.normalizeJobType = normalizeJobType;
window.normalizeWorkMode = normalizeWorkMode;
window.cleanLocation = cleanLocation;
