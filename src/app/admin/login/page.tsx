"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const text = await res.text();

      let data: unknown = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        setError(
          typeof data === "object" &&
            data &&
            "error" in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).error)
            : "Admin login failed"
        );
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 24,
          background: "white",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Admin Login
        </h1>

        <p style={{ color: "#666", marginBottom: 20 }}>
          Sign in to access the admin console.
        </p>

        {error ? (
          <div
            style={{
              color: "crimson",
              border: "1px solid #f2c2c2",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        ) : null}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || !username.trim() || !password}
          style={{
            width: "100%",
            border: "1px solid #111",
            borderRadius: 8,
            padding: "10px 12px",
            background: "#111",
            color: "white",
            cursor:
              loading || !username.trim() || !password ? "not-allowed" : "pointer",
            opacity: loading || !username.trim() || !password ? 0.7 : 1,
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </div>
    </main>
  );
}