// extension/adapters/microsoft.js

const msTxt = (el) => (el?.innerText || el?.textContent || "").replace(/\s+/g, " ").trim();

function msValueByLabel(root, labelText) {
    // finds value near label like "Work site" / "Employment type"
    const all = Array.from(root.querySelectorAll("div, span, p"));
    for (const n of all) {
        if (msTxt(n) === labelText) {
            const parent = n.parentElement;
            if (!parent) continue;

            // try within same parent first
            const parts = Array.from(parent.querySelectorAll("div, span, p"))
                .map(msTxt)
                .filter(Boolean);

            const val = parts.find((v) => v !== labelText);
            if (val) return val;

            // fallback: sibling
            const sib = n.nextElementSibling;
            if (sib && msTxt(sib)) return msTxt(sib);
        }
    }
    return "";
}

function msPickTitle(root) {
    // avoid generic "Jobs"
    const bad = new Set(["Jobs", "Careers", "Search"]);
    const heads = Array.from(root.querySelectorAll("h1, h2, [role='heading']"))
        .map((el) => msTxt(el))
        .filter((t) => t.length >= 8 && !bad.has(t));

    return heads[0] || "";
}

function normalizeMsLoc(s) {
    return (s || "")
        .replace(/\[object Object\]/g, "")
        .replace(/\s+,/g, ",")
        .replace(/,\s+,/g, ", ")
        .replace(/\s+/g, " ")
        .trim();
}

async function runMicrosoftAdapter(data) {
    const isMicrosoft =
        location.hostname.includes("apply.careers.microsoft.com") ||
        location.hostname.includes("careers.microsoft.com");
    if (!isMicrosoft) return data;

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
        sources: {}
    };

    // MS is SPA => panel loads late => retry
    for (let i = 0; i < 5; i++) {
        const root = document.querySelector("main") || document.body;

        // Title (ignore "Jobs")
        const t = msPickTitle(root);
        if (t && t !== "Jobs") {
            out.role_title = t;
            out.confidence.role_title = "high";
            out.sources.role_title = "ms_adapter_title";
        }

        // Company (simple)
        out.company_name = "Microsoft";
        out.confidence.company_name = "high";
        out.sources.company_name = "ms_static";

        // Location: best source is the location line near top (often contains commas)
        const locCandidates = Array.from(root.querySelectorAll("span, div, p"))
            .map(msTxt)
            .filter((x) => x.includes(",") && /[A-Za-z]/.test(x) && x.length < 60);

        const loc = normalizeMsLoc(locCandidates[0] || "");
        if (loc) {
            out.location = loc;
            out.confidence.location = "high";
            out.sources.location = "ms_adapter_loc";
        }

        // Employment type -> Job Type
        const emp = msValueByLabel(root, "Employment type");
        const jt = normalizeJobType(emp);
        if (jt) {
            out.job_type = jt;
            out.confidence.job_type = "high";
            out.sources.job_type = "ms_adapter_jt";
        }

        // Work site -> Work Mode
        const ws = msValueByLabel(root, "Work site");
        const wm = normalizeWorkMode(ws);
        if (wm) {
            out.work_mode = wm;
            out.confidence.work_mode = "high";
            out.sources.work_mode = "ms_adapter_wm";
        }

        // break condition: title fixed + location not broken
        if (out.role_title && out.role_title !== "Jobs" && out.location && !out.location.includes("[object Object]")) {
            break;
        }
        await sleep(350);
    }

    return mergeAdapterData(data, out);
}
