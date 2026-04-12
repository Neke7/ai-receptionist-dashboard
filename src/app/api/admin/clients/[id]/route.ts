import { NextResponse } from "next/server";

const BACKEND =
  process.env.BACKEND_URL?.trim() ||
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
  "http://localhost:3001";

function adminBasicAuth(): string {
  const user = process.env.ADMIN_USERNAME || process.env.DASH_USER || "";
  const pass = process.env.ADMIN_PASSWORD || process.env.DASH_PASS || "";
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

type Params = { id: string };

export async function PATCH(
  req: Request,
  ctx: { params: Promise<Params> }
) {
  try {
    const { id } = await ctx.params;
    const body = await req.text();

    const res = await fetch(`${BACKEND}/api/clients/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminBasicAuth(),
      },
      body,
      cache: "no-store",
    });

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error("Proxy PATCH /api/admin/clients/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 500 }
    );
  }
}

