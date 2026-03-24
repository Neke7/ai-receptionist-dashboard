import { NextResponse } from "next/server";

const BACKEND =
  process.env.BACKEND_URL?.trim() ||
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
  "http://localhost:3001";

export async function POST(req: Request) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const trimmedKey = apiKey.trim();

    // Validate against backend by attempting a protected read
    const backendRes = await fetch(`${BACKEND}/api/calls`, {
      method: "GET",
      headers: {
        "x-api-key": trimmedKey,
      },
      cache: "no-store",
    });

    if (backendRes.status === 401) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    if (!backendRes.ok) {
      const text = await backendRes.text().catch(() => "");
      console.error("Login validation backend error:", backendRes.status, text);

      return NextResponse.json(
        { error: "Unable to validate API key right now. Please try again." },
        { status: 502 }
      );
    }

    const res = NextResponse.json({ ok: true });

    res.cookies.set("client_api_key", trimmedKey, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (err) {
    console.error("Login route error:", err);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
