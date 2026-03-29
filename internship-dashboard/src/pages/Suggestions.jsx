import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import SuggestionCard from "../components/suggestions/SuggestionCard";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { fetchPendingExpanded, confirmSuggestion, dismissSuggestion } from "../api/suggestions";

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");

  async function fetchSuggestions() {
    try {
      setLoading(true);
      setError("");

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
      await confirmSuggestion(id);
      setSuggestions((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert("Confirm failed");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDismiss(id) {
    try {
      setActionLoadingId(id);
      await dismissSuggestion(id);
      setSuggestions((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert("Dismiss failed");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-wine-50">Suggestions</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-wine-200/80">
            Review system-generated stage suggestions before applying changes.
          </p>
        </div>

        {loading && <LoadingState text="Loading suggestions..." />}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && suggestions.length === 0 && (
          <EmptyState
            title="No suggestions right now"
            subtitle="New suggestions will appear here when the system detects useful status updates."
          />
        )}

        {!loading && !error && suggestions.length > 0 && (
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
