import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import ErrorBox from "../components/ErrorBox";
import { getPlatformPerf, getResumePerf, getWeeklyTrend } from "../api/analytics";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";

export default function Analytics() {
  const [platform, setPlatform] = useState([]);
  const [resume, setResume] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setErr("");
      setLoading(true);
      try {
        const [p, r, w] = await Promise.all([getPlatformPerf(), getResumePerf(), getWeeklyTrend()]);
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

  // Try to auto-detect common keys. If your backend uses different keys, tell me sample row and I'll map it.
  const platformChartData = useMemo(() => {
    return platform.map((x) => ({
      name: x.platform || x.name || "unknown",
      applied: x.applied_count ?? x.applied ?? x.total ?? 0,
      responded: x.responded_count ?? x.responded ?? x.responses ?? 0,
      rate: x.response_rate ?? x.rate ?? 0,
    }));
  }, [platform]);

  const resumeChartData = useMemo(() => {
    return resume.map((x) => ({
      name: x.resume_version || x.resume || x.name || "unknown",
      applied: x.applied_count ?? x.applied ?? x.total ?? 0,
      responded: x.responded_count ?? x.responded ?? x.responses ?? 0,
      rate: x.callback_rate ?? x.response_rate ?? x.rate ?? 0,
    }));
  }, [resume]);

  const weeklyChartData = useMemo(() => {
    return weekly.map((x) => ({
      week: x.week || x.week_start || x.label || "week",
      applied: x.applied_count ?? x.applied ?? x.total ?? 0,
      responded: x.responded_count ?? x.responded ?? 0,
    }));
  }, [weekly]);

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-2xl font-semibold">Analytics</div>
        <div className="text-sm text-gray-500 mt-1">Charts + tables (deterministic metrics)</div>

        <div className="mt-4">
          <ErrorBox message={err} />
        </div>

        {loading ? <Loading /> : null}

        {!loading ? (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card title="Platform Performance (Applied vs Responded)">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformChartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="applied" />
                    <Bar dataKey="responded" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <SimpleTable rows={platformChartData} />
            </Card>

            <Card title="Resume Performance (Applied vs Responded)">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resumeChartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="applied" />
                    <Bar dataKey="responded" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <SimpleTable rows={resumeChartData} />
            </Card>

            <Card title="Weekly Trend (Applied / Responded)">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyChartData}>
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="applied" />
                    <Line type="monotone" dataKey="responded" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <SimpleTable rows={weeklyChartData} />
            </Card>
          </div>
        ) : null}
      </div>
    </>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="font-semibold">{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SimpleTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-gray-500 mt-4">No data</div>;
  }

  const cols = Object.keys(rows[0]).slice(0, 5);

  return (
    <div className="mt-4 overflow-auto">
      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            {cols.map((c) => (
              <th key={c} className="text-left p-2 border">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 12).map((r, idx) => (
            <tr key={idx}>
              {cols.map((c) => (
                <td key={c} className="p-2 border">
                  {String(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
