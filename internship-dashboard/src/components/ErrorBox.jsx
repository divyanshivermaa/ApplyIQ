export default function ErrorBox({ message }) {
  if (!message) return null;

  // If somehow message is not a string, make it readable
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
    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 dark:text-red-300 dark:bg-red-950/40 dark:border-red-800">
      {text}
    </div>
  );
}
