export default function EmptyState({ title = "No data found", subtitle = "" }) {
  return (
    <div className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center shadow-sm transition-colors dark:border-wine-800 dark:bg-[#1a1116]">
      <h3 className="text-base font-semibold text-gray-700 dark:text-wine-50">{title}</h3>
      {subtitle ? (
        <p className="mt-2 text-sm text-gray-500 dark:text-wine-200/80">{subtitle}</p>
      ) : null}
    </div>
  );
}
