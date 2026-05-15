import { Link } from "react-router-dom";
import { getToken } from "../api/client";
import chromeExtensionCapture from "../assets/chrome-extension-capture.png";

const cardClass =
  "rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-400 dark:border-gray-800 dark:bg-gray-900/60 dark:shadow-lg dark:shadow-black/20 dark:hover:border-blue-500/40";

function SectionTitle({ children }) {
  return (
    <div className="mb-10 text-center">
      <h2 className="text-3xl font-semibold tracking-tight">{children}</h2>
      <div className="flex justify-center mt-3">
        <div className="h-1 w-16 rounded bg-gray-900 dark:bg-gradient-to-r dark:from-blue-500 dark:to-indigo-500" />
      </div>
    </div>
  );
}

export default function Landing() {
  const isLoggedIn = !!getToken();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-white text-slate-900 dark:from-gray-950 dark:via-gray-900 dark:to-black dark:text-white">
      <section className="mx-auto flex min-h-[76vh] max-w-6xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-slate-600 dark:text-blue-400">
          ApplyIQ
        </p>

        <h1 className="mx-auto mb-6 max-w-5xl text-6xl font-bold leading-tight md:text-7xl">
          Internship Application{" "}
          <span className="text-slate-950 dark:text-blue-500">Intelligence</span> System
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg leading-8 text-slate-600 dark:text-gray-400">
          An <span className="text-slate-950 dark:text-blue-300">explainable</span>,{" "}
          <span className="text-slate-950 dark:text-blue-300">analytics</span>-first platform for
          tracking applications, detecting bottlenecks, and improving resume
          strategy.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          {isLoggedIn ? (
            <Link
              to="/dashboard"
              className="rounded-lg bg-black px-6 py-3 font-medium text-white shadow-md transition hover:bg-gray-900 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              View Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-black px-6 py-3 font-medium text-white shadow-md transition hover:bg-gray-900 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              Login to Dashboard
            </Link>
          )}
        </div>

        <div className="mt-14 w-full max-w-3xl">
          <div className="max-h-[430px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-blue-950/20 dark:border-blue-500/30">
            <img
              src={chromeExtensionCapture}
              alt="Chrome extension capturing job details from a hiring page"
              className="block w-full object-cover object-top"
            />
          </div>
          <div className="mx-auto mt-5 max-w-3xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">
              Chrome Extension Capture
            </p>
            <p className="text-lg font-semibold leading-7 text-slate-900 dark:text-white">
              Capture live job listings in seconds and convert them into
              structured, trackable application records.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto h-px max-w-6xl bg-slate-200 dark:bg-gray-800" />

      <section className="mx-auto max-w-6xl bg-white px-6 py-20 shadow-sm ring-1 ring-slate-200/80 dark:bg-gray-950/40 dark:ring-gray-800">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
            <h3 className="text-lg font-semibold mb-4">The Problem</h3>

            <ul className="list-disc space-y-3 pl-5 text-slate-600 dark:text-gray-400">
              <li>Traditional trackers are just lists.</li>
              <li>No stage history analysis.</li>
              <li>No resume performance insights.</li>
              <li>No prioritization intelligence.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
            <h3 className="text-lg font-semibold mb-4">The Solution</h3>

            <ul className="list-disc space-y-3 pl-5 text-slate-600 dark:text-gray-400">
              <li>Deterministic stage tracking.</li>
              <li>Overdue detection engine.</li>
              <li>Resume slot analytics.</li>
              <li>Interpreted insights and trends.</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="mx-auto h-px max-w-6xl bg-slate-200 dark:bg-gray-800" />

      <section className="mx-auto max-w-6xl bg-white px-6 py-20 shadow-sm ring-1 ring-slate-200/80 dark:bg-gray-950/40 dark:ring-gray-800">
        <SectionTitle>System Architecture</SectionTitle>

        <div className="grid gap-6 text-center md:grid-cols-4">
          <div className={cardClass}>
            <h3 className="mb-2 text-sm font-medium">Browser Extension</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400">
              User-triggered job capture across platforms.
            </p>
          </div>

          <div className={cardClass}>
            <h3 className="mb-2 text-sm font-medium">Backend (FastAPI)</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Auth, stage logic, analytics, suggestions.
            </p>
          </div>

          <div className={cardClass}>
            <h3 className="mb-2 text-sm font-medium">Database</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Applications, stage history, resume slots.
            </p>
          </div>

          <div className={cardClass}>
            <h3 className="mb-2 text-sm font-medium">Dashboard</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Insights, analytics, trends, follow-ups.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto h-px max-w-6xl bg-slate-200 dark:bg-gray-800" />

      <section className="mx-auto max-w-6xl bg-white px-6 py-20 shadow-sm ring-1 ring-slate-200/80 dark:bg-gray-950/40 dark:ring-gray-800">
        <SectionTitle>Core Features</SectionTitle>

        <div className="grid gap-8 md:grid-cols-3">
          <div className={cardClass}>
            <h3 className="mb-3 text-sm font-medium">Stage History System</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Tracks every status change with full history for transparency
              and analytics.
            </p>
          </div>

          <div className={cardClass}>
            <h3 className="mb-3 text-sm font-medium">Overdue Detection Engine</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Deterministically identifies applications that need follow-up.
            </p>
          </div>

          <div className={cardClass}>
            <h3 className="mb-3 text-sm font-medium">Resume Slot Analytics</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Compares resume versions using conversion-based insights.
            </p>
          </div>

          <div className={cardClass}>
            <h3 className="mb-3 text-sm font-medium">Deterministic Suggestions</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Keyword-based intelligent recommendations with user
              confirmation.
            </p>
          </div>

          <div className={cardClass}>
            <h3 className="mb-3 text-sm font-medium">Behavioral Tracking</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Weekly activity and trend comparison to measure consistency.
            </p>
          </div>

          <div className={cardClass}>
            <h3 className="mb-3 text-sm font-medium">Confidence-Based Extraction</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Multi-layer data capture with structured confidence merging.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
