// Simple UI helper functions for labels, badges, and safe text display

export function formatLabel(key) {
  const map = {
    resume_slot: "Resume Slot",
    date_applied: "Date Applied",
    current_stage: "Current Stage",
    source_type: "Source",
    confidence: "Confidence",
    platform_performance: "Platform Performance",
  };

  return map[key] || key;
}

export function formatConfidenceText(confidence) {
  if (confidence === null || confidence === undefined || confidence === "") {
    return "No confidence";
  }

  const numeric = Number(confidence);
  if (!Number.isNaN(numeric)) {
    return `${numeric}% Confidence`;
  }

  return `${String(confidence).toUpperCase()} Confidence`;
}

export function getConfidenceClass(confidence) {
  const numeric = Number(confidence);

  if (!Number.isNaN(numeric)) {
    if (numeric >= 80) {
      return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
    }
    if (numeric >= 60) {
      return "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
    }
    return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
  }

  const value = String(confidence || "").toUpperCase();

  if (value === "HIGH") {
    return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
  }

  if (value === "MEDIUM") {
    return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800";
  }

  return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
}

export function getSourceClass(source) {
  const value = String(source || "").toUpperCase();

  if (value === "PORTAL") {
    return "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
  }

  if (value === "EMAIL") {
    return "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
  }

  if (value === "OVERDUE") {
    return "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
  }

  return "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700";
}

export function safeText(value, fallback = "—") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return value;
}

export function titleCaseText(value) {
  if (!value) return "—";

  return String(value)
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalizeSuggestionExplanation(text, sourceType) {
  if (!text) {
    return "No explanation available.";
  }

  const normalized = String(text).trim();

  if (String(sourceType || "").toUpperCase() === "OVERDUE") {
    if (/marked overdue by rule/i.test(normalized) || /rule v\d+/i.test(normalized)) {
      return "No response received within the expected timeline. Consider following up.";
    }
  }

  return normalized;
}
