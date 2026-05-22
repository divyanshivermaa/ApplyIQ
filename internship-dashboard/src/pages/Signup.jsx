import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import { getToken } from "../api/client";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) navigate("/dashboard", { replace: true });
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMsg("");

    if (name.trim().length < 2) {
      setMsg("Please enter your name.");
      return;
    }

    if (!email.includes("@") || email.trim().length < 5) {
      setMsg("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setMsg("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setMsg(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md transition-colors dark:border-gray-800 dark:bg-gray-900/60">
        <div className="text-xl font-semibold text-gray-800 dark:text-white">Create account</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Register a new account to track applications and view intelligence.
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-100">Name</label>
            <input
              className="mt-1 w-full border rounded-xl px-3 py-2 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 dark:text-gray-100">Email</label>
            <input
              className="mt-1 w-full border rounded-xl px-3 py-2 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 dark:text-gray-100">Password</label>
            <div className="relative mt-1">
              <input
                className="w-full border rounded-xl px-3 py-2 pr-10 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
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
            className="w-full rounded-xl bg-black py-2 text-white transition hover:bg-gray-900 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>

          {msg ? <div className="text-sm text-red-600 dark:text-red-300">{msg}</div> : null}
        </form>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-300">
            Log in.
          </Link>
        </div>
      </div>
    </div>
  );
}
