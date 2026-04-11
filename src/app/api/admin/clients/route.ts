import { NextResponse } from "next/server";

const BACKEND =
  process.env.BACKEND_URL?.trim() ||
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
  "http://localhost:3001";

function adminBasicAuth(): string {
  const user = process.env.DASH_USER || "";
  const pass = process.env.DASH_PASS || "";
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

// GET /api/admin/clients  -> proxies to backend GET /api/clients
export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/clients`, {
      cache: "no-store",
      headers: { Authorization: adminBasicAuth() },
    });
    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error("ADMIN CLIENTS GET error:", err);
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 500 }
    );
  }
}

// POST /api/admin/clients -> proxies to backend POST /api/clients
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND}/api/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminBasicAuth(),
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error("ADMIN CLIENTS POST error:", err);
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 500 }
    );
  }
}
