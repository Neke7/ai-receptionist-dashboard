"use client";

import { usePathname, useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Hide logout button on login/auth pages
  if (pathname === "/login" || pathname === "/auth-check") {
    return null;
  }

  async function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to log out?");

    if (!confirmed) return;

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // ignore errors and still redirect
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        zIndex: 9999,
        padding: "8px 12px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        background: "white",
        cursor: "pointer",
      }}
    >
      Logout
    </button>
  );
}

