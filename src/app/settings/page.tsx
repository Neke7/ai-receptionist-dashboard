"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Plus,
  X,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";

type CalendarStatus = {
  connected: boolean;
  enabled?: boolean;
  calendarId?: string | null;
};

// ── Business Rules (SOPs) ────────────────────────────────────────────────────

const OFFER_MAX = 500;
const GREETING_MAX = 200;
const AMOUNT_MAX = 200;

// Fully-resolved shape returned by GET /api/settings/business-rules. `version`,
// `emergency.behavior`, and `serviceArea.outsideAreaBehavior` are server-managed
// and never edited in the UI.
type BusinessRules = {
  version: number;
  enabled: boolean;
  conversionOffer: { enabled: boolean; text: string };
  emergency: { keywords: string[]; behavior: string };
  commercial: { accepted: boolean };
  greeting: { override: string };
  serviceArea?: { enabled: boolean; zips: string[]; outsideAreaBehavior?: string };
  tripFee?: { enabled: boolean; amountText: string };
  notServiced?: { enabled: boolean; items: string[] };
};

// Flat, editable projection of BusinessRules used by the form.
type RulesForm = {
  enabled: boolean;
  conversionOfferEnabled: boolean;
  conversionOfferText: string;
  emergencyKeywords: string[];
  commercialAccepted: boolean;
  greetingOverride: string;
  serviceAreaEnabled: boolean;
  serviceAreaZips: string[];
  tripFeeEnabled: boolean;
  tripFeeAmountText: string;
  notServicedEnabled: boolean;
  notServicedItems: string[];
};

function toForm(r: BusinessRules): RulesForm {
  return {
    enabled: !!r.enabled,
    conversionOfferEnabled: !!r.conversionOffer?.enabled,
    conversionOfferText: r.conversionOffer?.text ?? "",
    emergencyKeywords: Array.isArray(r.emergency?.keywords)
      ? r.emergency.keywords
      : [],
    commercialAccepted: r.commercial?.accepted ?? true,
    greetingOverride: r.greeting?.override ?? "",
    serviceAreaEnabled: !!r.serviceArea?.enabled,
    serviceAreaZips: Array.isArray(r.serviceArea?.zips) ? r.serviceArea!.zips : [],
    tripFeeEnabled: !!r.tripFee?.enabled,
    tripFeeAmountText: r.tripFee?.amountText ?? "",
    notServicedEnabled: !!r.notServiced?.enabled,
    notServicedItems: Array.isArray(r.notServiced?.items)
      ? r.notServiced!.items
      : [],
  };
}

/**
 * Inline switch matching the Toggle used on the call detail page (role="switch",
 * indigo when on). Adds an optional `disabled` state for greyed sub-rules.
 */
function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={[
        "flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2.5 transition",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-5 w-9 shrink-0 rounded-full border transition",
          checked ? "bg-indigo-500 border-indigo-400" : "bg-white/5 border-white/10",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition",
            checked ? "left-4" : "left-0.5",
          ].join(" ")}
        />
      </button>
    </label>
  );
}

/**
 * Tag/chip editor — add on Enter or comma, case-insensitive dedup, removable
 * chips. Manages its own input state so each instance is independent. Shared by
 * emergency keywords, service-area ZIPs, and not-serviced items.
 */
function ChipInput({
  values,
  onChange,
  placeholder,
  emptyText,
  removeLabel = "Remove",
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  emptyText: string;
  removeLabel?: string;
}) {
  const [input, setInput] = useState("");

  function add() {
    const v = input.trim();
    if (!v) {
      setInput("");
      return;
    }
    const exists = values.some((k) => k.toLowerCase() === v.toLowerCase());
    if (!exists) onChange([...values, v]);
    setInput("");
  }

  function remove(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {values.length === 0 ? (
          <span className="text-xs text-muted-foreground">{emptyText}</span>
        ) : (
          values.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-foreground"
            >
              {v}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`${removeLabel} ${v}`}
                className="text-muted-foreground transition hover:text-rose-300"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="input-base"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="btn-secondary shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
    </>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  // Business Rules (SOPs) state.
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesError, setRulesError] = useState("");
  const [rulesForm, setRulesForm] = useState<RulesForm | null>(null);
  const [rulesOriginal, setRulesOriginal] = useState<RulesForm | null>(null);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [rulesSaveError, setRulesSaveError] = useState("");
  const [rulesSaved, setRulesSaved] = useState(false);

  // Banner driven by the params the backend OAuth callback redirects back with.
  // Read from the URL directly (rather than useSearchParams) to avoid a Suspense
  // boundary.
  type Notice = "success" | "reconnect" | "connect" | null;
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const calendar = params.get("calendar");

    if (error === "reconnect") setNotice("reconnect");
    else if (error === "connect") setNotice("connect");
    else if (calendar === "connected") setNotice("success");
    else return; // no banner param → nothing to do, leave live status alone

    // A banner param means we just came back from the OAuth callback, so pull
    // the authoritative state to reflect the result of the connect attempt.
    loadStatus();

    // Strip the params so a refresh doesn't re-show the banner or re-fetch.
    window.history.replaceState({}, "", "/settings");
  }, []);

  async function loadStatus() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/calendar/status", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        throw new Error(`Status check failed (${res.status})`);
      }
      const data: CalendarStatus = await res.json();
      setStatus(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load calendar status."
      );
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    setError("");
    try {
      const res = await fetch("/api/calendar/disconnect", { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        throw new Error(`Disconnect failed (${res.status})`);
      }
      // Re-fetch so the UI reflects the backend's authoritative state.
      await loadStatus();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not disconnect calendar."
      );
    } finally {
      setDisconnecting(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadRules() {
    setRulesLoading(true);
    setRulesError("");
    try {
      const res = await fetch("/api/settings/business-rules", {
        cache: "no-store",
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (res.status === 403) {
        window.location.href = "/suspended";
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load business rules (${res.status})`);
      }
      const data: BusinessRules = await res.json();
      const form = toForm(data);
      setRulesForm(form);
      setRulesOriginal(form);
    } catch (e) {
      setRulesError(
        e instanceof Error ? e.message : "Could not load business rules."
      );
      setRulesForm(null);
    } finally {
      setRulesLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  function patchForm(patch: Partial<RulesForm>) {
    setRulesForm((f) => (f ? { ...f, ...patch } : f));
    setRulesSaved(false);
    setRulesSaveError("");
  }

  async function saveRules() {
    if (!rulesForm) return;
    setRulesSaving(true);
    setRulesSaveError("");
    setRulesSaved(false);
    try {
      // Whitelisted partial only — never version or emergency.behavior.
      const payload = {
        enabled: rulesForm.enabled,
        conversionOffer: {
          enabled: rulesForm.conversionOfferEnabled,
          text: rulesForm.conversionOfferText,
        },
        emergency: { keywords: rulesForm.emergencyKeywords },
        commercial: { accepted: rulesForm.commercialAccepted },
        greeting: { override: rulesForm.greetingOverride },
        serviceArea: {
          enabled: rulesForm.serviceAreaEnabled,
          zips: rulesForm.serviceAreaZips,
        },
        tripFee: {
          enabled: rulesForm.tripFeeEnabled,
          amountText: rulesForm.tripFeeAmountText,
        },
        notServiced: {
          enabled: rulesForm.notServicedEnabled,
          items: rulesForm.notServicedItems,
        },
      };

      const res = await fetch("/api/settings/business-rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (res.status === 403) {
        window.location.href = "/suspended";
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
        setRulesSaveError(msg);
        return;
      }

      // Re-sync from the authoritative response when it returns the resolved
      // object; otherwise trust the form we just sent.
      let next: RulesForm = rulesForm;
      try {
        const data = await res.json();
        if (data && typeof data === "object" && "enabled" in data) {
          next = toForm(data as BusinessRules);
        }
      } catch {
        // empty/non-JSON body — keep `next` as the submitted form
      }
      setRulesForm(next);
      setRulesOriginal(next);
      setRulesSaved(true);
    } catch {
      setRulesSaveError("Could not save. Please try again.");
    } finally {
      setRulesSaving(false);
    }
  }

  const rulesDirty =
    !!rulesForm &&
    !!rulesOriginal &&
    JSON.stringify(rulesForm) !== JSON.stringify(rulesOriginal);

  const connected = status?.connected === true;
  const enabled = status?.enabled === true;

  return (
    <AppShell variant="client" title="Settings">
      <div className="mx-auto max-w-xl">
        <section className="surface p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Google Calendar
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                When connected, Aria can book appointments directly on your
                Google Calendar during calls. When disconnected, calls fall back
                to taking a request for your team to confirm.
              </p>
            </div>
          </div>

          {/* Post-OAuth-callback banner */}
          {notice === "success" ? (
            <div className="mt-6 flex items-start gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Google Calendar connected successfully.</span>
            </div>
          ) : notice === "reconnect" ? (
            <div className="mt-6 flex items-start gap-2 rounded-md border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                We couldn&apos;t get calendar access. Google only grants it on a
                fresh approval — go to{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:text-amber-200"
                >
                  myaccount.google.com/permissions
                </a>
                , remove Oxphi, then click Connect again.
              </span>
            </div>
          ) : notice === "connect" ? (
            <div className="mt-6 flex items-start gap-2 rounded-md border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                We couldn&apos;t start the Google connection. Please try again.
              </span>
            </div>
          ) : null}

          {/* Body */}
          <div className="mt-6 border-t border-white/5 pt-6">
            {loading ? (
              <div className="text-sm text-muted-foreground">
                Loading calendar status…
              </div>
            ) : error ? (
              <div className="flex items-start gap-2 rounded-md border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : connected ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  {enabled ? (
                    <>
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1 text-xs font-medium text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Connected
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Aria can book appointments on your calendar during
                        calls.
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-2.5 py-1 text-xs font-medium text-amber-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        Booking paused
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Connected, but live booking is currently paused. New
                        bookings will fall back to a request your team confirms.
                        Reconnect to re-enable booking.
                      </p>
                    </>
                  )}
                  {status?.calendarId ? (
                    <p className="break-all text-xs text-muted-foreground">
                      {status.calendarId}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="btn-secondary shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                  Not connected
                </span>
                <a
                  href="/api/calendar/connect"
                  className="btn-primary inline-flex shrink-0 items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Connect Google Calendar
                </a>
              </div>
            )}
          </div>
        </section>

        {/* ── Business Rules (SOPs) ─────────────────────────────────── */}
        <section className="surface mt-6 p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Business Rules (SOPs)
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Standard operating procedures Aria follows on every call —
                follow-up offers, emergency handling, commercial jobs, and your
                greeting.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="mt-6 border-t border-white/5 pt-6">
            {rulesLoading ? (
              <div className="text-sm text-muted-foreground">
                Loading business rules…
              </div>
            ) : rulesError ? (
              <div className="flex items-start gap-2 rounded-md border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{rulesError}</span>
              </div>
            ) : rulesForm ? (
              <div className="space-y-6">
                {/* Master toggle */}
                <Toggle
                  label="Enable Business Rules (SOPs)"
                  checked={rulesForm.enabled}
                  onChange={(v) => patchForm({ enabled: v })}
                />

                {/* Sub-rules — inert + greyed until the master switch is on */}
                <div
                  className={[
                    "space-y-6",
                    rulesForm.enabled ? "" : "pointer-events-none opacity-50",
                  ].join(" ")}
                  aria-disabled={!rulesForm.enabled}
                >
                  {/* Conversion offer */}
                  <div className="space-y-3">
                    <Toggle
                      label="Offer a follow-up after each booking"
                      checked={rulesForm.conversionOfferEnabled}
                      onChange={(v) =>
                        patchForm({ conversionOfferEnabled: v })
                      }
                    />
                    {rulesForm.conversionOfferEnabled ? (
                      <div>
                        <textarea
                          value={rulesForm.conversionOfferText}
                          onChange={(e) =>
                            patchForm({
                              conversionOfferText: e.target.value.slice(
                                0,
                                OFFER_MAX
                              ),
                            })
                          }
                          maxLength={OFFER_MAX}
                          rows={3}
                          placeholder="After your service, would you like to hear about our seasonal maintenance plan?"
                          className="input-base resize-y"
                        />
                        <div className="mt-1 text-right text-xs text-muted-foreground">
                          {rulesForm.conversionOfferText.length}/{OFFER_MAX}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Emergency keywords */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">
                      Emergency keywords
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Calls mentioning these are flagged urgent for an owner
                      callback.
                    </p>
                    <ChipInput
                      values={rulesForm.emergencyKeywords}
                      onChange={(next) =>
                        patchForm({ emergencyKeywords: next })
                      }
                      placeholder="Add a keyword (e.g. flooding, no heat)"
                      emptyText="No keywords yet."
                      removeLabel="Remove"
                    />
                  </div>

                  {/* Commercial jobs */}
                  <Toggle
                    label="Accept commercial / business-property jobs"
                    checked={rulesForm.commercialAccepted}
                    onChange={(v) => patchForm({ commercialAccepted: v })}
                  />

                  {/* Service area */}
                  <div className="space-y-2">
                    <Toggle
                      label="Limit service to specific ZIP codes"
                      checked={rulesForm.serviceAreaEnabled}
                      onChange={(v) => patchForm({ serviceAreaEnabled: v })}
                    />
                    {rulesForm.serviceAreaEnabled ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Calls from outside these ZIPs are taken as a callback
                          instead of a booking.
                        </p>
                        <ChipInput
                          values={rulesForm.serviceAreaZips}
                          onChange={(next) =>
                            patchForm({ serviceAreaZips: next })
                          }
                          placeholder="Add a ZIP code"
                          emptyText="No ZIP codes yet."
                          removeLabel="Remove ZIP"
                        />
                      </div>
                    ) : null}
                  </div>

                  {/* Trip / diagnostic fee */}
                  <div className="space-y-2">
                    <Toggle
                      label="Tell callers our trip/diagnostic fee"
                      checked={rulesForm.tripFeeEnabled}
                      onChange={(v) => patchForm({ tripFeeEnabled: v })}
                    />
                    {rulesForm.tripFeeEnabled ? (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Aria will say this exactly when callers ask what it
                          costs to come out.
                        </p>
                        <input
                          value={rulesForm.tripFeeAmountText}
                          onChange={(e) =>
                            patchForm({
                              tripFeeAmountText: e.target.value.slice(
                                0,
                                AMOUNT_MAX
                              ),
                            })
                          }
                          maxLength={AMOUNT_MAX}
                          placeholder="$89 diagnostic, applied to any repair"
                          className="input-base"
                        />
                        <div className="text-right text-xs text-muted-foreground">
                          {rulesForm.tripFeeAmountText.length}/{AMOUNT_MAX}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Brands / systems not serviced */}
                  <div className="space-y-2">
                    <Toggle
                      label="Flag jobs we don't service"
                      checked={rulesForm.notServicedEnabled}
                      onChange={(v) => patchForm({ notServicedEnabled: v })}
                    />
                    {rulesForm.notServicedEnabled ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Callers needing these are routed to a callback instead
                          of a booking.
                        </p>
                        <ChipInput
                          values={rulesForm.notServicedItems}
                          onChange={(next) =>
                            patchForm({ notServicedItems: next })
                          }
                          placeholder="e.g. oil furnaces, boilers"
                          emptyText="Nothing added yet."
                          removeLabel="Remove"
                        />
                      </div>
                    ) : null}
                  </div>

                  {/* Custom greeting */}
                  <div className="space-y-1">
                    <label
                      htmlFor="greeting-override"
                      className="text-sm font-medium text-foreground"
                    >
                      Custom greeting (optional)
                    </label>
                    <input
                      id="greeting-override"
                      value={rulesForm.greetingOverride}
                      onChange={(e) =>
                        patchForm({
                          greetingOverride: e.target.value.slice(
                            0,
                            GREETING_MAX
                          ),
                        })
                      }
                      maxLength={GREETING_MAX}
                      placeholder="Thanks for calling Acme Plumbing…"
                      className="input-base"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Leave blank to use the default greeting.
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {rulesForm.greetingOverride.length}/{GREETING_MAX}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save row */}
                <div className="border-t border-white/5 pt-4">
                  {rulesSaveError ? (
                    <div className="mb-3 flex items-start gap-2 rounded-md border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-300">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{rulesSaveError}</span>
                    </div>
                  ) : null}
                  {rulesSaved ? (
                    <div className="mb-3 flex items-start gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>Business rules saved.</span>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={saveRules}
                    disabled={rulesSaving || !rulesDirty}
                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {rulesSaving ? "Saving…" : "Save business rules"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
