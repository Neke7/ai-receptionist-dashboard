import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND =
  (process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:3001")!.trim();

/**
 * Server-side OAuth kickoff. The browser hits /api/calendar/connect; we resolve
 * the client id from the cookie-authenticated session here (so the client never
 * needs the backend host or its own id) and 302 to the backend's Google consent
 * screen. Any failure lands the user back on /settings with an ?error= flag
 * rather than crashing.
 */
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const apiKey = cookieStore.get("client_api_key")?.value?.trim();

    if (!apiKey) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Resolve the client id server-side from the authenticated session.
    const meRes = await fetch(`${BACKEND}/api/auth/me`, {
      cache: "no-store",
      headers: { "x-api-key": apiKey },
    });

    if (!meRes.ok) {
      return NextResponse.redirect(new URL("/settings?error=connect", req.url));
    }

    const me = await meRes.json();
    const id = me?.id;

    if (!id) {
      return NextResponse.redirect(new URL("/settings?error=connect", req.url));
    }

    return NextResponse.redirect(
      `${BACKEND}/auth/google?clientId=${encodeURIComponent(String(id))}`
    );
  } catch (err) {
    console.error("Proxy GET /api/calendar/connect error:", err);
    return NextResponse.redirect(new URL("/settings?error=connect", req.url));
  }
}
