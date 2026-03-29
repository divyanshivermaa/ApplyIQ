import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import SuggestionCard from "../components/suggestions/SuggestionCard";
import ErrorBox from "../components/ErrorBox";
import api from "../api";

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    application_id: "",
    source_type: "EMAIL",
    raw_text: "",
  });

  async function fetchAll() {
    setErr("");
    try {
      setLoading(true);

      const [sRes, aRes] = await Promise.all([
        api.get("/status-suggestions/pending-expanded"),
        api.get("/applications"),
      ]);

      setSuggestions(Array.isArray(sRes.data) ? sRes.data : []);
      setApplications(Array.isArray(aRes.data) ? aRes.data : []);
    } catch (e) {
      setErr("Could not load suggestions data");
      setSuggestions([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function handleConfirm(id) {
    setErr("");
    setMsg("");
    try {
      setActionLoadingId(id);
      await api.post(`/status-suggestions/${id}/confirm`);
      setSuggestions((prev) => prev.filter((item) => item.id !== id));
      setMsg("Suggestion confirmed ✅");
    } catch (e) {
      setErr("Confirm failed");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDismiss(id) {
    setErr("");
    setMsg("");
    try {
      setActionLoadingId(id);
      await api.post(`/status-suggestions/${id}/dismiss`);
      setSuggestions((prev) => prev.filter((item) => item.id !== id));
      setMsg("Suggestion dismissed");
    } catch (e) {
      setErr("Dismiss failed");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleCreateSuggestion() {
    setErr("");
    setMsg("");

    if (!form.application_id || !form.raw_text.trim()) {
      setErr("Select an application and enter signal text.");
      return;
    }

    try {
      setCreateLoading(true);

      const res = await api.post("/status-suggestions/from-signal", {
        application_id: Number(form.application_id),
        source_type: form.source_type,
        raw_text: form.raw_text.trim(),
      });

      if (res.data?.created) {
        setMsg("Suggestion created ✅");
      } else {
        setMsg(res.data?.message || "No actionable suggestion detected.");
      }

      setForm((prev) => ({
        ...prev,
        raw_text: "",
      }));

      await fetchAll();
    } catch (e) {
      setErr("Could not create suggestion");
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-wine-50">
            Suggestions
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-wine-200/80">
            Review system-generated stage suggestions before applying changes.
          </p>
        </div>

        <ErrorBox message={err} />
        {msg ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {msg}
          </div>
        ) : null}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-wine-800 dark:bg-[#1a1116]">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-wine-50">
            Generate Suggestion
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-wine-200/80">
            Paste recruiter email text or other status signal here to create a deterministic suggestion.
          </p>

          <div className="mt-4 grid gap-3">
            <select
              value={form.application_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, application_id: e.target.value }))
              }
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
            >
              <option value="">Select application</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.company_name} - {app.role_title}
                </option>
              ))}
            </select>

            <select
              value={form.source_type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, source_type: e.target.value }))
              }
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
            >
              <option value="EMAIL">EMAIL</option>
              <option value="PORTAL">PORTAL</option>
            </select>

            <textarea
              rows={5}
              value={form.raw_text}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, raw_text: e.target.value }))
              }
              placeholder="Paste email or status text here..."
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
            />

            <button
              onClick={handleCreateSuggestion}
              disabled={createLoading}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60 dark:bg-wine-600 dark:hover:bg-wine-500"
            >
              {createLoading ? "Creating..." : "Generate Suggestion"}
            </button>
          </div>
        </div>

        {loading && <LoadingState text="Loading suggestions..." />}

        {!loading && suggestions.length === 0 && (
          <EmptyState
            title="No suggestions right now"
            subtitle="New suggestions will appear here when the system detects useful status updates."
          />
        )}

        {!loading && suggestions.length > 0 && (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onConfirm={handleConfirm}
                onDismiss={handleDismiss}
                actionLoadingId={actionLoadingId}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
