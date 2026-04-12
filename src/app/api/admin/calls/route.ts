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

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/admin/calls`, {
      method: "GET",
      cache: "no-store",
      headers: { Authorization: adminBasicAuth() },
    });

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error("ADMIN CALLS PROXY GET error:", err);
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 500 }
    );
  }
}

