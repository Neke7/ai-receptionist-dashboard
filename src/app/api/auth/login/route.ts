import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ error: "apiKey is required" }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });

    // cookie name must match what /api/calls reads:
    res.cookies.set("client_api_key", apiKey.trim(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return res;
  } catch (err) {
    console.error("Login route error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}