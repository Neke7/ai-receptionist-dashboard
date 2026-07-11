import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND =
  (process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:3001")!.trim();

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const apiKey = cookieStore.get("client_api_key")?.value?.trim();

    if (!apiKey) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    // Forward ?status / ?from / ?to (and any future filters) straight through.
    const search = new URL(req.url).search;

    const res = await fetch(`${BACKEND}/api/appointments${search}`, {
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
    console.error("Proxy GET /api/appointments error:", err);
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 500 });
  }
}

// Manual appointment create. Forwards the body to the live backend
// POST /api/appointments and passes its status + body through VERBATIM — the
// page depends on 201 / 201+warning / 409 / 400 arriving intact (mirrors the
// [id] PATCH proxy pattern).
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const apiKey = cookieStore.get("client_api_key")?.value?.trim();

    if (!apiKey) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const payload = await req.text();

    const res = await fetch(`${BACKEND}/api/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": req.headers.get("content-type") ?? "application/json",
        "x-api-key": apiKey,
      },
      body: payload,
    });

    const body = await res.text();

    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error("Proxy POST /api/appointments error:", err);
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 500 });
  }
}
