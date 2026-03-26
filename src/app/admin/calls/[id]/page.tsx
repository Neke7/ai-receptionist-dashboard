"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type AdminCallRecord = {
  id: string;
  createdAt: string;
  retellCallId: string | null;
  agentId: string | null;
  caller_name: string | null;
  caller_phone: string | null;
  caller_email: string | null;
  intent: string | null;
  customer_type: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  notes: string | null;
  appointment_booked: boolean | null;
  callback_requested: boolean | null;
  call_outcome: string | null;
  call_summary: string | null;
  call_successful: boolean | null;
  start_timestamp: string | null;
  end_timestamp: string | null;
  duration_ms: number | null;
  recording_url: string | null;
  client: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

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

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatStatus(call: AdminCallRecord) {
  if (call.call_outcome === "booked") return "Booked";
  if (call.call_outcome === "follow_up") return "Follow Up";
  if (call.call_outcome === "info_only") return "Info Only";
  return "Unknown";
}

export default function AdminCallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [call, setCall] = useState<AdminCallRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCall() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/calls/${id}`, {
        cache: "no-store",
      });

      const text = await res.text();

      let data: unknown = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(
          typeof data === "object" &&
            data &&
            "error" in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).error)
            : `API /api/admin/calls/${id} failed (${res.status})`
        );
      }

      setCall((data as AdminCallRecord) || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load call");
      setCall(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCall();
  }, [id]);

  if (loading) {
    return <main style={{ padding: 24 }}>Loading call...</main>;
  }

  if (error || !call) {
    return (
      <main style={{ padding: 24 }}>
        <div
          style={{
            color: "crimson",
            border: "1px solid #f2c2c2",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          Error: {error || "Call not found"}
        </div>

        <button
          onClick={() => router.push("/admin/calls")}
          style={{
            border: "1px solid #111",
            borderRadius: 8,
            padding: "8px 12px",
            background: "#111",
            color: "white",
            cursor: "pointer",
          }}
        >
          Back to Admin Calls
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
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
            Admin Call Detail
          </h1>
          <p style={{ color: "#666" }}>
            Full call detail for admin review.
          </p>
        </div>

        <button
          onClick={() => router.push("/admin/calls")}
          style={{
            border: "1px solid #111",
            borderRadius: 8,
            padding: "8px 12px",
            background: "#111",
            color: "white",
            cursor: "pointer",
          }}
        >
          Back to Admin Calls
        </button>
      </div>

      <section
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Call Timing</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Started</div>
            <div>{formatDateTime(call.start_timestamp)}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Ended</div>
            <div>{formatDateTime(call.end_timestamp)}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Duration</div>
            <div>{formatDuration(call.duration_ms)}</div>
          </div>
        </div>

        {call.recording_url ? (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>
              Call Recording
            </div>
            <audio controls style={{ width: "100%" }}>
              <source src={call.recording_url} />
              Your browser does not support audio playback.
            </audio>
          </div>
        ) : null}
      </section>

      <section
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Client</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Client Name</div>
            <div>{call.client?.name || "Unassigned"}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Client Email</div>
            <div>{call.client?.email || "—"}</div>
          </div>
        </div>
      </section>

      <section
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Caller</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Name</div>
            <div>{call.caller_name || "Unknown"}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Phone</div>
            <div>{call.caller_phone || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Email</div>
            <div>{call.caller_email || "—"}</div>
          </div>
        </div>
      </section>

      <section
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Call Summary</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Status</div>
            <div>{formatStatus(call)}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Intent</div>
            <div>{call.intent || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Customer Type</div>
            <div>{call.customer_type || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Preferred Date</div>
            <div>{call.preferred_date || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Preferred Time</div>
            <div>{call.preferred_time || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Call Successful</div>
            <div>{call.call_successful ? "Yes" : "No"}</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Summary</div>
          <div>{call.call_summary || "—"}</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Notes</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{call.notes || "—"}</div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Appointment Booked</div>
            <div>{call.appointment_booked ? "Yes" : "No"}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Callback Requested</div>
            <div>{call.callback_requested ? "Yes" : "No"}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
