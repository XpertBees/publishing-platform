import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

/** POST /api/auth/login — proxies to the Express API and sets httpOnly cookies. */
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
    });
  } catch {
    return NextResponse.json({ error: "Authentication service unavailable" }, { status: 502 });
  }

  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    data?: { accessToken?: string; refreshToken?: string; user?: unknown };
    error?: { message?: string };
  } | null;

  if (!res.ok || !json?.success || !json.data?.accessToken || !json.data?.refreshToken) {
    return NextResponse.json(
      { error: json?.error?.message ?? "Invalid email or password" },
      { status: res.status === 200 ? 401 : res.status },
    );
  }

  const response = NextResponse.json({ user: json.data.user });
  response.cookies.set("dp_access", json.data.accessToken, { ...COOKIE_OPTS, maxAge: 60 * 15 });
  response.cookies.set("dp_refresh", json.data.refreshToken, {
    ...COOKIE_OPTS,
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
