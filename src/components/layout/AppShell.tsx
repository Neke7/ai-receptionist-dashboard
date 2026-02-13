import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";

interface AppShellProps {
  title?: string;
  children: ReactNode;
}

function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={[
        "flex items-center justify-between rounded-md px-3 py-2 text-sm transition",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      ].join(" ")}
    >
      <span>{label}</span>
      {active ? (
        <span className="h-1.5 w-1.5 rounded-full bg-foreground/70" />
      ) : null}
    </Link>
  );
}

export default function AppShell({ title, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-background">
          <div className="px-5 py-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Console
            </div>
            <div className="mt-1 text-lg font-semibold leading-tight">
              AI Receptionist
            </div>

            <Separator className="my-5" />

            <nav className="space-y-1">
              <NavLink href="/" label="Dashboard" />
              <NavLink href="/calls" label="Calls" />
            </nav>
          </div>

          <div className="mt-auto px-5 pb-6 text-xs text-muted-foreground">
            Internal portal
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-6 py-6">
            {title ? (
              <div className="mb-6">
                <h1 className="text-2xl font-semibold leading-tight">
                  {title}
                </h1>
                <div className="mt-2">
                  <Separator />
                </div>
              </div>
            ) : null}

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

