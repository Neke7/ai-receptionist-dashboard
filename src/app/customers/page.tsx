"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  RefreshCw,
  Search as SearchIcon,
  Users as UsersIcon,
  X,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { formatRelativeTime } from "@/lib/calls";
import { type CustomerRecord, filterCustomers } from "@/lib/customers";

function displayName(c: CustomerRecord): string {
  return c.name?.trim() || c.phone?.trim() || "Unknown customer";
}

function CustomerCardSkeleton() {
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-3 w-12 animate-pulse rounded bg-white/[0.06]" />
      </div>
      <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
    </div>
  );
}

/**
 * Mobile-first customer card — mirrors the calls page CallCard pattern.
 */
function CustomerCard({ customer }: { customer: CustomerRecord }) {
  const count = customer.callCount ?? 0;
  return (
    <Link
      href={`/customers/${customer.id}`}
      className="surface block p-4 transition hover:border-white/15"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-base font-semibold">{displayName(customer)}</div>
        <div className="shrink-0 text-xs text-muted-foreground">
          {formatRelativeTime(customer.lastSeenAt)}
        </div>
      </div>
      {customer.phone ? (
        <a
          href={`tel:${customer.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 inline-block text-sm text-indigo-300 hover:underline"
        >
          {customer.phone}
        </a>
      ) : null}
      <div className="mt-2 text-sm text-muted-foreground">
        {count} {count === 1 ? "call" : "calls"}
      </div>
    </Link>
  );
}

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadCustomers() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/customers", { cache: "no-store" });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/suspended");
        return;
      }

      const text = await res.text();
      let data: unknown = [];
      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        data = [];
      }

      if (!res.ok) {
        throw new Error(
          typeof data === "object" && data && "error" in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).error)
            : `API /api/customers failed (${res.status})`
        );
      }

      setCustomers(Array.isArray(data) ? (data as CustomerRecord[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = useMemo(
    () => filterCustomers(customers, search),
    [customers, search]
  );

  return (
    <AppShell
      variant="client"
      title="Customers"
      subtitle="Every caller your AI receptionist has spoken with."
      actions={
        <button onClick={loadCustomers} className="btn-secondary">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      }
    >
      {/* Search */}
      <div className="surface p-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone"
            className="input-base pl-9"
          />
        </div>
      </div>

      {/* Body */}
      <div className="mt-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <CustomerCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="surface border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : customers.length === 0 ? (
          // Truly empty account — nothing the user could change to fix this.
          <div className="surface p-10 text-center">
            <UsersIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-3 text-base font-medium text-foreground">
              No customers yet
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              When your AI receptionist captures a caller, they&apos;ll show up
              right here.
            </div>
          </div>
        ) : filtered.length === 0 ? (
          // Search excluded everything — actionable, so offer a Clear button.
          <div className="surface p-10 text-center">
            <SearchIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-3 text-base font-medium text-foreground">
              No matches
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search.
            </div>
            <button
              onClick={() => setSearch("")}
              className="btn-secondary mt-4 inline-flex"
            >
              <X className="h-3.5 w-3.5" />
              Clear search
            </button>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {filtered.map((customer) => (
                <CustomerCard key={customer.id} customer={customer} />
              ))}
            </div>

            {/* Desktop table */}
            <div className="surface hidden overflow-hidden md:block">
              <div className="overflow-x-auto">
                <table className="surface-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Calls</th>
                      <th>Last contact</th>
                      <th className="text-right" aria-label="Open" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((customer) => (
                      <tr
                        key={customer.id}
                        onClick={() => router.push(`/customers/${customer.id}`)}
                        className="cursor-pointer transition hover:bg-white/[0.02]"
                      >
                        <td className="font-medium">{displayName(customer)}</td>
                        <td className="text-muted-foreground">
                          {customer.phone ? (
                            <a
                              href={`tel:${customer.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-indigo-300 hover:underline"
                            >
                              {customer.phone}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="text-muted-foreground tabular-nums">
                          {customer.callCount ?? 0}
                        </td>
                        <td className="text-muted-foreground">
                          {formatRelativeTime(customer.lastSeenAt)}
                        </td>
                        <td className="text-right">
                          <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
