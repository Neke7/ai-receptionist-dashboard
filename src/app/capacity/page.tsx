"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarOff } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import {
  type CapacityResponse,
  type CapacitySlot,
  formatSlotRange,
  isSlotFull,
  todayISO,
} from "@/lib/capacity";

/** "3 techs" / "1 tech" */
function techLabel(n: number): string {
  return `${n} ${n === 1 ? "tech" : "techs"}`;
}

function SlotRowSkeleton() {
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-4 w-16 animate-pulse rounded bg-white/[0.06]" />
      </div>
      <div className="mt-3 h-2 w-full animate-pulse rounded-full bg-white/[0.06]" />
    </div>
  );
}

/**
 * One hour-by-hour slot. Open slots read green with the remaining count
 * emphasized; full slots (demand >= capacity) read muted-red. The proportional
 * bar is normalized to the day's peak capacity so a staggered crew (2 → 3 → 1)
 * is obvious at a glance, with booked (rose) vs. open (emerald) segments.
 */
function SlotRow({ slot, peak }: { slot: CapacitySlot; peak: number }) {
  const full = isSlotFull(slot);
  const widthPct = peak > 0 ? (slot.capacity / peak) * 100 : 0;

  return (
    <div
      className={[
        "surface p-4 border-l-2",
        full ? "border-l-rose-500/50" : "border-l-emerald-500/50",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-foreground">
            {formatSlotRange(slot.slotStart, slot.slotEnd)}
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {techLabel(slot.capacity)} · {slot.demand} booked
          </div>
        </div>
        <div className="shrink-0 text-right">
          {full ? (
            <span className="inline-flex items-center rounded-full border border-rose-400/20 bg-rose-400/5 px-2.5 py-0.5 text-sm font-semibold text-rose-300">
              Full
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-0.5 text-sm font-semibold text-emerald-300">
              {slot.available} open
            </span>
          )}
        </div>
      </div>

      {/* Coverage bar: total width scaled to peak capacity, split booked vs open. */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div className="flex h-full" style={{ width: `${widthPct}%` }}>
          <div className="h-full bg-rose-500/45" style={{ flexGrow: slot.demand }} />
          <div
            className="h-full bg-emerald-500/55"
            style={{ flexGrow: slot.available }}
          />
        </div>
      </div>
    </div>
  );
}

export default function CapacityPage() {
  const router = useRouter();

  const [date, setDate] = useState<string>(todayISO());
  const [data, setData] = useState<CapacityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCapacity(forDate: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/capacity?date=${encodeURIComponent(forDate)}&slotMinutes=60`,
        { cache: "no-store" }
      );

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
            : `API /api/capacity failed (${res.status})`
        );
      }

      setData(parsed as CapacityResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load capacity");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCapacity(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const summary = data?.summary;
  const slots = data?.slots ?? [];
  const closed = !!data && (slots.length === 0 || (summary?.techsWorkingToday ?? 0) === 0);

  return (
    <AppShell
      variant="client"
      title="Capacity"
      subtitle="Technician coverage by the hour — see where your day has room and where it's full."
      actions={
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-base w-auto"
            aria-label="Capacity date"
          />
        </label>
      }
    >
      {/* Headline summary */}
      {!loading && !error && summary ? (
        <div className="surface mb-6 p-5">
          <div className="text-base font-medium text-foreground">
            {summary.techsWorkingToday}{" "}
            {summary.techsWorkingToday === 1 ? "technician" : "technicians"} working
            {" · "}
            peak capacity {summary.peakCapacity}
            {" · "}
            <span className={closed ? "text-muted-foreground" : "text-emerald-300"}>
              {summary.availableSlots} of {summary.totalSlots} slots open
            </span>
          </div>
        </div>
      ) : null}

      {/* Body */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SlotRowSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="surface border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : closed ? (
        <div className="surface p-10 text-center">
          <CalendarOff className="mx-auto h-8 w-8 text-muted-foreground" />
          <div className="mt-3 text-base font-medium text-foreground">
            No technicians scheduled for this day
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Pick another date to see coverage, or set technician working hours to
            open this day up.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => (
            <SlotRow
              key={slot.slotStart}
              slot={slot}
              peak={summary?.peakCapacity ?? 0}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
