import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ErrorBox from "../components/ErrorBox";
import SuggestionCard from "../components/suggestions/SuggestionCard";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { fetchPendingExpanded, confirmSuggestion, dismissSuggestion } from "../api/suggestions";

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  async function fetchSuggestions() {
    try {
      setLoading(true);
      setError("");
      setActionError("");

      const data = await fetchPendingExpanded(50);
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Could not load suggestions");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSuggestions();
  }, []);

  async function handleConfirm(id) {
    try {
      setActionLoadingId(id);
      setActionError("");
      await confirmSuggestion(id);
      setSuggestions((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setActionError(err?.message || "Confirm failed");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDismiss(id) {
    try {
      setActionLoadingId(id);
      setActionError("");
      await dismissSuggestion(id);
      setSuggestions((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setActionError(err?.message || "Dismiss failed");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Insights & Recommendations
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            System-generated recommendations and application insights.
          </p>
        </div>

        {loading && <LoadingState text="Loading suggestions..." />}

        {!loading && (error || actionError) && (
          <ErrorBox message={error || actionError} />
        )}

        {!loading && !error && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
              Recommended Actions
            </h2>
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
              Review the source signal, confidence, and explanation before confirming or dismissing each recommendation.
            </p>

            {suggestions.length === 0 ? (
              <EmptyState
                title="No suggestions right now"
                subtitle="New suggestions will appear here when the system detects useful status updates."
              />
            ) : (
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
        )}
      </div>
    </>
  );
}
