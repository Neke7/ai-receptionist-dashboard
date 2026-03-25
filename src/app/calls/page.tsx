"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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

function formatStatus(call: CallRecord) {
  if (call.call_outcome === "booked") return "Booked";
  if (call.call_outcome === "follow_up") return "Follow Up";
  if (call.call_outcome === "info_only") return "Info Only";
  return "Unknown";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const trimmed = String(value).trim();

  if (/^\d+$/.test(trimmed)) {
    const date = new Date(Number(trimmed));
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }
  }

  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleString();
  }

  return trimmed;
}

function formatCreatedAt(value: string) {
  return formatDateTime(value);
}

function formatDuration(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) return "—";

  const totalSeconds = Math.floor(value / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${hours}h`;
}

function Sidebar() {
  const pathname = usePathname();

  function navStyle(href: string): React.CSSProperties {
    const active = pathname === href;
    return {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 12px",
      borderRadius: 8,
      textDecoration: "none",
      color: active ? "black" : "#666",
      background: active ? "#f3f4f6" : "transparent",
      fontWeight: active ? 600 : 400,
      marginBottom: 6,
    };
  }

  return (
    <aside
      style={{
        width: 240,
        borderRight: "1px solid #e5e5e5",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontSize: 12, textTransform: "uppercase", color: "#777" }}>
        Console
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, marginBottom: 24 }}>
        AI Receptionist
      </div>

      <nav style={{ marginBottom: 24 }}>
        <Link href="/" style={navStyle("/")}>
          <span>Dashboard</span>
          {pathname === "/" ? <span>•</span> : null}
        </Link>

        <Link href="/calls" style={navStyle("/calls")}>
          <span>Calls</span>
          {pathname === "/calls" ? <span>•</span> : null}
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#777", marginTop: 24 }}>
        Internal portal
      </div>
    </aside>
  );
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
          typeof data === "object" &&
            data &&
            "error" in (data as Record<string, unknown>)
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
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
              All Calls
            </h1>
            <p style={{ color: "#666" }}>
              Search, filter, and review all receptionist calls.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={loadCalls}
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: "8px 12px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>

            <Link
              href="/"
              style={{
                display: "inline-block",
                border: "1px solid #111",
                borderRadius: 8,
                padding: "8px 12px",
                background: "#111",
                color: "white",
                textDecoration: "none",
              }}
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <section
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 16,
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: 6 }}>Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by caller, phone, intent, or summary"
                style={{
                  width: "100%",
                  padding: 10,
                  border: "1px solid #ccc",
                  borderRadius: 8,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: 10,
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  background: "white",
                }}
              >
                <option value="all">All</option>
                <option value="booked">Booked</option>
                <option value="follow_up">Follow Up</option>
                <option value="info_only">Info Only</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>
        </section>

        {loading ? (
          <div>Loading calls...</div>
        ) : error ? (
          <div
            style={{
              color: "crimson",
              border: "1px solid #f2c2c2",
              borderRadius: 8,
              padding: 12,
            }}
          >
            Error: {error}
          </div>
        ) : paginatedCalls.length === 0 ? (
          <div
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              padding: 16,
            }}
          >
            No calls found for the current search/filter.
          </div>
        ) : (
          <>
            <div
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f8f8", textAlign: "left" }}>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Caller</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Phone</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Status</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Intent</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Started</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Duration</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Created</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCalls.map((call) => (
                    <tr key={call.id}>
                      <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                        {call.caller_name || "Unknown"}
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                        {call.caller_phone || "—"}
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                        {formatStatus(call)}
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                        {call.intent || "unknown"}
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                        {formatDateTime(call.start_timestamp)}
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                        {formatDuration(call.duration_ms)}
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                        {formatCreatedAt(call.createdAt)}
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                        <Link
                          href={`/calls/${call.id}`}
                          style={{
                            display: "inline-block",
                            border: "1px solid #111",
                            borderRadius: 8,
                            padding: "8px 12px",
                            background: "#111",
                            color: "white",
                            textDecoration: "none",
                          }}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ color: "#666" }}>
                Page {page} of {totalPages}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    padding: "8px 12px",
                    background: page === 1 ? "#f5f5f5" : "white",
                    color: page === 1 ? "#999" : "black",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Previous
                </button>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    padding: "8px 12px",
                    background: page === totalPages ? "#f5f5f5" : "white",
                    color: page === totalPages ? "#999" : "black",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
