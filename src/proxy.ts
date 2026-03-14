import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="AI Receptionist Admin"',
    },
  });
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never protect Next internals/static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  ) {
    return NextResponse.next();
  }

  // ✅ Only protect admin routes
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  if (!isAdmin) return NextResponse.next();

  const user = process.env.DASH_USER || "";
  const pass = process.env.DASH_PASS || "";

  // If creds missing, block (safer)
  if (!user || !pass) return unauthorized();

  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("basic ")) return unauthorized();

  try {
    const encoded = authHeader.slice(6).trim();
    const decoded = atob(encoded); // Edge-safe
    const [u, p] = decoded.split(":");
    if (u === user && p === pass) return NextResponse.next();
    return unauthorized();
  } catch {
    return unauthorized();
  }
}

export const config = {
  matcher: ["/:path*"],
};
