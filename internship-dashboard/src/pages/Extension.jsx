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
        <div className="text-2xl font-semibold text-gray-800 dark:text-wine-50">Extension</div>
        <div className="text-sm text-gray-500 dark:text-wine-200/80 mt-1">
          Chrome extension connects here. Token copy + usage guide.
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md transition-colors dark:border-wine-800 dark:bg-[#1a1116]">
          <div className="font-semibold text-gray-800 dark:text-wine-50">1) API Base URL</div>
          <div className="text-sm text-gray-600 dark:text-wine-200/80 mt-1">
            Set this in extension settings / config (if your extension asks for it).
          </div>
          <div className="mt-3 font-mono text-sm border rounded-xl p-3 bg-gray-50 break-all dark:border-wine-800 dark:bg-[#24131b] dark:text-wine-100">
            http://127.0.0.1:8000
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md transition-colors dark:border-wine-800 dark:bg-[#1a1116]">
          <div className="font-semibold text-gray-800 dark:text-wine-50">2) Auth Token (Bearer)</div>
          <div className="text-sm text-gray-600 dark:text-wine-200/80 mt-1">
            The extension needs this token to call the API. Copy and paste it in the extension popup/settings.
          </div>

          <div className="mt-3 font-mono text-xs border rounded-xl p-3 bg-gray-50 break-all dark:border-wine-800 dark:bg-[#24131b] dark:text-wine-100">
            {token || "No token found. Please login first."}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-60 dark:bg-wine-600 dark:hover:bg-wine-500"
              onClick={copyToken}
              disabled={!token}
            >
              {copied ? "Copied ✅" : "Copy Token"}
            </button>
            <div className="text-sm text-gray-500 dark:text-wine-200/80 flex items-center">
              Use as: <span className="ml-1 font-mono">Bearer &lt;token&gt;</span>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md transition-colors dark:border-wine-800 dark:bg-[#1a1116]">
          <div className="font-semibold text-gray-800 dark:text-wine-50">3) What to test</div>
          <ul className="mt-2 text-sm text-gray-700 dark:text-wine-200/80 list-disc pl-5 space-y-1">
            <li>Open any job page - extension "Capture" - submit - should create Application.</li>
            <li>Open portal page - extension "Portal Scan" - submit - backend creates StatusSuggestions (PENDING).</li>
            <li>Dashboard - Suggestions - Confirm/Dismiss.</li>
          </ul>

          <div className="mt-4 text-sm text-gray-600 dark:text-wine-200/80">
            <div className="font-medium text-gray-800 dark:text-wine-100">Backend endpoints used:</div>
            <div className="font-mono text-xs mt-2 bg-gray-50 border rounded-xl p-3 dark:border-wine-800 dark:bg-[#24131b] dark:text-wine-100">
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
