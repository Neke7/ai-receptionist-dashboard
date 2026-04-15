"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  Sparkles,
} from "lucide-react";

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

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export default function TrialExpiredPage() {
  const router = useRouter();
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);
  const [error, setError] = useState("");

  // If the user has already paid (e.g. they upgraded in another tab and came
  // back), bounce them back to the dashboard rather than leaving them on the
  // paywall.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        const status = (data?.subscriptionStatus || "").toLowerCase();
        if (status === "active" || data?.trialExpired === false) {
          router.replace("/");
        }
      } catch {
        // Silent — the page still works without this guard.
      }
    })();
  }, [router]);

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
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setCheckoutLoading(null);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  return (
    <div className="relative min-h-screen px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-red-500/10 blur-[140px]" />
      </div>

      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">Oxphi</span>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </div>

        <div className="mt-10 text-center">
          <div className="inline-flex items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 p-3">
            <Clock className="h-5 w-5 text-red-300" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Your free trial has ended
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            To keep your AI receptionist running, choose a plan below. Your
            account configuration stays exactly as you left it — calls resume
            as soon as your subscription is active.
          </p>
        </div>

        {error ? (
          <div className="mx-auto mt-6 max-w-xl rounded-md border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {TIERS.map((tier) => {
            const isBusy = checkoutLoading === tier.id;
            return (
              <div
                key={tier.id}
                className={`surface relative flex flex-col p-6 transition ${
                  tier.featured
                    ? "border-indigo-500/40 shadow-lg shadow-indigo-500/5"
                    : ""
                }`}
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
                    disabled={isBusy}
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
                    ) : (
                      `Choose ${tier.name}`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Payments are securely processed by Stripe. Prices are in USD.
        </p>
      </div>
    </div>
  );
}
