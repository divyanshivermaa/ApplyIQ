import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import ErrorBox from "../components/ErrorBox";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { listApplications, createApplication, addStage, deleteApplication, updateApplication } from "../api/applications";
import { safeText } from "../utils/uiHelpers";
import useResumeSlotCount from "../hooks/useResumeSlotCount";

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [stageSelections, setStageSelections] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const {
    resumeSlotCount,
    setResumeSlotCount,
    slotOptions,
    MIN_COUNT,
    MAX_COUNT,
  } = useResumeSlotCount();

  const [resumeInput, setResumeInput] = useState(String(resumeSlotCount));

  // modal
  const [open, setOpen] = useState(false);

  // create form
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [platform, setPlatform] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [resumeVersion, setResumeVersion] = useState("1");


  async function load() {
    setErr("");
    setLoading(true);
    try {
      const [appsData] = await Promise.all([listApplications()]);
      const nextApps = Array.isArray(appsData) ? appsData : [];
      setApps(nextApps);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const selected = Number(resumeVersion);
    if (selected > resumeSlotCount) {
      setResumeVersion("1");
    }
  }, [resumeSlotCount, resumeVersion]);

  useEffect(() => {
    setResumeInput(String(resumeSlotCount));
  }, [resumeSlotCount]);


  useEffect(() => {
    if (!apps || apps.length === 0) return;
    const initialStages = {};
    apps.forEach((app) => {
      initialStages[app.id] = app.current_stage || "CAPTURED";
    });
    setStageSelections(initialStages);
  }, [apps]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return apps;
    return apps.filter((a) => {
      const hay = `${a.company_name || ""} ${a.role_title || ""} ${a.platform || ""}`.toLowerCase();
      return hay.includes(t);
    });
  }, [apps, q]);

  async function onCreate() {
    setErr("");
    setMsg("");
    if (!company.trim() || !role.trim()) {
      setErr("Company and Role are required.");
      return;
    }
    if (!jobUrl.trim()) {
      setErr("Job URL is required (backend rule). Paste the job link.");
      return;
    }
    try {
      const payload = {
        company_name: company.trim(),
        role_title: role.trim(),
        platform: platform.trim() || "UNKNOWN",
        job_url: jobUrl.trim(),
        current_stage: "CAPTURED",
        resume_slot: Number(resumeVersion), // 1 / 2 / 3
      };

      await createApplication(payload);

      setMsg("Application created ✅");
      setOpen(false);

      // reset
      setCompany("");
      setRole("");
      setPlatform("");
      setJobUrl("");
      setResumeVersion("1");

      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function handleAddStage(appId) {
    setErr("");
    setMsg("");
    try {
      const selectedStage = stageSelections[appId];
      if (!selectedStage) return;
      await addStage(appId, { stage: selectedStage });
      setMsg(`Stage added ✅ ${selectedStage}`);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function handleDeleteApplication(appId) {
    const ok = window.confirm("Remove this application?");
    if (!ok) return;

    try {
      await deleteApplication(appId);
      setApps((prev) => prev.filter((item) => item.id !== appId));
      setStageSelections((prev) => {
        const next = { ...prev };
        delete next[appId];
        return next;
      });
    } catch (err) {
      alert("Could not delete application");
    }
  }

  function startEdit(app) {
    setEditingId(app.id);
    setEditForm({
      company_name: app.company_name || "",
      role_title: app.role_title || "",
      platform: app.platform || "",
      job_url: app.job_url || "",
      resume_slot: app.resume_slot ?? "",
      current_stage: app.current_stage || "CAPTURED",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function handleSaveEdit(appId) {
    try {
      const payload = {
        current_stage: editForm.current_stage,
      };

      if (editForm.company_name !== "") payload.company_name = editForm.company_name;
      if (editForm.role_title !== "") payload.role_title = editForm.role_title;
      if (editForm.platform !== "") payload.platform = editForm.platform;
      if (editForm.job_url !== "") payload.job_url = editForm.job_url;

      if (editForm.resume_slot !== "" && editForm.resume_slot !== null) {
        payload.resume_slot = Number(editForm.resume_slot);
      }

      const updated = await updateApplication(appId, payload);
      setApps((prev) => prev.map((item) => (item.id === appId ? updated : item)));
      setStageSelections((prev) => ({
        ...prev,
        [appId]: updated.current_stage || prev[appId] || "CAPTURED",
      }));
      cancelEdit();
    } catch (err) {
      alert(err?.message || "Could not update application");
    }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold text-gray-800 dark:text-wine-50">Applications</div>
            <div className="text-sm text-gray-500 dark:text-wine-200/80 mt-1">
              Add manually (for A/B resume analytics) + view captured apps.
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 dark:bg-wine-600 dark:hover:bg-wine-500"
            onClick={() => setOpen(true)}
          >
            + Add Application
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <ErrorBox message={err} />
          {msg ? (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">{msg}</div>
          ) : null}
        </div>

        <div className="mt-4">
          <input
            className="w-full md:w-96 border rounded-xl px-3 py-2 bg-white text-gray-800 dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
            placeholder="Search company / role / platform"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-wine-800 dark:bg-[#1a1116]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-base font-semibold text-gray-800 dark:text-wine-50">
                Resume Slot Settings
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-wine-200/80">
                Choose how many resume slots you want to maintain for A/B testing and tracking.
              </div>
            </div>

            <div className="w-full md:w-64">
              <label className="text-sm text-gray-700 dark:text-wine-100">
                Number of Resume Slots
              </label>
              <input
                type="number"
                min={MIN_COUNT}
                max={MAX_COUNT}
                value={resumeInput}
                onChange={(e) => {
                  const val = e.target.value;

                  // allow empty (so backspace works)
                  setResumeInput(val);

                  // only update real state if valid number
                  if (val === "") return;

                  const num = Number(val);
                  if (Number.isNaN(num)) return;

                  if (num >= MIN_COUNT && num <= MAX_COUNT) {
                    setResumeSlotCount(num);
                  }
                }}
                onBlur={() => {
                  // fix invalid values when user leaves input
                  let num = Number(resumeInput);

                  if (Number.isNaN(num) || resumeInput === "") {
                    num = resumeSlotCount; // fallback
                  }

                  num = Math.min(Math.max(num, MIN_COUNT), MAX_COUNT);
                  setResumeSlotCount(num);
                  setResumeInput(String(num));
                }}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
              />
            </div>
          </div>
        </div>

        {loading && <LoadingState text="Loading applications..." />}

        {!loading && apps.length === 0 ? (
          <EmptyState
            title="No applications yet"
            subtitle="Capture a job or add an application to start tracking."
          />
        ) : null}

        {!loading && apps.length > 0 ? (
          <div className="mt-6 grid gap-3">
            {filtered.map((a) => (
              <div key={a.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md transition-colors dark:border-wine-800 dark:bg-[#1a1116]">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  {editingId === a.id ? (
                    <div className="w-full space-y-4">
                      <input
                        type="text"
                        value={editForm.company_name || ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, company_name: e.target.value }))
                        }
                        placeholder="Company name"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
                      />

                      <input
                        type="text"
                        value={editForm.role_title || ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, role_title: e.target.value }))
                        }
                        placeholder="Role title"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
                      />

                      <input
                        type="text"
                        value={editForm.platform || ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, platform: e.target.value }))
                        }
                        placeholder="Platform"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
                      />

                      <input
                        type="text"
                        value={editForm.job_url || ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, job_url: e.target.value }))
                        }
                        placeholder="Job URL"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
                      />

                      <select
                        value={editForm.resume_slot ?? ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, resume_slot: e.target.value }))
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
                      >
                        <option value="">Select Resume Slot</option>
                        {slotOptions.map((slot) => (
                          <option key={slot} value={String(slot)}>
                            Resume Slot {slot}
                          </option>
                        ))}
                      </select>

                      <select
                        value={editForm.current_stage || "CAPTURED"}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, current_stage: e.target.value }))
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
                      >
                        <option value="CAPTURED">CAPTURED</option>
                        <option value="APPLIED">APPLIED</option>
                        <option value="OA">OA</option>
                        <option value="INTERVIEW">INTERVIEW</option>
                        <option value="OFFER">OFFER</option>
                        <option value="REJECTED">REJECTED</option>
                        <option value="GHOSTED">GHOSTED</option>
                      </select>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSaveEdit(a.id)}
                          className="rounded-xl bg-wine-600 px-4 py-2 text-sm font-medium text-white hover:bg-wine-700"
                        >
                          Save
                        </button>

                        <button
                          onClick={cancelEdit}
                          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-wine-50">
                          {safeText(a.company_name)} - {cleanRoleTitleUI(a.role_title)}
                        </h3>

                        <p className="text-sm text-gray-600 dark:text-wine-200/80">
                          <span className="font-medium text-gray-700 dark:text-wine-100">Platform:</span>{" "}
                          {safeText(labelPlatform(a.platform))}
                          <span className="mx-2">•</span>
                          <span className="font-medium text-gray-700 dark:text-wine-100">Current Stage:</span>{" "}
                          {a.current_stage || "CAPTURED"}
                          <span className="mx-2">•</span>
                          <span className="font-medium text-gray-700 dark:text-wine-100">Work Mode:</span>{" "}
                          {safeText(extractWorkMode(a))}
                        </p>

                        <p className="text-sm text-gray-600 dark:text-wine-200/80">
                          <span className="font-medium text-gray-700 dark:text-wine-100">Resume Slot:</span>{" "}
                      {a.resume_slot ? `Resume ${a.resume_slot}` : "—"}
                        </p>

                        {a.job_url ? (
                          <a
                            href={a.job_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline dark:text-wine-300"
                          >
                            Open Application
                          </a>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 mr-2">
                          <button
                            onClick={() => startEdit(a)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-sm text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-200 dark:hover:bg-[#311621] dark:hover:text-wine-50"
                            title="Edit application"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDeleteApplication(a.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-base text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-200 dark:hover:bg-red-950 dark:hover:text-red-300"
                            title="Remove application"
                          >
                            ×
                          </button>
                        </div>
                        <select
                          value={stageSelections[a.id] ?? a.current_stage ?? "CAPTURED"}
                          onChange={(e) =>
                            setStageSelections((prev) => ({
                              ...prev,
                              [a.id]: e.target.value,
                            }))
                          }
                          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
                        >
                          <option value="CAPTURED">CAPTURED</option>
                          <option value="APPLIED">APPLIED</option>
                          <option value="OA">OA</option>
                          <option value="INTERVIEW">INTERVIEW</option>
                          <option value="OFFER">OFFER</option>
                          <option value="REJECTED">REJECTED</option>
                          <option value="GHOSTED">GHOSTED</option>
                        </select>

                        <button
                          onClick={() => handleAddStage(a.id)}
                          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100 dark:hover:bg-[#311621]"
                        >
                          Add Stage
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {filtered.length === 0 ? <div className="text-sm text-gray-500">No applications found.</div> : null}
          </div>
        ) : null}
      </div>

      {/* Modal */}
      {open ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg dark:bg-[#1a1116] dark:border dark:border-wine-800">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-800 dark:text-wine-50">Add Application</div>
                <div className="text-sm text-gray-500 dark:text-wine-200/80 mt-1">
                  Resume A/B/C assign karne ke liye resume_slot set hota hai (1/2/3).
                </div>
              </div>
              <button
                className="text-sm px-3 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-wine-700 dark:text-wine-100 dark:hover:bg-[#24131b]"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <Field label="Company *" value={company} onChange={setCompany} placeholder="e.g., Google" />
              <Field label="Role *" value={role} onChange={setRole} placeholder="e.g., Frontend Intern" />
              <Field label="Platform" value={platform} onChange={setPlatform} placeholder="e.g., linkedin.com" />
              <Field label="Job URL" value={jobUrl} onChange={setJobUrl} placeholder="https://..." />

              <div>
                <div className="text-sm text-gray-700 dark:text-wine-100">Resume Slot</div>
                <select
                  className="mt-1 w-full border rounded-xl px-3 py-2 bg-white text-gray-800 dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
                  value={resumeVersion}
                  onChange={(e) => setResumeVersion(e.target.value)}
                >
                  {slotOptions.map((slot) => (
                    <option key={slot} value={String(slot)}>
                      Resume {slot}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="mt-2 w-full rounded-xl bg-black text-white py-2 hover:opacity-90 dark:bg-wine-600 dark:hover:bg-wine-500"
                onClick={onCreate}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div className="text-sm text-gray-700 dark:text-wine-100">{label}</div>
      <input
        className="mt-1 w-full border rounded-xl px-3 py-2 bg-white text-gray-800 dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function labelPlatform(p) {
  if (!p || p === "UNKNOWN") return "Manual / Unknown";
  return p;
}

function cleanRoleTitleUI(value) {
  const text = safeText(value);
  return text
    .replace(/\s*-\s*Indeed\.com\s*$/i, "")
    .replace(/\s*-\s*Remote\s*-\s*Indeed\.com\s*$/i, "")
    .replace(/\s*-\s*Remote\s*$/i, "")
    .trim();
}

function extractWorkMode(app) {
  const fromLocation = String(app?.location || "").trim();
  if (fromLocation) {
    const cleaned = fromLocation
      .replace(/\s*\(as applicable\)\s*$/i, "")
      .split(/\s+Working Days\s*:/i)[0]
      .split(/\n/)[0]
      .trim();
    if (cleaned.length > 0 && cleaned.length <= 40) return cleaned;
  }

  const t = String(app?.role_title || "").toLowerCase();
  if (t.includes("remote")) return "Remote";
  if (t.includes("hybrid")) return "Hybrid";
  if (t.includes("on-site") || t.includes("onsite") || t.includes("on site")) return "On-site";
  return "—";
}
