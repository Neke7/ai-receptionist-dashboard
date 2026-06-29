/**
 * Shared appointment (dispatch) helpers used by the /appointments pages.
 *
 * Pure TypeScript — no React imports. Parallels lib/technicians.ts: the record
 * shape, the suggested-technician shape, and the status badge config live here
 * so the list and detail pages share one source of truth. Date/time rendering
 * reuses formatDateTime from lib/calls.ts (don't reinvent it here).
 */

export type AppointmentStatus =
  | "scheduled"
  | "assigned"
  | "completed"
  | "cancelled"
  | "no_show";

/** A folded customer reference as returned on an appointment. */
export type AppointmentCustomer = {
  id: string;
  name: string | null;
  phone: string | null;
};

/** A folded technician reference as returned on an appointment. */
export type AppointmentTechnician = {
  id: string;
  name: string;
};

export type Appointment = {
  id: string;
  customerId: string | null;
  callId: string | null;
  technicianId: string | null;
  calendarEventId: string | null;
  startTime: string | null;
  endTime: string | null;
  serviceType: string | null;
  serviceAddress: string | null;
  serviceZip: string | null;
  status: AppointmentStatus;
  customer: AppointmentCustomer | null;
  technician: AppointmentTechnician | null;
};

/** Structured ZIP-coverage flag the backend attaches to each suggestion:
 *   "exact"      → the tech's service area lists the appointment ZIP
 *   "covers_all" → the tech has no ZIP restriction (covers every area)
 *   "uncovered"  → the appointment ZIP is outside the tech's service area (a caution)
 *   null         → the appointment has no ZIP, so the signal is disabled
 * May be absent on older backend responses; treat absent as null. */
export type ZipMatch = "exact" | "covers_all" | "uncovered" | null;

/** A ranked technician suggestion for an appointment. matchScore >= 1 means the
 * tech's skills/area matched the service; suggestions arrive matched-first. */
export type Suggestion = {
  id: string;
  name: string;
  skills: string[];
  serviceAreaZips: string[];
  matchScore: number;
  // Backend returns these as arrays of strings (e.g. ["HVAC"], ["ac","tune-up"]).
  // Unmatched techs come back with an empty array, not null. Skill badges come
  // first, then a single ZIP badge ("Covers 77019" / "Outside service area").
  matchReason: string[];
  matchedTerms: string[];
  // Structured coverage flag (see ZipMatch). Drives warning styling on the ZIP
  // badge so we don't have to string-match the human-readable text.
  zipMatch?: ZipMatch;
};

/** A single "why suggested" badge, classified by tone so the UI can style
 * positive reasons (skill/coverage matches) apart from cautions. */
export type ReasonBadge = { label: string; tone: "positive" | "warning" };

/**
 * Split a suggestion's matchReason into individually-styled badges.
 *
 * Positive reasons (skill matches like "HVAC", coverage like "Covers 77019")
 * read as a plus; the lone "outside the service area" caution reads as a
 * warning. The structured zipMatch flag drives the warning detection — the
 * trailing ZIP badge on an "uncovered" tech is the caution — and we fall back
 * to matching the "Outside service area" text when the flag is absent.
 */
export function classifyReasons(
  s: Pick<Suggestion, "matchReason" | "zipMatch">
): ReasonBadge[] {
  const reasons = (Array.isArray(s.matchReason) ? s.matchReason : [])
    .map((r) => String(r).trim())
    .filter(Boolean);
  return reasons.map((label, i) => {
    const isTrailingZip = i === reasons.length - 1;
    const warning =
      (s.zipMatch === "uncovered" && isTrailingZip) ||
      label.toLowerCase() === "outside service area";
    return { label, tone: warning ? "warning" : "positive" };
  });
}

/** True when an appointment still needs a technician — the dispatch signal. */
export function isUnassigned(a: Pick<Appointment, "technicianId">): boolean {
  return !a.technicianId;
}

/** True when a suggestion is an actual skill/area match (vs. just an available
 * fallback technician listed below the matches). */
export function isMatch(s: Pick<Suggestion, "matchScore">): boolean {
  return (s.matchScore ?? 0) >= 1;
}

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "scheduled",
  "assigned",
  "completed",
  "cancelled",
  "no_show",
];

type BadgeStyle = {
  label: string;
  dot: string;
  text: string;
  ring: string;
  bg: string;
};

/**
 * Status badge styling per appointment status, mirroring the class shape used
 * by components/status-badge.tsx:
 *   scheduled  → amber  (needs a technician)
 *   assigned   → blue   (a tech is on it)
 *   completed  → green
 *   cancelled  → muted
 *   no_show    → muted
 */
const STATUS_STYLES: Record<AppointmentStatus, BadgeStyle> = {
  scheduled: {
    label: "Scheduled",
    dot: "bg-amber-400",
    text: "text-amber-300",
    ring: "border-amber-400/20",
    bg: "bg-amber-400/5",
  },
  assigned: {
    label: "Assigned",
    dot: "bg-sky-400",
    text: "text-sky-300",
    ring: "border-sky-400/20",
    bg: "bg-sky-400/5",
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    ring: "border-emerald-400/20",
    bg: "bg-emerald-400/5",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-zinc-500",
    text: "text-zinc-400",
    ring: "border-white/10",
    bg: "bg-white/5",
  },
  no_show: {
    label: "No-show",
    dot: "bg-zinc-500",
    text: "text-zinc-400",
    ring: "border-white/10",
    bg: "bg-white/5",
  },
};

/** Resolve the badge style for a status, falling back to the muted style for
 * any unexpected value. */
export function appointmentStatusStyle(status: string): BadgeStyle {
  return STATUS_STYLES[status as AppointmentStatus] ?? STATUS_STYLES.cancelled;
}

/** Human label for a status (e.g. for a <select> option). */
export function appointmentStatusLabel(status: string): string {
  return appointmentStatusStyle(status).label;
}
