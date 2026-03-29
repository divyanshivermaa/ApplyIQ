// extension/adapters/wellfound.js

function pickFirst(selectors, root = document) {
    for (const sel of selectors) {
        const el = root.querySelector(sel);
        const t = norm(el?.innerText);
        if (t) return t;
    }
    return "";
}

function findLocationFromLinks(root = document) {
    // Hindi: /location/... wali link se location nikal rahe hain (ye stable hota hai)
    const a = root.querySelector('a[href^="/location/"]');
    return norm(a?.innerText);
}

function findWorkModeBySection(root = document) {
    // Hindi: "Remote Work Policy" title ke paas wala text
    const headings = Array.from(root.querySelectorAll("h2, h3, div, p"))
        .map(el => ({ el, t: norm(el.innerText) }))
        .filter(x => x.t);

    const idx = headings.findIndex(x => /remote work policy/i.test(x.t));
    if (idx === -1) return "";

    // next 1-3 nodes me value aati hai
    for (let k = idx + 1; k <= Math.min(idx + 4, headings.length - 1); k++) {
        const v = headings[k].t;
        if (v && v.length <= 60) return v;
    }
    return "";
}

function parseJobTypeFromMetaLine(root = document) {
    // Hindi: title ke niche wali line often "₹.. | Mumbai | 2 years | Full Time"
    // We'll find a text block with pipes and pick token matching type.
    const candidates = Array.from(root.querySelectorAll("li, div, span"))
        .map(el => norm(el.innerText))
        .filter(t => t.includes("|") && t.length < 120);

    const blob = candidates.join(" || ").toLowerCase();

    if (blob.includes("full time") || blob.includes("full-time")) return "Full-time";
    if (blob.includes("part time") || blob.includes("part-time")) return "Part-time";
    if (blob.includes("intern")) return "Internship";
    if (blob.includes("contract")) return "Contract";

    return "";
}

function adaptWellfound() {
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
        source: "adapter:wellfound",
    };

    // The job opens in a modal/panel; we can scope to the largest visible dialog-like container
    const root =
        document.querySelector('[role="dialog"]') ||
        document.querySelector("main") ||
        document;

    // 1) Title (modal h1)
    const title = pickFirst(
        [
            'h1[class*="text-xl"]',
            "h1",
        ],
        root
    );
    if (title && !/startup jobs/i.test(title)) {
        out.role_title = title;
        out.confidence.role_title = "high";
    }

    // 2) Location from /location/ link
    const loc = findLocationFromLinks(root);
    if (loc) {
        out.location = loc;
        out.confidence.location = "high";
    }

    // 3) Company name
    // Prefer company link if present (/company/...), else take first strong header text above title
    const companyLink = root.querySelector('a[href^="/company/"]');
    const companyFromLink = norm(companyLink?.innerText);

    if (companyFromLink && companyFromLink.length > 1) {
        // Hindi comment:
        // "Actively Hiring", "Top 1% of responders" jaise badge words hata rahe hain
        let cleaned = companyFromLink
            .replace(/actively hiring/ig, "")
            .replace(/top\s*\d+%.*?/ig, "")
            .replace(/growing fast/ig, "")
            .trim();

        // extra safety: double spaces remove
        cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

        out.company_name = cleaned;
        out.confidence.company_name = "high";
    } else {
        // fallback: look for the company name near the top (usually above title)
        const headerTexts = Array.from(root.querySelectorAll("div, a, span"))
            .map(el => norm(el.innerText))
            .filter(t => t && t.length > 1 && t.length < 40);

        // Heuristic: first text that is not title and not common words
        const bad = new Set(["actively hiring", "share", "save"]);
        const pick = headerTexts.find(t => !bad.has(t.toLowerCase()) && t !== out.role_title);

        if (pick) {
            out.company_name = pick;
            out.confidence.company_name = "medium";
        }
    }

    // 4) Job type from meta line with pipes
    const jt = parseJobTypeFromMetaLine(root);
    if (jt) {
        out.job_type = jt;
        out.confidence.job_type = "high";
    }

    // 5) Work mode from "Remote Work Policy"
    const wmRaw = findWorkModeBySection(root);
    if (wmRaw) {
        // Normalize into Remote/Hybrid/On-site if possible
        const low = wmRaw.toLowerCase();
        if (low.includes("remote")) out.work_mode = "Remote";
        else if (low.includes("hybrid") || low.includes("wfh")) out.work_mode = "Hybrid";
        else if (low.includes("office") || low.includes("in office")) out.work_mode = "On-site";
        else out.work_mode = wmRaw;

        out.confidence.work_mode = "medium";
    }

    return out;
}
