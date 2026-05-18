import { NextResponse } from "next/server";

const BACKEND =
  process.env.BACKEND_URL?.trim() ||
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
  "http://localhost:3001";

type Params = { token: string };

export async function GET(
  _req: Request,
  ctx: { params: Promise<Params> }
) {
  try {
    const { token } = await ctx.params;

    const res = await fetch(
      `${BACKEND}/api/onboarding/${encodeURIComponent(token)}`,
      { cache: "no-store" }
    );

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error("ONBOARDING PROXY GET error:", err);
    return NextResponse.json(
      { error: "Unable to load the onboarding form right now. Please try again." },
      { status: 502 }
    );
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<Params> }
) {
  try {
    const { token } = await ctx.params;
    const body = await req.text();

    const res = await fetch(
      `${BACKEND}/api/onboarding/${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        cache: "no-store",
      }
    );

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error("ONBOARDING PROXY POST error:", err);
    return NextResponse.json(
      { error: "Unable to submit the onboarding form right now. Please try again." },
      { status: 502 }
    );
  }
}
