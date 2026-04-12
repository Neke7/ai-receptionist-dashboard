"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Info,
  PhoneCall,
  RefreshCw,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/status-badge";

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

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">
            {value}
          </div>
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

export default function AdminClientCallsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
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
    <AppShell
      variant="admin"
      title="Client Calls"
      subtitle={`Calls for client ID: ${clientId}`}
      actions={
        <>
          <button onClick={loadCalls} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button onClick={() => router.push("/admin")} className="btn-secondary">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total"
          value={totals.total}
          icon={PhoneCall}
          accent="bg-indigo-500/10 text-indigo-300"
        />
        <StatCard
          label="Booked"
          value={totals.booked}
          icon={CheckCircle2}
          accent="bg-emerald-500/10 text-emerald-300"
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

      <div className="mt-6">
        {loading ? (
          <div className="surface p-10 text-center text-sm text-muted-foreground">
            Loading calls…
          </div>
        ) : error ? (
          <div className="surface border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : calls.length === 0 ? (
          <div className="surface p-10 text-center">
            <div className="text-sm font-medium">No calls yet</div>
            <div className="mt-1 text-sm text-muted-foreground">
              This client hasn&apos;t received any calls.
            </div>
          </div>
        ) : (
          <div className="surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="surface-table">
                <thead>
                  <tr>
                    <th>Caller</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Intent</th>
                    <th>Created</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
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
                        {call.intent || "—"}
                      </td>
                      <td className="text-muted-foreground">
                        {formatCreatedAt(call.createdAt)}
                      </td>
                      <td className="max-w-[420px] truncate text-muted-foreground">
                        {call.call_summary || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
