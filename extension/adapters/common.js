// extension/adapters/common.js

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
    return "";
}

function normalizeWorkMode(s) {
    const t = (s || "").toLowerCase();
    if (t.includes("remote")) return "Remote";
    if (t.includes("hybrid")) return "Hybrid";
    if (t.includes("on-site") || t.includes("onsite")) return "On-site";
    return "";
}
