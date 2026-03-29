export default function EmptyState({ title = "No data found", subtitle = "" }) {
  return (
    <div className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center shadow-sm">
      <h3 className="text-base font-semibold text-gray-700">{title}</h3>
      {subtitle ? (
        <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
      ) : null}
    </div>
  );
}
