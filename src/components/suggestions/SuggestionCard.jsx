import Badge from "../common/Badge";
import {
  getConfidenceClass,
  getSourceClass,
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

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-wine-800 dark:bg-[#1a1116]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-wine-50">
              {safeText(suggestion.company_name)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-wine-200/80">
              {safeText(suggestion.role_title)}
            </p>
          </div>

          <div className="text-sm">
            <span className="font-medium text-gray-700 dark:text-wine-100">
              Suggested Stage:
            </span>{" "}
            <span className="text-gray-800 dark:text-wine-50">
              {safeText(titleCaseText(suggestion.suggested_stage))}
            </span>
          </div>

          <p className="text-sm leading-6 text-gray-600 dark:text-wine-200/80">
            {safeText(suggestion.explanation, "No explanation available")}
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge
              text={safeText(String(suggestion.confidence || ""), "LOW")}
              className={getConfidenceClass(suggestion.confidence_label || suggestion.confidence)}
            />
            <Badge
              text={safeText(String(suggestion.source_type || "").toUpperCase(), "UNKNOWN")}
              className={getSourceClass(suggestion.source_type)}
            />
          </div>
        </div>

        <div className="flex shrink-0 gap-2 md:flex-col">
          <button
            onClick={() => onConfirm(suggestion.id)}
            disabled={isLoading}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Please wait..." : "Confirm"}
          </button>

          <button
            onClick={() => onDismiss(suggestion.id)}
            disabled={isLoading}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100 dark:hover:bg-[#311621]"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
