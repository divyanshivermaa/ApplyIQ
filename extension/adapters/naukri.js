// extension/adapters/naukri.js
function adaptNaukri() {
    return {
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
        source: "adapter:naukri",
    };
}
