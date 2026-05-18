import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND =
  process.env.BACKEND_URL?.trim() ||
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
  "http://localhost:3001";

function adminBasicAuth(): string {
  const user = process.env.ADMIN_USERNAME || process.env.DASH_USER || "";
  const pass = process.env.ADMIN_PASSWORD || process.env.DASH_PASS || "";
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

type Params = { id: string };

export async function POST(
  _req: Request,
  ctx: { params: Promise<Params> }
) {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_auth")?.value !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;

    const res = await fetch(`${BACKEND}/api/admin/clients/${id}/suspend`, {
      method: "POST",
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
    console.error(
      "Proxy POST /api/admin/clients/[id]/suspend error:",
      err
    );
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 500 }
    );
  }
}
