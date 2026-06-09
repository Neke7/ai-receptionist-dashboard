"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Power } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import {
  TechnicianForm,
  type TechnicianInput,
  technicianToInput,
} from "@/components/technician-form";
import { type Technician } from "@/lib/technicians";

function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1 text-xs font-medium text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
      Inactive
    </span>
  );
}

export default function TechnicianDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [loading, setLoading] = useState(true);
  const [tech, setTech] = useState<Technician | null>(null);
  const [formKey, setFormKey] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState("");

  async function loadTech() {
    setLoading(true);
    try {
      const res = await fetch(`/api/technicians/${id}`, { cache: "no-store" });

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
        throw new Error(`API /api/technicians/${id} failed (${res.status}) ${text}`);
      }

      const data: Technician = await res.json();
      setTech(data);
      setFormKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      router.push("/technicians");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function applyUpdated(data: unknown, fallback: Partial<Technician>) {
    if (data && typeof data === "object" && "id" in (data as object)) {
      setTech(data as Technician);
    } else {
      setTech((prev) => (prev ? { ...prev, ...fallback } : prev));
    }
    setFormKey((k) => k + 1);
  }

  async function handleSave(values: TechnicianInput) {
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      const body = {
        name: values.name,
        phone: values.phone || null,
        email: values.email || null,
        skills: values.skills,
        serviceAreaZips: values.serviceAreaZips,
        active: values.active,
        availabilityJson: values.availabilityJson,
      };
      const res = await fetch(`/api/technicians/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
        let msg = `Save failed (${res.status})`;
        try {
          const j = text ? JSON.parse(text) : null;
          if (j && typeof j === "object" && "error" in j) msg = String(j.error);
        } catch {
          // non-JSON body — keep the generic message
        }
        setSaveError(msg);
        return;
      }

      const data = await res.json().catch(() => null);
      applyUpdated(data, body as Partial<Technician>);
      setSaved(true);
    } catch {
      setSaveError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Deactivate this technician? They won't be offered for dispatch. You can reactivate them later."
      )
    ) {
      return;
    }
    setStatusBusy(true);
    setStatusError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/technicians/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/suspended");
        return;
      }
      if (!res.ok) {
        throw new Error(`Deactivate failed (${res.status})`);
      }
      const data = await res.json().catch(() => null);
      applyUpdated(data, { active: false });
    } catch (e) {
      setStatusError(
        e instanceof Error ? e.message : "Could not deactivate technician."
      );
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleReactivate() {
    setStatusBusy(true);
    setStatusError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/technicians/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
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
        throw new Error(`Reactivate failed (${res.status})`);
      }
      const data = await res.json().catch(() => null);
      applyUpdated(data, { active: true });
    } catch (e) {
      setStatusError(
        e instanceof Error ? e.message : "Could not reactivate technician."
      );
    } finally {
      setStatusBusy(false);
    }
  }

  if (loading || !tech) {
    return (
      <AppShell variant="client" title="Technician">
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          Loading technician…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      variant="client"
      title={tech.name}
      actions={
        <>
          {tech.active ? (
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={statusBusy}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Power className="h-4 w-4" />
              {statusBusy ? "Working…" : "Deactivate"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReactivate}
              disabled={statusBusy}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Power className="h-4 w-4" />
              {statusBusy ? "Working…" : "Reactivate"}
            </button>
          )}
          <button
            onClick={() => router.push("/technicians")}
            className="btn-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </>
      }
    >
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Status + status-action feedback */}
        <div className="flex items-center justify-between">
          <StatusPill active={tech.active} />
          {!tech.active ? (
            <span className="text-xs text-muted-foreground">
              Not currently offered for dispatch.
            </span>
          ) : null}
        </div>

        {statusError ? (
          <div className="rounded-md border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-300">
            {statusError}
          </div>
        ) : null}

        {saved ? (
          <div className="flex items-start gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Technician saved.</span>
          </div>
        ) : null}

        {/* Edit form */}
        <div className="surface p-6">
          <TechnicianForm
            key={formKey}
            initial={technicianToInput(tech)}
            submitting={saving}
            error={saveError}
            submitLabel="Save changes"
            onSubmit={handleSave}
          />
        </div>
      </div>
    </AppShell>
  );
}
