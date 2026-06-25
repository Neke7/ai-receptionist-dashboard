"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PhoneCall,
  Users,
  BarChart3,
  CalendarDays,
  CreditCard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";

import { useAccountStatus } from "@/hooks/use-trial";

export type ShellVariant = "client" | "admin";

interface AppShellProps {
  variant: ShellVariant;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const CLIENT_NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calls", label: "Calls", icon: PhoneCall },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/technicians", label: "Technicians", icon: Wrench },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Clients", icon: Users },
  { href: "/admin/calls", label: "All Calls", icon: PhoneCall },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={[
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
        active
          ? "bg-white/5 text-foreground border border-white/5"
          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.035] border border-transparent",
      ].join(" ")}
    >
      <Icon
        className={[
          "h-4 w-4 shrink-0 transition",
          active ? "text-indigo-400" : "text-muted-foreground group-hover:text-foreground",
        ].join(" ")}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function BrandMark({
  variant,
  clientName,
}: {
  variant: ShellVariant;
  clientName?: string;
}) {
  const subtitle =
    variant === "admin"
      ? "Admin Console"
      : clientName?.trim() || "Client Portal";

  return (
    <Link
      href={variant === "admin" ? "/admin" : "/"}
      className="flex items-center gap-2"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-sm font-semibold text-foreground">Oxphi</span>
        <span
          className={[
            "max-w-[160px] truncate text-[11px] tracking-wide text-muted-foreground",
            variant === "client" && clientName?.trim()
              ? "font-medium normal-case text-foreground/90"
              : "uppercase",
          ].join(" ")}
          title={subtitle}
        >
          {subtitle}
        </span>
      </div>
    </Link>
  );
}

export default function AppShell({
  variant,
  title,
  subtitle,
  actions,
  children,
}: AppShellProps) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const nav = variant === "admin" ? ADMIN_NAV : CLIENT_NAV;

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { status: accountStatus } = useAccountStatus();
  const clientName =
    variant === "client" ? accountStatus?.name ?? undefined : undefined;

  useEffect(() => {
    if (!accountStatus) return;
    if (accountStatus.isSuspended && pathname !== "/suspended") {
      router.replace("/suspended");
    }
  }, [accountStatus, pathname, router]);

  // Close the mobile drawer on route change and lock body scroll while open.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const { body } = document;
    if (mobileNavOpen) {
      body.style.overflow = "hidden";
      return () => {
        body.style.overflow = "";
      };
    }
  }, [mobileNavOpen]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function handleLogout() {
    try {
      if (variant === "admin") {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
      } else {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
      }
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/5 bg-[var(--sidebar)]">
        <div className="px-5 pt-6 pb-4">
          <BrandMark variant={variant} clientName={clientName} />
        </div>

        <div className="px-3 py-2">
          <div className="px-2 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Navigation
          </div>
          <nav className="space-y-1">
            {nav.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/5 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-white/[0.035] hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-white/5 bg-[#0a0b10]/90 px-4 backdrop-blur-md md:hidden">
        <BrandMark variant={variant} clientName={clientName} />
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/5 bg-white/[0.03] text-foreground transition hover:bg-white/[0.06]"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-white/5 bg-[var(--sidebar)] shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
              <BrandMark variant={variant} clientName={clientName} />
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/5 bg-white/[0.03] text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-3 py-2">
              <div className="px-2 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Navigation
              </div>
              <nav className="space-y-1">
                {nav.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    onClick={() => setMobileNavOpen(false)}
                  />
                ))}
              </nav>
            </div>

            <div className="mt-auto border-t border-white/5 p-3">
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  void handleLogout();
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-white/[0.035] hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {/* Main */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0 flex flex-col">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-8 py-6 md:py-10 flex-1">
          {(title || actions) && (
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                {title ? (
                  <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-foreground">
                    {title}
                  </h1>
                ) : null}
                {subtitle ? (
                  <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                ) : null}
              </div>
              {actions ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {actions}
                </div>
              ) : null}
            </div>
          )}

          {children}
        </div>

        <footer className="border-t border-white/5">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
            <div>© {new Date().getFullYear()} Oxphi. All rights reserved.</div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/terms" className="transition hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="/privacy" className="transition hover:text-foreground">
                Privacy Policy
              </Link>
              <a
                href="mailto:support@oxphi.io"
                className="transition hover:text-foreground"
              >
                Contact
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
