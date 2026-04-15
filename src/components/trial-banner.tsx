"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

import type { TrialInfo } from "@/hooks/use-trial";

const TRIAL_DAYS = 14;

function daysRemaining(endsAt: string | null | undefined): number | null {
  if (!endsAt) return null;
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) return null;
  const diffMs = end - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

function colorScheme(days: number) {
  // green (14-7 days), yellow (7-3 days), red (3-0 days)
  if (days >= 7) {
    return {
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/[0.06]",
      text: "text-emerald-200",
      accent: "text-emerald-300",
      bar: "bg-gradient-to-r from-emerald-400 to-emerald-500",
      track: "bg-emerald-500/10",
    };
  }
  if (days >= 3) {
    return {
      border: "border-amber-500/30",
      bg: "bg-amber-500/[0.06]",
      text: "text-amber-200",
      accent: "text-amber-300",
      bar: "bg-gradient-to-r from-amber-400 to-amber-500",
      track: "bg-amber-500/10",
    };
  }
  return {
    border: "border-red-500/30",
    bg: "bg-red-500/[0.06]",
    text: "text-red-200",
    accent: "text-red-300",
    bar: "bg-gradient-to-r from-red-400 to-red-500",
    track: "bg-red-500/10",
  };
}

export default function TrialBanner({ info }: { info: TrialInfo | null }) {
  if (!info) return null;

  const status = (info.subscriptionStatus || "").toLowerCase();
  if (status === "active") return null;
  if (info.trialExpired) return null;

  const days = daysRemaining(info.trialEndsAt);
  if (days === null) return null;

  const used = Math.min(TRIAL_DAYS, Math.max(0, TRIAL_DAYS - days));
  const remainingPct = Math.max(0, Math.min(100, (days / TRIAL_DAYS) * 100));
  const c = colorScheme(days);

  return (
    <div
      className={`mb-6 rounded-md border ${c.border} ${c.bg} px-4 py-3 text-sm ${c.text}`}
      role="status"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Clock className={`mt-0.5 h-4 w-4 shrink-0 ${c.accent}`} />
          <div className="min-w-0">
            <div className="font-medium">
              Your free trial ends in{" "}
              <span className={c.accent}>
                {days} day{days === 1 ? "" : "s"}
              </span>
              {" — Upgrade now"}
            </div>
            <div className={`mt-0.5 text-xs ${c.accent}/80`}>
              Day {used} of {TRIAL_DAYS}
            </div>
          </div>
        </div>
        <Link
          href="/billing"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-white/[0.08]"
        >
          Upgrade now
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${c.track}`}>
        <div
          className={`h-full rounded-full transition-all ${c.bar}`}
          style={{ width: `${remainingPct}%` }}
        />
      </div>
    </div>
  );
}
