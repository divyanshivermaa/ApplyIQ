import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ErrorBox from "../components/ErrorBox";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import StatCard from "../components/StatCard";
import ActivitySummary from "../components/ActivitySummary";
import {
  getInsights,
  getOverdueByStage,
  getOverdueSummary,
  getPlatformPerf,
  getResumePerf,
} from "../api/analytics";
import { listApplications } from "../api/applications";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function totalFromRows(rows) {
  return rows.reduce((sum, row) => sum + Number(row.count || 0), 0);
}

function getBestResumeSlot(rows) {
  if (!rows.length) return "";
  const best = rows
    .slice()
    .sort((a, b) => {
      const bScore = Number(b.offer_rate_pct || 0) || Number(b.interview_rate_pct || 0) || Number(b.interviews || 0);
      const aScore = Number(a.offer_rate_pct || 0) || Number(a.interview_rate_pct || 0) || Number(a.interviews || 0);
      return bScore - aScore;
    })[0];
  return best?.resume_slot || best?.resume || "";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [applications, setApplications] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState([]);
  const [todoTitle, setTodoTitle] = useState("");
  const [todoNote, setTodoNote] = useState("");
  const [todoDeadline, setTodoDeadline] = useState("");
  const [todoLink, setTodoLink] = useState("");
  const [overdueCount, setOverdueCount] = useState(0);
  const [topStage, setTopStage] = useState("");
  const [topPlatform, setTopPlatform] = useState("");
  const [bestResume, setBestResume] = useState("");
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const chartColors = useMemo(() => {
    return isDark
      ? {
          axis: "#bfdbfe",
          grid: "#1e3a8a",
          tooltipBg: "#111827",
          tooltipBorder: "#2563eb",
          tooltipLabel: "#f9f1f4",
          tooltipItem: "#bfdbfe",
          bar: "#2563eb",
          cursor: "rgba(37, 99, 235, 0.10)",
        }
      : {
          axis: "#374151",
          grid: "#e5e7eb",
          tooltipBg: "#ffffff",
          tooltipBorder: "#d1d5db",
          tooltipLabel: "#111827",
          tooltipItem: "#374151",
          bar: "#111827",
          cursor: "rgba(17, 24, 39, 0.08)",
        };
  }, [isDark]);

  useEffect(() => {
    async function load() {
      setErr("");
      setLoading(true);
      try {
        const [i, o, summary, platformPerf, resumePerf, apps] = await Promise.all([
          getInsights(),
          getOverdueByStage(),
          getOverdueSummary(),
          getPlatformPerf(),
          getResumePerf(),
          listApplications(),
        ]);
        const nextInsights = Array.isArray(i) ? i : [];
        const nextOverdue = Array.isArray(o) ? o : [];
        const nextPlatforms = Array.isArray(platformPerf) ? platformPerf : [];
        const nextResumes = Array.isArray(resumePerf) ? resumePerf : [];

        setInsights(nextInsights);
        setOverdue(nextOverdue);
        setOverdueCount(Number(summary?.total_overdue ?? totalFromRows(nextOverdue)));
        setTopStage(nextOverdue[0]?.stage || "");
        setTopPlatform(nextPlatforms[0]?.platform || "");
        setBestResume(getBestResumeSlot(nextResumes));
        setApplications(Array.isArray(apps) ? apps : []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("manual_todos");
      if (raw) setTodos(JSON.parse(raw));
    } catch {}
  }, []);

  function persistTodos(next) {
    setTodos(next);
    try {
      localStorage.setItem("manual_todos", JSON.stringify(next));
    } catch {}
  }

  function addTodo() {
    if (!todoTitle.trim()) return;
    const next = [
      {
        id: Date.now(),
        title: todoTitle.trim(),
        note: todoNote.trim(),
        deadline: todoDeadline,
        link: todoLink.trim(),
        done: false,
      },
      ...todos,
    ];
    persistTodos(next);
    setTodoTitle("");
    setTodoNote("");
    setTodoDeadline("");
    setTodoLink("");
  }

  function removeTodo(id) {
    persistTodos(todos.filter((t) => t.id !== id));
  }

  function toggleTodo(id) {
    persistTodos(
      todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  const totalOverdue = overdue.reduce((sum, r) => sum + (r.count || 0), 0);


  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 transition-colors bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="text-2xl font-semibold text-gray-800 dark:text-white">Dashboard</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Deterministic insights and overdue concentration.
        </div>

        <div className="mt-4">
          <ErrorBox message={err} />
        </div>

        {loading && <LoadingState text="Loading analytics..." />}

        {!loading ? (
          <>
            <div className="mb-6 mt-6">
              <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                What Needs Attention
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                  <h3 className="font-semibold text-red-600 mb-1">Follow-ups Needed</h3>
                  {overdueCount === 0 ? (
                    <p className="text-sm text-green-600">
                      No overdue applications. Good job!
                    </p>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-400">
                      {overdueCount} application(s) are overdue.
                      {topStage && ` Most are in ${topStage} stage.`}
                    </p>
                  )}
                  {overdueCount > 0 && (
                    <button
                      onClick={() => navigate("/applications?filter=overdue")}
                      className="mt-2 text-sm text-gray-700 underline dark:text-blue-300"
                    >
                      View Overdue Applications
                    </button>
                  )}
                </div>
                <div className="border rounded-lg p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                  <h3 className="font-semibold text-yellow-600 mb-1">Pipeline Status</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    {topStage
                      ? `Most applications are stuck in ${topStage}.`
                      : "Pipeline data not available."}
                  </p>
                  <button
                    onClick={() => navigate("/applications")}
                    className="mt-2 text-sm text-gray-700 underline dark:text-blue-300"
                  >
                    View Applications
                  </button>
                </div>
                <div className="border rounded-lg p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                  <h3 className="font-semibold text-green-600 mb-1">Resume Performance</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    {bestResume
                      ? `Resume ${bestResume} is performing better.`
                      : "Apply more to generate resume insights."}
                  </p>
                  <button
                    onClick={() => navigate("/analytics")}
                    className="mt-2 text-sm text-gray-700 underline dark:text-blue-300"
                  >
                    View Analytics
                  </button>
                </div>
                <div className="border rounded-lg p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                  <h3 className="font-semibold text-gray-900 mb-1 dark:text-blue-300">Platform Insight</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    {topPlatform
                      ? `${topPlatform} has the highest response rate.`
                      : "No platform data yet."}
                  </p>
                  <button
                    onClick={() => navigate("/analytics")}
                    className="mt-2 text-sm text-gray-700 underline dark:text-blue-300"
                  >
                    Explore Platforms
                  </button>
                </div>
              </div>
            </div>

            <ActivitySummary applications={applications} />

            {/*
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <StatCard
                title="Total overdue follow-ups"
                value={totalOverdue}
                subtitle="Overdue items across stages"
              />
              <StatCard
                title="Insights generated"
                value={insights.length}
                subtitle="Actionable analytics summaries"
              />
            </div>
            */}

            <div className="mt-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-colors dark:border-gray-800 dark:bg-gray-900/60">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Overdue by Stage</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Stage-wise bottleneck view.</p>
                </div>
                <div className="h-[220px] w-full">
                  {overdue.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center dark:border-gray-800 dark:bg-gray-900/60">
                      <h3 className="text-xl font-semibold text-gray-700 dark:text-white">
                        No overdue items right now
                      </h3>
                      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        Overdue stage distribution will appear once follow-ups become overdue.
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overdue}>
                        <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                        <XAxis dataKey="stage" tick={{ fill: chartColors.axis }} />
                        <YAxis tick={{ fill: chartColors.axis }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: chartColors.tooltipBg,
                            border: `1px solid ${chartColors.tooltipBorder}`,
                            borderRadius: "12px",
                            color: chartColors.tooltipLabel,
                          }}
                          labelStyle={{
                            color: chartColors.tooltipLabel,
                            fontWeight: 600,
                          }}
                          itemStyle={{
                            color: chartColors.tooltipItem,
                          }}
                          cursor={{ fill: chartColors.cursor }}
                        />
                        <Bar dataKey="count" fill={chartColors.bar} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-colors dark:border-gray-800 dark:bg-gray-900/60">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Planned Applications
                </h2>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={todoTitle}
                  onChange={(e) => setTodoTitle(e.target.value)}
                  placeholder="Company or role"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
                <textarea
                  value={todoNote}
                  onChange={(e) => setTodoNote(e.target.value)}
                  placeholder="Notes (where to apply, contact, etc.)"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  rows={3}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={todoDeadline}
                    onChange={(e) => setTodoDeadline(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  />
                  <input
                    type="text"
                    value={todoLink}
                    onChange={(e) => setTodoLink(e.target.value)}
                    placeholder="Application link"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  />
                </div>
                <button
                  onClick={addTodo}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  Add Planned Application
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {todos.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No planned applications yet.
                  </p>
                )}
                {todos
                  .slice()
                  .sort((a, b) => {
                    const aTime = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
                    const bTime = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
                    return aTime - bTime;
                  })
                  .slice(0, 2)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-3 transition-colors dark:border-gray-800 dark:bg-gray-950"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-white">
                            {t.title}
                          </div>
                          {t.note ? (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {t.note}
                            </div>
                          ) : null}
                          <div className="text-sm text-red-500 mt-2">
                            {t.deadline ? `Deadline: ${t.deadline}` : "No deadline"}
                          </div>
                          {t.link ? (
                            <a
                              href={t.link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-xs font-medium text-gray-700 hover:underline dark:text-blue-300 mt-1"
                            >
                              Open link
                            </a>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleTodo(t.id)}
                            className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:hover:bg-blue-950/40"
                          >
                            {t.done ? "Done" : "Mark done"}
                          </button>
                          <button
                            onClick={() => removeTodo(t.id)}
                            className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:hover:bg-red-950 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
