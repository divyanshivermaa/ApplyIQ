export default function LoadingState({ text = "Loading..." }) {
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
      {text}
    </div>
  );
}
