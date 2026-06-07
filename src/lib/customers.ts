/**
 * Shared customer (CRM) helpers used by the /customers list and detail pages.
 *
 * Pure TypeScript — no React imports. Parallels src/lib/calls.ts: the record
 * shapes and the filter helper live here so both pages share one source of
 * truth, and the detail shape reuses the existing CallRecord type.
 */

import type { CallRecord } from "@/lib/calls";

/**
 * Field set returned by GET /api/customers. All optional except id so the
 * backend can omit columns it hasn't populated without breaking the UI.
 */
export type CustomerRecord = {
  id: string;
  phone?: string | null;
  name?: string | null;
  email?: string | null;
  address?: string | null;
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  createdAt?: string | null;
  callCount?: number | null;
};

/**
 * Field set returned by GET /api/customers/:id — the same summary fields plus
 * the customer's call history, reusing the existing CallRecord type.
 */
export type CustomerDetail = CustomerRecord & {
  calls: CallRecord[];
};

/**
 * Client-side search over name + phone, paralleling filterCalls in lib/calls.ts.
 * An empty query returns the list unchanged.
 */
export function filterCustomers(
  customers: CustomerRecord[],
  query: string
): CustomerRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return customers;
  return customers.filter((c) => {
    const haystack = [c.name || "", c.phone || ""].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}
