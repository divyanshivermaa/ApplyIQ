export default function ActivitySummary({ applications = [] }) {
  const now = new Date();

  const applicationsThisWeek = applications.filter((app) => {
    const created = new Date(app.created_at || app.date_applied);
    const diff = (now - created) / (1000 * 60 * 60 * 24);

    return diff <= 7;
  }).length;

  const interviewsThisMonth = applications.filter((app) => {
    const created = new Date(app.created_at || app.date_applied);

    return (
      (app.stage || app.current_stage) === "INTERVIEW" &&
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  }).length;

  const uniqueWeeks = new Set();

  applications.forEach((app) => {
    const created = new Date(app.created_at || app.date_applied);

    const year = created.getFullYear();
    const week = Math.floor((created.getDate() - 1) / 7);

    uniqueWeeks.add(`${year}-${created.getMonth()}-${week}`);
  });

  const activeWeeks = uniqueWeeks.size;

  const currentWeekApplications = applications.filter((app) => {
    const created = new Date(app.created_at || app.date_applied);
    const diff = (now - created) / (1000 * 60 * 60 * 24);

    return diff <= 7;
  }).length;

  const lastWeekApplications = applications.filter((app) => {
    const created = new Date(app.created_at || app.date_applied);
    const diff = (now - created) / (1000 * 60 * 60 * 24);

    return diff > 7 && diff <= 14;
  }).length;

  let weeklyInsight = "You are building consistent application activity.";

  if (currentWeekApplications > lastWeekApplications) {
    weeklyInsight = `You applied to ${
      currentWeekApplications - lastWeekApplications
    } more role(s) than last week.`;
  } else if (currentWeekApplications < lastWeekApplications) {
    weeklyInsight = "Your application activity dropped compared to last week.";
  } else if (
    currentWeekApplications === lastWeekApplications &&
    currentWeekApplications > 0
  ) {
    weeklyInsight = "Your application activity remained consistent this week.";
  }

  return (
    <div className="border rounded-lg p-4 mb-6 bg-white dark:border-gray-800 dark:bg-gray-900/60">
      <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
        Activity Summary
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Applications This Week
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {applicationsThisWeek}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Interviews This Month
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {interviewsThisMonth}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Active Weeks
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {activeWeeks}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        {weeklyInsight}
      </p>
    </div>
  );
}
