"use client";

import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Calendar, Check, CheckCircle2 } from "lucide-react";

import AppShell from "@/components/layout/AppShell";

type CalendarStatus = {
  connected: boolean;
  enabled?: boolean;
  calendarId?: string | null;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  // Banner driven by the params the backend OAuth callback redirects back with.
  // Read from the URL directly (rather than useSearchParams) to avoid a Suspense
  // boundary.
  type Notice = "success" | "reconnect" | "connect" | null;
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const calendar = params.get("calendar");

    if (error === "reconnect") setNotice("reconnect");
    else if (error === "connect") setNotice("connect");
    else if (calendar === "connected") setNotice("success");
    else return; // no banner param → nothing to do, leave live status alone

    // A banner param means we just came back from the OAuth callback, so pull
    // the authoritative state to reflect the result of the connect attempt.
    loadStatus();

    // Strip the params so a refresh doesn't re-show the banner or re-fetch.
    window.history.replaceState({}, "", "/settings");
  }, []);

  async function loadStatus() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/calendar/status", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        throw new Error(`Status check failed (${res.status})`);
      }
      const data: CalendarStatus = await res.json();
      setStatus(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load calendar status."
      );
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    setError("");
    try {
      const res = await fetch("/api/calendar/disconnect", { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        throw new Error(`Disconnect failed (${res.status})`);
      }
      // Re-fetch so the UI reflects the backend's authoritative state.
      await loadStatus();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not disconnect calendar."
      );
    } finally {
      setDisconnecting(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  const connected = status?.connected === true;
  const enabled = status?.enabled === true;

  return (
    <AppShell variant="client" title="Settings">
      <div className="mx-auto max-w-xl">
        <section className="surface p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Google Calendar
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                When connected, Aria can book appointments directly on your
                Google Calendar during calls. When disconnected, calls fall back
                to taking a request for your team to confirm.
              </p>
            </div>
          </div>

          {/* Post-OAuth-callback banner */}
          {notice === "success" ? (
            <div className="mt-6 flex items-start gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Google Calendar connected successfully.</span>
            </div>
          ) : notice === "reconnect" ? (
            <div className="mt-6 flex items-start gap-2 rounded-md border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                We couldn&apos;t get calendar access. Google only grants it on a
                fresh approval — go to{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:text-amber-200"
                >
                  myaccount.google.com/permissions
                </a>
                , remove Oxphi, then click Connect again.
              </span>
            </div>
          ) : notice === "connect" ? (
            <div className="mt-6 flex items-start gap-2 rounded-md border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                We couldn&apos;t start the Google connection. Please try again.
              </span>
            </div>
          ) : null}

          {/* Body */}
          <div className="mt-6 border-t border-white/5 pt-6">
            {loading ? (
              <div className="text-sm text-muted-foreground">
                Loading calendar status…
              </div>
            ) : error ? (
              <div className="flex items-start gap-2 rounded-md border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : connected ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  {enabled ? (
                    <>
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1 text-xs font-medium text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Connected
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Aria can book appointments on your calendar during
                        calls.
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-2.5 py-1 text-xs font-medium text-amber-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        Booking paused
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Connected, but live booking is currently paused. New
                        bookings will fall back to a request your team confirms.
                        Reconnect to re-enable booking.
                      </p>
                    </>
                  )}
                  {status?.calendarId ? (
                    <p className="break-all text-xs text-muted-foreground">
                      {status.calendarId}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="btn-secondary shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                  Not connected
                </span>
                <a
                  href="/api/calendar/connect"
                  className="btn-primary inline-flex shrink-0 items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Connect Google Calendar
                </a>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
