"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";

type PlanId = "starter" | "pro" | "enterprise";

type TierDefinition = {
  id: PlanId;
  name: string;
  priceCents: number;
  includedCalls: number;
  overagePriceCents: number;
  tagline: string;
  features: string[];
  featured?: boolean;
};

const TIERS: TierDefinition[] = [
  {
    id: "starter",
    name: "Starter",
    priceCents: 4900,
    includedCalls: 100,
    overagePriceCents: 50,
    tagline: "For small teams getting started.",
    features: [
      "100 included calls / month",
      "$0.50 per extra call",
      "Email notifications",
      "Standard support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceCents: 14900,
    includedCalls: 500,
    overagePriceCents: 35,
    tagline: "For growing businesses with higher call volume.",
    features: [
      "500 included calls / month",
      "$0.35 per extra call",
      "Email notifications",
      "Priority support",
    ],
    featured: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceCents: 39900,
    includedCalls: 2000,
    overagePriceCents: 25,
    tagline: "For high-volume teams with enterprise needs.",
    features: [
      "2,000 included calls / month",
      "$0.25 per extra call",
      "Email notifications",
      "Dedicated success manager",
    ],
  },
];

type SubscriptionResponse = {
  planId: PlanId | null;
  plan: {
    id: PlanId;
    name: string;
    priceCents: number;
    includedCalls: number;
    overagePriceCents: number;
  } | null;
  status: string | null;
  callsThisMonth: number;
  hasBillingConfigured: boolean;
};

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function StatusPill({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-xs text-muted-foreground">
        No active plan
      </span>
    );
  }

  const map: Record<string, { label: string; className: string }> = {
    active: {
      label: "Active",
      className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    },
    trialing: {
      label: "Trialing",
      className: "border-sky-500/20 bg-sky-500/10 text-sky-300",
    },
    past_due: {
      label: "Past due",
      className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    },
    canceled: {
      label: "Canceled",
      className: "border-red-500/20 bg-red-500/10 text-red-300",
    },
    incomplete: {
      label: "Incomplete",
      className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    },
  };

  const entry = map[status] ?? {
    label: status,
    className: "border-white/10 bg-white/[0.03] text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${entry.className}`}
    >
      {entry.label}
    </span>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingPageInner />
    </Suspense>
  );
}

function BillingPageInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [sub, setSub] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const checkout = params.get("checkout");
    if (checkout === "success") {
      setBanner({
        type: "success",
        text: "Subscription started — welcome aboard! Your plan will appear below momentarily.",
      });
    } else if (checkout === "cancelled") {
      setBanner({
        type: "error",
        text: "Checkout was cancelled. You can pick a plan below whenever you're ready.",
      });
    }
  }, [params]);

  async function loadSubscription() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/subscription", {
        cache: "no-store",
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const text = await res.text();
      let data: unknown = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(
          typeof data === "object" && data && "error" in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).error)
            : `Failed to load subscription (${res.status})`
        );
      }

      setSub(data as SubscriptionResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscription");
      setSub(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscription();
  }, []);

  async function startCheckout(plan: PlanId) {
    setCheckoutLoading(plan);
    setError("");
    try {
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

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
            : "Failed to start checkout"
        );
      }

      const url =
        typeof data === "object" && data && "url" in (data as Record<string, unknown>)
          ? String((data as Record<string, unknown>).url || "")
          : "";

      if (!url) throw new Error("Checkout URL missing from response");

      window.location.href = url;
    } catch (err) {
      setBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to start checkout",
      });
      setCheckoutLoading(null);
    }
  }

  const currentPlanId = sub?.planId ?? null;
  const includedCalls = sub?.plan?.includedCalls ?? null;
  const callsThisMonth = sub?.callsThisMonth ?? 0;

  const usagePct = useMemo(() => {
    if (!includedCalls || includedCalls <= 0) return 0;
    return Math.min(100, Math.round((callsThisMonth / includedCalls) * 100));
  }, [callsThisMonth, includedCalls]);

  const overageCalls = useMemo(() => {
    if (!includedCalls) return 0;
    return Math.max(0, callsThisMonth - includedCalls);
  }, [callsThisMonth, includedCalls]);

  return (
    <AppShell
      variant="client"
      title="Billing"
      subtitle="Manage your Oxphi plan and track call usage for the current period."
    >
      {banner ? (
        <div
          className={`mb-6 flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200"
              : "border-red-500/20 bg-red-500/5 text-red-200"
          }`}
        >
          {banner.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <div className="flex-1">{banner.text}</div>
          <button
            onClick={() => setBanner(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-md border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {/* Current plan */}
      <section className="surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold">Current plan</h2>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-2xl font-semibold tracking-tight">
                {loading
                  ? "Loading…"
                  : sub?.plan?.name ?? "No plan"}
              </span>
              <StatusPill status={sub?.status ?? null} />
            </div>
            {sub?.plan ? (
              <div className="mt-1 text-sm text-muted-foreground">
                {formatMoney(sub.plan.priceCents)}/month · {sub.plan.includedCalls}{" "}
                calls included · {formatMoney(sub.plan.overagePriceCents)} per extra call
              </div>
            ) : (
              <div className="mt-1 text-sm text-muted-foreground">
                Choose a plan below to start billing.
              </div>
            )}
          </div>
        </div>

        {/* Usage meter */}
        <div className="mt-6">
          <div className="flex items-end justify-between text-sm">
            <div className="text-muted-foreground">Calls this period</div>
            <div className="font-medium">
              {callsThisMonth}
              {includedCalls ? (
                <span className="text-muted-foreground">
                  {" / "}
                  {includedCalls}
                </span>
              ) : null}
            </div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.04]">
            <div
              className={`h-full rounded-full transition-all ${
                usagePct >= 100
                  ? "bg-gradient-to-r from-amber-400 to-red-400"
                  : "bg-gradient-to-r from-indigo-400 to-indigo-500"
              }`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          {overageCalls > 0 && sub?.plan ? (
            <div className="mt-2 text-xs text-amber-300">
              {overageCalls} calls beyond plan — billed at{" "}
              {formatMoney(sub.plan.overagePriceCents)} each.
            </div>
          ) : null}
        </div>
      </section>

      {/* Pricing tiers */}
      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Available plans
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map((tier) => {
            const isCurrent = currentPlanId === tier.id;
            const isBusy = checkoutLoading === tier.id;
            return (
              <div
                key={tier.id}
                className={`surface relative flex flex-col p-6 transition ${
                  tier.featured
                    ? "border-indigo-500/40 shadow-lg shadow-indigo-500/5"
                    : ""
                } ${isCurrent ? "ring-1 ring-indigo-500/50" : ""}`}
              >
                {tier.featured ? (
                  <span className="absolute -top-2 left-6 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-indigo-300">
                    Most popular
                  </span>
                ) : null}

                <div className="text-sm font-medium text-muted-foreground">
                  {tier.name}
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">
                    {formatMoney(tier.priceCents)}
                  </span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tier.tagline}
                </p>

                <ul className="mt-4 space-y-2 text-sm">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-6 border-t border-white/5">
                  <button
                    disabled={isCurrent || isBusy || loading}
                    onClick={() => startCheckout(tier.id)}
                    className={`w-full ${
                      tier.featured ? "btn-primary" : "btn-secondary"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecting…
                      </>
                    ) : isCurrent ? (
                      "Current plan"
                    ) : currentPlanId ? (
                      `Switch to ${tier.name}`
                    ) : (
                      `Choose ${tier.name}`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Payments are securely processed by Stripe. Prices are in USD.
        </p>
      </section>
    </AppShell>
  );
}
