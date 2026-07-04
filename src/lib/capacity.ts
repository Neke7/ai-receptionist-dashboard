/**
 * Shared capacity helpers used by the /capacity page.
 *
 * Pure TypeScript — no React imports. Parallels lib/appointments.ts: the
 * response shape and small formatting helpers live here so the page stays a
 * thin view. Slot-time rendering reuses the app's 12-hour style (the same
 * `{ hour: "numeric", minute: "2-digit" }` used on the call detail page), not
 * formatDateTime (which is a full datetime, not a time-of-day).
 */

/** A single hour-by-hour capacity slot from GET /api/capacity. */
export type CapacitySlot = {
  slotStart: string;
  slotEnd: string;
  /** Technicians working during this slot. */
  capacity: number;
  /** Appointments booked into this slot. */
  demand: number;
  /** Remaining open coverage (capacity - demand). */
  available: number;
};

/** Roll-up totals for the selected day. */
export type CapacitySummary = {
  totalSlots: number;
  availableSlots: number;
  peakCapacity: number;
  techsWorkingToday: number;
};

/** Full GET /api/capacity response. A closed day returns slots:[] and
 *  summary.techsWorkingToday:0. */
export type CapacityResponse = {
  date: string;
  timezone: string;
  slots: CapacitySlot[];
  summary: CapacitySummary;
};

/** Local YYYY-MM-DD for today — the default date-picker value. Built from local
 *  calendar parts (not toISOString, which would shift across the UTC boundary). */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Format a single slot boundary as "8:00 AM" using the app's 12-hour style.
 *  Falls back to the raw value if it isn't Date-parseable. */
function formatSlotTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Format a slot's start/end as a range, e.g. "8:00 AM – 9:00 AM". */
export function formatSlotRange(start: string, end: string): string {
  return `${formatSlotTime(start)} – ${formatSlotTime(end)}`;
}

/** True when a slot is fully booked (demand has met or exceeded capacity) — the
 *  "no coverage left" signal that reads as full/red in the UI. */
export function isSlotFull(slot: Pick<CapacitySlot, "capacity" | "demand">): boolean {
  return slot.demand >= slot.capacity;
}
