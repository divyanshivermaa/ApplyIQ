export default function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md transition-colors dark:border-wine-800 dark:bg-[#1a1116]">
      <div className="text-sm text-gray-500 dark:text-wine-200/80">{title}</div>
      <div className="text-2xl font-semibold mt-1 text-gray-800 dark:text-wine-50">{value}</div>
      {subtitle ? (
        <div className="text-xs text-gray-500 dark:text-wine-200/80 mt-2">{subtitle}</div>
      ) : null}
    </div>
  );
}
