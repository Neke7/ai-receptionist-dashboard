"use client";

import { useEffect, useState } from "react";

export type TrialInfo = {
  id: string;
  name: string;
  email: string;
  trialStartDate: string | null;
  trialEndsAt: string | null;
  trialExpired: boolean;
  subscriptionStatus: string | null;
  callsThisMonth: number;
};

type Result = {
  info: TrialInfo | null;
  loading: boolean;
  unauthorized: boolean;
  refresh: () => Promise<void>;
};

/**
 * Fetches /api/auth/me once on mount. Consumers use this to drive the trial
 * banner, the blocking redirect to /trial-expired, and any other UI that
 * needs to know where the logged-in client stands in their 14-day trial.
 */
export function useTrial(): Result {
  const [info, setInfo] = useState<TrialInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.status === 401) {
        setUnauthorized(true);
        setInfo(null);
        return;
      }
      if (!res.ok) {
        setInfo(null);
        return;
      }
      const data = (await res.json()) as TrialInfo;
      setInfo(data);
    } catch {
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { info, loading, unauthorized, refresh: load };
}
