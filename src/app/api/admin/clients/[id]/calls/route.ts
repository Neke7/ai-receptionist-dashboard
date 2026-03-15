import { NextResponse } from "next/server";

const BACKEND =
  process.env.BACKEND_URL?.trim() ||
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
  "http://localhost:3001";

type Params = { id: string };

export async function GET(
  _req: Request,
  ctx: { params: Promise<Params> }
) {
  try {
    const { id } = await ctx.params;

    const res = await fetch(`${BACKEND}/api/clients/${id}/calls`, {
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
    console.error("Proxy GET /api/admin/clients/[id]/calls error:", err);
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 500 }
    );
  }
}