import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const adminUsername = process.env.ADMIN_USERNAME?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();

    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        { error: "Admin credentials are not configured" },
        { status: 500 }
      );
    }

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.trim() !== adminUsername ||
      password !== adminPassword
    ) {
      return NextResponse.json(
        { error: "Invalid admin username or password" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });

    res.cookies.set("admin_auth", "true", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    console.error("ADMIN LOGIN route error:", err);
    return NextResponse.json(
      { error: "Admin login failed" },
      { status: 500 }
    );
  }
}
