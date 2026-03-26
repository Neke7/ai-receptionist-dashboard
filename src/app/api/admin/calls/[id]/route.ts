import { NextResponse } from "next/server";

const BACKEND =
  process.env.BACKEND_URL?.trim() ||
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
  "http://localhost:3001";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const res = await fetch(`${BACKEND}/api/admin/calls/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error("ADMIN CALL DETAIL PROXY GET error:", err);
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 500 }
    );
  }
}
