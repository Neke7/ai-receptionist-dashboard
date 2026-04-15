"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/status-badge";
import { LeadScoreMeter } from "@/components/lead-temperature";

type CallOutcome = "booked" | "info_only" | "follow_up" | "unknown";

type CallRecord = {
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

  leadScore: number | null;
  leadTemperature: "hot" | "warm" | "cold" | null;
};

function normalizeOutcome(
  call_outcome: string | null | undefined,
  appointment_booked: boolean | null | undefined
): CallOutcome {
  const raw = (call_outcome || "").trim().toLowerCase();
  if (raw === "booked") return "booked";
  if (raw === "info_only" || raw === "info only") return "info_only";
  if (raw === "follow_up" || raw === "follow up") return "follow_up";
  if (appointment_booked === true) return "booked";
  if (appointment_booked === false) return "info_only";
  return "unknown";
}

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

function formatDuration(durationMs: number | null | undefined) {
  if (typeof durationMs !== "number" || Number.isNaN(durationMs)) return "—";
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2.5 cursor-pointer transition hover:bg-white/[0.04]">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-5 w-9 shrink-0 rounded-full border transition",
          checked
            ? "bg-indigo-500 border-indigo-400"
            : "bg-white/5 border-white/10",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition",
            checked ? "left-4" : "left-0.5",
          ].join(" ")}
        />
      </button>
    </label>
  );
}

export default function CallDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [call, setCall] = useState<CallRecord | null>(null);

  const [form, setForm] = useState({
    caller_name: "",
    caller_phone: "",
    caller_email: "",
    intent: "",
    customer_type: "",
    preferred_date: "",
    preferred_time: "",
    notes: "",
    appointment_booked: false,
    callback_requested: false,
    call_outcome: "unknown" as CallOutcome,
    call_summary: "",
    call_successful: false,
  });

  const outcomeForBadge = useMemo(() => {
    return normalizeOutcome(
      call?.call_outcome ?? form.call_outcome,
      call?.appointment_booked ?? form.appointment_booked
    );
  }, [call, form.call_outcome, form.appointment_booked]);

  async function loadCall() {
    setLoading(true);
    try {
      const res = await fetch(`/api/calls/${id}`, { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/trial-expired");
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API /api/calls/${id} failed (${res.status}) ${text}`);
      }

      const data: CallRecord = await res.json();
      setCall(data);

      const derivedOutcome = normalizeOutcome(data.call_outcome, data.appointment_booked);

      setForm({
        caller_name: data.caller_name ?? "",
        caller_phone: data.caller_phone ?? "",
        caller_email: data.caller_email ?? "",
        intent: data.intent ?? "",
        customer_type: data.customer_type ?? "",
        preferred_date: data.preferred_date ?? "",
        preferred_time: data.preferred_time ?? "",
        notes: data.notes ?? "",
        appointment_booked: Boolean(data.appointment_booked),
        callback_requested: Boolean(data.callback_requested),
        call_outcome: derivedOutcome,
        call_summary: data.call_summary ?? "",
        call_successful: Boolean(data.call_successful),
      });
    } catch (e) {
      console.error(e);
      alert("Could not load this call. Go back and try again.");
      router.push("/calls");
    } finally {
      setLoading(false);
    }
  }

  function setOutcome(outcome: CallOutcome) {
    if (outcome === "booked") {
      setForm((f) => ({ ...f, call_outcome: outcome, appointment_booked: true }));
      return;
    }
    if (outcome === "info_only") {
      setForm((f) => ({ ...f, call_outcome: outcome, appointment_booked: false }));
      return;
    }
    setForm((f) => ({ ...f, call_outcome: outcome }));
  }

  function toggleAppointmentBooked(checked: boolean) {
    setForm((f) => {
      const nextOutcome = checked
        ? "booked"
        : f.call_outcome === "booked"
        ? "info_only"
        : f.call_outcome;
      return { ...f, appointment_booked: checked, call_outcome: nextOutcome };
    });
  }

  async function saveChanges() {
    setSaving(true);
    try {
      const res = await fetch(`/api/calls/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caller_name: form.caller_name || null,
          caller_phone: form.caller_phone || null,
          caller_email: form.caller_email || null,
          intent: form.intent || null,
          customer_type: form.customer_type || null,
          preferred_date: form.preferred_date || null,
          preferred_time: form.preferred_time || null,
          notes: form.notes || null,
          appointment_booked: form.appointment_booked,
          callback_requested: form.callback_requested,
          call_outcome: form.call_outcome === "unknown" ? null : form.call_outcome,
          call_summary: form.call_summary || null,
          call_successful: form.call_successful,
        }),
      });

      if (res.status === 401) {
        window.location.reload();
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Save failed (${res.status}) ${text}`);
      }

      await loadCall();
    } catch (e) {
      console.error(e);
      alert("Save failed. Check backend logs.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !call) {
    return (
      <AppShell variant="client" title="Call Details">
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          Loading call…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      variant="client"
      title="Call Details"
      subtitle={`ID ${call.id}`}
      actions={
        <>
          <button
            onClick={() => router.push("/calls")}
            className="btn-secondary"
            disabled={saving}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button onClick={saveChanges} disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge outcome={outcomeForBadge} />
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
        {/* Left column: lead score + timing + recording */}
        <div className="space-y-5 lg:col-span-1">
          <SectionCard
            title="Lead Score"
            description="Automated score based on call outcome, contact info, and scheduling signals."
          >
            <LeadScoreMeter
              score={call.leadScore}
              temperature={call.leadTemperature}
            />
          </SectionCard>

          <SectionCard title="Call Timing">
            <div className="space-y-3">
              <Field label="Started">
                <input
                  readOnly
                  value={formatDateTime(call.start_timestamp)}
                  className="input-base"
                />
              </Field>
              <Field label="Ended">
                <input
                  readOnly
                  value={formatDateTime(call.end_timestamp)}
                  className="input-base"
                />
              </Field>
              <Field label="Duration">
                <input
                  readOnly
                  value={formatDuration(call.duration_ms)}
                  className="input-base"
                />
              </Field>
            </div>
          </SectionCard>

          {call.recording_url ? (
            <SectionCard title="Call Recording">
              <audio controls className="w-full">
                <source src={call.recording_url} />
                Your browser does not support audio playback.
              </audio>
            </SectionCard>
          ) : null}
        </div>

        {/* Right column: caller + booking */}
        <div className="space-y-5 lg:col-span-2">
          <SectionCard title="Caller">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Name">
                <input
                  value={form.caller_name}
                  onChange={(e) => setForm({ ...form, caller_name: e.target.value })}
                  placeholder="Caller name"
                  className="input-base"
                />
              </Field>
              <Field label="Phone">
                <input
                  value={form.caller_phone}
                  onChange={(e) => setForm({ ...form, caller_phone: e.target.value })}
                  placeholder="+1-___-___-____"
                  className="input-base"
                />
              </Field>
              <Field label="Email">
                <input
                  value={form.caller_email}
                  onChange={(e) => setForm({ ...form, caller_email: e.target.value })}
                  placeholder="name@company.com"
                  className="input-base"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Booking & Intent">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Intent">
                <input
                  value={form.intent}
                  onChange={(e) => setForm({ ...form, intent: e.target.value })}
                  placeholder="book_appointment"
                  className="input-base"
                />
              </Field>
              <Field label="Customer type">
                <input
                  value={form.customer_type}
                  onChange={(e) => setForm({ ...form, customer_type: e.target.value })}
                  placeholder="new / returning"
                  className="input-base"
                />
              </Field>
              <Field label="Preferred date">
                <input
                  value={form.preferred_date}
                  onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  className="input-base"
                />
              </Field>
              <Field label="Preferred time">
                <input
                  value={form.preferred_time}
                  onChange={(e) => setForm({ ...form, preferred_time: e.target.value })}
                  placeholder="3:00 PM"
                  className="input-base"
                />
              </Field>
            </div>

            <div className="mt-5 border-t border-white/5 pt-5">
              <Field label="Call outcome">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {([
                    { key: "booked", label: "Booked" },
                    { key: "info_only", label: "Info Only" },
                    { key: "follow_up", label: "Follow up" },
                    { key: "unknown", label: "Unknown" },
                  ] as const).map((o) => {
                    const active = form.call_outcome === o.key;
                    return (
                      <button
                        key={o.key}
                        type="button"
                        onClick={() => setOutcome(o.key)}
                        className={[
                          "rounded-md border px-3 py-2 text-sm font-medium transition",
                          active
                            ? "border-indigo-400/50 bg-indigo-500/10 text-indigo-200"
                            : "border-white/5 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
                        ].join(" ")}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                <Toggle
                  label="Appointment booked"
                  checked={form.appointment_booked}
                  onChange={toggleAppointmentBooked}
                />
                <Toggle
                  label="Callback requested"
                  checked={form.callback_requested}
                  onChange={(v) => setForm({ ...form, callback_requested: v })}
                />
                <Toggle
                  label="Call successful"
                  checked={form.call_successful}
                  onChange={(v) => setForm({ ...form, call_successful: v })}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Summary & Notes">
            <div className="space-y-3">
              <Field label="Summary">
                <input
                  value={form.call_summary}
                  onChange={(e) => setForm({ ...form, call_summary: e.target.value })}
                  placeholder="Short summary…"
                  className="input-base"
                />
              </Field>
              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notes from the call…"
                  rows={5}
                  className="input-base resize-y"
                />
              </Field>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
