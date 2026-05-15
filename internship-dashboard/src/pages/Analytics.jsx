import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import ErrorBox from "../components/ErrorBox";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { getPlatformPerf, getResumePerf, getWeeklyTrend } from "../api/analytics";
import { formatLabel, safeText } from "../utils/uiHelpers";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function Analytics() {
  const [platform, setPlatform] = useState([]);
  const [resume, setResume] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function load() {
      setErr("");
      setLoading(true);
      try {
        const [p, r, w] = await Promise.all([
          getPlatformPerf(),
          getResumePerf(),
          getWeeklyTrend(),
        ]);
        setPlatform(Array.isArray(p) ? p : []);
        setResume(Array.isArray(r) ? r : []);
        setWeekly(Array.isArray(w) ? w : []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ✅ Map to your backend keys
  const platformData = useMemo(() => {
    return platform.map((x) => ({
      platform: !x.platform || x.platform === "UNKNOWN" ? "Manual / Unknown" : x.platform,
      total_apps: x.total_apps ?? 0,
      interviews: x.interviews ?? 0,
      offers: x.offers ?? 0,
    }));
  }, [platform]);

  const resumeData = useMemo(() => {
    return resume.map((x) => ({
      resume: x.resume_version || `Resume ${x.resume_slot}`,
      resume_slot: x.resume_slot ?? null,
      total_apps: x.total_apps ?? 0,
      progressed: x.progressed ?? 0,
      interviews: x.interviews ?? 0,
      offers: x.offers ?? 0,
      interview_rate_pct: x.interview_rate_pct ?? 0,
      offer_rate_pct: x.offer_rate_pct ?? 0,
    }));
  }, [resume]);

  const weeklyData = useMemo(() => {
    return weekly.map((x) => ({
      week_start: x.week_start ?? x.week ?? "week",
      applications: x.applications ?? 0,
    }));
  }, [weekly]);

  const topPlatform = useMemo(() => {
    if (platformData.length === 0) return "";
    const best = platformData.slice().sort((a, b) => {
      const bScore = b.interviews + b.offers;
      const aScore = a.interviews + a.offers;
      return bScore - aScore || b.total_apps - a.total_apps;
    })[0];
    return best?.platform || "";
  }, [platformData]);

  const topResume = useMemo(() => {
    if (resumeData.length === 0) return "";
    const best = resumeData.slice().sort((a, b) => {
      return (
        b.interview_rate_pct - a.interview_rate_pct ||
        b.interviews - a.interviews ||
        b.offers - a.offers
      );
    })[0];
    return best?.resume || "";
  }, [resumeData]);

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
          barAlt: "#60a5fa",
          barAlt2: "#93c5fd",
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
          barAlt: "#6b7280",
          barAlt2: "#9ca3af",
          cursor: "rgba(17, 24, 39, 0.08)",
        };
  }, [isDark]);

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-2xl font-semibold text-gray-800 dark:text-white">Analytics</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Charts (platform + weekly trend). Resume charts show when data exists.
        </div>

        <div className="mt-4">
          <ErrorBox message={err} />
        </div>

        {loading && <LoadingState text="Loading analytics..." />}

        {!loading ? (
          <>
          <div className="mb-6 mt-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
              Key Takeaways
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-white text-gray-700 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-100">
                Resume 1 currently has the best interview conversion.
              </div>

              <div className="border rounded-lg p-4 bg-white text-gray-700 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-100">
                Indeed applications are receiving the fastest responses.
              </div>

              <div className="border rounded-lg p-4 bg-white text-gray-700 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-100">
                Most activity occurred this week.
              </div>

              <div className="border rounded-lg p-4 bg-white text-gray-700 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-100">
                Applications in APPLIED stage are most likely to become overdue.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Platform */}
            <Card
              title="Platform Performance"
              subtitle="Compare interview and offer conversion across platforms."
            >
              {platformData.length === 0 ? (
                <>
                  <EmptyState
                    title="Not enough data yet"
                    subtitle="Analytics will appear once applications and stage data are available."
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    More applications are needed to generate meaningful analytics.
                  </p>
                </>
              ) : (
                <>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={platformData}>
                        <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                        <XAxis
                          dataKey="platform"
                          axisLine={false}
                          tick={false}
                          tickLine={false}
                        />
                        <YAxis tick={{ fill: chartColors.axis }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: chartColors.tooltipBg,
                            border: `1px solid ${chartColors.tooltipBorder}`,
                            borderRadius: "12px",
                            color: chartColors.tooltipLabel,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                          }}
                          labelStyle={{
                            color: chartColors.tooltipLabel,
                            fontWeight: 600,
                            marginBottom: "6px",
                          }}
                          itemStyle={{
                            color: chartColors.tooltipItem,
                            fontSize: "14px",
                          }}
                          cursor={{ fill: chartColors.cursor }}
                        />
                        <Bar dataKey="total_apps" name="Applications" fill={chartColors.bar} radius={[8, 8, 0, 0]} />
                        <Bar dataKey="interviews" name="Interviews" fill={chartColors.barAlt} radius={[8, 8, 0, 0]} />
                        <Bar dataKey="offers" name="Offers" fill={chartColors.barAlt2} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    Top performing platform: {topPlatform}
                  </p>
                  <SimpleTable rows={platformData} />
                </>
              )}
            </Card>

            {/* Resume */}
            <Card
              title="Resume Performance"
              subtitle="Identify which resume version performs better."
            >
              {resumeData.length === 0 ? (
                <>
                  <EmptyState
                    title="Not enough data yet"
                    subtitle="Add Resume Slot in applications to enable this view."
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    More applications are needed to generate meaningful analytics.
                  </p>
                </>
              ) : (
                <>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={resumeData}>
                        <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                        <XAxis dataKey="resume" tick={{ fill: chartColors.axis }} />
                        <YAxis tick={{ fill: chartColors.axis }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: chartColors.tooltipBg,
                            border: `1px solid ${chartColors.tooltipBorder}`,
                            borderRadius: "12px",
                            color: chartColors.tooltipLabel,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                          }}
                          labelStyle={{
                            color: chartColors.tooltipLabel,
                            fontWeight: 600,
                            marginBottom: "6px",
                          }}
                          itemStyle={{
                            color: chartColors.tooltipItem,
                            fontSize: "14px",
                          }}
                          cursor={{ fill: chartColors.cursor }}
                        />
                        <Bar dataKey="total_apps" name="Applications" fill={chartColors.bar} radius={[8, 8, 0, 0]} />
                        <Bar dataKey="interviews" name="Interviews" fill={chartColors.barAlt} radius={[8, 8, 0, 0]} />
                        <Bar dataKey="offers" name="Offers" fill={chartColors.barAlt2} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    Best performing resume: {topResume}
                  </p>
                  <SimpleTable rows={resumeData} />
                </>
              )}
            </Card>

            {/* Weekly */}
            <Card
              title="Weekly Trends"
              subtitle="Track consistency and application momentum over time."
            >
              {weeklyData.length === 0 ? (
                <>
                  <EmptyState
                    title="Not enough data yet"
                    subtitle="Weekly trends will appear once applications are captured."
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    More applications are needed to generate meaningful analytics.
                  </p>
                </>
              ) : (
                <>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                        <XAxis dataKey="week_start" tick={{ fill: chartColors.axis }} />
                        <YAxis tick={{ fill: chartColors.axis }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: chartColors.tooltipBg,
                            border: `1px solid ${chartColors.tooltipBorder}`,
                            borderRadius: "12px",
                            color: chartColors.tooltipLabel,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                          }}
                          labelStyle={{
                            color: chartColors.tooltipLabel,
                            fontWeight: 600,
                            marginBottom: "6px",
                          }}
                          itemStyle={{
                            color: chartColors.tooltipItem,
                            fontSize: "14px",
                          }}
                          cursor={{ fill: chartColors.cursor }}
                        />
                        <Bar dataKey="applications" name="Applications" fill={chartColors.bar} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <SimpleTable rows={weeklyData} />
                </>
              )}
            </Card>
          </div>
          </>
        ) : null}
      </div>
    </>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md transition-colors dark:border-gray-800 dark:bg-gray-900/60">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h2>
        {subtitle ? <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SimpleTable({ rows }) {
  if (!rows || rows.length === 0) return null;

  const cols = Object.keys(rows[0]).slice(0, 6);

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="min-w-full border-collapse bg-white dark:bg-gray-900/60">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-950">
            {cols.map((c) => (
              <th
                key={c}
                className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:border-gray-800 dark:text-gray-100"
              >
                {formatLabel(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 12).map((r, idx) => (
            <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
              {cols.map((c) => (
                <td key={c} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-100">
                  {safeText(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
