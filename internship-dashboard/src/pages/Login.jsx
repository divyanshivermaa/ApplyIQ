import { useState } from "react";
import { login } from "../api/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      await login(email, password);
      window.location.href = "/dashboard";
    } catch (err) {
      setMsg(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0a0d] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md transition-colors dark:border-wine-800 dark:bg-[#1a1116]">
        <div className="text-xl font-semibold text-gray-800 dark:text-wine-50">Login</div>
        <div className="text-sm text-gray-500 dark:text-wine-200/80 mt-1">
          Use the same credentials as backend. (OAuth2PasswordRequestForm)
        </div>

        <form onSubmit={handle} className="mt-5 space-y-3">
          <div>
            <label className="text-sm text-gray-700 dark:text-wine-100">Email</label>
            <input
              className="mt-1 w-full border rounded-xl px-3 py-2 bg-white text-gray-800 dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm text-gray-700 dark:text-wine-100">Password</label>
            <div className="relative mt-1">
              <input
                className="w-full border rounded-xl px-3 py-2 pr-10 bg-white text-gray-800 dark:border-wine-700 dark:bg-[#24131b] dark:text-wine-100"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800 dark:text-wine-200 dark:hover:text-wine-50"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-black text-white py-2 hover:opacity-90 disabled:opacity-60 dark:bg-wine-600 dark:hover:bg-wine-500"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {msg ? <div className="text-sm text-red-600 dark:text-red-300">{msg}</div> : null}
        </form>
      </div>
    </div>
  );
}
