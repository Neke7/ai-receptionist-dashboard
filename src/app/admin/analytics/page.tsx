"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Flame,
  PhoneCall,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";

type ClientCallCount = {
  clientId: string;
  clientName: string;
  count: number;
};

type DayVolume = {
  date: string;
  count: number;
};

type LeadScoreBreakdown = {
  clientId: string;
  clientName: string;
  hot: number;
  warm: number;
  cold: number;
  unscored: number;
};

type AnalyticsData = {
  totalCalls: number;
  bookedCount: number;
  bookedRate: number;
  followUpCount: number;
  followUpRate: number;
  callsPerClient: ClientCallCount[];
  callVolumeOverTime: DayVolume[];
  leadScoreByClient?: LeadScoreBreakdown[];
};

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="surface p-5 transition hover:border-white/10">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">
            {value}
          </div>
          {hint ? (
            <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
          ) : null}
        </div>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function VolumeChart({ data }: { data: DayVolume[] }) {
  const display = useMemo(() => data.slice(-30), [data]);

  if (display.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No call volume data yet.
      </div>
    );
  }

  const maxCount = Math.max(...display.map((d) => d.count), 1);
  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <div className="relative">
      <div className="relative h-[240px]">
        {/* Horizontal grid lines */}
        <div className="pointer-events-none absolute inset-0 flex flex-col-reverse justify-between">
          {gridLines.map((g, i) => (
            <div
              key={i}
              className="flex items-center"
              style={{ height: 0 }}
            >
              <span className="w-10 text-right pr-2 text-[10px] text-muted-foreground">
                {Math.round(maxCount * g)}
              </span>
              <div className="flex-1 border-t border-white/5" />
            </div>
          ))}
          <div className="flex items-center" style={{ height: 0 }}>
            <span className="w-10 text-right pr-2 text-[10px] text-muted-foreground">
              0
            </span>
            <div className="flex-1 border-t border-white/5" />
          </div>
        </div>

        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-1 pl-10 pr-1">
          {display.map((d) => {
            const heightPct = (d.count / maxCount) * 100;
            return (
              <div
                key={d.date}
                className="group relative flex h-full flex-1 items-end"
                title={`${d.date}: ${d.count} calls`}
              >
                <div
                  className="w-full rounded-t-sm bg-gradient-to-t from-indigo-600 to-indigo-400 transition group-hover:from-indigo-500 group-hover:to-indigo-300"
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                />
                <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  {d.count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="mt-2 flex gap-1 pl-10 pr-1 text-[10px] text-muted-foreground">
        {display.map((d, idx) => {
          const show =
            display.length <= 10 ||
            idx === 0 ||
            idx === display.length - 1 ||
            idx % Math.ceil(display.length / 8) === 0;
          return (
            <div key={d.date} className="flex-1 text-center truncate">
              {show ? d.date.slice(5) : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/analytics", { cache: "no-store" });
      const text = await res.text();

      let parsed: unknown = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = null;
      }

      if (!res.ok) {
        throw new Error(
          typeof parsed === "object" &&
            parsed &&
            "error" in (parsed as Record<string, unknown>)
            ? String((parsed as Record<string, unknown>).error)
            : `Failed to load analytics (${res.status})`
        );
      }

      setData(parsed as AnalyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const activeClients = data
    ? data.callsPerClient.filter((c) => c.clientId !== "unassigned").length
    : 0;

  return (
    <AppShell
      variant="admin"
      title="Analytics"
      subtitle="Performance across every client and call outcome."
      actions={
        <button onClick={loadAnalytics} className="btn-secondary">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      }
    >
      {loading ? (
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          Loading analytics…
        </div>
      ) : error ? (
        <div className="surface border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Calls"
              value={data.totalCalls}
              icon={PhoneCall}
              accent="bg-indigo-500/10 text-indigo-300"
            />
            <StatCard
              label="Booked"
              value={data.bookedCount}
              hint={`${formatPercent(data.bookedRate)} conversion`}
              icon={CheckCircle2}
              accent="bg-emerald-500/10 text-emerald-300"
            />
            <StatCard
              label="Follow Up"
              value={data.followUpCount}
              hint={`${formatPercent(data.followUpRate)} of calls`}
              icon={RotateCcw}
              accent="bg-amber-500/10 text-amber-300"
            />
            <StatCard
              label="Active Clients"
              value={activeClients}
              icon={Building2}
              accent="bg-sky-500/10 text-sky-300"
            />
          </div>

          {/* Volume chart */}
          <div className="surface mt-6 p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold">Call Volume Over Time</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Daily total calls (last {Math.min(30, data.callVolumeOverTime.length)} days)
                </p>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-300">
                <BarChart3 className="h-4 w-4" />
              </div>
            </div>

            <VolumeChart data={data.callVolumeOverTime} />
          </div>

          {/* Lead score breakdown per client */}
          <div className="surface mt-6 overflow-hidden">
            <div className="flex items-start justify-between border-b border-white/5 px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold">Lead Score Breakdown</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Hot, warm, and cold leads by client
                </p>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500/10 text-orange-300">
                <Flame className="h-4 w-4" />
              </div>
            </div>

            {!data.leadScoreByClient || data.leadScoreByClient.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No scored leads yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="surface-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                          Hot
                        </span>
                      </th>
                      <th>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                          Warm
                        </span>
                      </th>
                      <th>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                          Cold
                        </span>
                      </th>
                      <th>Unscored</th>
                      <th className="w-[35%]">Mix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.leadScoreByClient]
                      .sort(
                        (a, b) =>
                          b.hot + b.warm + b.cold + b.unscored -
                          (a.hot + a.warm + a.cold + a.unscored)
                      )
                      .map((row) => {
                        const total =
                          row.hot + row.warm + row.cold + row.unscored;
                        const pct = (n: number) =>
                          total > 0 ? (n / total) * 100 : 0;
                        return (
                          <tr key={row.clientId}>
                            <td className="font-medium">{row.clientName}</td>
                            <td className="text-orange-300 tabular-nums">
                              {row.hot}
                            </td>
                            <td className="text-yellow-300 tabular-nums">
                              {row.warm}
                            </td>
                            <td className="text-sky-300 tabular-nums">
                              {row.cold}
                            </td>
                            <td className="text-muted-foreground tabular-nums">
                              {row.unscored}
                            </td>
                            <td>
                              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                                <div
                                  className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                                  style={{ width: `${pct(row.hot)}%` }}
                                  title={`Hot: ${row.hot}`}
                                />
                                <div
                                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-400"
                                  style={{ width: `${pct(row.warm)}%` }}
                                  title={`Warm: ${row.warm}`}
                                />
                                <div
                                  className="h-full bg-gradient-to-r from-sky-500 to-blue-500"
                                  style={{ width: `${pct(row.cold)}%` }}
                                  title={`Cold: ${row.cold}`}
                                />
                                <div
                                  className="h-full bg-white/10"
                                  style={{ width: `${pct(row.unscored)}%` }}
                                  title={`Unscored: ${row.unscored}`}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Calls per client */}
          <div className="surface mt-6 overflow-hidden">
            <div className="border-b border-white/5 px-6 py-4">
              <h2 className="text-sm font-semibold">Calls Per Client</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Volume share by tenant
              </p>
            </div>

            {data.callsPerClient.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No client data available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="surface-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Calls</th>
                      <th className="w-[55%]">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.callsPerClient]
                      .sort((a, b) => b.count - a.count)
                      .map((client) => {
                        const pct =
                          data.totalCalls > 0
                            ? (client.count / data.totalCalls) * 100
                            : 0;
                        return (
                          <tr key={client.clientId}>
                            <td className="font-medium">{client.clientName}</td>
                            <td className="text-muted-foreground">{client.count}</td>
                            <td>
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="w-12 text-right text-xs text-muted-foreground">
                                  {pct.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
