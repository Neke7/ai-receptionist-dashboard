import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="AI Receptionist Dashboard"',
    },
  });
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next.js internals + public files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  ) {
    return NextResponse.next();
  }

  // ✅ Protect these routes (dashboard + API proxy routes)
  const isProtected =
    pathname === "/" ||
    pathname.startsWith("/calls") ||
    pathname.startsWith("/api");

  if (!isProtected) return NextResponse.next();

  const user = process.env.DASH_USER || "";
  const pass = process.env.DASH_PASS || "";

  // If env vars are missing, lock it down (safer than accidentally open)
  if (!user || !pass) return unauthorized();

  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Basic ")) return unauthorized();

  const base64 = auth.slice("Basic ".length);
  let decoded = "";
  try {
    decoded = Buffer.from(base64, "base64").toString("utf8");
  } catch {
    return unauthorized();
  }

  const [u, p] = decoded.split(":");
  if (u === user && p === pass) return NextResponse.next();

  return unauthorized();
}

// Apply middleware to all routes (we already allowlist _next above)
export const config = {
  matcher: ["/:path*"],
};
