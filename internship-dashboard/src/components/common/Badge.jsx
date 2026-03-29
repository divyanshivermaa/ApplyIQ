export default function Badge({ text, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {text}
    </span>
  );
}
