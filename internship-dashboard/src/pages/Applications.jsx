import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ErrorBox from "../components/ErrorBox";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { createApplication, addStage, deleteApplication, updateApplication } from "../api/applications";
import { safeText } from "../utils/uiHelpers";
import useResumeSlotCount from "../hooks/useResumeSlotCount";
import { queryKeys, useApplications, useInvalidateApplications } from "../hooks/queries";

function getDaysAgo(date) {
  if (!date) return 0;
  const diff = new Date() - new Date(date);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function Applications() {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("recent");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const queryClient = useQueryClient();
  const invalidateApplications = useInvalidateApplications();
  const { data: appsData, error: appsError, isLoading: loading } = useApplications(sortKey);
  const apps = useMemo(
    () => (Array.isArray(appsData) ? appsData : []),
    [appsData]
  );
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
  const [appliedAt, setAppliedAt] = useState("");
  const [resumeVersion, setResumeVersion] = useState("1");

  useEffect(() => {
    setErr(appsError?.message || "");
  }, [appsError]);

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
  const needsAttention = useMemo(
    () => filtered.filter((app) => app.is_overdue),
    [filtered]
  );
  const inProgress = useMemo(
    () =>
      filtered.filter(
        (app) =>
          !app.is_overdue &&
          !["REJECTED", "OFFER"].includes(app.current_stage || "CAPTURED")
      ),
    [filtered]
  );
  const completed = useMemo(
    () =>
      filtered.filter((app) =>
        ["REJECTED", "OFFER"].includes(app.current_stage || "CAPTURED")
      ),
    [filtered]
  );

  async function onCreate() {
    setErr("");
    setMsg("");
    if (!company.trim() || !role.trim()) {
      setErr("Company and Role are required.");
      return;
    }
    try {
      const payload = {
        company_name: company.trim(),
        role_title: role.trim(),
        platform: platform.trim() || "UNKNOWN",
        current_stage: "CAPTURED",
        resume_slot: Number(resumeVersion), // 1 / 2 / 3
      };
      if (jobUrl.trim()) payload.job_url = jobUrl.trim();
      if (appliedAt) payload.applied_at = appliedAt;

      await createApplication(payload);

      setCompany("");
      setRole("");
      setPlatform("");
      setJobUrl("");
      setAppliedAt("");
      setResumeVersion("1");

      setOpen(false);
      setMsg("Application created.");
      await invalidateApplications();
    } catch (e) {
      setErr(e.message || "Could not create application.");
    }
  }

  async function handleAddStage(appId) {
    setErr("");
    setMsg("");
    try {
      const selectedStage = stageSelections[appId];
      if (!selectedStage) return;
      await addStage(appId, { stage: selectedStage });
      setMsg(`Stage added: ${selectedStage}`);
      await invalidateApplications();
    } catch (e) {
      setErr(e.message || "Could not add the selected stage.");
    }
  }

  async function handleDeleteApplication(appId) {
    const ok = window.confirm("Remove this application?");
    if (!ok) return;

    try {
      await deleteApplication(appId);
      queryClient.setQueryData(queryKeys.applications(sortKey), (prev) =>
        Array.isArray(prev) ? prev.filter((item) => item.id !== appId) : prev
      );
      await invalidateApplications();
      setStageSelections((prev) => {
        const next = { ...prev };
        delete next[appId];
        return next;
      });
    } catch (err) {
      setErr(err?.message || "Could not delete application.");
    }
  }

  function startEdit(app) {
    setEditingId(app.id);
    setEditForm({
      company_name: app.company_name || "",
      role_title: app.role_title || "",
      platform: app.platform || "",
      job_url: app.job_url || "",
      location: extractWorkMode(app) === "-" ? "" : extractWorkMode(app),
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
      payload.job_url = editForm.job_url || null;
      payload.location = editForm.location || null;

      if (editForm.resume_slot !== "" && editForm.resume_slot !== null) {
        payload.resume_slot = Number(editForm.resume_slot);
      }

      const updated = await updateApplication(appId, payload);
      queryClient.setQueryData(queryKeys.applications(sortKey), (prev) =>
        Array.isArray(prev)
          ? prev.map((item) => (item.id === appId ? updated : item))
          : prev
      );
      await invalidateApplications();
      setStageSelections((prev) => ({
        ...prev,
        [appId]: updated.current_stage || prev[appId] || "CAPTURED",
      }));
      cancelEdit();
    } catch (err) {
      setErr(err?.message || "Could not update application.");
    }
  }

  function renderCard(a) {
    const daysAgo = getDaysAgo(a.date_applied);
    const stage = a.stage || a.current_stage;
    const isRecent = daysAgo <= 3;
    const isWaiting =
      daysAgo > 7 &&
      !a.is_overdue &&
      !["REJECTED", "OFFER"].includes(stage);
    const isInterview = stage === "INTERVIEW";
    const isStale = isWaiting;

    return (
      <div
        key={a.id}
        className={`rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md transition-colors dark:border-gray-800 dark:bg-gray-900/60 ${
          a.is_overdue ? "border-red-500 bg-red-50" : "border-gray-200"
        }`}
      >
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
                className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />

              <input
                type="text"
                value={editForm.role_title || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, role_title: e.target.value }))
                }
                placeholder="Role title"
                className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />

              <input
                type="text"
                value={editForm.platform || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, platform: e.target.value }))
                }
                placeholder="Platform"
                className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />

              <input
                type="text"
                value={editForm.job_url || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, job_url: e.target.value }))
                }
                placeholder="Job URL"
                className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />

              <select
                value={editForm.location || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, location: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              >
                <option value="">Select Work Mode</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>

              <select
                value={editForm.resume_slot ?? ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, resume_slot: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
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
                className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
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
                  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-900 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  Save
                </button>

                <button
                  onClick={cancelEdit}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {safeText(a.company_name)} - {cleanRoleTitleUI(a.role_title)}
                </h3>

                <div className="flex gap-2 flex-wrap mt-1">
                  {a.is_overdue && (
                    <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                      OVERDUE
                    </span>
                  )}

                  {isWaiting && (
                    <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">
                      WAITING
                    </span>
                  )}

                  {isRecent && (
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                      RECENT
                    </span>
                  )}

                  {isInterview && (
                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                      INTERVIEW
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-100">Platform:</span>{" "}
                  {safeText(labelPlatform(a.platform))}
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="font-medium text-gray-700 dark:text-gray-100">Work Mode:</span>{" "}
                  {safeText(extractWorkMode(a))}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-100">Date Applied:</span>{" "}
                  {formatDateShort(a.date_applied || a.created_at)}
                </p>
                {isStale && (
                  <p className="text-sm text-yellow-600 mt-1">
                    No update for {daysAgo} days
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Applied {getDaysAgo(a.date_applied || a.created_at)} days ago - no response yet
                </p>
                <span className="text-xs text-gray-400">
                  Resume Slot: {a.resume_slot ?? "Not set"}
                </span>

                {a.job_url ? (
                  <a
                    href={a.job_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-sm font-medium text-gray-700 hover:underline dark:text-blue-300"
                  >
                    Open Application
                  </a>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 mr-2">
                  <button
                    onClick={() => startEdit(a)}
                    className="inline-flex h-9 min-w-14 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-[0] text-gray-600 transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-blue-950/40 dark:hover:text-white"
                    title="Edit application"
                    aria-label="Edit application"
                  >
                    <span className="text-xs font-medium">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteApplication(a.id)}
                    className="inline-flex h-9 min-w-20 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-[0] text-gray-600 transition hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-red-950 dark:hover:text-red-300"
                    title="Remove application"
                    aria-label="Remove application"
                  >
                    <span className="text-xs font-medium">Remove</span>
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
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
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
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-blue-950/40"
                >
                  Add Stage
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold text-gray-800 dark:text-white">Applications</div>
          </div>
          <button
            className="rounded-xl bg-black px-4 py-2 text-white transition hover:bg-gray-900 dark:bg-blue-600 dark:hover:bg-blue-500"
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

        <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr]">
          <div className="relative w-full">
            <input
              className="w-full rounded-xl border bg-white px-3 py-2 pr-10 text-gray-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              placeholder="Search company / role / platform"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort</label>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            >
              <option value="recent">Newest first</option>
              <option value="old">Oldest first</option>
            </select>
          </div>
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label="Clear search"
            >
              x
            </button>
          ) : null}
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-base font-semibold text-gray-800 dark:text-white">
                Resume Slot Settings
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose how many resume slots you want to maintain for A/B testing and tracking.
              </div>
            </div>

            <div className="w-full md:w-64">
              <label className="text-sm text-gray-700 dark:text-gray-100">
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
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
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
            <h2 className="text-lg font-semibold mt-4 mb-2">Needs Attention</h2>
            <p className="text-xs text-gray-400 mb-2">
              {sortKey === "old" ? "Sorted by oldest applications" : "Sorted by newest applications"}
            </p>
            {needsAttention.length === 0 ? (
              <p className="text-sm text-gray-400">No applications here</p>
            ) : null}
            {needsAttention.map((a) => renderCard(a))}

            <h2 className="text-lg font-semibold mt-6 mb-2">In Progress</h2>
            <p className="text-xs text-gray-400 mb-2">
              {sortKey === "old" ? "Sorted by oldest applications" : "Sorted by newest applications"}
            </p>
            {inProgress.length === 0 ? (
              <p className="text-sm text-gray-400">No applications here</p>
            ) : null}
            {inProgress.map((a) => renderCard(a))}

            <h2 className="text-lg font-semibold mt-6 mb-2">Completed</h2>
            <p className="text-xs text-gray-400 mb-2">
              {sortKey === "old" ? "Sorted by oldest applications" : "Sorted by newest applications"}
            </p>
            {completed.length === 0 ? (
              <p className="text-sm text-gray-400">No applications here</p>
            ) : null}
            {completed.map((a) => renderCard(a))}

            {filtered.length < 0 && filtered.map((a) => (
              <div key={a.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md transition-colors dark:border-gray-800 dark:bg-gray-900/60">
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
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                      />

                      <input
                        type="text"
                        value={editForm.role_title || ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, role_title: e.target.value }))
                        }
                        placeholder="Role title"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                      />

                      <input
                        type="text"
                        value={editForm.platform || ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, platform: e.target.value }))
                        }
                        placeholder="Platform"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                      />

                      <input
                        type="text"
                        value={editForm.job_url || ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, job_url: e.target.value }))
                        }
                        placeholder="Job URL"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                      />

                      <select
                        value={editForm.resume_slot ?? ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, resume_slot: e.target.value }))
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
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
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
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
                          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-900 dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                          Save
                        </button>

                        <button
                          onClick={cancelEdit}
                          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                          {safeText(a.company_name)} - {cleanRoleTitleUI(a.role_title)}
                        </h3>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-gray-700 dark:text-gray-100">Platform:</span>{" "}
                          {safeText(labelPlatform(a.platform))}
                          <span className="mx-2">•</span>
                          <span className="font-medium text-gray-700 dark:text-gray-100">Current Stage:</span>{" "}
                          {a.current_stage || "CAPTURED"}
                          <span className="mx-2">•</span>
                          <span className="font-medium text-gray-700 dark:text-gray-100">Work Mode:</span>{" "}
                          {safeText(extractWorkMode(a))}
                        </p>
                        {a.is_overdue ? (
                          <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                            Overdue
                          </span>
                        ) : null}

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-gray-700 dark:text-gray-100">Resume Slot:</span>{" "}
                      {a.resume_slot ? `Resume ${a.resume_slot}` : "—"}
                          <span className="mx-2">•</span>
                          <span className="font-medium text-gray-700 dark:text-gray-100">Date Applied:</span>{" "}
                          {formatDateShort(a.date_applied || a.created_at)}
                        </p>

                        {a.job_url ? (
                          <a
                            href={a.job_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-sm font-medium text-gray-700 hover:underline dark:text-blue-300"
                          >
                            Open Application
                          </a>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 mr-2">
                          <button
                            onClick={() => startEdit(a)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-sm text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-blue-950/40 dark:hover:text-white"
                            title="Edit application"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDeleteApplication(a.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-base text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-red-950 dark:hover:text-red-300"
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
                          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
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
                          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-blue-950/40"
                        >
                          Add Stage
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {filtered.length < 0 && (filtered.length === 0 ? (
              <div className="text-sm text-gray-500">No applications found.</div>
            ) : null)}
          </div>
        ) : null}
      </div>

      {/* Modal */}
      {open ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg dark:bg-gray-900/60 dark:border dark:border-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-800 dark:text-white">Add Application</div>
              </div>
              <button
                className="text-sm px-3 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <Field label="Company *" value={company} onChange={setCompany} placeholder="e.g., Google" />
              <Field label="Role *" value={role} onChange={setRole} placeholder="e.g., Frontend Intern" />
              <Field label="Platform" value={platform} onChange={setPlatform} placeholder="e.g., linkedin.com" />
              <Field label="Job URL (optional)" value={jobUrl} onChange={setJobUrl} placeholder="https://..." />

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-100">
                  Applied Date
                </label>
                <input
                  type="date"
                  value={appliedAt}
                  onChange={(e) => setAppliedAt(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
              </div>

              <div>
                <div className="text-sm text-gray-700 dark:text-gray-100">Resume Slot</div>
                <select
                  className="mt-1 w-full border rounded-xl px-3 py-2 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
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
                className="mt-2 w-full rounded-xl bg-black py-2 text-white transition hover:bg-gray-900 dark:bg-blue-600 dark:hover:bg-blue-500"
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
      <div className="text-sm text-gray-700 dark:text-gray-100">{label}</div>
      <input
        className="mt-1 w-full border rounded-xl px-3 py-2 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
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

function formatDateShort(value) {
  if (!value) return "—";
  const raw = String(value);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
