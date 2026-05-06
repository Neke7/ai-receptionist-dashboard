"use client";
import { useEffect, useState } from "react";

export type AccountStatus = {
  id: string;
  name: string | null;
  email: string;
  isSuspended: boolean;
  suspendedAt: string | null;
  subscriptionStatus: string | null;
  callsThisMonth: number;
};

export function useAccountStatus() {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchStatus() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          throw new Error("Failed to fetch account status");
        }
        const data = await res.json();
        if (!cancelled) {
          setStatus(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    }
    fetchStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, loading, error };
}
