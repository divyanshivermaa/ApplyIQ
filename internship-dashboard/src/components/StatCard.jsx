export default function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md transition-colors dark:border-gray-800 dark:bg-gray-900/60">
      <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
      <div className="text-2xl font-semibold mt-1 text-gray-800 dark:text-white">{value}</div>
      {subtitle ? (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{subtitle}</div>
      ) : null}
    </div>
  );
}
