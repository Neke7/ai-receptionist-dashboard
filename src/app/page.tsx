"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Info,
  PhoneCall,
  RefreshCw,
  Search,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/status-badge";

type CallRecord = {
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
};

const PAGE_SIZE = 10;

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

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  hint,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="surface p-5 transition hover:border-white/10">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">
            {value}
          </div>
          {hint ? (
            <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
          ) : null}
        </div>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const filteredCalls = useMemo(() => {
    const q = search.trim().toLowerCase();
    return calls.filter((call) => {
      const matchesSearch =
        !q ||
        (call.caller_name || "").toLowerCase().includes(q) ||
        (call.caller_phone || "").toLowerCase().includes(q) ||
        (call.intent || "").toLowerCase().includes(q) ||
        (call.call_summary || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (call.call_outcome || "unknown") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [calls, search, statusFilter]);

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

  const totals = useMemo(() => {
    return {
      total: calls.length,
      booked: calls.filter((c) => c.call_outcome === "booked").length,
      followUp: calls.filter((c) => c.call_outcome === "follow_up").length,
      infoOnly: calls.filter((c) => c.call_outcome === "info_only").length,
    };
  }, [calls]);

  return (
    <AppShell
      variant="client"
      title="Dashboard"
      subtitle="Real-time view of your Oxphi activity."
      actions={
        <button onClick={loadCalls} className="btn-secondary">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      }
    >
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Calls"
          value={totals.total}
          icon={PhoneCall}
          accent="bg-indigo-500/10 text-indigo-300"
        />
        <StatCard
          label="Booked"
          value={totals.booked}
          icon={CheckCircle2}
          accent="bg-emerald-500/10 text-emerald-300"
          hint={
            totals.total
              ? `${((totals.booked / totals.total) * 100).toFixed(0)}% of calls`
              : undefined
          }
        />
        <StatCard
          label="Follow Up"
          value={totals.followUp}
          icon={Calendar}
          accent="bg-amber-500/10 text-amber-300"
        />
        <StatCard
          label="Info Only"
          value={totals.infoOnly}
          icon={Info}
          accent="bg-sky-500/10 text-sky-300"
        />
      </div>

      {/* Filters */}
      <div className="surface mt-8 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by caller, phone, intent, or summary"
              className="input-base pl-9"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-base appearance-none"
          >
            <option value="all">All statuses</option>
            <option value="booked">Booked</option>
            <option value="follow_up">Follow Up</option>
            <option value="info_only">Info Only</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
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
            <div className="text-sm font-medium text-foreground">
              No calls found
            </div>
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
                      <th>Caller</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Duration</th>
                      <th>Created</th>
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
                          <StatusBadge outcome={call.call_outcome} />
                        </td>
                        <td className="text-muted-foreground">
                          {formatDuration(call.duration_ms)}
                        </td>
                        <td className="text-muted-foreground">
                          {formatDateTime(call.createdAt)}
                        </td>
                        <td className="text-right">
                          <Link
                            href={`/calls/${call.id}`}
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

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Showing page {page} of {totalPages} · {filteredCalls.length} total
              </div>
              <div className="flex items-center gap-2">
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
