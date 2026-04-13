"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PhoneCall,
  Users,
  BarChart3,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";

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
  { href: "/billing", label: "Billing", icon: CreditCard },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Clients", icon: Users },
  { href: "/admin/calls", label: "All Calls", icon: PhoneCall },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

function NavLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
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
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/5 bg-[var(--sidebar)]">
        <div className="px-5 pt-6 pb-4">
          <Link href={variant === "admin" ? "/admin" : "/"} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">
                Oxphi
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {variant === "admin" ? "Admin Console" : "Client Portal"}
              </span>
            </div>
          </Link>
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

      {/* Main */}
      <main className="flex-1 min-w-0">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-8 py-6 md:py-10">
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
      </main>
    </div>
  );
}
