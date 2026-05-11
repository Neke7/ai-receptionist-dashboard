"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail, Sparkles } from "lucide-react";

import { useAccountStatus } from "@/hooks/use-trial";

export default function SuspendedPage() {
  const router = useRouter();
  const { status } = useAccountStatus();

  useEffect(() => {
    if (status && !status.isSuspended) {
      router.replace("/");
    }
  }, [status, router]);

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
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[140px]" />
      </div>

      <div className="mx-auto w-full max-w-xl">
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

        <div className="mt-16 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Account Paused
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground md:text-base">
            Your account has been paused. Please contact your account manager to
            restore access.
          </p>

          <div className="mt-8 flex justify-center">
            <a
              href="mailto:support@oxphi.io"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Contact support@oxphi.io
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
