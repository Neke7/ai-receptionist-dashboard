/**
 * Shared call helpers used by the root dashboard and the deep /calls list.
 *
 * Pure TypeScript — no React imports. Anything that needs to render JSX (badges,
 * cards) stays in src/components.
 */

export type CallOutcome = "booked" | "follow_up" | "info_only" | "unknown";

/**
 * Field set returned by GET /api/calls. All fields are optional so the two
 * page-level CallRecord shapes (previously redeclared in each page) merge here
 * without forcing the backend to fill in every column.
 */
export type CallRecord = {
  id: string;
  createdAt: string;
  start_timestamp?: string | null;
  end_timestamp?: string | null;
  duration_ms?: number | null;
  caller_name?: string | null;
  caller_phone?: string | null;
  caller_email?: string | null;
  intent?: string | null;
  customer_type?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  appointment_booked?: boolean | null;
  callback_requested?: boolean | null;
  call_outcome?: string | null;
  call_summary?: string | null;
  call_successful?: boolean | null;
  recording_url?: string | null;
  leadScore?: number | null;
  leadTemperature?: "hot" | "warm" | "cold" | null;
};

export type CallStatusFilter =
  | "all"
  | "booked"
  | "follow_up"
  | "info_only"
  | "unknown"
  | "needs_callback";

export type CallFilter = {
  search: string;
  status: CallStatusFilter;
};

/**
 * Format an ISO string, unix-ms string, or Date-parseable value as a locale
 * datetime. Returns "—" for empty values so it can drop straight into a cell.
 */
export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const trimmed = String(value).trim();
  if (/^\d+$/.test(trimmed)) {
    const d = new Date(Number(trimmed));
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  }
  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  return trimmed;
}

/** Format duration_ms as a compact "Xm Ys" / "Xh Ym" string. */
export function formatDuration(ms?: number | null): string {
  if (typeof ms !== "number" || Number.isNaN(ms) || ms < 0) return "—";
  const totalSeconds = Math.floor(ms / 1000);
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

/**
 * Compact relative time used by the dashboard row "Time" column and the mobile
 * call cards. Examples: "Just now", "12m ago", "3h ago", "Yesterday", "May 24",
 * "May 24, 2025".
 */
export function formatRelativeTime(value?: string | null): string {
  if (!value) return "—";
  const trimmed = String(value).trim();
  const date = /^\d+$/.test(trimmed) ? new Date(Number(trimmed)) : new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (dayDiff === 1) return "Yesterday";

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Coerce any backend call_outcome value to the four canonical buckets. */
export function normalizeOutcome(outcome?: string | null): CallOutcome {
  const key = (outcome || "").toLowerCase();
  if (key === "booked" || key === "follow_up" || key === "info_only") return key;
  return "unknown";
}

/**
 * Apply the search + status filter used by both pages. Search matches against
 * caller name, phone, intent, and summary; status "needs_callback" is treated
 * as `callback_requested === true` rather than a call_outcome value.
 */
export function filterCalls(
  calls: CallRecord[],
  filter: CallFilter
): CallRecord[] {
  const q = filter.search.trim().toLowerCase();
  return calls.filter((call) => {
    if (q) {
      const haystack = [
        call.caller_name || "",
        call.caller_phone || "",
        call.intent || "",
        call.call_summary || "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (filter.status === "all") return true;
    if (filter.status === "needs_callback") return call.callback_requested === true;
    return normalizeOutcome(call.call_outcome) === filter.status;
  });
}

export type CallStats = {
  total: number;
  booked: number;
  followUp: number;
  infoOnly: number;
  needsCallback: number;
  thisMonth: number;
};

/**
 * Derived counts shown on the dashboard stats strip. "thisMonth" is computed
 * client-side from createdAt rather than from /api/auth/me's callsThisMonth so
 * it stays consistent with the call list the user is looking at.
 */
export function computeStats(calls: CallRecord[]): CallStats {
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  return {
    total: calls.length,
    booked: calls.filter((c) => normalizeOutcome(c.call_outcome) === "booked").length,
    followUp: calls.filter((c) => normalizeOutcome(c.call_outcome) === "follow_up")
      .length,
    infoOnly: calls.filter((c) => normalizeOutcome(c.call_outcome) === "info_only")
      .length,
    needsCallback: calls.filter((c) => c.callback_requested === true).length,
    thisMonth: calls.filter((c) => {
      const d = new Date(c.createdAt);
      return (
        !Number.isNaN(d.getTime()) &&
        d.getMonth() === curMonth &&
        d.getFullYear() === curYear
      );
    }).length,
  };
}
