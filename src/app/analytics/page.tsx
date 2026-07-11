"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";

import AppShell from "@/components/layout/AppShell";

// ============================================================
// Payload shape — GET /api/analytics (client-scoped, read-only).
// Mirrors the backend lib/analytics.js return. Rates are 0–1 decimals.
// ============================================================
type AnalyticsResponse = {
  meta: {
    clientId: string;
    timezone: string;
    callCount: number;
    firstCallAt: string | null;
    lastCallAt: string | null;
  };
  volumeWeekly: { weekStart: string; count: number }[];
  newCustomersWeekly: { weekStart: string; count: number }[];
  byDayOfWeek: { day: string; count: number }[];
  byOutcome: { value: string | null; count: number }[];
  byLeadTemperature: { value: string | null; count: number }[];
  avgCallDurationSec: number;
  conversion: {
    totalCalls: number;
    spam: number;
    qualifiedCalls: number;
    confirmed: number;
    softBooked: number;
    confirmedRate: number;
    softBookedRate: number;
  };
};

/** rate (0–1) → whole-percent string, e.g. 0.4626 → "46%". */
function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/** Short "Mon DD" from a "YYYY-MM-DD" date-only string, parsed as LOCAL parts
 *  (not Date(iso) which is UTC and can slip a day at the tz boundary). */
function shortWeek(dateOnly: string): string {
  const [y, m, d] = dateOnly.split("-").map(Number);
  if (!y || !m || !d) return dateOnly;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Short "Mon DD" from a full ISO datetime; "—" when null/unparseable. */
function shortDateTime(iso: string | null): string {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** snake_case / null outcome value → readable label. */
function outcomeLabel(value: string | null): string {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Fill color per outcome, matching /capacity's emerald(good)/rose(bad) language
 *  with neutral amber/sky/slate in between. Booked reads emerald. */
function outcomeFill(value: string | null): string {
  switch (value) {
    case "booked":
      return "bg-emerald-500/55";
    case "follow_up":
      return "bg-amber-500/55";
    case "info_only":
      return "bg-sky-500/55";
    case "filtered":
      return "bg-rose-500/45";
    default:
      return "bg-white/15";
  }
}

/** Fill color per lead temperature — hot(orange) → warm(amber) → cold(sky),
 *  with a muted grey for unscored. */
function tempFill(value: string | null): string {
  switch (value) {
    case "hot":
      return "bg-orange-500/55";
    case "warm":
      return "bg-amber-500/55";
    case "cold":
      return "bg-sky-500/55";
    default:
      return "bg-white/15";
  }
}

/** Avg talk time in seconds → "2m 01s". Callers guard the 0/null case; this
 *  always renders m + zero-padded s for a real duration. */
function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

// A small summary tile — the stat-row primitive (surface + muted label + big
// value), matching /capacity's summary and /admin/analytics' StatCard idiom.
function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
}

// A single labeled horizontal bar — the reusable bar primitive from /capacity
// (h-2 track, bg-white/[0.04], width% fill), with a label row above it.
function BarRow({
  label,
  count,
  widthPct,
  fill,
}: {
  label: string;
  count: number;
  widthPct: number;
  fill: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate text-foreground">{label}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{count}</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className={`h-full rounded-full ${fill}`}
          style={{ width: `${Math.max(widthPct, count > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}

// Section card wrapper — a titled .surface, the card primitive shared with
// /capacity. `emphasis` gives the centerpiece more breathing room + an accent.
function Card({
  title,
  subtitle,
  emphasis,
  children,
}: {
  title: string;
  subtitle?: string;
  emphasis?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={[
        "surface",
        emphasis ? "p-6 border-l-2 border-l-emerald-500/50" : "p-5",
      ].join(" ")}
    >
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="surface p-5">
      <div className="h-4 w-40 animate-pulse rounded bg-white/[0.06]" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
            <div className="mt-1.5 h-2 w-full animate-pulse rounded-full bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();

  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analytics", { cache: "no-store" });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/suspended");
        return;
      }

      const text = await res.text();
      let parsed: unknown = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = null;
      }

      if (!res.ok) {
        throw new Error(
          typeof parsed === "object" && parsed && "error" in (parsed as Record<string, unknown>)
            ? String((parsed as Record<string, unknown>).error)
            : `API /api/analytics failed (${res.status})`
        );
      }

      setData(parsed as AnalyticsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const empty = !!data && data.meta.callCount === 0;

  // Bar normalization maxima (guard divide-by-zero).
  const maxVolume = data ? Math.max(1, ...data.volumeWeekly.map((w) => w.count)) : 1;
  const maxNewCust = data ? Math.max(1, ...data.newCustomersWeekly.map((w) => w.count)) : 1;
  const maxOutcome = data ? Math.max(1, ...data.byOutcome.map((o) => o.count)) : 1;
  const maxDow = data ? Math.max(1, ...data.byDayOfWeek.map((d) => d.count)) : 1;
  const busiestDow = data ? Math.max(0, ...data.byDayOfWeek.map((d) => d.count)) : 0;
  const maxTemp = data ? Math.max(1, ...data.byLeadTemperature.map((t) => t.count)) : 1;

  // Lead temperature in a fixed hot→warm→cold→unscored order (not the backend's
  // count-desc), so the scale reads consistently. Missing buckets render as 0;
  // the null/unscored bucket is always kept — a large unscored count is signal.
  const TEMP_ORDER: (string | null)[] = ["hot", "warm", "cold", null];
  const tempByValue = data
    ? new Map(data.byLeadTemperature.map((t) => [t.value, t.count]))
    : new Map<string | null, number>();

  const conv = data?.conversion;
  // Funnel widths are proportional to qualifiedCalls (the baseline).
  const qbase = conv && conv.qualifiedCalls > 0 ? conv.qualifiedCalls : 1;

  return (
    <AppShell
      variant="client"
      title="Analytics"
      subtitle="How your phone is performing — call volume, booking conversion, and when the calls come in."
    >
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="surface p-4">
                <div className="h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
                <div className="mt-3 h-6 w-16 animate-pulse rounded bg-white/[0.06]" />
              </div>
            ))}
          </div>
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <div className="surface border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : empty ? (
        <div className="surface p-10 text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground" />
          <div className="mt-3 text-base font-medium text-foreground">
            No call data yet
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Once your receptionist starts taking calls, your volume, conversion,
            and busiest-day trends will show up here.
          </div>
        </div>
      ) : data && conv ? (
        <div className="space-y-6">
          {/* Summary stat row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Total Calls" value={String(data.meta.callCount)} />
            <StatTile
              label="Date Range"
              value={`${shortDateTime(data.meta.firstCallAt)} – ${shortDateTime(
                data.meta.lastCallAt
              )}`}
            />
            <StatTile label="Soft-Booked Rate" value={pct(conv.softBookedRate)} />
            <StatTile label="Confirmed Rate" value={pct(conv.confirmedRate)} />
          </div>

          {/* CARD — Avg Call Duration */}
          <Card
            title="Avg Call Duration"
            subtitle="Average talk time on answered calls."
          >
            {data.avgCallDurationSec ? (
              <div className="text-3xl font-semibold tracking-tight text-foreground">
                {formatDuration(data.avgCallDurationSec)}
              </div>
            ) : (
              <>
                <div className="text-3xl font-semibold tracking-tight text-muted-foreground">
                  —
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  No answered-call talk time yet
                </p>
              </>
            )}
          </Card>

          {/* CARD 1 — Call Volume (weekly) */}
          <Card
            title="Call Volume (weekly)"
            subtitle="Calls per week — every week shown, including quiet ones."
          >
            {data.volumeWeekly.length === 0 ? (
              <p className="text-sm text-muted-foreground">No weekly data yet.</p>
            ) : (
              <div className="space-y-3">
                {data.volumeWeekly.map((w) => (
                  <BarRow
                    key={w.weekStart}
                    label={shortWeek(w.weekStart)}
                    count={w.count}
                    widthPct={(w.count / maxVolume) * 100}
                    fill="bg-indigo-500/55"
                  />
                ))}
              </div>
            )}
          </Card>

          {/* CARD — New Customers (weekly) */}
          <Card
            title="New Customers (weekly)"
            subtitle="First-time callers per week — tends to track call volume closely."
          >
            {data.newCustomersWeekly.length === 0 ? (
              <p className="text-sm text-muted-foreground">No weekly data yet.</p>
            ) : (
              <div className="space-y-3">
                {data.newCustomersWeekly.map((w) => (
                  <BarRow
                    key={w.weekStart}
                    label={shortWeek(w.weekStart)}
                    count={w.count}
                    widthPct={(w.count / maxNewCust) * 100}
                    fill="bg-sky-500/55"
                  />
                ))}
              </div>
            )}
          </Card>

          {/* CARD 2 — Booking Conversion (centerpiece) */}
          <Card
            title="Booking Conversion"
            subtitle="Of the callers worth booking, how many committed to a time — and how many were confirmed on the calendar."
            emphasis
          >
            <div className="space-y-4">
              {/* Qualified — full-width baseline */}
              <div>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-foreground">Qualified calls</span>
                  <span className="tabular-nums text-muted-foreground">
                    {conv.qualifiedCalls}
                  </span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-white/[0.04]">
                  <div className="h-full w-full rounded-full bg-white/15" />
                </div>
              </div>

              {/* Soft-booked — committed to a time */}
              <div>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-foreground">Soft-booked</span>
                  <span className="tabular-nums text-muted-foreground">
                    {conv.softBooked}
                    <span className="ml-2 font-semibold text-emerald-300">
                      {pct(conv.softBookedRate)}
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-emerald-500/40"
                    style={{ width: `${(conv.softBooked / qbase) * 100}%` }}
                  />
                </div>
              </div>

              {/* Confirmed — calendar event created */}
              <div>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-foreground">Confirmed</span>
                  <span className="tabular-nums text-muted-foreground">
                    {conv.confirmed}
                    <span className="ml-2 font-semibold text-emerald-300">
                      {pct(conv.confirmedRate)}
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-emerald-500/70"
                    style={{ width: `${(conv.confirmed / qbase) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              Confirmed = a calendar event was created; soft-booked callers
              committed to a time. The gap is partly callers who didn&apos;t
              finalize and partly calls taken while calendar booking wasn&apos;t
              connected.
            </p>
          </Card>

          {/* CARD 3 — Calls by Outcome */}
          <Card
            title="Calls by Outcome"
            subtitle="What happened on each call."
          >
            {data.byOutcome.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outcome data yet.</p>
            ) : (
              <div className="space-y-3">
                {data.byOutcome.map((o) => (
                  <BarRow
                    key={o.value ?? "unknown"}
                    label={outcomeLabel(o.value)}
                    count={o.count}
                    widthPct={(o.count / maxOutcome) * 100}
                    fill={outcomeFill(o.value)}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* CARD — Lead Temperature */}
          <Card
            title="Lead Temperature"
            subtitle="How your callers scored as leads — including calls we couldn't score."
          >
            {data.byLeadTemperature.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No lead temperature data yet.
              </p>
            ) : (
              <div className="space-y-3">
                {TEMP_ORDER.map((value) => (
                  <BarRow
                    key={value ?? "unscored"}
                    label={value ? outcomeLabel(value) : "Unscored"}
                    count={tempByValue.get(value) ?? 0}
                    widthPct={((tempByValue.get(value) ?? 0) / maxTemp) * 100}
                    fill={tempFill(value)}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* CARD 4 — Busiest Day of Week */}
          <Card
            title="Busiest Day of Week"
            subtitle="When your calls come in — Monday through Sunday."
          >
            <div className="space-y-3">
              {data.byDayOfWeek.map((d) => (
                <BarRow
                  key={d.day}
                  label={d.day}
                  count={d.count}
                  widthPct={(d.count / maxDow) * 100}
                  // Highlight the peak day in emerald; others neutral indigo.
                  fill={
                    d.count > 0 && d.count === busiestDow
                      ? "bg-emerald-500/55"
                      : "bg-indigo-500/45"
                  }
                />
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
