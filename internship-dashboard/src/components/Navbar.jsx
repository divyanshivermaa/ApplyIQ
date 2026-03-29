import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { logout } from "../api/auth";

function NavItem({ to, label }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-black text-white dark:bg-wine-600 dark:text-white"
          : "text-gray-700 hover:bg-gray-100 dark:text-wine-100 dark:hover:bg-[#24131b]"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  return (
    <div className="border-b border-gray-200 bg-white/90 backdrop-blur dark:border-wine-900 dark:bg-[#120b0f]/95">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-semibold text-gray-800 dark:text-wine-50">Internship Intelligence System</div>
        <div className="flex gap-2">
          <NavItem to="/dashboard" label="Dashboard" />
          <NavItem to="/suggestions" label="Suggestions" />
          <NavItem to="/applications" label="Applications" />
          <NavItem to="/analytics" label="Analytics" />
          <NavItem to="/extension" label="Extension" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-wine-700 dark:bg-zinc-900 dark:text-wine-100 dark:hover:bg-zinc-800"
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-wine-700 dark:text-wine-100 dark:hover:bg-[#24131b]"
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
