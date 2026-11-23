import { NextResponse } from "next/server";

/** POST /api/auth/logout — clears both auth cookies. */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("dp_access", "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set("dp_refresh", "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
