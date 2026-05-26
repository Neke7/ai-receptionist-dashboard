"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Download,
  Mic,
  PhoneOff,
  RefreshCw,
  Search as SearchIcon,
  X,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/status-badge";
import { LeadTemperatureBadge } from "@/components/lead-temperature";
import {
  type CallRecord,
  type CallStatusFilter,
  filterCalls,
  formatDateTime,
  formatDuration,
  formatRelativeTime,
} from "@/lib/calls";
import {
  downloadCsv,
  formatBoolForCsv,
  formatDurationForCsv,
  formatOutcomeForCsv,
  formatTimestampForCsv,
  toCsv,
} from "@/lib/csv";

const PAGE_SIZE = 10;

const VALID_FILTERS: ReadonlyArray<CallStatusFilter> = [
  "all",
  "booked",
  "needs_callback",
  "follow_up",
  "info_only",
  "unknown",
];

function isValidFilter(value: string | null): value is CallStatusFilter {
  return value !== null && (VALID_FILTERS as readonly string[]).includes(value);
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
 * Mobile-first call card. Same visual design as the dashboard's RecentCallCard
 * — kept inline here rather than in src/components to honor the "no extra
 * files" constraint for this stage.
 */
function CallCard({ call }: { call: CallRecord }) {
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

function CallsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Honor deep links like /calls?filter=needs_callback (from the dashboard's
  // "Needs callback" stat card).
  const initialFilter = searchParams.get("filter");

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CallStatusFilter>(
    isValidFilter(initialFilter) ? initialFilter : "all"
  );
  const [page, setPage] = useState(1);

  async function loadCalls() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/calls", { cache: "no-store" });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      // Previously missing — /calls would just throw a generic error when the
      // backend returned 403 instead of bouncing the user to /suspended.
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

  // Pull the business name so the CSV export filename can include it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data && typeof data.name === "string") {
          setBusinessName(data.name);
        }
      } catch {
        // Filename will fall back to "calls-YYYY-MM-DD.csv".
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCalls = useMemo(
    () => filterCalls(calls, { search, status: statusFilter }),
    [calls, search, statusFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredCalls.length / PAGE_SIZE));

  const paginatedCalls = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCalls.slice(start, start + PAGE_SIZE);
  }, [filteredCalls, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function exportCsv() {
    const headers = [
      "Date",
      "Caller Name",
      "Caller Phone",
      "Caller Email",
      "Intent",
      "Outcome",
      "Lead Score",
      "Lead Temperature",
      "Summary",
      "Duration",
      "Booked",
      "Callback Requested",
      "Recording URL",
    ];

    const rows = calls.map((c) => [
      formatTimestampForCsv(c.createdAt),
      c.caller_name ?? "",
      c.caller_phone ?? "",
      c.caller_email ?? "",
      c.intent ?? "",
      formatOutcomeForCsv(c.call_outcome),
      typeof c.leadScore === "number" ? c.leadScore : "",
      c.leadTemperature
        ? c.leadTemperature.charAt(0).toUpperCase() + c.leadTemperature.slice(1)
        : "Unscored",
      c.call_summary ?? "",
      formatDurationForCsv(c.duration_ms),
      formatBoolForCsv(c.appointment_booked),
      formatBoolForCsv(c.callback_requested),
      c.recording_url ?? "",
    ]);

    const csv = toCsv(headers, rows);
    const stamp = new Date().toISOString().slice(0, 10);
    const slug = businessName.replace(/[^A-Za-z0-9]+/g, "");
    const prefix = slug ? `${slug}-` : "";
    downloadCsv(`${prefix}calls-${stamp}.csv`, csv);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  return (
    <AppShell
      variant="client"
      title="All Calls"
      subtitle="Search, filter, and review every Oxphi call."
      actions={
        <>
          <button
            onClick={exportCsv}
            className="btn-secondary"
            disabled={loading || calls.length === 0}
            title="Export all calls to CSV"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button onClick={loadCalls} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </>
      }
    >
      {/* Filters */}
      <div className="surface p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px]">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by caller, phone, intent, or summary"
              className="input-base pl-9"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CallStatusFilter)}
            className="input-base appearance-none"
          >
            <option value="all">All statuses</option>
            <option value="booked">Booked</option>
            <option value="needs_callback">Needs callback</option>
            <option value="follow_up">Follow up</option>
            <option value="info_only">Info only</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      {/* Body */}
      <div className="mt-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <CallCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="surface border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : calls.length === 0 ? (
          // Truly empty account — nothing the user could change to fix this.
          <div className="surface p-10 text-center">
            <PhoneOff className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-3 text-base font-medium text-foreground">
              No calls yet
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              When your AI receptionist captures a call, it&apos;ll show up right here.
            </div>
          </div>
        ) : paginatedCalls.length === 0 ? (
          // Filter excluded everything — actionable, so offer a Clear button.
          <div className="surface p-10 text-center">
            <SearchIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-3 text-base font-medium text-foreground">
              No matches
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter.
            </div>
            <button
              onClick={clearFilters}
              className="btn-secondary mt-4 inline-flex"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {paginatedCalls.map((call) => (
                <CallCard key={call.id} call={call} />
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
                      <th>Duration</th>
                      <th>Created</th>
                      <th className="text-right" aria-label="Open" />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCalls.map((call) => (
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
                        <td className="text-muted-foreground">
                          {formatDuration(call.duration_ms)}
                        </td>
                        <td className="text-muted-foreground">
                          {formatDateTime(call.createdAt)}
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

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Showing page {page} of {totalPages} · {filteredCalls.length} total
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

/**
 * Wrapping CallsPageInner in <Suspense> is required by Next.js when a client
 * component reads useSearchParams — otherwise the static-generation pass
 * emits a CSR-bailout warning.
 */
export default function CallsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      }
    >
      <CallsPageInner />
    </Suspense>
  );
}
