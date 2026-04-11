"use client";

import { usePathname, useRouter } from "next/navigation";

export default function LogoutButton() {
  const pathname = usePathname();
  const router = useRouter();

  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");

  async function handleLogout() {
    try {
      if (isAdminRoute) {
        await fetch("/api/admin/logout", {
          method: "POST",
        });

        router.push("/admin/login");
        router.refresh();
        return;
      }

      await fetch("/api/logout", {
        method: "POST",
      });

      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1000,
        border: "1px solid #111",
        borderRadius: 8,
        padding: "8px 12px",
        background: "#111",
        color: "white",
        cursor: "pointer",
      }}
    >
      Logout
    </button>
  );
}
