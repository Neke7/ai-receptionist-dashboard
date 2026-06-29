"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Sparkles,
  UserMinus,
  UserPlus,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import AppointmentStatusBadge from "@/components/appointment-status-badge";
import { formatDateTime } from "@/lib/calls";
import {
  type Appointment,
  type ReasonBadge,
  type Suggestion,
  APPOINTMENT_STATUSES,
  appointmentStatusLabel,
  classifyReasons,
  isMatch,
  isUnassigned,
} from "@/lib/appointments";

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  );
}

function SkillPills({ skills }: { skills: string[] }) {
  if (!skills || skills.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {skills.map((s, i) => (
        <span
          key={`${s}-${i}`}
          className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-foreground"
        >
          {s}
        </span>
      ))}
    </div>
  );
}

/** A single "why suggested" badge. Positive reasons (skill/coverage matches)
 * get the indigo match color; the "outside service area" caution gets a distinct
 * amber warning style so it can't be misread as a plus. */
function ReasonBadge({ label, tone }: ReasonBadge) {
  if (tone === "warning") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
        <AlertTriangle className="h-3 w-3" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-400/20 bg-indigo-400/5 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
      <Sparkles className="h-3 w-3" />
      {label}
    </span>
  );
}

function SuggestionRow({
  s,
  selected,
  busy,
  onSelect,
}: {
  s: Suggestion;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
}) {
  // Each matchReason entry renders as its own badge, styled by tone (positive
  // skill/coverage match vs. an "outside service area" caution). Unmatched techs
  // have an empty array, so no badges show for them.
  const reasons = classifyReasons(s);
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={busy || selected}
      className={[
        "flex w-full items-start justify-between gap-3 rounded-md border p-3 text-left transition",
        selected
          ? "border-sky-400/30 bg-sky-400/5"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
        busy && !selected ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{s.name}</span>
          {reasons.map((r, i) => (
            <ReasonBadge key={`${r.label}-${i}`} label={r.label} tone={r.tone} />
          ))}
        </div>
        <SkillPills skills={s.skills} />
      </div>
      {selected ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-sky-300">
          <Check className="h-4 w-4" />
          Assigned
        </span>
      ) : (
        <span className="shrink-0 text-xs text-muted-foreground">Select</span>
      )}
    </button>
  );
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [loading, setLoading] = useState(true);
  const [appt, setAppt] = useState<Appointment | null>(null);

  // Assignment panel
  const [picking, setPicking] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState("");

  const [assignBusy, setAssignBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  async function loadAppointment() {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, { cache: "no-store" });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/suspended");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API /api/appointments/${id} failed (${res.status}) ${text}`);
      }

      const data: Appointment = await res.json();
      setAppt(data);
    } catch (e) {
      console.error(e);
      router.push("/appointments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadSuggestions() {
    setSuggestLoading(true);
    setSuggestError("");
    try {
      const res = await fetch(`/api/appointments/${id}/suggested-technicians`, {
        cache: "no-store",
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/suspended");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to load suggestions (${res.status}) ${text}`);
      }

      const data = await res.json();
      const list: Suggestion[] = Array.isArray(data?.suggestions)
        ? data.suggestions
        : [];
      setSuggestions(list);
    } catch (e) {
      setSuggestError(
        e instanceof Error ? e.message : "Could not load technician suggestions."
      );
    } finally {
      setSuggestLoading(false);
    }
  }

  function openPicker() {
    setActionError("");
    setPicking(true);
    if (!suggestions && !suggestLoading) {
      void loadSuggestions();
    }
  }

  /** PATCH the appointment and fold the returned record into local state so the
   * page reflects the change (incl. the auto status advance) without a reload. */
  async function patchAppointment(
    body: Record<string, unknown>
  ): Promise<boolean> {
    setActionError("");
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        router.push("/login");
        return false;
      }
      if (res.status === 403) {
        router.replace("/suspended");
        return false;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let msg = `Update failed (${res.status})`;
        try {
          const j = text ? JSON.parse(text) : null;
          if (j && typeof j === "object" && "error" in j) msg = String(j.error);
        } catch {
          // non-JSON body — keep the generic message
        }
        setActionError(msg);
        return false;
      }

      const data: Appointment = await res.json();
      setAppt(data);
      return true;
    } catch {
      setActionError("Could not reach the server. Please try again.");
      return false;
    }
  }

  async function handleAssign(technicianId: string) {
    setAssignBusy(true);
    const ok = await patchAppointment({ technicianId });
    if (ok) setPicking(false);
    setAssignBusy(false);
  }

  async function handleUnassign() {
    setAssignBusy(true);
    await patchAppointment({ technicianId: null });
    setAssignBusy(false);
  }

  async function handleStatusChange(status: string) {
    if (!appt || status === appt.status) return;
    setStatusBusy(true);
    await patchAppointment({ status });
    setStatusBusy(false);
  }

  if (loading || !appt) {
    return (
      <AppShell variant="client" title="Appointment">
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          Loading appointment…
        </div>
      </AppShell>
    );
  }

  const unassigned = isUnassigned(appt);
  const customer = appt.customer;
  const phone = customer?.phone?.trim() || "";
  const matched = (suggestions ?? []).filter(isMatch);
  const others = (suggestions ?? []).filter((s) => !isMatch(s));

  return (
    <AppShell
      variant="client"
      title={customer?.name?.trim() || customer?.phone?.trim() || "Appointment"}
      subtitle={appt.serviceType?.trim() || undefined}
      actions={
        <button
          onClick={() => router.push("/appointments")}
          className="btn-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      }
    >
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Status + dispatch signal */}
        <div className="flex items-center justify-between gap-3">
          <AppointmentStatusBadge status={appt.status} />
          {unassigned ? (
            <span className="text-xs text-amber-300">Needs a technician</span>
          ) : null}
        </div>

        {actionError ? (
          <div className="rounded-md border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-300">
            {actionError}
          </div>
        ) : null}

        {/* Appointment summary */}
        <div className="surface p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label="Customer">
              {customer?.name?.trim() || "—"}
            </InfoRow>
            <InfoRow label="Phone">
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="text-indigo-300 hover:underline break-all"
                >
                  {phone}
                </a>
              ) : (
                "—"
              )}
            </InfoRow>
            <InfoRow label="Service">
              {appt.serviceType?.trim() || "—"}
            </InfoRow>
            <InfoRow label="Service address">
              {appt.serviceAddress?.trim() ||
                (appt.serviceZip?.trim() ? `ZIP ${appt.serviceZip.trim()}` : "—")}
            </InfoRow>
            <InfoRow label="Starts">{formatDateTime(appt.startTime)}</InfoRow>
            <InfoRow label="Ends">{formatDateTime(appt.endTime)}</InfoRow>
          </div>
        </div>

        {/* Assignment */}
        <div className="surface p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Technician</h2>
            {!unassigned && !picking ? (
              <button
                type="button"
                onClick={handleUnassign}
                disabled={assignBusy}
                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <UserMinus className="h-4 w-4" />
                {assignBusy ? "Working…" : "Unassign"}
              </button>
            ) : null}
          </div>

          {/* Current assignment */}
          {!unassigned ? (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-sky-400/20 bg-sky-400/5 p-3">
              <Check className="h-4 w-4 shrink-0 text-sky-300" />
              <span className="text-sm text-foreground">
                Assigned to{" "}
                <span className="font-medium">
                  {appt.technician?.name ?? "a technician"}
                </span>
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No technician assigned yet.
            </p>
          )}

          {/* Picker toggle */}
          {!picking ? (
            <button
              type="button"
              onClick={openPicker}
              className="btn-primary mt-4 inline-flex"
            >
              <UserPlus className="h-4 w-4" />
              {unassigned ? "Assign technician" : "Change technician"}
            </button>
          ) : (
            <div className="mt-4 space-y-4">
              {suggestLoading ? (
                <div className="text-sm text-muted-foreground">
                  Finding technicians…
                </div>
              ) : suggestError ? (
                <div className="rounded-md border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-300">
                  {suggestError}
                  <button
                    type="button"
                    onClick={loadSuggestions}
                    className="ml-2 underline hover:text-rose-200"
                  >
                    Retry
                  </button>
                </div>
              ) : (suggestions ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No technicians available to assign.
                </div>
              ) : (
                <>
                  {matched.length > 0 ? (
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                        Suggested for this job
                      </div>
                      <div className="space-y-2">
                        {matched.map((s) => (
                          <SuggestionRow
                            key={s.id}
                            s={s}
                            selected={appt.technicianId === s.id}
                            busy={assignBusy}
                            onSelect={() => handleAssign(s.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {others.length > 0 ? (
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                        Other technicians
                      </div>
                      <div className="space-y-2">
                        {others.map((s) => (
                          <SuggestionRow
                            key={s.id}
                            s={s}
                            selected={appt.technicianId === s.id}
                            busy={assignBusy}
                            onSelect={() => handleAssign(s.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              <button
                type="button"
                onClick={() => setPicking(false)}
                disabled={assignBusy}
                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Manual status override */}
        <div className="surface p-6">
          <h2 className="text-sm font-semibold text-foreground">Status</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Assigning a technician advances this automatically. Override it here
            to mark the job completed, cancelled, or a no-show.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <select
              value={appt.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={statusBusy}
              className="input-base max-w-xs disabled:cursor-not-allowed disabled:opacity-40"
            >
              {APPOINTMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {appointmentStatusLabel(s)}
                </option>
              ))}
            </select>
            {statusBusy ? (
              <span className="text-xs text-muted-foreground">Saving…</span>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
