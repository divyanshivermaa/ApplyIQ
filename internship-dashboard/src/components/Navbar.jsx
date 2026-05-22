import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { logout } from "../api/auth";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/suggestions", label: "Suggestions" },
  { to: "/applications", label: "Applications" },
  { to: "/analytics", label: "Analytics" },
  { to: "/extension", label: "Extension" },
];

function NavItem({ to, label, onClick }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-blue-950/40"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [menuOpen, setMenuOpen] = useState(false);

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
    <div className="border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className="font-semibold text-gray-800 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 transition"
        >
          Internship Intelligence System
        </Link>

        <div className="hidden md:flex gap-2">
          {navItems.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} />
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-zinc-900 dark:text-gray-100 dark:hover:bg-zinc-800"
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900"
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
          >
            Logout
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="md:hidden rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-zinc-900 dark:text-gray-100 dark:hover:bg-zinc-800"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen ? (
        <div className="md:hidden border-t border-gray-200 bg-white/95 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/95">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} onClick={() => setMenuOpen(false)} />
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-zinc-900 dark:text-gray-100 dark:hover:bg-zinc-800"
            >
              {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            </button>
            <button
              type="button"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-zinc-900 dark:text-gray-100 dark:hover:bg-zinc-800"
              onClick={() => {
                logout();
                window.location.href = "/";
              }}
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
