import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND =
  (process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:3001")!.trim();

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const cookieStore = await cookies(); // ✅ IMPORTANT (fixes your error)
    const apiKey = cookieStore.get("client_api_key")?.value?.trim();

    if (!apiKey) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { id } = await ctx.params;

    const res = await fetch(`${BACKEND}/api/calls/${id}`, {
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
    console.error("Proxy GET /api/calls/[id] error:", err);
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const cookieStore = await cookies(); // ✅ IMPORTANT (fixes your error)
    const apiKey = cookieStore.get("client_api_key")?.value?.trim();

    if (!apiKey) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const payload = await req.text();

    const res = await fetch(`${BACKEND}/api/calls/${id}`, {
      method: "PATCH",
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
    console.error("Proxy PATCH /api/calls/[id] error:", err);
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 500 });
  }
}
