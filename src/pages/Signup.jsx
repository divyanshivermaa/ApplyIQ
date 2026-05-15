import { useState } from "react";
import { Link } from "react-router-dom";
import { register } from "../api/auth";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setMsg("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      setMsg("Name must be at least 2 characters.");
      return;
    }
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setMsg("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setMsg("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await register(trimmedName, trimmedEmail, password);
      setMsg("Signup complete. Redirecting to dashboard...");
      window.location.href = "/dashboard";
    } catch (err) {
      setMsg(`Signup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", fontFamily: "system-ui" }}>
      <h2>Sign up</h2>
      <form onSubmit={handleSignup}>
        <label>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        />

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
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      <p style={{ opacity: 0.7, marginTop: 18 }}>
        Already have an account? <a href="/login" style={{ color: "#2563eb", textDecoration: "underline" }}>Login</a>.
      </p>
    </div>
  );
}
