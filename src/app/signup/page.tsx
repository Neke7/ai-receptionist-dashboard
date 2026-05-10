"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

const SERVICE_TYPES = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Other",
] as const;

type ServiceType = (typeof SERVICE_TYPES)[number] | "";

type FieldErrors = {
  name?: string;
  businessName?: string;
  email?: string;
  serviceType?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!name.trim()) errs.name = "Please enter your name.";
    if (!businessName.trim()) errs.businessName = "Please enter your business name.";
    if (!email.trim()) {
      errs.email = "Please enter your email.";
    } else if (!EMAIL_RE.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    }
    if (!serviceType) errs.serviceType = "Please select a service type.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          businessName: businessName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          serviceType,
        }),
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
          typeof data === "object" && data && "error" in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).error)
            : `Submission failed (${res.status})`
        );
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
            {submitted ? (
              <CheckCircle2 className="h-5 w-5 text-white" />
            ) : (
              <Sparkles className="h-5 w-5 text-white" />
            )}
          </div>
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            {submitted ? "Thanks — we'll be in touch." : "Book a Call"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {submitted
              ? "We'll review your info and reach out within one business day to schedule a call."
              : "Tell us about your business and we'll be in touch."}
          </p>
        </div>

        {submitted ? (
          <div className="surface p-6 text-center">
            <Link
              href="/"
              className="font-medium text-indigo-400 hover:text-indigo-300"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="surface p-6" noValidate>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Your name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setFieldErrors((p) => ({ ...p, name: validate().name }))}
                  placeholder="John Smith"
                  className="input-base"
                  autoFocus
                />
                {fieldErrors.name ? (
                  <p className="mt-1 text-xs text-red-300">{fieldErrors.name}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Business name
                </label>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  onBlur={() =>
                    setFieldErrors((p) => ({ ...p, businessName: validate().businessName }))
                  }
                  placeholder="Houston HVAC Pros"
                  className="input-base"
                />
                {fieldErrors.businessName ? (
                  <p className="mt-1 text-xs text-red-300">{fieldErrors.businessName}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setFieldErrors((p) => ({ ...p, email: validate().email }))}
                  placeholder="you@yourbusiness.com"
                  className="input-base"
                />
                {fieldErrors.email ? (
                  <p className="mt-1 text-xs text-red-300">{fieldErrors.email}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Phone
                  <span className="ml-1 text-muted-foreground/70 font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(832) 555-0100"
                  className="input-base"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  What type of service?
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as ServiceType)}
                  onBlur={() =>
                    setFieldErrors((p) => ({ ...p, serviceType: validate().serviceType }))
                  }
                  className="input-base"
                >
                  <option value="">Select one…</option>
                  {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {fieldErrors.serviceType ? (
                  <p className="mt-1 text-xs text-red-300">{fieldErrors.serviceType}</p>
                ) : null}
              </div>
            </div>

            {error ? (
              <div className="mt-3 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-4 w-full disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Book a Call"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
