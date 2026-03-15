"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type CallRecord = {
  id: string;
  createdAt: string;
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

function formatStatus(call: CallRecord) {
  if (call.call_outcome === "booked") return "Booked";
  if (call.call_outcome === "follow_up") return "Follow Up";
  if (call.call_outcome === "info_only") return "Info Only";
  return "Unknown";
}

function formatIntent(intent: string | null) {
  if (!intent) return "unknown";
  return intent;
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function AdminClientCallsPage() {
  const params = useParams<{ id: string }>();
  const clientId = params?.id;

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCalls() {
    if (!clientId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/clients/${clientId}/calls`, {
        cache: "no-store",
      });

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
            : `Failed to load client calls (${res.status})`
        );
      }

      setCalls(Array.isArray(data) ? (data as CallRecord[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load client calls");
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCalls();
  }, [clientId]);

  const totals = useMemo(() => {
    return {
      total: calls.length,
      booked: calls.filter((c) => c.call_outcome === "booked").length,
      followUp: calls.filter((c) => c.call_outcome === "follow_up").length,
      infoOnly: calls.filter((c) => c.call_outcome === "info_only").length,
    };
  }, [calls]);

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            Client Calls
          </h1>
          <p style={{ color: "#666" }}>
            Viewing calls for client ID: {clientId}
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
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
            href="/admin"
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: "8px 12px",
              background: "white",
              textDecoration: "none",
              color: "black",
            }}
          >
            Back to Admin
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
          <div style={{ color: "#666", marginBottom: 6 }}>Total</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totals.total}</div>
        </div>
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
          <div style={{ color: "#666", marginBottom: 6 }}>Booked</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totals.booked}</div>
        </div>
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
          <div style={{ color: "#666", marginBottom: 6 }}>Follow Up</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totals.followUp}</div>
        </div>
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
          <div style={{ color: "#666", marginBottom: 6 }}>Info Only</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totals.infoOnly}</div>
        </div>
      </div>

      {loading ? (
        <div>Loading calls...</div>
      ) : error ? (
        <div style={{ color: "crimson", border: "1px solid #f2c2c2", padding: 12, borderRadius: 8 }}>
          Error: {error}
        </div>
      ) : calls.length === 0 ? (
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
          No calls found for this client yet.
        </div>
      ) : (
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f8f8", textAlign: "left" }}>
                <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Caller</th>
                <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Phone</th>
                <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Status</th>
                <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Intent</th>
                <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Created</th>
                <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Summary</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
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
                    {formatIntent(call.intent)}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                    {formatCreatedAt(call.createdAt)}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee", maxWidth: 420 }}>
                    {call.call_summary || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}