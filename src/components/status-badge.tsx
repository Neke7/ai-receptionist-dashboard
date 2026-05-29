type StatusBadgeProps = {
  outcome: string | null | undefined;
};

const STATUS_MAP: Record<
  string,
  { label: string; dot: string; text: string; ring: string; bg: string }
> = {
  booked: {
    label: "Booked",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    ring: "border-emerald-400/20",
    bg: "bg-emerald-400/5",
  },
  follow_up: {
    label: "Follow Up",
    dot: "bg-amber-400",
    text: "text-amber-300",
    ring: "border-amber-400/20",
    bg: "bg-amber-400/5",
  },
  info_only: {
    label: "Info Only",
    dot: "bg-sky-400",
    text: "text-sky-300",
    ring: "border-sky-400/20",
    bg: "bg-sky-400/5",
  },
  unknown: {
    label: "Unknown",
    dot: "bg-zinc-500",
    text: "text-zinc-400",
    ring: "border-white/10",
    bg: "bg-white/5",
  },
  filtered: {
    label: "Spam",
    dot: "bg-rose-400",
    text: "text-rose-300",
    ring: "border-rose-400/20",
    bg: "bg-rose-400/5",
  },
};

export default function StatusBadge({ outcome }: StatusBadgeProps) {
  const key = (outcome || "unknown").toLowerCase();
  const s = STATUS_MAP[key] || STATUS_MAP.unknown;
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        s.text,
        s.ring,
        s.bg,
      ].join(" ")}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
