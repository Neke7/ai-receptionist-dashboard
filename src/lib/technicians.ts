/**
 * Shared technician (dispatch roster) helpers used by the /technicians pages.
 *
 * Pure TypeScript — no React imports. Parallels lib/customers.ts: the record
 * shape plus availability helpers live here so the list, add, and edit forms
 * share one source of truth.
 */

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const WEEKDAYS: Weekday[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export type DayHours = { open: string; close: string };

// Per-weekday hours; a null day means "off". A null map means "use the
// client's default business hours".
export type WeeklyAvailability = Record<Weekday, DayHours | null>;

export type Technician = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  skills: string[];
  serviceAreaZips: string[];
  active: boolean;
  availabilityJson: WeeklyAvailability | null;
  createdAt?: string | null;
};

/** "08:00" → "8 AM", "17:00" → "5 PM", "13:30" → "1:30 PM" — 12-hour display
 * only; drops minutes when :00. Does not change what's stored. */
function shortTime(t: string): string {
  const [h, m] = t.split(":");
  const hour24 = Number(h);
  const period = hour24 < 12 ? "AM" : "PM";
  const hr = hour24 % 12 || 12;
  return m && m !== "00" ? `${hr}:${m} ${period}` : `${hr} ${period}`;
}

/**
 * Human summary of a weekly availability map for roster display:
 * null / all-off → "Default hours"; a contiguous run of identical hours →
 * "Mon–Fri 8–5" (or "Mon 8–5" for a single day); anything else → "Custom".
 */
export function formatAvailability(av: WeeklyAvailability | null): string {
  if (!av) return "Default hours";
  const openDays = WEEKDAYS.filter((d) => av[d]);
  if (openDays.length === 0) return "Default hours";

  const first = av[openDays[0]]!;
  const sameHours = openDays.every(
    (d) => av[d]!.open === first.open && av[d]!.close === first.close
  );
  const indices = openDays.map((d) => WEEKDAYS.indexOf(d));
  const contiguous = indices.every(
    (n, i) => i === 0 || n === indices[i - 1] + 1
  );

  if (sameHours && contiguous) {
    const lo = WEEKDAY_LABELS[openDays[0]];
    const hi = WEEKDAY_LABELS[openDays[openDays.length - 1]];
    const range = openDays.length === 1 ? lo : `${lo}–${hi}`;
    return `${range} ${shortTime(first.open)}–${shortTime(first.close)}`;
  }
  return "Custom";
}

/** Expand a (possibly null) availability map into an always-present 7-day grid
 * of string fields for editing. Empty strings mean the day is off. */
export function availabilityToGrid(
  av: WeeklyAvailability | null
): Record<Weekday, DayHours> {
  const grid = {} as Record<Weekday, DayHours>;
  for (const d of WEEKDAYS) {
    const h = av?.[d];
    grid[d] = { open: h?.open ?? "", close: h?.close ?? "" };
  }
  return grid;
}

/** Collapse the editing grid back to the API shape. A day needs both open and
 * close to count; if no day has hours, the whole map is null (default hours). */
export function gridToAvailability(
  grid: Record<Weekday, DayHours>
): WeeklyAvailability | null {
  let any = false;
  const av = {} as WeeklyAvailability;
  for (const d of WEEKDAYS) {
    const open = grid[d].open.trim();
    const close = grid[d].close.trim();
    if (open && close) {
      av[d] = { open, close };
      any = true;
    } else {
      av[d] = null;
    }
  }
  return any ? av : null;
}
