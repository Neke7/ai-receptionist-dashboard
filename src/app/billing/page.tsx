"use client";

import { Mail, Receipt } from "lucide-react";

import AppShell from "@/components/layout/AppShell";

export default function BillingPage() {
  return (
    <AppShell variant="client" title="Billing">
      <div className="mx-auto max-w-xl">
        <section className="surface p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
            <Receipt className="h-5 w-5 text-white" />
          </div>

          <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
            Billing
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your billing is managed by your account manager.
          </p>

          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            For invoices, payment changes, plan questions, or anything else
            billing-related, please reach out — we'll respond within one
            business day.
          </p>

          <div className="mt-6 flex justify-center">
            <a
              href="mailto:support@oxphi.com"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Contact support@oxphi.com
            </a>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
