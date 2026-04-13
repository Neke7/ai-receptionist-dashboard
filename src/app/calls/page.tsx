"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Download, RefreshCw, Search } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/status-badge";
import { LeadTemperatureBadge } from "@/components/lead-temperature";
import {
  downloadCsv,
  formatBoolForCsv,
  formatDurationForCsv,
  formatOutcomeForCsv,
  formatTimestampForCsv,
  toCsv,
} from "@/lib/csv";

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
  leadScore: number | null;
  leadTemperature: "hot" | "warm" | "cold" | null;
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

export default function CallsPage() {
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

  function exportCsv() {
    const headers = [
      "Date",
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

    const rows = calls.map((c) => [
      formatTimestampForCsv(c.createdAt),
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
    downloadCsv(`calls-${stamp}.csv`, csv);
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
      <div className="surface p-4">
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
                      <th>Lead</th>
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
                        <td>
                          <LeadTemperatureBadge
                            temperature={call.leadTemperature}
                            score={call.leadScore}
                          />
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
