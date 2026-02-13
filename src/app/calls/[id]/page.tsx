"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
};

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:3001";

function normalizeOutcome(
  call_outcome: string | null | undefined,
  appointment_booked: boolean | null | undefined
): CallOutcome {
  const raw = (call_outcome || "").trim().toLowerCase();

  if (raw === "booked") return "booked";
  if (raw === "info_only" || raw === "info only") return "info_only";
  if (raw === "follow_up" || raw === "follow up") return "follow_up";

  // If outcome not set, derive from appointment_booked:
  if (appointment_booked === true) return "booked";
  if (appointment_booked === false) return "info_only";

  return "unknown";
}

export default function CallDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [call, setCall] = useState<CallRecord | null>(null);

  // Editable form state
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

  const statusBadge = useMemo(() => {
    // Single source of truth: call_outcome (derived if needed)
    const outcome = normalizeOutcome(
      call?.call_outcome ?? form.call_outcome,
      call?.appointment_booked ?? form.appointment_booked
    );

    if (outcome === "booked") return { label: "Booked", variant: "default" as const };
    if (outcome === "info_only") return { label: "Info Only", variant: "secondary" as const };
    if (outcome === "follow_up") return { label: "Follow up", variant: "secondary" as const };
    return { label: "Unknown", variant: "secondary" as const };
  }, [call, form.call_outcome, form.appointment_booked]);

  async function loadCall() {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/calls/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load call");
      const data: CallRecord = await res.json();
      setCall(data);

      const derivedOutcome = normalizeOutcome(data.call_outcome, data.appointment_booked);

      // ✅ IMPORTANT: call_outcome appears exactly ONCE here (no duplicate key)
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
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  function setOutcome(outcome: CallOutcome) {
    // Keep appointment_booked consistent with outcome when user sets outcome buttons
    if (outcome === "booked") {
      setForm((f) => ({ ...f, call_outcome: outcome, appointment_booked: true }));
      return;
    }
    if (outcome === "info_only") {
      setForm((f) => ({ ...f, call_outcome: outcome, appointment_booked: false }));
      return;
    }
    // follow_up / unknown doesn't force appointment_booked
    setForm((f) => ({ ...f, call_outcome: outcome }));
  }

  function toggleAppointmentBooked(checked: boolean) {
    // If they check booked, ensure outcome becomes booked.
    // If they uncheck booked and outcome was booked, move to info_only.
    setForm((f) => {
      const nextOutcome =
        checked ? "booked" : f.call_outcome === "booked" ? "info_only" : f.call_outcome;
      return { ...f, appointment_booked: checked, call_outcome: nextOutcome };
    });
  }

  async function saveChanges() {
    setSaving(true);
    try {
      // ✅ IMPORTANT: call_outcome appears exactly ONCE here (no duplicate key)
      const res = await fetch(`${BACKEND}/api/calls/${id}`, {
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

      if (!res.ok) throw new Error("Save failed");
      await loadCall();
      alert("Saved ✅");
    } catch (e) {
      console.error(e);
      alert("Save failed. Check backend terminal for errors.");
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
      <AppShell title="Call Details">
        <Card>
          <CardHeader>
            <CardTitle>Loading call…</CardTitle>
          </CardHeader>
          <CardContent>Please wait.</CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Call Details">
      <div className="space-y-4">
        {/* Top row */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            ID: <span className="font-mono">{call.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            <Button variant="secondary" onClick={() => router.push("/")} disabled={saving}>
              Back
            </Button>
            <Button onClick={saveChanges} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        {/* Caller */}
        <Card>
          <CardHeader>
            <CardTitle>Caller</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Name</label>
              <Input
                value={form.caller_name}
                onChange={(e) => setForm({ ...form, caller_name: e.target.value })}
                placeholder="Caller name"
              />
            </div>
            <div>
              <label className="text-sm">Phone</label>
              <Input
                value={form.caller_phone}
                onChange={(e) => setForm({ ...form, caller_phone: e.target.value })}
                placeholder="+1-___-___-____"
              />
            </div>
            <div>
              <label className="text-sm">Email</label>
              <Input
                value={form.caller_email}
                onChange={(e) => setForm({ ...form, caller_email: e.target.value })}
                placeholder="name@company.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Booking / Intent */}
        <Card>
          <CardHeader>
            <CardTitle>Booking / Intent</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Intent</label>
              <Input
                value={form.intent}
                onChange={(e) => setForm({ ...form, intent: e.target.value })}
                placeholder="book_appointment"
              />
            </div>

            <div>
              <label className="text-sm">Customer type</label>
              <Input
                value={form.customer_type}
                onChange={(e) => setForm({ ...form, customer_type: e.target.value })}
                placeholder="new / returning"
              />
            </div>

            <div>
              <label className="text-sm">Preferred date</label>
              <Input
                value={form.preferred_date}
                onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                placeholder="YYYY-MM-DD"
              />
            </div>

            <div>
              <label className="text-sm">Preferred time</label>
              <Input
                value={form.preferred_time}
                onChange={(e) => setForm({ ...form, preferred_time: e.target.value })}
                placeholder="3:00 PM"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="text-sm">Appointment booked</label>
              <input
                type="checkbox"
                checked={form.appointment_booked}
                onChange={(e) => toggleAppointmentBooked(e.target.checked)}
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="text-sm">Callback requested</label>
              <input
                type="checkbox"
                checked={form.callback_requested}
                onChange={(e) => setForm({ ...form, callback_requested: e.target.checked })}
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="text-sm">Call successful</label>
              <input
                type="checkbox"
                checked={form.call_successful}
                onChange={(e) => setForm({ ...form, call_successful: e.target.checked })}
              />
            </div>
          </CardContent>

          <Separator />

          {/* Outcome / Notes / Summary */}
          <CardContent className="grid grid-cols-1 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm">Call outcome</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={form.call_outcome === "booked" ? "default" : "outline"}
                  onClick={() => setOutcome("booked")}
                >
                  Booked
                </Button>
                <Button
                  type="button"
                  variant={form.call_outcome === "info_only" ? "default" : "outline"}
                  onClick={() => setOutcome("info_only")}
                >
                  Info Only
                </Button>
                <Button
                  type="button"
                  variant={form.call_outcome === "follow_up" ? "default" : "outline"}
                  onClick={() => setOutcome("follow_up")}
                >
                  Follow up
                </Button>
                <Button
                  type="button"
                  variant={form.call_outcome === "unknown" ? "default" : "outline"}
                  onClick={() => setOutcome("unknown")}
                >
                  Unknown
                </Button>
              </div>

              {/* Keep a raw text input too (in case you want custom outcomes later) */}
              <Input
                value={form.call_outcome}
                onChange={(e) =>
                  setForm({
                    ...form,
                    call_outcome: (e.target.value.trim().toLowerCase() as CallOutcome) || "unknown",
                  })
                }
                placeholder="booked / info_only / follow_up"
              />
            </div>

            <div>
              <label className="text-sm">Notes</label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes from the call…"
              />
            </div>

            <div>
              <label className="text-sm">Summary</label>
              <Input
                value={form.call_summary}
                onChange={(e) => setForm({ ...form, call_summary: e.target.value })}
                placeholder="Short summary…"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}


