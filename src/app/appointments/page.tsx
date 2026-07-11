"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CalendarDays, Plus, RefreshCw, UserX, X } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import AppointmentStatusBadge from "@/components/appointment-status-badge";
import { AppointmentForm, type AppointmentInput } from "@/components/appointment-form";
import { formatDateTime } from "@/lib/calls";
import { type Appointment, isUnassigned } from "@/lib/appointments";
import { todayISO } from "@/lib/capacity";

/** Browser/device timezone — the fallback when the business tz can't be read. */
function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";
  } catch {
    return "America/Chicago";
  }
}

/** A non-blocking post-create banner: a plain success, or an amber advisory when
 *  the backend flagged the slot may be occupied (the appointment WAS created). */
type Notice = { tone: "success" | "warning"; text: string };

type FilterKey = "all" | "needs" | "assigned";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "needs", label: "Needs assignment" },
  { key: "assigned", label: "Assigned" },
];

function customerName(a: Appointment): string {
  return a.customer?.name?.trim() || a.customer?.phone?.trim() || "Unknown customer";
}

/** Prominent "needs a tech" signal — same amber language as the scheduled badge. */
function UnassignedPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/5 px-2 py-0.5 text-xs font-medium text-amber-300">
      <UserX className="h-3 w-3" />
      Unassigned
    </span>
  );
}

function TechCell({ appt }: { appt: Appointment }) {
  if (isUnassigned(appt)) return <UnassignedPill />;
  return (
    <span className="text-foreground">{appt.technician?.name ?? "—"}</span>
  );
}

function AppointmentCardSkeleton() {
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-5 w-20 animate-pulse rounded-full bg-white/[0.06]" />
      </div>
      <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
    </div>
  );
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  const router = useRouter();
  const unassigned = isUnassigned(appt);
  return (
    <button
      type="button"
      onClick={() => router.push(`/appointments/${appt.id}`)}
      className={[
        "surface block w-full p-4 text-left transition hover:border-white/15",
        unassigned ? "border-l-2 border-l-amber-400/60" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-base font-semibold">{customerName(appt)}</div>
        <AppointmentStatusBadge status={appt.status} />
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        {formatDateTime(appt.startTime)}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">
          {appt.serviceType?.trim() || "—"}
        </span>
        <TechCell appt={appt} />
      </div>
    </button>
  );
}

export default function AppointmentsPage() {
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  // New-appointment panel state.
  const [showAdd, setShowAdd] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  // Business tz for the datetime echo/conversion (device tz until resolved), and
  // the calendar-connected preflight (null = unknown/checking).
  const [timeZone, setTimeZone] = useState<string>(() => deviceTimeZone());
  const [tzIsFallback, setTzIsFallback] = useState(true);
  const [calendarReady, setCalendarReady] = useState<boolean | null>(null);
  const [preflighted, setPreflighted] = useState(false);

  async function loadAppointments() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/appointments", { cache: "no-store" });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/suspended");
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
            : `API /api/appointments failed (${res.status})`
        );
      }

      setAppointments(Array.isArray(data) ? (data as Appointment[]) : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load appointments"
      );
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  // Resolve the business tz + calendar-connected status once, when the owner
  // first opens the panel (so we don't pay for it on every list view).
  useEffect(() => {
    if (!showAdd || preflighted) return;
    setPreflighted(true);

    (async () => {
      try {
        const r = await fetch("/api/calendar/status", { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          setCalendarReady(Boolean(j?.connected) && Boolean(j?.enabled));
        } else {
          setCalendarReady(null);
        }
      } catch {
        setCalendarReady(null);
      }

      try {
        const r = await fetch(
          `/api/capacity?date=${todayISO()}&slotMinutes=60`,
          { cache: "no-store" }
        );
        if (r.ok) {
          const j = await r.json();
          if (j?.timezone) {
            setTimeZone(j.timezone);
            setTzIsFallback(false);
          }
        }
      } catch {
        // Keep the device-tz fallback; the echo notes it.
      }
    })();
  }, [showAdd, preflighted]);

  async function handleCreate(values: AppointmentInput) {
    setAddSubmitting(true);
    setAddError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: values.phone,
          name: values.name || null,
          serviceType: values.serviceType || null,
          serviceAddress: values.serviceAddress || null,
          serviceZip: values.serviceZip || null,
          startTime: values.startTime,
          ...(values.durationMin != null
            ? { durationMin: values.durationMin }
            : {}),
        }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/suspended");
        return;
      }

      const text = await res.text().catch(() => "");
      let body: Record<string, unknown> | null = null;
      try {
        body = text ? (JSON.parse(text) as Record<string, unknown>) : null;
      } catch {
        body = null;
      }

      // 201 (with or without a warning) is SUCCESS — the appointment exists.
      if (res.ok) {
        const warning =
          body && typeof body.warning === "string" ? body.warning : "";
        setNotice(
          warning
            ? { tone: "warning", text: `Appointment created. Heads up — ${warning}` }
            : { tone: "success", text: "Appointment created." }
        );
        setShowAdd(false);
        await loadAppointments();
        return;
      }

      // 409 / 400 — keep the panel + fields, surface the backend message verbatim.
      setAddError(
        body && typeof body.error === "string"
          ? body.error
          : `Could not create appointment (${res.status}).`
      );
    } catch {
      setAddError("Could not create appointment. Please try again.");
    } finally {
      setAddSubmitting(false);
    }
  }

  const needsCount = useMemo(
    () => appointments.filter((a) => a.status === "scheduled" && isUnassigned(a)).length,
    [appointments]
  );

  const visible = useMemo(() => {
    if (filter === "needs") {
      return appointments.filter((a) => a.status === "scheduled" && isUnassigned(a));
    }
    if (filter === "assigned") {
      return appointments.filter((a) => !isUnassigned(a));
    }
    return appointments;
  }, [appointments, filter]);

  return (
    <AppShell
      variant="client"
      title="Appointments"
      subtitle="Your dispatch board — every booked job and who's covering it."
      actions={
        <>
          <button
            onClick={() => {
              setNotice(null);
              setAddError("");
              setShowAdd((s) => !s);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            New appointment
          </button>
          <button onClick={loadAppointments} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </>
      }
    >
      {/* Non-blocking post-create notice (success or amber advisory) */}
      {notice ? (
        <div
          className={[
            "mb-4 flex items-start justify-between gap-3 rounded-md border p-3 text-sm",
            notice.tone === "warning"
              ? "border-amber-400/20 bg-amber-400/5 text-amber-200"
              : "border-emerald-400/20 bg-emerald-400/5 text-emerald-200",
          ].join(" ")}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
            className="shrink-0 opacity-70 transition hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* New-appointment panel */}
      {showAdd ? (
        <div className="surface mb-4 p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            New appointment
          </h2>
          <AppointmentForm
            timeZone={timeZone}
            tzIsFallback={tzIsFallback}
            calendarReady={calendarReady}
            submitting={addSubmitting}
            error={addError}
            submitLabel="Create appointment"
            onSubmit={handleCreate}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      ) : null}

      {/* Filter chips */}
      {!loading && !error && appointments.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
                  active
                    ? "border-white/15 bg-white/5 text-foreground"
                    : "border-transparent bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
                ].join(" ")}
              >
                {f.label}
                {f.key === "needs" && needsCount > 0 ? (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400/15 px-1 text-[10px] font-semibold text-amber-300">
                    {needsCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Body */}
      <div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <AppointmentCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="surface border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : appointments.length === 0 ? (
          <div className="surface p-10 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-3 text-base font-medium text-foreground">
              No appointments yet
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              When your AI receptionist books a job, it&apos;ll show up here to
              dispatch.
            </div>
          </div>
        ) : visible.length === 0 ? (
          <div className="surface p-10 text-center text-sm text-muted-foreground">
            {filter === "needs"
              ? "Nothing waiting on a technician — every scheduled job has someone assigned."
              : "No appointments match this filter."}
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {visible.map((appt) => (
                <AppointmentCard key={appt.id} appt={appt} />
              ))}
            </div>

            {/* Desktop table */}
            <div className="surface hidden overflow-hidden md:block">
              <div className="overflow-x-auto">
                <table className="surface-table">
                  <thead>
                    <tr>
                      <th>Date &amp; time</th>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Technician</th>
                      <th>Status</th>
                      <th className="text-right" aria-label="Open" />
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((appt) => {
                      const unassigned = isUnassigned(appt);
                      return (
                        <tr
                          key={appt.id}
                          onClick={() => router.push(`/appointments/${appt.id}`)}
                          className={[
                            "cursor-pointer transition hover:bg-white/[0.02]",
                            unassigned ? "bg-amber-400/[0.03]" : "",
                          ].join(" ")}
                        >
                          <td className="whitespace-nowrap font-medium">
                            {formatDateTime(appt.startTime)}
                          </td>
                          <td>{customerName(appt)}</td>
                          <td className="text-muted-foreground">
                            {appt.serviceType?.trim() || "—"}
                          </td>
                          <td>
                            <TechCell appt={appt} />
                          </td>
                          <td>
                            <AppointmentStatusBadge status={appt.status} />
                          </td>
                          <td className="text-right">
                            <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
