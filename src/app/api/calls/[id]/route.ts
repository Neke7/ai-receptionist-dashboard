import { NextResponse } from "next/server";

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:3001";

const CLIENT_API_KEY = process.env.CLIENT_API_KEY || "";

type Params = { id: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  try {
    const { id } = await ctx.params;

    const res = await fetch(`${BACKEND}/api/calls/${id}`, {
      cache: "no-store",
      headers: {
        "x-api-key": CLIENT_API_KEY,
      },
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<Params> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const res = await fetch(`${BACKEND}/api/calls/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLIENT_API_KEY,
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
    console.error(err);
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 500 });
  }
}