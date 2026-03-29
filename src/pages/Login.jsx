import { useState } from "react";
import { login } from "../api/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      await login(email, password);
      setMsg("Login success. Open Suggestions page now.");
      window.location.href = "/suggestions";
    } catch (err) {
      setMsg(`Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", fontFamily: "system-ui" }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        />

        <label>Password</label>
        <div style={{ position: "relative", margin: "6px 0 12px" }}>
          <input
            value={password}
            type={showPassword ? "text" : "password"}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            style={{ width: "100%", padding: "10px 38px 10px 10px" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              padding: 4,
              cursor: "pointer",
              opacity: 0.7,
            }}
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

        <button disabled={loading} style={{ padding: 10, width: "100%" }}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      <p style={{ opacity: 0.7, marginTop: 18 }}>
        Note: This uses Bearer token auth. Token is stored in localStorage.
      </p>
    </div>
  );
}
