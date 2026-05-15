import Badge from "../common/Badge";
import {
  formatConfidenceText,
  getConfidenceClass,
  getSourceClass,
  normalizeSuggestionExplanation,
  safeText,
  titleCaseText,
} from "../../utils/uiHelpers";

export default function SuggestionCard({
  suggestion,
  onConfirm,
  onDismiss,
  actionLoadingId,
}) {
  const isLoading = actionLoadingId === suggestion.id;
  const isOverdue = String(suggestion.source_type || "").toUpperCase() === "OVERDUE";
  const sourceLabel = isOverdue ? "OVERDUE" : safeText(String(suggestion.source_type || "").toUpperCase(), "UNKNOWN");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {safeText(suggestion.company_name)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {safeText(suggestion.role_title)}
            </p>
          </div>

          <div className="text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-100">
              {isOverdue ? "Suggested Action:" : "Suggested Stage:"}
            </span>
            <span className="ml-1 text-gray-800 dark:text-white">
              {isOverdue
                ? "Follow Up"
                : safeText(titleCaseText(suggestion.suggested_stage))}
            </span>
          </div>

          <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
            {normalizeSuggestionExplanation(suggestion.explanation, suggestion.source_type)}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              text={formatConfidenceText(suggestion.confidence)}
              className={getConfidenceClass(suggestion.confidence)}
            />
            <Badge text={sourceLabel} className={getSourceClass(suggestion.source_type)} />
          </div>
        </div>

        <div className="flex shrink-0 gap-2 md:flex-col">
          <button
            onClick={() => onConfirm(suggestion.id)}
            disabled={isLoading}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            {isLoading ? "Please wait..." : "Confirm"}
          </button>

          <button
            onClick={() => onDismiss(suggestion.id)}
            disabled={isLoading}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-blue-950/40"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
