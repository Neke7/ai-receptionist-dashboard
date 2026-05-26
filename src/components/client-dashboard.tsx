"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarCheck,
  Clock,
  Info,
  Mic,
  Phone,
  PhoneCall,
  PhoneOff,
  RefreshCw,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/status-badge";
import { LeadTemperatureBadge } from "@/components/lead-temperature";
import {
  type CallRecord,
  type CallStats,
  computeStats,
  formatRelativeTime,
} from "@/lib/calls";

const RECENT_LIMIT = 10;

type StatCardProps = {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  href?: string;
};

function StatCard({ label, value, icon: Icon, accent, href }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground md:text-xs">
          {label}
        </div>
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md md:h-8 md:w-8 ${accent}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
        {value}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="surface block p-4 transition hover:border-white/15 md:p-5"
      >
        {body}
      </Link>
    );
  }
  return <div className="surface p-4 md:p-5">{body}</div>;
}

function StatCardSkeleton() {
  return (
    <div className="surface p-4 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="h-3 w-16 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-7 w-7 animate-pulse rounded-md bg-white/[0.06] md:h-8 md:w-8" />
      </div>
      <div className="mt-3 h-7 w-12 animate-pulse rounded bg-white/[0.06] md:h-8 md:w-16" />
    </div>
  );
}

function CallCardSkeleton() {
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-3 w-12 animate-pulse rounded bg-white/[0.06]" />
      </div>
      <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/[0.06]" />
      <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-white/[0.06]" />
      <div className="mt-3 flex gap-2">
        <div className="h-5 w-16 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="h-5 w-14 animate-pulse rounded-full bg-white/[0.06]" />
      </div>
    </div>
  );
}

/**
 * Mobile call card used by the recent-calls section. Same visual design as the
 * card on the /calls deep list. Wrap-the-whole-card-in-a-Link pattern keeps
 * the entire surface tappable; the phone link uses stopPropagation so a tap
 * dials instead of opening the detail page.
 */
function RecentCallCard({ call }: { call: CallRecord }) {
  return (
    <Link
      href={`/calls/${call.id}`}
      className="surface block p-4 transition hover:border-white/15"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-base font-semibold">
          {call.caller_name || "Unknown caller"}
        </div>
        <div className="shrink-0 text-xs text-muted-foreground">
          {formatRelativeTime(call.createdAt)}
        </div>
      </div>
      {call.caller_phone ? (
        <a
          href={`tel:${call.caller_phone}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 inline-block text-sm text-indigo-300 hover:underline"
        >
          {call.caller_phone}
        </a>
      ) : null}
      {call.call_summary ? (
        <div className="mt-2 line-clamp-2 text-sm text-foreground/80">
          {call.call_summary}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge outcome={call.call_outcome} />
        <LeadTemperatureBadge
          temperature={call.leadTemperature}
          score={call.leadScore}
          size="sm"
        />
        {call.recording_url ? (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-muted-foreground"
            title="Recording available"
          >
            <Mic className="h-3 w-3" />
            Recording
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export default function ClientDashboard() {
  const router = useRouter();

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCalls() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/calls", { cache: "no-store" });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/suspended");
        return;
      }

      const text = await res.text();
      let data: unknown = [];
      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        data = [];
      }

      if (!res.ok) {
        throw new Error(
          typeof data === "object" && data && "error" in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).error)
            : `API /api/calls failed (${res.status})`
        );
      }

      setCalls(Array.isArray(data) ? (data as CallRecord[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calls");
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCalls();
  }, []);

  const stats: CallStats = useMemo(() => computeStats(calls), [calls]);
  const recent = useMemo(() => calls.slice(0, RECENT_LIMIT), [calls]);

  return (
    <AppShell
      variant="client"
      title="Dashboard"
      subtitle="A live view of every call your AI receptionist captures."
      actions={
        <button onClick={loadCalls} className="btn-secondary">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      }
    >
      {/* Stats strip */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
          <StatCard
            label="This month"
            value={stats.thisMonth}
            icon={Phone}
            accent="bg-indigo-500/10 text-indigo-300"
          />
          <StatCard
            label="Total calls"
            value={stats.total}
            icon={BarChart3}
            accent="bg-violet-500/10 text-violet-300"
          />
          <StatCard
            label="Booked"
            value={stats.booked}
            icon={CalendarCheck}
            accent="bg-emerald-500/10 text-emerald-300"
          />
          <StatCard
            label="Needs callback"
            value={stats.needsCallback}
            icon={PhoneCall}
            accent="bg-amber-500/10 text-amber-300"
            href="/calls?filter=needs_callback"
          />
          <StatCard
            label="Follow up"
            value={stats.followUp}
            icon={Clock}
            accent="bg-yellow-500/10 text-yellow-300"
          />
          <StatCard
            label="Info only"
            value={stats.infoOnly}
            icon={Info}
            accent="bg-sky-500/10 text-sky-300"
          />
        </div>
      )}

      {/* Recent calls header */}
      <div className="mt-8 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent calls</h2>
        <Link
          href="/calls"
          className="inline-flex items-center gap-1 text-sm text-indigo-300 hover:underline"
        >
          View all calls
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Body */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CallCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="surface border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : recent.length === 0 ? (
        <div className="surface p-10 text-center">
          <PhoneOff className="mx-auto h-8 w-8 text-muted-foreground" />
          <div className="mt-3 text-base font-medium text-foreground">
            No calls yet
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            When your AI receptionist captures a call, it&apos;ll show up right here.
          </div>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {recent.map((call) => (
              <RecentCallCard key={call.id} call={call} />
            ))}
          </div>

          {/* Desktop table */}
          <div className="surface hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="surface-table">
                <thead>
                  <tr>
                    <th>Caller</th>
                    <th>Phone</th>
                    <th>Summary</th>
                    <th>Lead</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th className="text-right" aria-label="Open" />
                  </tr>
                </thead>
                <tbody>
                  {recent.map((call) => (
                    <tr
                      key={call.id}
                      onClick={() => router.push(`/calls/${call.id}`)}
                      className="cursor-pointer transition hover:bg-white/[0.02]"
                    >
                      <td className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{call.caller_name || "Unknown"}</span>
                          {call.recording_url ? (
                            <Mic
                              className="h-3.5 w-3.5 text-muted-foreground"
                              aria-label="Recording available"
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className="text-muted-foreground">
                        {call.caller_phone ? (
                          <a
                            href={`tel:${call.caller_phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-indigo-300 hover:underline"
                          >
                            {call.caller_phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-muted-foreground">
                        <div
                          className="line-clamp-1 max-w-xs"
                          title={call.call_summary || ""}
                        >
                          {call.call_summary || "—"}
                        </div>
                      </td>
                      <td>
                        <LeadTemperatureBadge
                          temperature={call.leadTemperature}
                          score={call.leadScore}
                          size="sm"
                        />
                      </td>
                      <td>
                        <StatusBadge outcome={call.call_outcome} />
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {formatRelativeTime(call.createdAt)}
                      </td>
                      <td className="text-right">
                        <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
