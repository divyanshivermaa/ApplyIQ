import { useState } from "react";
import Navbar from "../components/Navbar";
import { getToken } from "../api/client";

export default function Extension() {
  const [copied, setCopied] = useState(false);

  const token = getToken() || "";

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback
      alert("Copy failed. You can manually copy from the box.");
    }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-2xl font-semibold text-gray-800 dark:text-white">Extension</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Chrome extension connects here. Token copy + usage guide.
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md transition-colors dark:border-gray-800 dark:bg-gray-900/60">
          <div className="font-semibold text-gray-800 dark:text-white">1) API Base URL</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Set this in extension settings / config (if your extension asks for it).
          </div>
          <div className="mt-3 font-mono text-sm border rounded-xl p-3 bg-gray-50 break-all dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100">
            {import.meta.env.VITE_API_BASE_URL || "Set VITE_API_BASE_URL on Vercel"}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md transition-colors dark:border-gray-800 dark:bg-gray-900/60">
          <div className="font-semibold text-gray-800 dark:text-white">2) Auth Token (Bearer)</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            The extension needs this token to call the API. Copy and paste it in the extension popup/settings.
          </div>

          <div className="mt-3 font-mono text-xs border rounded-xl p-3 bg-gray-50 break-all dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100">
            {token || "No token found. Please login first."}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              className="rounded-xl bg-black px-4 py-2 text-white transition hover:bg-gray-900 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
              onClick={copyToken}
              disabled={!token}
            >
              {copied ? "Copied ✅" : "Copy Token"}
            </button>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              Use as: <span className="ml-1 font-mono">Bearer &lt;token&gt;</span>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md transition-colors dark:border-gray-800 dark:bg-gray-900/60">
          <div className="font-semibold text-gray-800 dark:text-white">3) What to test</div>
          <ul className="mt-2 text-sm text-gray-700 dark:text-gray-400 list-disc pl-5 space-y-1">
            <li>Open any job page - extension "Capture" - submit - should create Application.</li>
            <li>Open portal page - extension "Portal Scan" - submit - backend creates StatusSuggestions (PENDING).</li>
            <li>Dashboard - Suggestions - Confirm/Dismiss.</li>
          </ul>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="font-medium text-gray-800 dark:text-gray-100">Backend endpoints used:</div>
            <div className="font-mono text-xs mt-2 bg-gray-50 border rounded-xl p-3 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100">
              POST /status-scan/submit{"\n"}
              GET /status-suggestions/pending-expanded{"\n"}
              POST /status-suggestions/{`{id}`}/confirm{"\n"}
              POST /status-suggestions/{`{id}`}/dismiss
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
