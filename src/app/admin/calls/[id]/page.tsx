"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/status-badge";

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

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface p-6">
      <h3 className="mb-5 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm text-foreground">{value ?? "—"}</div>
    </div>
  );
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
      const res = await fetch(`/api/admin/calls/${id}`, { cache: "no-store" });
      const text = await res.text();

      let data: unknown = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(
          typeof data === "object" && data && "error" in (data as Record<string, unknown>)
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
    return (
      <AppShell variant="admin" title="Call Detail">
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          Loading call…
        </div>
      </AppShell>
    );
  }

  if (error || !call) {
    return (
      <AppShell
        variant="admin"
        title="Call Detail"
        actions={
          <button onClick={() => router.push("/admin/calls")} className="btn-secondary">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        }
      >
        <div className="surface border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error || "Call not found"}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      variant="admin"
      title="Call Detail"
      subtitle={`ID ${call.id}`}
      actions={
        <button onClick={() => router.push("/admin/calls")} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back to All Calls
        </button>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge outcome={call.call_outcome} />
        {call.callback_requested ? (
          <span className="badge">
            <span className="badge-dot bg-amber-400" />
            Callback requested
          </span>
        ) : null}
        {call.call_successful ? (
          <span className="badge">
            <span className="badge-dot bg-emerald-400" />
            Successful
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-1">
          <SectionCard title="Call Timing">
            <div className="space-y-4">
              <InfoRow label="Started" value={formatDateTime(call.start_timestamp)} />
              <InfoRow label="Ended" value={formatDateTime(call.end_timestamp)} />
              <InfoRow label="Duration" value={formatDuration(call.duration_ms)} />
            </div>
          </SectionCard>

          {call.recording_url ? (
            <SectionCard title="Recording">
              <audio controls className="w-full">
                <source src={call.recording_url} />
                Your browser does not support audio playback.
              </audio>
            </SectionCard>
          ) : null}

          <SectionCard title="Client">
            <div className="space-y-4">
              <InfoRow label="Name" value={call.client?.name || "Unassigned"} />
              <InfoRow label="Email" value={call.client?.email || "—"} />
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <SectionCard title="Caller">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <InfoRow label="Name" value={call.caller_name || "Unknown"} />
              <InfoRow label="Phone" value={call.caller_phone || "—"} />
              <InfoRow label="Email" value={call.caller_email || "—"} />
            </div>
          </SectionCard>

          <SectionCard title="Call Summary">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <InfoRow label="Intent" value={call.intent || "—"} />
              <InfoRow label="Customer Type" value={call.customer_type || "—"} />
              <InfoRow
                label="Call Successful"
                value={call.call_successful ? "Yes" : "No"}
              />
              <InfoRow label="Preferred Date" value={call.preferred_date || "—"} />
              <InfoRow label="Preferred Time" value={call.preferred_time || "—"} />
              <InfoRow
                label="Appointment Booked"
                value={call.appointment_booked ? "Yes" : "No"}
              />
            </div>

            <div className="mt-6 border-t border-white/5 pt-6">
              <InfoRow
                label="Summary"
                value={
                  call.call_summary ? (
                    <span className="whitespace-pre-wrap">{call.call_summary}</span>
                  ) : (
                    "—"
                  )
                }
              />
            </div>

            <div className="mt-6 border-t border-white/5 pt-6">
              <InfoRow
                label="Notes"
                value={
                  call.notes ? (
                    <span className="whitespace-pre-wrap">{call.notes}</span>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
