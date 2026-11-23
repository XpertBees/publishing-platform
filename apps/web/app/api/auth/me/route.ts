import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** GET /api/auth/me — proxies GET /auth/me with the access-token cookie. */
export async function GET() {
  const token = (await cookies()).get("dp_access")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Authentication service unavailable" }, { status: 502 });
  }

  const json = await res.json().catch(() => null);
  return NextResponse.json(json ?? { error: "Unexpected response" }, { status: res.status });
}
