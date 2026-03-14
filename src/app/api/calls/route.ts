import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND =
  (process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:3001")!.trim();

export async function GET() {
  try {
    const cookieStore = await cookies(); // ✅ IMPORTANT (fixes your error)
    const apiKey = cookieStore.get("client_api_key")?.value?.trim();

    // ✅ Must be 401 so your UI redirects to /login
    if (!apiKey) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const res = await fetch(`${BACKEND}/api/calls`, {
      cache: "no-store",
      headers: { "x-api-key": apiKey },
    });

    const body = await res.text();

    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error("Proxy GET /api/calls error:", err);
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 500 });
  }
}

