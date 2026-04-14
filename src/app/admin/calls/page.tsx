"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  Calendar,
  Download,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/status-badge";
import {
  downloadCsv,
  formatBoolForCsv,
  formatDurationForCsv,
  formatOutcomeForCsv,
  formatTimestampForCsv,
  toCsv,
} from "@/lib/csv";

type AdminCallRecord = {
  id: string;
  createdAt: string;
  start_timestamp: string | null;
  end_timestamp: string | null;
  duration_ms: number | null;
  caller_name: string | null;
  caller_phone: string | null;
  caller_email: string | null;
  intent: string | null;
  customer_type: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  appointment_booked: boolean | null;
  callback_requested: boolean | null;
  call_outcome: string | null;
  call_summary: string | null;
  call_successful: boolean | null;
  client: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

type ClientOption = {
  id: string;
  name: string;
  email: string;
};

type SortKey = "caller" | "status" | "duration" | "created";
type SortDir = "asc" | "desc";

type DateRange = "all" | "today" | "week" | "month" | "last30";

const PAGE_SIZE = 20;

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
  last30: "Last 30 days",
  all: "All time",
};

const STATUS_FILTERS: {
  key: string;
  label: string;
  dot: string;
  text: string;
  ring: string;
  bg: string;
}[] = [
  {
    key: "all",
    label: "All",
    dot: "bg-zinc-400",
    text: "text-foreground",
    ring: "border-white/10",
    bg: "bg-white/[0.04]",
  },
  {
    key: "booked",
    label: "Booked",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    ring: "border-emerald-400/25",
    bg: "bg-emerald-400/10",
  },
  {
    key: "follow_up",
    label: "Follow Up",
    dot: "bg-amber-400",
    text: "text-amber-300",
    ring: "border-amber-400/25",
    bg: "bg-amber-400/10",
  },
  {
    key: "info_only",
    label: "Info Only",
    dot: "bg-sky-400",
    text: "text-sky-300",
    ring: "border-sky-400/25",
    bg: "bg-sky-400/10",
  },
  {
    key: "unknown",
    label: "Unknown",
    dot: "bg-zinc-500",
    text: "text-zinc-300",
    ring: "border-white/10",
    bg: "bg-white/[0.04]",
  },
];

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const trimmed = String(value).trim();
  if (/^\d+$/.test(trimmed)) {
    const date = new Date(Number(trimmed));
    if (!Number.isNaN(date.getTime())) return date.toLocaleString();
  }
  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) return date.toLocaleString();
  return trimmed;
}

function formatDuration(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) return "—";
  const totalSeconds = Math.floor(value / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function parseTimestamp(call: AdminCallRecord): number {
  const iso = call.createdAt;
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

function withinDateRange(call: AdminCallRecord, range: DateRange): boolean {
  if (range === "all") return true;
  const t = parseTimestamp(call);
  if (t === 0) return false;

  const now = new Date();
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return t >= start.getTime();
  }
  if (range === "week") {
    // ISO-ish: treat Monday as week start.
    const start = new Date(now);
    const day = (start.getDay() + 6) % 7; // 0 = Monday
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return t >= start.getTime();
  }
  if (range === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return t >= start;
  }
  if (range === "last30") {
    const start = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    return t >= start;
  }
  return true;
}

const STATUS_ORDER: Record<string, number> = {
  booked: 0,
  follow_up: 1,
  info_only: 2,
  unknown: 3,
};

function compareCalls(
  a: AdminCallRecord,
  b: AdminCallRecord,
  key: SortKey
): number {
  switch (key) {
    case "caller": {
      const an = (a.caller_name || "").toLowerCase();
      const bn = (b.caller_name || "").toLowerCase();
      return an.localeCompare(bn);
    }
    case "status": {
      const ao = STATUS_ORDER[a.call_outcome || "unknown"] ?? 99;
      const bo = STATUS_ORDER[b.call_outcome || "unknown"] ?? 99;
      return ao - bo;
    }
    case "duration": {
      const ad = typeof a.duration_ms === "number" ? a.duration_ms : -1;
      const bd = typeof b.duration_ms === "number" ? b.duration_ms : -1;
      return ad - bd;
    }
    case "created":
    default:
      return parseTimestamp(a) - parseTimestamp(b);
  }
}

export default function AdminCallsPage() {
  return (
    <Suspense fallback={null}>
      <AdminCallsPageInner />
    </Suspense>
  );
}

function AdminCallsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialClientId = searchParams.get("clientId") || "all";

  const [calls, setCalls] = useState<AdminCallRecord[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState<string>(initialClientId);
  const [dateRange, setDateRange] = useState<DateRange>("all");

  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [page, setPage] = useState(1);

  // Keep `?clientId=` in the URL in sync so the filter is bookmarkable and
  // matches the link we get from /admin clicking a row.
  useEffect(() => {
    const qs = new URLSearchParams(searchParams.toString());
    const current = qs.get("clientId");
    if (clientFilter === "all") {
      if (current !== null) {
        qs.delete("clientId");
        const next = qs.toString();
        router.replace(next ? `/admin/calls?${next}` : "/admin/calls", {
          scroll: false,
        });
      }
    } else if (current !== clientFilter) {
      qs.set("clientId", clientFilter);
      router.replace(`/admin/calls?${qs.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientFilter]);

  // If URL changes from the outside (e.g. user edits it), sync state back.
  useEffect(() => {
    const fromUrl = searchParams.get("clientId") || "all";
    if (fromUrl !== clientFilter) setClientFilter(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function loadCalls() {
    setLoading(true);
    setError("");

    try {
      const [callsRes, clientsRes] = await Promise.all([
        fetch("/api/admin/calls", { cache: "no-store" }),
        fetch("/api/admin/clients", { cache: "no-store" }),
      ]);

      const callsText = await callsRes.text();
      let callsData: unknown = [];
      try {
        callsData = callsText ? JSON.parse(callsText) : [];
      } catch {
        callsData = [];
      }

      if (!callsRes.ok) {
        throw new Error(
          typeof callsData === "object" &&
            callsData &&
            "error" in (callsData as Record<string, unknown>)
            ? String((callsData as Record<string, unknown>).error)
            : `API /api/admin/calls failed (${callsRes.status})`
        );
      }

      setCalls(Array.isArray(callsData) ? (callsData as AdminCallRecord[]) : []);

      // Clients list is best-effort: a failure here shouldn't block the page.
      if (clientsRes.ok) {
        const clientsText = await clientsRes.text();
        try {
          const parsed = clientsText ? JSON.parse(clientsText) : [];
          if (Array.isArray(parsed)) {
            setClients(
              parsed.map((c: Record<string, unknown>) => ({
                id: String(c.id ?? ""),
                name: String(c.name ?? ""),
                email: String(c.email ?? ""),
              }))
            );
          }
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin calls");
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCalls();
  }, []);

  const filteredCalls = useMemo(() => {
    const q = search.trim().toLowerCase();
    return calls.filter((call) => {
      const matchesSearch =
        !q ||
        (call.caller_name || "").toLowerCase().includes(q) ||
        (call.caller_phone || "").toLowerCase().includes(q) ||
        (call.call_summary || "").toLowerCase().includes(q) ||
        (call.client?.name || "").toLowerCase().includes(q) ||
        (call.client?.email || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (call.call_outcome || "unknown") === statusFilter;

      const matchesClient =
        clientFilter === "all" || call.client?.id === clientFilter;

      const matchesDate = withinDateRange(call, dateRange);

      return matchesSearch && matchesStatus && matchesClient && matchesDate;
    });
  }, [calls, search, statusFilter, clientFilter, dateRange]);

  const sortedCalls = useMemo(() => {
    const copy = [...filteredCalls];
    copy.sort((a, b) => {
      const cmp = compareCalls(a, b, sortKey);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filteredCalls, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedCalls.length / PAGE_SIZE));

  const paginatedCalls = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedCalls.slice(start, start + PAGE_SIZE);
  }, [sortedCalls, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, clientFilter, dateRange, sortKey, sortDir]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function toggleSort(next: SortKey) {
    if (next === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(next);
      // Default direction per column — created defaults to newest first, the
      // others to natural reading order (A→Z, shortest→longest).
      setSortDir(next === "created" ? "desc" : "asc");
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setClientFilter("all");
    setDateRange("all");
  }

  const activeClient = useMemo(
    () => clients.find((c) => c.id === clientFilter) || null,
    [clients, clientFilter]
  );

  const anyFilterActive =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    clientFilter !== "all" ||
    dateRange !== "all";

  const rangeStart = sortedCalls.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(sortedCalls.length, page * PAGE_SIZE);

  function exportCsv() {
    const headers = [
      "Date",
      "Client Name",
      "Caller Name",
      "Caller Phone",
      "Caller Email",
      "Intent",
      "Outcome",
      "Summary",
      "Duration",
      "Booked",
      "Follow Up",
    ];

    const rows = sortedCalls.map((c) => [
      formatTimestampForCsv(c.createdAt),
      c.client?.name ?? "Unassigned",
      c.caller_name ?? "",
      c.caller_phone ?? "",
      c.caller_email ?? "",
      c.intent ?? "",
      formatOutcomeForCsv(c.call_outcome),
      c.call_summary ?? "",
      formatDurationForCsv(c.duration_ms),
      formatBoolForCsv(c.appointment_booked),
      formatBoolForCsv(c.callback_requested),
    ]);

    const csv = toCsv(headers, rows);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`admin-calls-${stamp}.csv`, csv);
  }

  function SortHeader({
    label,
    keyName,
    className = "",
  }: {
    label: string;
    keyName: SortKey;
    className?: string;
  }) {
    const active = sortKey === keyName;
    const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
    return (
      <th className={className}>
        <button
          type="button"
          onClick={() => toggleSort(keyName)}
          className={[
            "inline-flex items-center gap-1.5 transition",
            active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {label}
          <Icon
            className={[
              "h-3 w-3",
              active ? "text-indigo-300" : "opacity-60",
            ].join(" ")}
          />
        </button>
      </th>
    );
  }

  return (
    <AppShell
      variant="admin"
      title="All Calls"
      subtitle="Calls across every client, ordered by recency."
      actions={
        <>
          <button
            onClick={exportCsv}
            className="btn-secondary"
            disabled={loading || sortedCalls.length === 0}
            title="Export filtered calls to CSV"
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
      <div className="surface p-4 md:p-5">
        {/* Row 1: search + client dropdown + date range dropdown */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search caller, phone, client, email, or summary"
              className="input-base pl-9"
            />
          </div>

          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="input-base appearance-none pl-9"
            >
              <option value="all">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.email || c.id}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="input-base appearance-none pl-9"
            >
              {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((key) => (
                <option key={key} value={key}>
                  {DATE_RANGE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: prominent status filter as a button group */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/5 pt-4">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Status
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((s) => {
              const active = statusFilter === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatusFilter(s.key)}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
                    active
                      ? `${s.text} ${s.ring} ${s.bg} ring-1 ring-inset ring-current/20`
                      : "border-white/5 bg-white/[0.02] text-muted-foreground hover:border-white/10 hover:bg-white/[0.04] hover:text-foreground",
                  ].join(" ")}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                </button>
              );
            })}
          </div>

          {anyFilterActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          ) : null}
        </div>

        {activeClient ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-200">
            <Users className="h-3 w-3" />
            Showing calls for{" "}
            <span className="font-medium text-foreground">
              {activeClient.name || activeClient.email}
            </span>
            <button
              type="button"
              onClick={() => setClientFilter("all")}
              className="ml-1 text-indigo-200/80 hover:text-foreground"
              aria-label="Clear client filter"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Table */}
      <div className="mt-4">
        {loading ? (
          <div className="surface p-10 text-center text-sm text-muted-foreground">
            Loading calls…
          </div>
        ) : error ? (
          <div className="surface border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : paginatedCalls.length === 0 ? (
          <div className="surface p-10 text-center">
            <div className="text-sm font-medium">No calls found</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter.
            </div>
          </div>
        ) : (
          <>
            <div className="surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="surface-table">
                  <thead>
                    <tr>
                      <SortHeader label="Caller" keyName="caller" />
                      <th>Phone</th>
                      <th>Client</th>
                      <SortHeader label="Status" keyName="status" />
                      <SortHeader label="Duration" keyName="duration" />
                      <SortHeader label="Created" keyName="created" />
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCalls.map((call) => (
                      <tr key={call.id}>
                        <td className="font-medium">
                          {call.caller_name || "Unknown"}
                        </td>
                        <td className="text-muted-foreground">
                          {call.caller_phone || "—"}
                        </td>
                        <td>
                          {call.client?.id ? (
                            <button
                              type="button"
                              onClick={() => setClientFilter(call.client!.id)}
                              className="group text-left"
                              title="Filter by this client"
                            >
                              <div className="font-medium text-foreground transition group-hover:text-indigo-300">
                                {call.client.name || "Unnamed client"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {call.client.email || "—"}
                              </div>
                            </button>
                          ) : (
                            <>
                              <div className="font-medium">Unassigned</div>
                              <div className="text-xs text-muted-foreground">—</div>
                            </>
                          )}
                        </td>
                        <td>
                          <StatusBadge outcome={call.call_outcome} />
                        </td>
                        <td className="text-muted-foreground tabular-nums">
                          {formatDuration(call.duration_ms)}
                        </td>
                        <td className="text-muted-foreground">
                          {formatDateTime(call.createdAt)}
                        </td>
                        <td className="text-right">
                          <Link
                            href={`/admin/calls/${call.id}`}
                            className="btn-secondary inline-flex"
                          >
                            View
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="tabular-nums text-foreground">
                  {rangeStart}-{rangeEnd}
                </span>{" "}
                of{" "}
                <span className="tabular-nums text-foreground">
                  {sortedCalls.length}
                </span>{" "}
                {sortedCalls.length === 1 ? "call" : "calls"}
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden text-xs text-muted-foreground sm:inline">
                  Page {page} of {totalPages}
                </div>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
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
