import { NextResponse } from "next/server";

const BACKEND =
  process.env.BACKEND_URL?.trim() ||
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
  "http://localhost:3001";

// Public lead capture proxy. No auth, no cookies — the backend
// validates the payload and emails the lead.
export async function POST(req: Request) {
  try {
    const body = await req.text();

    const res = await fetch(`${BACKEND}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    console.error("LEADS PROXY POST error:", err);
    return NextResponse.json(
      { error: "Unable to submit lead right now. Please try again." },
      { status: 502 }
    );
  }
}
