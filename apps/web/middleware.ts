import { NextRequest, NextResponse } from "next/server";

/**
 * Guards /admin/* with a presence check on the dp_access cookie.
 * Real authentication and RBAC are enforced by the Express API; this
 * only keeps logged-out visitors out of the admin shell.
 */
export function middleware(req: NextRequest) {
  if (!req.cookies.get("dp_access")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
