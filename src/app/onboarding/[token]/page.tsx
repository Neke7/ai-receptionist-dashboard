"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

type IntakeFields = {
  businessLegalName: string;
  ownerName: string;
  ownerCellPhone: string;
  contactEmail: string;
  businessAddress: string;
  serviceArea: string;

  businessHours: string;
  afterHoursBehavior: string;
  holidaySchedule: string;

  servicesOffered: string;
  customerType: string;
  quotesOverPhone: string;
  quoteDetails: string;
  equipmentBrands: string;

  handlesEmergencies: string;
  emergencyDefinition: string;
  emergencyBehavior: string;

  bookingMethod: string;
  preferredTimeSlots: string;

  phoneSetupChoice: string;
  existingPhoneNumber: string;
  phoneCarrier: string;

  notificationChannels: string;
  additionalRecipients: string;

  receptionistName: string;
  receptionistVoice: string;

  additionalNotes: string;
};

const INITIAL: IntakeFields = {
  businessLegalName: "",
  ownerName: "",
  ownerCellPhone: "",
  contactEmail: "",
  businessAddress: "",
  serviceArea: "",
  businessHours: "",
  afterHoursBehavior: "",
  holidaySchedule: "",
  servicesOffered: "",
  customerType: "",
  quotesOverPhone: "",
  quoteDetails: "",
  equipmentBrands: "",
  handlesEmergencies: "",
  emergencyDefinition: "",
  emergencyBehavior: "",
  bookingMethod: "",
  preferredTimeSlots: "",
  phoneSetupChoice: "",
  existingPhoneNumber: "",
  phoneCarrier: "",
  notificationChannels: "",
  additionalRecipients: "",
  receptionistName: "Aria",
  receptionistVoice: "",
  additionalNotes: "",
};

const REQUIRED: Array<keyof IntakeFields> = [
  "businessLegalName",
  "ownerName",
  "ownerCellPhone",
  "contactEmail",
  "businessAddress",
  "serviceArea",
  "businessHours",
  "servicesOffered",
  "phoneSetupChoice",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoadState =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "ready"; businessName: string; alreadyCompleted: boolean };

export default function OnboardingPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [load, setLoad] = useState<LoadState>({ kind: "loading" });
  const [fields, setFields] = useState<IntakeFields>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof IntakeFields, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/onboarding/${token}`, { cache: "no-store" });
        if (res.status === 404) {
          if (!cancelled) setLoad({ kind: "invalid" });
          return;
        }
        if (!res.ok) {
          if (!cancelled) setLoad({ kind: "invalid" });
          return;
        }
        const data = (await res.json()) as {
          businessName?: string;
          alreadyCompleted?: boolean;
        };
        if (!cancelled) {
          setLoad({
            kind: "ready",
            businessName: data.businessName || "your business",
            alreadyCompleted: Boolean(data.alreadyCompleted),
          });
        }
      } catch {
        if (!cancelled) setLoad({ kind: "invalid" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function setField<K extends keyof IntakeFields>(key: K, value: IntakeFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function validate(): Partial<Record<keyof IntakeFields, string>> {
    const errs: Partial<Record<keyof IntakeFields, string>> = {};
    for (const key of REQUIRED) {
      if (!fields[key].trim()) {
        errs[key] = "This field is required.";
      }
    }
    if (fields.contactEmail.trim() && !EMAIL_RE.test(fields.contactEmail.trim())) {
      errs.contactEmail = "Please enter a valid email address.";
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstKey = REQUIRED.find((k) => errs[k]);
      if (firstKey) {
        const el = document.getElementById(`field-${firstKey}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        (el as HTMLInputElement | HTMLTextAreaElement | null)?.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, string> = {};
      (Object.keys(fields) as Array<keyof IntakeFields>).forEach((k) => {
        payload[k] = fields[k].trim();
      });

      const res = await fetch(`/api/onboarding/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: unknown = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        const msg =
          typeof data === "object" && data && "message" in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).message)
            : typeof data === "object" && data && "error" in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).error)
            : `Submission failed (${res.status})`;
        throw new Error(msg);
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (load.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (load.kind === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="font-serif text-3xl text-foreground">Link not valid</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            This onboarding link isn&apos;t valid. Please check the link or contact{" "}
            <a
              href="mailto:support@oxphi.io"
              className="text-indigo-300 hover:text-indigo-200 underline-offset-2 hover:underline"
            >
              support@oxphi.io
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
        </div>
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-5 font-serif text-3xl text-foreground">
            Thanks, {load.businessName}.
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Your information is in — we&apos;ll have your receptionist live within 48
            hours. Questions?{" "}
            <a
              href="mailto:support@oxphi.io"
              className="text-indigo-300 hover:text-indigo-200 underline-offset-2 hover:underline"
            >
              support@oxphi.io
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-[120px]" />
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
            Welcome, {load.businessName}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Let&apos;s set up your receptionist. This takes about 10 minutes.
          </p>
        </header>

        {load.alreadyCompleted ? (
          <div className="surface mb-5 border-indigo-500/20 bg-indigo-500/5 p-3 text-sm text-indigo-200">
            You&apos;ve already submitted this form. You can update your answers below
            and resubmit.
          </div>
        ) : null}

        {submitError ? (
          <div className="surface mb-5 border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">
            {submitError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Section title="Your business">
            <TextField
              id="field-businessLegalName"
              label="Business name (exactly how the receptionist should answer the phone)"
              required
              value={fields.businessLegalName}
              onChange={(v) => setField("businessLegalName", v)}
              error={fieldErrors.businessLegalName}
            />
            <TextField
              id="field-ownerName"
              label="Owner / main contact name"
              required
              value={fields.ownerName}
              onChange={(v) => setField("ownerName", v)}
              error={fieldErrors.ownerName}
            />
            <TextField
              id="field-ownerCellPhone"
              label="Best cell number (where you get lead texts)"
              required
              placeholder="+18325551234"
              value={fields.ownerCellPhone}
              onChange={(v) => setField("ownerCellPhone", v)}
              error={fieldErrors.ownerCellPhone}
            />
            <TextField
              id="field-contactEmail"
              label="Best email address"
              type="email"
              required
              value={fields.contactEmail}
              onChange={(v) => setField("contactEmail", v)}
              error={fieldErrors.contactEmail}
            />
            <TextField
              id="field-businessAddress"
              label="Business address"
              required
              value={fields.businessAddress}
              onChange={(v) => setField("businessAddress", v)}
              error={fieldErrors.businessAddress}
            />
            <TextAreaField
              id="field-serviceArea"
              label="Service area — cities, neighborhoods, or zip codes you serve"
              required
              value={fields.serviceArea}
              onChange={(v) => setField("serviceArea", v)}
              error={fieldErrors.serviceArea}
            />
          </Section>

          <Section title="Hours & availability">
            <TextAreaField
              id="field-businessHours"
              label="Your business hours (weekdays and weekends)"
              required
              value={fields.businessHours}
              onChange={(v) => setField("businessHours", v)}
              error={fieldErrors.businessHours}
            />
            <RadioGroup
              name="afterHoursBehavior"
              label="After hours, the receptionist should:"
              value={fields.afterHoursBehavior}
              onChange={(v) => setField("afterHoursBehavior", v)}
              options={[
                "Answer 24/7 and capture every call",
                "Answer but tell callers we respond during business hours",
              ]}
            />
            <TextField
              label="Any holidays or dates you're closed?"
              value={fields.holidaySchedule}
              onChange={(v) => setField("holidaySchedule", v)}
            />
          </Section>

          <Section title="Your services">
            <TextAreaField
              id="field-servicesOffered"
              label="What services do you offer?"
              required
              value={fields.servicesOffered}
              onChange={(v) => setField("servicesOffered", v)}
              error={fieldErrors.servicesOffered}
            />
            <RadioGroup
              name="customerType"
              label="Who do you serve?"
              value={fields.customerType}
              onChange={(v) => setField("customerType", v)}
              options={["Residential only", "Commercial only", "Both"]}
            />
            <RadioGroup
              name="quotesOverPhone"
              label="Should the receptionist give quotes over the phone?"
              value={fields.quotesOverPhone}
              onChange={(v) => setField("quotesOverPhone", v)}
              options={[
                "No — always defer pricing to an on-site quote (recommended)",
                "Yes — for certain services",
              ]}
            />
            <TextAreaField
              label="If yes, which services and what price ranges?"
              value={fields.quoteDetails}
              onChange={(v) => setField("quoteDetails", v)}
            />
            <TextField
              label="Brands or equipment you want mentioned (optional)"
              value={fields.equipmentBrands}
              onChange={(v) => setField("equipmentBrands", v)}
            />
          </Section>

          <Section title="Emergencies">
            <RadioGroup
              name="handlesEmergencies"
              label="Handle emergencies differently?"
              value={fields.handlesEmergencies}
              onChange={(v) => setField("handlesEmergencies", v)}
              options={[
                "Yes — recognize emergencies and flag them critical (recommended)",
                "No — treat all calls the same",
              ]}
            />
            <TextAreaField
              label="What counts as an emergency for your business? (optional — we have sensible defaults)"
              value={fields.emergencyDefinition}
              onChange={(v) => setField("emergencyDefinition", v)}
            />
            <TextField
              label="When there's an emergency, what should happen?"
              value={fields.emergencyBehavior}
              onChange={(v) => setField("emergencyBehavior", v)}
            />
          </Section>

          <Section title="Scheduling">
            <RadioGroup
              name="bookingMethod"
              label="How do you book appointments today?"
              value={fields.bookingMethod}
              onChange={(v) => setField("bookingMethod", v)}
              options={[
                "Google Calendar",
                "Field service software",
                "Pen and paper",
                "A dispatcher handles it",
                "Other",
              ]}
            />
            <TextField
              label="What time slots can callers be offered?"
              value={fields.preferredTimeSlots}
              onChange={(v) => setField("preferredTimeSlots", v)}
            />
          </Section>

          <Section title="Phone setup">
            <RadioGroup
              name="phoneSetupChoice"
              label="How do you want your phone set up?"
              required
              value={fields.phoneSetupChoice}
              onChange={(v) => setField("phoneSetupChoice", v)}
              options={[
                "A new number from Oxphi",
                "Forward my existing number",
                "Overflow only — answer when I can't",
                "Not sure — help me decide",
              ]}
              error={fieldErrors.phoneSetupChoice}
              id="field-phoneSetupChoice"
            />
            <TextField
              label="If forwarding: your current business number"
              value={fields.existingPhoneNumber}
              onChange={(v) => setField("existingPhoneNumber", v)}
            />
            <TextField
              label="If forwarding: your phone carrier"
              value={fields.phoneCarrier}
              onChange={(v) => setField("phoneCarrier", v)}
            />
          </Section>

          <Section title="Notifications">
            <RadioGroup
              name="notificationChannels"
              label="How should we send lead alerts?"
              value={fields.notificationChannels}
              onChange={(v) => setField("notificationChannels", v)}
              options={["Text message", "Email", "Both"]}
            />
            <TextField
              label="Anyone else who should be notified? (name + cell/email)"
              value={fields.additionalRecipients}
              onChange={(v) => setField("additionalRecipients", v)}
            />
          </Section>

          <Section title="Your receptionist">
            <TextField
              label="What should your receptionist be called?"
              placeholder="Aria"
              value={fields.receptionistName}
              onChange={(v) => setField("receptionistName", v)}
            />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Voice
              </label>
              <select
                value={fields.receptionistVoice}
                onChange={(e) => setField("receptionistVoice", e.target.value)}
                className="input-base"
              >
                {[
                  { v: "", label: "Select one…" },
                  { v: "Aria", label: "Aria — female, warm (default)" },
                  { v: "Grace", label: "Grace — female, professional" },
                  { v: "Hailey", label: "Hailey — female, friendly" },
                  { v: "Adrian", label: "Adrian — male, warm" },
                  { v: "Andrew", label: "Andrew — male, professional" },
                  { v: "Billy", label: "Billy — male, friendly" },
                ].map((o) => (
                  <option
                    key={o.v}
                    value={o.v}
                    style={{ color: "#0a0b10", backgroundColor: "#ffffff" }}
                  >
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          <Section title="Anything else">
            <TextAreaField
              label="Anything else we should know to set up your receptionist?"
              value={fields.additionalNotes}
              onChange={(v) => setField("additionalNotes", v)}
            />
          </Section>

          {submitError ? (
            <div className="surface border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">
              {submitError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : load.alreadyCompleted ? (
              "Resubmit"
            ) : (
              "Submit"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface p-6">
      <h2 className="font-serif text-2xl tracking-tight text-foreground">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  type,
  placeholder,
  required,
  error,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-red-300">*</span> : null}
      </label>
      <input
        id={id}
        type={type || "text"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="input-base"
      />
      {error ? <p className="mt-1 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  required,
  error,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-red-300">*</span> : null}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="input-base resize-y"
      />
      {error ? <p className="mt-1 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}

function RadioGroup({
  id,
  name,
  label,
  value,
  onChange,
  options,
  required,
  error,
}: {
  id?: string;
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
  error?: string;
}) {
  return (
    <div id={id}>
      <div className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-red-300">*</span> : null}
      </div>
      <div className="space-y-2">
        {options.map((opt) => {
          const checked = value === opt;
          return (
            <label
              key={opt}
              className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm transition ${
                checked
                  ? "border-indigo-500/40 bg-indigo-500/5 text-foreground"
                  : "border-white/5 bg-white/[0.02] text-muted-foreground hover:border-white/10 hover:text-foreground"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt}
                checked={checked}
                onChange={() => onChange(opt)}
                className="mt-1 h-3.5 w-3.5 accent-indigo-500"
              />
              <span>{opt}</span>
            </label>
          );
        })}
      </div>
      {error ? <p className="mt-1 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
