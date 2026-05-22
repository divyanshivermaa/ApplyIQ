import { useState } from "react";
import ErrorBox from "../components/ErrorBox";
import SuggestionCard from "../components/suggestions/SuggestionCard";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { useSuggestionActions, useSuggestions } from "../hooks/queries";

export default function Suggestions() {
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const { data, error, isLoading: loading } = useSuggestions(50);
  const { confirm, dismiss } = useSuggestionActions();
  const suggestions = Array.isArray(data) ? data : [];

  async function handleConfirm(id) {
    try {
      setActionLoadingId(id);
      setActionError("");
      await confirm.mutateAsync(id);
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
      await dismiss.mutateAsync(id);
    } catch (err) {
      setActionError(err?.message || "Dismiss failed");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <>
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
          <ErrorBox message={error ? "Could not load suggestions" : actionError} />
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
