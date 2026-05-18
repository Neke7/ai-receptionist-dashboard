"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Copy, Link2 } from "lucide-react";

import AppShell from "@/components/layout/AppShell";

type ClientProfile = {
  businessLegalName: string | null;
  ownerName: string | null;
  ownerCellPhone: string | null;
  contactEmail: string | null;
  businessAddress: string | null;
  serviceArea: string | null;

  businessHours: string | null;
  afterHoursBehavior: string | null;
  holidaySchedule: string | null;

  servicesOffered: string | null;
  customerType: string | null;
  quotesOverPhone: string | null;
  quoteDetails: string | null;
  equipmentBrands: string | null;

  handlesEmergencies: string | null;
  emergencyDefinition: string | null;
  emergencyBehavior: string | null;

  bookingMethod: string | null;
  preferredTimeSlots: string | null;

  phoneSetupChoice: string | null;
  existingPhoneNumber: string | null;
  phoneCarrier: string | null;

  notificationChannels: string | null;
  additionalRecipients: string | null;

  receptionistName: string | null;
  receptionistVoice: string | null;

  additionalNotes: string | null;

  createdAt?: string;
  updatedAt?: string;
};

type ClientFull = {
  id: string;
  name: string;
  email: string;
  onboardingToken?: string | null;
  onboardingCompletedAt?: string | null;
  profile: ClientProfile | null;
};

type Section = {
  title: string;
  rows: Array<{ label: string; key: keyof ClientProfile }>;
};

const SECTIONS: Section[] = [
  {
    title: "Your Business",
    rows: [
      { label: "Business name", key: "businessLegalName" },
      { label: "Owner / main contact", key: "ownerName" },
      { label: "Owner cell phone", key: "ownerCellPhone" },
      { label: "Contact email", key: "contactEmail" },
      { label: "Business address", key: "businessAddress" },
      { label: "Service area", key: "serviceArea" },
    ],
  },
  {
    title: "Hours & Availability",
    rows: [
      { label: "Business hours", key: "businessHours" },
      { label: "After hours behavior", key: "afterHoursBehavior" },
      { label: "Holiday schedule", key: "holidaySchedule" },
    ],
  },
  {
    title: "Your Services",
    rows: [
      { label: "Services offered", key: "servicesOffered" },
      { label: "Customer type", key: "customerType" },
      { label: "Quotes over phone", key: "quotesOverPhone" },
      { label: "Quote details", key: "quoteDetails" },
      { label: "Brands / equipment", key: "equipmentBrands" },
    ],
  },
  {
    title: "Emergencies",
    rows: [
      { label: "Handles emergencies", key: "handlesEmergencies" },
      { label: "What counts as an emergency", key: "emergencyDefinition" },
      { label: "Emergency behavior", key: "emergencyBehavior" },
    ],
  },
  {
    title: "Scheduling",
    rows: [
      { label: "Booking method", key: "bookingMethod" },
      { label: "Preferred time slots", key: "preferredTimeSlots" },
    ],
  },
  {
    title: "Phone Setup",
    rows: [
      { label: "Phone setup choice", key: "phoneSetupChoice" },
      { label: "Existing phone number", key: "existingPhoneNumber" },
      { label: "Phone carrier", key: "phoneCarrier" },
    ],
  },
  {
    title: "Notifications",
    rows: [
      { label: "Notification channels", key: "notificationChannels" },
      { label: "Additional recipients", key: "additionalRecipients" },
    ],
  },
  {
    title: "Your Receptionist",
    rows: [
      { label: "Receptionist name", key: "receptionistName" },
      { label: "Voice", key: "receptionistVoice" },
    ],
  },
  {
    title: "Anything Else",
    rows: [{ label: "Additional notes", key: "additionalNotes" }],
  },
];

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function OnboardingIntakeViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = params?.id;

  const [client, setClient] = useState<ClientFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/clients/${clientId}`, {
          cache: "no-store",
        });
        const text = await res.text();
        let data: unknown = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {};
        }

        if (!res.ok) {
          throw new Error(
            typeof data === "object" && data && "message" in (data as Record<string, unknown>)
              ? String((data as Record<string, unknown>).message)
              : typeof data === "object" && data && "error" in (data as Record<string, unknown>)
              ? String((data as Record<string, unknown>).error)
              : `Failed to load client (${res.status})`
          );
        }

        if (!cancelled) setClient(data as ClientFull);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load client");
          setClient(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  async function copyOnboardingLink() {
    if (!client?.onboardingToken) return;
    const url = `${window.location.origin}/onboarding/${client.onboardingToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback("Copied!");
      setTimeout(() => setCopyFeedback(""), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <AppShell
      variant="admin"
      title={client ? `${client.name} — Intake` : "Client intake"}
      subtitle="The answers this client submitted on their onboarding form."
      actions={
        <button onClick={() => router.push("/admin")} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      }
    >
      {loading ? (
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          Loading client…
        </div>
      ) : error ? (
        <div className="surface border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : !client ? (
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          Client not found.
        </div>
      ) : !client.profile ? (
        <div className="max-w-3xl">
          <div className="surface p-6">
            <h2 className="text-sm font-semibold">No intake submitted yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This client hasn&apos;t submitted their onboarding form yet. Send
              them this link so they can complete it:
            </p>

            {client.onboardingToken ? (
              <div className="mt-4 flex items-center gap-2 rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                <code className="flex-1 truncate font-mono text-xs text-muted-foreground">
                  {typeof window !== "undefined" ? window.location.origin : ""}
                  /onboarding/{client.onboardingToken}
                </code>
                <button
                  type="button"
                  onClick={copyOnboardingLink}
                  className="btn-secondary"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copyFeedback || "Copy"}
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-300">
                No onboarding token on file — this client may have been created
                before the intake feature. Recreate the client to generate a token.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-3xl space-y-5">
          <div className="surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Submitted
                </div>
                <div className="mt-1 text-sm">
                  {formatDate(client.onboardingCompletedAt)}
                </div>
              </div>
              {client.onboardingToken ? (
                <button
                  type="button"
                  onClick={copyOnboardingLink}
                  className="btn-secondary"
                  title="Copy onboarding link"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  {copyFeedback || "Copy link"}
                </button>
              ) : null}
            </div>
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title} className="surface p-6">
              <h2 className="text-sm font-semibold">{section.title}</h2>
              <dl className="mt-4 divide-y divide-white/5">
                {section.rows.map(({ label, key }) => {
                  const value = client.profile?.[key];
                  const display =
                    value && String(value).trim() ? String(value) : "—";
                  return (
                    <div
                      key={key}
                      className="grid grid-cols-1 gap-1 py-3 md:grid-cols-3 md:gap-4"
                    >
                      <dt className="text-xs font-medium text-muted-foreground md:pt-0.5">
                        {label}
                      </dt>
                      <dd className="whitespace-pre-wrap text-sm text-foreground md:col-span-2">
                        {display}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
