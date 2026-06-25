import { appointmentStatusStyle } from "@/lib/appointments";

/**
 * Appointment status pill — mirrors components/status-badge.tsx, but driven by
 * the per-status config in lib/appointments.ts so the list page, detail page,
 * and status dropdown all stay in sync.
 */
export default function AppointmentStatusBadge({ status }: { status: string }) {
  const s = appointmentStatusStyle(status);
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
