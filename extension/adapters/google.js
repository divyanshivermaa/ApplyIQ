// extension/adapters/google.js

function runGoogleCareersAdapter(data) {
    if (!window.location.hostname.includes("google.com")) return data;

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

    // -------- ROLE TITLE --------
    const titleEl = document.querySelector("h2");
    if (titleEl) {
        out.role_title = titleEl.innerText.trim();
        out.confidence.role_title = "high";
        out.sources.role_title = "google_h2";
    }

    // -------- COMPANY --------
    out.company_name = "Google";
    out.confidence.company_name = "high";
    out.sources.company_name = "google_static";

    // -------- LOCATION (Google Careers: anchor to "place" icon) --------
    const iconEls = Array.from(document.querySelectorAll("i, span, div"));

    // "place" icon ke paas jo text hai wahi location hota hai
    const placeIcon = iconEls.find(el => (el.innerText || "").trim().toLowerCase() === "place");

    if (placeIcon) {
        // icon ke parent ke andar location text hota hai
        const parent = placeIcon.closest("span, div");
        if (parent) {
            const txt = parent.innerText.replace(/\bplace\b/i, "").trim();

            // safety: numeric ya weird values reject
            const hasLetters = /[a-zA-Z]/.test(txt);
            const notNumeric = !/^\d{1,3}(,\d{3})*$/.test(txt);

            if (txt && hasLetters && notNumeric) {
                out.location = txt;
                out.confidence.location = "high";
                out.sources.location = "google_place_icon";
            }
        }
    }

    // -------- JOB TYPE --------
    const text = document.body.innerText.toLowerCase();

    if (text.includes("full time")) {
        out.job_type = "Full-time";
        out.confidence.job_type = "medium";
        out.sources.job_type = "google_text_scan";
    }

    if (text.includes("intern")) {
        out.job_type = "Internship";
        out.confidence.job_type = "medium";
        out.sources.job_type = "google_text_scan";
    }

    // -------- WORK MODE --------
    if (text.includes("remote")) {
        out.work_mode = "Remote";
        out.confidence.work_mode = "medium";
        out.sources.work_mode = "google_text_scan";
    } else if (text.includes("hybrid")) {
        out.work_mode = "Hybrid";
        out.confidence.work_mode = "medium";
        out.sources.work_mode = "google_text_scan";
    } else if (text.includes("in office")) {
        out.work_mode = "On-site";
        out.confidence.work_mode = "medium";
        out.sources.work_mode = "google_text_scan";
    }

    return mergeAdapterData(data, out);
}
