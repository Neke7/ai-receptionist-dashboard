"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Mail,
  Sparkles,
} from "lucide-react";

type CreatedClient = {
  id: string;
  name: string;
  email: string;
  apiKey: string;
  retellAgentId: string | null;
  createdAt?: string;
};

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retellAgentId, setRetellAgentId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedClient | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in the required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          retellAgentId: retellAgentId.trim() || null,
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
        throw new Error(
          typeof data === "object" && data && "error" in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).error)
            : `Signup failed (${res.status})`
        );
      }

      setCreated(data as CreatedClient);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  async function copyApiKey() {
    if (!created?.apiKey) return;
    try {
      await navigator.clipboard.writeText(created.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
            {created ? (
              <CheckCircle2 className="h-5 w-5 text-white" />
            ) : (
              <Sparkles className="h-5 w-5 text-white" />
            )}
          </div>
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            {created ? "You're all set" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {created
              ? "Save your API key somewhere safe — it won't be shown again."
              : "Sign up to start handling calls with Callio."}
          </p>
        </div>

        {created ? (
          /* Success screen */
          <div className="surface p-6">
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-200">
              <span className="font-medium">Save this key now.</span>{" "}
              It is the only time we'll display it. If you lose it, an admin
              will need to rotate it for you.
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Your API Key
              </label>
              <div className="flex items-stretch gap-2">
                <div className="input-base flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs">
                  {created.apiKey}
                </div>
                <button
                  type="button"
                  onClick={copyApiKey}
                  className="btn-secondary shrink-0"
                  title="Copy API key"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-white/5 pt-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Business
                  </div>
                  <div className="mt-1 text-sm">{created.name}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Email
                  </div>
                  <div className="mt-1 text-sm">{created.email}</div>
                </div>
              </div>
              {created.retellAgentId ? (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Retell Agent ID
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {created.retellAgentId}
                  </div>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="btn-primary mt-6 w-full"
            >
              Go to login
            </button>
          </div>
        ) : (
          /* Signup form */
          <form onSubmit={handleSubmit} className="surface p-6">
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Business name
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Acme Dental"
                    className="input-base pl-9"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@acme.com"
                    className="input-base pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Password
                  <span className="ml-1 text-muted-foreground/70 font-normal">
                    (used to generate your API key)
                  </span>
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-base pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Retell Agent ID
                  <span className="ml-1 text-muted-foreground/70 font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  value={retellAgentId}
                  onChange={(e) => setRetellAgentId(e.target.value)}
                  placeholder="agent_..."
                  className="input-base font-mono text-xs"
                />
              </div>
            </div>

            {error ? (
              <div className="mt-3 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim() || !password}
              className="btn-primary mt-4 w-full disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>
        )}

        {!created ? (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-400 hover:text-indigo-300"
            >
              Login
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
