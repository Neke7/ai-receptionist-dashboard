"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/status-badge";
import { LeadTemperatureBadge } from "@/components/lead-temperature";
import {
  type CallRecord,
  formatDateTime,
  formatRelativeTime,
} from "@/lib/calls";
import { type CustomerDetail } from "@/lib/customers";

function displayName(c: CustomerDetail): string {
  return c.name?.trim() || c.phone?.trim() || "Unknown customer";
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  );
}

/**
 * Call history row — reuses the same StatusBadge + lead badge + date rendering
 * as the calls page, and links to the existing /calls/[id] detail.
 */
function CustomerCallCard({ call }: { call: CallRecord }) {
  return (
    <Link
      href={`/calls/${call.id}`}
      className="surface block p-4 transition hover:border-white/15"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold">
          {call.caller_name || "Unknown caller"}
        </div>
        <div className="shrink-0 text-xs text-muted-foreground">
          {formatRelativeTime(call.createdAt)}
        </div>
      </div>
      {call.call_summary ? (
        <div className="mt-2 line-clamp-2 text-sm text-foreground/80">
          {call.call_summary}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge
          outcome={call.call_outcome}
          appointmentStatus={call.appointment_status}
        />
        <LeadTemperatureBadge
          temperature={call.leadTemperature}
          score={call.leadScore}
          size="sm"
        />
        <span className="text-xs text-muted-foreground">
          {formatDateTime(call.createdAt)}
        </span>
      </div>
    </Link>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);

  // Inline name editing (name only — everything else stays read-only).
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  async function loadCustomer() {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${id}`, { cache: "no-store" });

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
        throw new Error(`API /api/customers/${id} failed (${res.status}) ${text}`);
      }

      const data: CustomerDetail = await res.json();
      setCustomer(data);
    } catch (e) {
      console.error(e);
      router.push("/customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function startEdit() {
    if (!customer) return;
    setDraft(customer.name ?? "");
    setEditError("");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditError("");
  }

  async function saveName() {
    if (!customer) return;
    const trimmed = draft.trim();
    // Guarded by the disabled Save button, but re-check before the request.
    if (!trimmed || trimmed === (customer.name ?? "").trim()) return;

    setSaving(true);
    setEditError("");
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/suspended");
        return;
      }
      if (res.status === 400) {
        setEditError("Name cannot be empty");
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
        setEditError(msg);
        return;
      }

      // Endpoint returns the updated customer MINUS calls — merge into state and
      // preserve the existing call history.
      const updated = await res.json();
      setCustomer((prev) =>
        prev ? { ...prev, ...updated, calls: prev.calls } : prev
      );
      setEditing(false);
    } catch {
      setEditError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !customer) {
    return (
      <AppShell variant="client" title="Customer">
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          Loading customer…
        </div>
      </AppShell>
    );
  }

  const calls = Array.isArray(customer.calls) ? customer.calls : [];
  const phone = customer.phone?.trim() || "";
  const email = customer.email?.trim() || "";
  const address = customer.address?.trim() || "";

  const trimmedDraft = draft.trim();
  const canSave =
    trimmedDraft.length > 0 && trimmedDraft !== (customer.name ?? "").trim();

  return (
    <AppShell
      variant="client"
      actions={
        <button
          onClick={() => router.push("/customers")}
          className="btn-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      }
    >
      {/* Name (inline editable) */}
      <div className="mb-6">
        {editing ? (
          <div className="space-y-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Customer name"
              autoFocus
              className="input-base max-w-md"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={saveName}
                disabled={saving || !canSave}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
            {editError ? (
              <p className="text-sm text-rose-400">{editError}</p>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-foreground">
              {displayName(customer)}
            </h1>
            <button
              type="button"
              onClick={startEdit}
              aria-label="Edit name"
              title="Edit name"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        )}
        {!editing && phone ? (
          <p className="mt-1 text-sm text-muted-foreground">{phone}</p>
        ) : null}
      </div>

      {/* Summary */}
      <div className="surface p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <InfoRow label="Phone">
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="text-indigo-300 hover:underline break-all"
              >
                {phone}
              </a>
            ) : (
              "—"
            )}
          </InfoRow>
          <InfoRow label="Email">
            {email ? (
              <a
                href={`mailto:${email}`}
                className="text-indigo-300 hover:underline break-all"
              >
                {email}
              </a>
            ) : (
              "—"
            )}
          </InfoRow>
          <InfoRow label="Address">{address || "—"}</InfoRow>
          <InfoRow label="First seen">
            {formatDateTime(customer.firstSeenAt)}
          </InfoRow>
          <InfoRow label="Last seen">
            {formatDateTime(customer.lastSeenAt)}
          </InfoRow>
          <InfoRow label="Total calls">
            {customer.callCount ?? calls.length}
          </InfoRow>
        </div>
      </div>

      {/* Call history */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Call history
        </h2>
        {calls.length === 0 ? (
          <div className="surface p-10 text-center text-sm text-muted-foreground">
            No calls recorded for this customer yet.
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => (
              <CustomerCallCard key={call.id} call={call} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
