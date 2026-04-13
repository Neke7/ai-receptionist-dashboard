export type LeadTemperature = "hot" | "warm" | "cold" | null | undefined;

const TEMP_MAP: Record<
  "hot" | "warm" | "cold",
  {
    label: string;
    dot: string;
    text: string;
    ring: string;
    bg: string;
    bar: string;
  }
> = {
  hot: {
    label: "Hot",
    dot: "bg-orange-400",
    text: "text-orange-300",
    ring: "border-orange-400/25",
    bg: "bg-orange-400/10",
    bar: "bg-gradient-to-r from-orange-500 to-red-500",
  },
  warm: {
    label: "Warm",
    dot: "bg-yellow-400",
    text: "text-yellow-300",
    ring: "border-yellow-400/25",
    bg: "bg-yellow-400/10",
    bar: "bg-gradient-to-r from-amber-400 to-yellow-400",
  },
  cold: {
    label: "Cold",
    dot: "bg-sky-400",
    text: "text-sky-300",
    ring: "border-sky-400/25",
    bg: "bg-sky-400/10",
    bar: "bg-gradient-to-r from-sky-500 to-blue-500",
  },
};

function normalize(temp: LeadTemperature): "hot" | "warm" | "cold" | null {
  const key = (temp || "").toLowerCase();
  if (key === "hot" || key === "warm" || key === "cold") return key;
  return null;
}

export function LeadTemperatureBadge({
  temperature,
  score,
  size = "sm",
}: {
  temperature: LeadTemperature;
  score?: number | null;
  size?: "sm" | "md";
}) {
  const key = normalize(temperature);
  if (!key) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-xs text-muted-foreground"
        title="Not scored yet"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
        Unscored
      </span>
    );
  }

  const t = TEMP_MAP[key];
  const padding = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${padding} ${t.text} ${t.ring} ${t.bg}`}
      title={
        typeof score === "number" ? `Lead score: ${score}/100` : undefined
      }
    >
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {t.label}
      {typeof score === "number" ? (
        <span className="ml-0.5 tabular-nums text-[10px] opacity-80">
          · {score}
        </span>
      ) : null}
    </span>
  );
}

export function LeadScoreMeter({
  score,
  temperature,
}: {
  score: number | null | undefined;
  temperature: LeadTemperature;
}) {
  const safeScore =
    typeof score === "number" && Number.isFinite(score)
      ? Math.max(0, Math.min(100, score))
      : null;

  const key = normalize(temperature);
  const barClass = key ? TEMP_MAP[key].bar : "bg-white/20";

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight">
            {safeScore ?? "—"}
          </span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
        <LeadTemperatureBadge temperature={temperature} size="md" />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${safeScore ?? 0}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Cold</span>
        <span>Warm</span>
        <span>Hot</span>
      </div>
    </div>
  );
}
