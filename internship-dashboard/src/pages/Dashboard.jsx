import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ErrorBox from "../components/ErrorBox";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import StatCard from "../components/StatCard";
import { getInsights, getOverdueByStage } from "../api/analytics";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [insights, setInsights] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState([]);
  const [todoTitle, setTodoTitle] = useState("");
  const [todoNote, setTodoNote] = useState("");
  const [todoDeadline, setTodoDeadline] = useState("");
  const [todoLink, setTodoLink] = useState("");

  useEffect(() => {
    async function load() {
      setErr("");
      setLoading(true);
      try {
        const [i, o] = await Promise.all([getInsights(), getOverdueByStage()]);
        setInsights(Array.isArray(i) ? i : []);
        setOverdue(Array.isArray(o) ? o : []);
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
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-2xl font-semibold text-gray-800 dark:text-wine-50">Dashboard</div>
        <div className="text-sm text-gray-500 dark:text-wine-200/80 mt-1">
          Deterministic insights and overdue concentration.
        </div>

        <div className="mt-4">
          <ErrorBox message={err} />
        </div>

        {loading && <LoadingState text="Loading analytics..." />}

        {!loading ? (
          <>
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

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md transition-colors dark:border-wine-800 dark:bg-[#1a1116]">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-wine-50">
                    Manual Apply Notes
                  </h2>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={todoTitle}
                    onChange={(e) => setTodoTitle(e.target.value)}
                    placeholder="Company or role"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
                  />
                  <textarea
                    value={todoNote}
                    onChange={(e) => setTodoNote(e.target.value)}
                    placeholder="Notes (where to apply, contact, etc.)"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
                    rows={3}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={todoDeadline}
                      onChange={(e) => setTodoDeadline(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
                    />
                    <input
                      type="text"
                      value={todoLink}
                      onChange={(e) => setTodoLink(e.target.value)}
                      placeholder="Application link"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
                    />
                  </div>
                  <button
                    onClick={addTodo}
                    className="rounded-xl bg-wine-600 px-4 py-2 text-sm font-medium text-white hover:bg-wine-700"
                  >
                    Add Note
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {todos.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-wine-200/80">
                      No manual notes yet.
                    </div>
                  ) : (
                    todos.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-3 transition-colors dark:border-wine-800 dark:bg-[#24131b]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-800 dark:text-wine-50">
                              {t.title}
                            </div>
                            {t.note ? (
                              <div className="text-sm text-gray-600 dark:text-wine-200/80 mt-1">
                                {t.note}
                              </div>
                            ) : null}
                            <div className="text-xs text-gray-500 dark:text-wine-200/80 mt-2">
                              {t.deadline ? `Deadline: ${t.deadline}` : "No deadline"}
                            </div>
                            {t.link ? (
                              <a
                                href={t.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-xs font-medium text-blue-600 hover:underline dark:text-wine-300 mt-1"
                              >
                                Open link
                              </a>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleTodo(t.id)}
                              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-wine-700 dark:bg-[#1a1116] dark:text-wine-100 dark:hover:bg-[#311621]"
                            >
                              {t.done ? "Done" : "Mark done"}
                            </button>
                            <button
                              onClick={() => removeTodo(t.id)}
                              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-red-50 hover:text-red-600 dark:border-wine-700 dark:bg-[#1a1116] dark:text-wine-100 dark:hover:bg-red-950 dark:hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md transition-colors dark:border-wine-800 dark:bg-[#1a1116]">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-wine-50">Overdue by Stage</h2>
                  <p className="text-sm text-gray-500 dark:text-wine-200/80">Stage-wise bottleneck view.</p>
                </div>
                <div className="h-[320px] w-full">
                  {overdue.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center dark:border-wine-800 dark:bg-[#1a1116]">
                      <h3 className="text-xl font-semibold text-gray-700 dark:text-wine-50">
                        No overdue items right now
                      </h3>
                      <p className="mt-3 text-sm text-gray-500 dark:text-wine-200/80">
                        Overdue stage distribution will appear once follow-ups become overdue.
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overdue}>
                        <XAxis dataKey="stage" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8b1e3f" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md transition-colors dark:border-wine-800 dark:bg-[#1a1116]">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-wine-50">Insights</h2>
                  <p className="text-sm text-gray-500 dark:text-wine-200/80">Each insight cites its metric source.</p>
                </div>
                <div className="space-y-3">
                  {insights.length === 0 ? (
                    <EmptyState
                      title="Not enough data yet"
                      subtitle="Insights will appear once applications and stage data are available."
                    />
                  ) : (
                    insights.map((x) => (
                      (() => {
                        const text = String(x.insight || "").replaceAll("'UNKNOWN'", "'Manual / Unknown'");
                        return (
                          <div key={x.key} className="border border-gray-200 rounded-xl p-3 dark:border-wine-800">
                            <div className="font-medium text-gray-800 dark:text-wine-50">{x.title}</div>
                            <div className="text-sm text-gray-700 dark:text-wine-200/80 mt-1">{text}</div>
                            <div className="text-xs text-gray-500 dark:text-wine-200/80 mt-2">
                              Source: {x.metric_source}
                            </div>
                          </div>
                        );
                      })()
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
