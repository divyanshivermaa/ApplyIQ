export default function ErrorBox({ message }) {
  if (!message) return null;

  const text =
    typeof message === "string"
      ? message
      : (() => {
          try {
            return JSON.stringify(message);
          } catch {
            return String(message);
          }
        })();

  return (
    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
      {text}
    </div>
  );
}
