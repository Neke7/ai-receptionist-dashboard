"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onLogin() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data?.error === "string" && data.error.trim()
            ? data.error
            : "Login failed. Please check your API key and try again."
        );
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to reach login service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with your API key to access the dashboard.
          </p>
        </div>

        <div className="surface p-6">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            API Key
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              placeholder="sk_••••••••"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading && apiKey.trim()) onLogin();
              }}
              className="input-base pl-9"
              autoFocus
            />
          </div>

          {error ? (
            <div className="mt-3 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <button
            onClick={onLogin}
            disabled={loading || !apiKey.trim()}
            className="btn-primary mt-4 w-full disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-indigo-400 hover:text-indigo-300"
          >
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Having trouble? Contact your account administrator.
        </p>
      </div>
    </div>
  );
}
