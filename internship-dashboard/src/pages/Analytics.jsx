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

  const chartColors = useMemo(() => {
    return isDark
      ? {
          axis: "#e7c7d1",
          grid: "#3d0b1b",
          tooltipBg: "#1a1116",
          tooltipBorder: "#5d1129",
          tooltipLabel: "#f9f1f4",
          tooltipItem: "#e7c7d1",
          bar: "#8b1e3f",
          barAlt: "#5d1129",
          barAlt2: "#741734",
          cursor: "rgba(139, 30, 63, 0.10)",
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
          cursor: "rgba(139, 30, 63, 0.08)",
        };
  }, [isDark]);

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-2xl font-semibold text-gray-800 dark:text-wine-50">Analytics</div>
        <div className="text-sm text-gray-500 dark:text-wine-200/80 mt-1">
          Charts (platform + weekly trend). Resume charts show when data exists.
        </div>

        <div className="mt-4">
          <ErrorBox message={err} />
        </div>

        {loading && <LoadingState text="Loading analytics..." />}

        {!loading ? (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Platform */}
            <Card
              title="Platform Performance"
              subtitle="Compare applications and outcomes across platforms."
            >
              {platformData.length === 0 ? (
                <EmptyState
                  title="Not enough data yet"
                  subtitle="Analytics will appear once applications and stage data are available."
                />
              ) : (
                <>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={platformData}>
                        <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                        <XAxis dataKey="platform" tick={{ fill: chartColors.axis }} />
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
                  <SimpleTable rows={platformData} />
                </>
              )}
            </Card>

            {/* Resume */}
            <Card
              title="Resume Performance"
              subtitle="Compare application outcomes by resume slot."
            >
              {resumeData.length === 0 ? (
                <EmptyState
                  title="Not enough data yet"
                  subtitle="Add Resume Slot in applications to enable this view."
                />
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
                  <SimpleTable rows={resumeData} />
                </>
              )}
            </Card>

            {/* Weekly */}
            <Card
              title="Weekly Trend"
              subtitle="Track weekly application volume."
            >
              {weeklyData.length === 0 ? (
                <EmptyState
                  title="Not enough data yet"
                  subtitle="Weekly trends will appear once applications are captured."
                />
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
        ) : null}
      </div>
    </>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md transition-colors dark:border-wine-800 dark:bg-[#1a1116]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-wine-50">{title}</h2>
        {subtitle ? <p className="text-sm text-gray-500 dark:text-wine-200/80">{subtitle}</p> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SimpleTable({ rows }) {
  if (!rows || rows.length === 0) return null;

  const cols = Object.keys(rows[0]).slice(0, 6);

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-wine-800">
      <table className="min-w-full border-collapse bg-white dark:bg-[#1a1116]">
        <thead>
          <tr className="bg-gray-50 dark:bg-[#24131b]">
            {cols.map((c) => (
              <th
                key={c}
                className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:border-wine-800 dark:text-wine-100"
              >
                {formatLabel(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 12).map((r, idx) => (
            <tr key={idx} className="border-b border-gray-100 dark:border-wine-900">
              {cols.map((c) => (
                <td key={c} className="px-4 py-3 text-sm text-gray-700 dark:text-wine-100">
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
