"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Plus, RefreshCw, Wrench } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { Toggle } from "@/components/form-controls";
import {
  TechnicianForm,
  type TechnicianInput,
  technicianToInput,
} from "@/components/technician-form";
import { type Technician, formatAvailability } from "@/lib/technicians";

function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2 py-0.5 text-xs font-medium text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
      Inactive
    </span>
  );
}

function SkillPills({ skills }: { skills: string[] }) {
  if (!skills || skills.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {skills.map((s, i) => (
        <span
          key={`${s}-${i}`}
          className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-foreground"
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function TechCardSkeleton() {
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-white/[0.06]" />
      </div>
      <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
    </div>
  );
}

function TechCard({ tech }: { tech: Technician }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(`/technicians/${tech.id}`)}
      className="surface block w-full p-4 text-left transition hover:border-white/15"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-base font-semibold">{tech.name}</div>
        <StatusPill active={tech.active} />
      </div>
      {tech.phone ? (
        <div className="mt-1 text-sm text-muted-foreground">{tech.phone}</div>
      ) : null}
      <div className="mt-3">
        <SkillPills skills={tech.skills} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          {tech.serviceAreaZips?.length ?? 0}{" "}
          {(tech.serviceAreaZips?.length ?? 0) === 1 ? "ZIP" : "ZIPs"}
        </span>
        <span>{formatAvailability(tech.availabilityJson)}</span>
      </div>
    </button>
  );
}

export default function TechniciansPage() {
  const router = useRouter();

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  async function loadTechnicians() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/technicians", { cache: "no-store" });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/suspended");
        return;
      }

      const text = await res.text();
      let data: unknown = [];
      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        data = [];
      }

      if (!res.ok) {
        throw new Error(
          typeof data === "object" && data && "error" in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).error)
            : `API /api/technicians failed (${res.status})`
        );
      }

      setTechnicians(Array.isArray(data) ? (data as Technician[]) : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load technicians"
      );
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTechnicians();
  }, []);

  async function handleCreate(values: TechnicianInput) {
    setAddSubmitting(true);
    setAddError("");
    try {
      const res = await fetch("/api/technicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          phone: values.phone || null,
          email: values.email || null,
          skills: values.skills,
          serviceAreaZips: values.serviceAreaZips,
          active: values.active,
          availabilityJson: values.availabilityJson,
        }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/suspended");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let msg = `Could not create technician (${res.status})`;
        try {
          const j = text ? JSON.parse(text) : null;
          if (j && typeof j === "object" && "error" in j) msg = String(j.error);
        } catch {
          // non-JSON body — keep the generic message
        }
        setAddError(msg);
        return;
      }

      setShowAdd(false);
      await loadTechnicians();
    } catch {
      setAddError("Could not create technician. Please try again.");
    } finally {
      setAddSubmitting(false);
    }
  }

  const visible = useMemo(
    () => (showInactive ? technicians : technicians.filter((t) => t.active)),
    [technicians, showInactive]
  );

  const hasInactive = technicians.some((t) => !t.active);

  return (
    <AppShell
      variant="client"
      title="Technicians"
      subtitle="Your dispatch roster — who can take which jobs, where, and when."
      actions={
        <>
          <button
            onClick={() => setShowAdd((s) => !s)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Add technician
          </button>
          <button onClick={loadTechnicians} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </>
      }
    >
      {/* Add panel */}
      {showAdd ? (
        <div className="surface mb-4 p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Add technician
          </h2>
          <TechnicianForm
            initial={technicianToInput(null)}
            submitting={addSubmitting}
            error={addError}
            submitLabel="Create technician"
            onSubmit={handleCreate}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      ) : null}

      {/* Inactive filter */}
      {hasInactive ? (
        <div className="mb-4">
          <Toggle
            label="Show inactive technicians"
            checked={showInactive}
            onChange={setShowInactive}
          />
        </div>
      ) : null}

      {/* Body */}
      <div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <TechCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="surface border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : technicians.length === 0 ? (
          <div className="surface p-10 text-center">
            <Wrench className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-3 text-base font-medium text-foreground">
              No technicians yet
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Add your first one to start building your dispatch roster.
            </div>
            {!showAdd ? (
              <button
                onClick={() => setShowAdd(true)}
                className="btn-primary mt-4 inline-flex"
              >
                <Plus className="h-4 w-4" />
                Add technician
              </button>
            ) : null}
          </div>
        ) : visible.length === 0 ? (
          <div className="surface p-10 text-center text-sm text-muted-foreground">
            All technicians are inactive. Turn on “Show inactive” to see them.
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {visible.map((tech) => (
                <TechCard key={tech.id} tech={tech} />
              ))}
            </div>

            {/* Desktop table */}
            <div className="surface hidden overflow-hidden md:block">
              <div className="overflow-x-auto">
                <table className="surface-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Skills</th>
                      <th>ZIPs</th>
                      <th>Availability</th>
                      <th>Status</th>
                      <th className="text-right" aria-label="Open" />
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((tech) => (
                      <tr
                        key={tech.id}
                        onClick={() => router.push(`/technicians/${tech.id}`)}
                        className="cursor-pointer transition hover:bg-white/[0.02]"
                      >
                        <td className="font-medium">{tech.name}</td>
                        <td>
                          <SkillPills skills={tech.skills} />
                        </td>
                        <td className="text-muted-foreground tabular-nums">
                          {tech.serviceAreaZips?.length ?? 0}
                        </td>
                        <td className="text-muted-foreground">
                          {formatAvailability(tech.availabilityJson)}
                        </td>
                        <td>
                          <StatusPill active={tech.active} />
                        </td>
                        <td className="text-right">
                          <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
