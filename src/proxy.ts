import { NextRequest, NextResponse } from "next/server";

// "/" is NOT protected — the root route renders the public landing page for
// anonymous visitors and the dashboard for signed-in users (see src/app/page.tsx).
const CLIENT_PROTECTED_ROUTES = ["/calls", "/billing"];
const ADMIN_BASE_ROUTE = "/admin";
const ADMIN_LOGIN_ROUTE = "/admin/login";
const CLIENT_LOGIN_ROUTE = "/login";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const clientApiKey = req.cookies.get("client_api_key")?.value;
  const adminAuth = req.cookies.get("admin_auth")?.value;

  const isAdminLoginRoute = pathname === ADMIN_LOGIN_ROUTE;

  const isAdminProtectedRoute =
    pathname === ADMIN_BASE_ROUTE ||
    (pathname.startsWith(`${ADMIN_BASE_ROUTE}/`) && !isAdminLoginRoute);

  const isClientProtectedRoute = CLIENT_PROTECTED_ROUTES.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  });

  if (isAdminLoginRoute) {
    if (adminAuth === "true") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  if (isAdminProtectedRoute) {
    if (adminAuth !== "true") {
      return NextResponse.redirect(new URL(ADMIN_LOGIN_ROUTE, req.url));
    }
    return NextResponse.next();
  }

  if (isClientProtectedRoute) {
    if (!clientApiKey) {
      return NextResponse.redirect(new URL(CLIENT_LOGIN_ROUTE, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/calls/:path*", "/billing/:path*", "/admin/:path*"],
};