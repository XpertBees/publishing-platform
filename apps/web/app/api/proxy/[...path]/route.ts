import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

interface RefreshResult {
  accessToken?: string;
  refreshToken?: string;
}

/** Exchange the refresh cookie for a fresh access token. */
async function tryRefresh(refreshToken: string): Promise<RefreshResult | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => null)) as {
      success?: boolean;
      data?: RefreshResult;
    } | null;
    if (!json?.success || !json.data?.accessToken) return null;
    return json.data;
  } catch {
    return null;
  }
}

async function handle(
  req: NextRequest,
  params: Promise<{ path: string[] }>,
): Promise<NextResponse> {
  const { path } = await params;
  const store = await cookies();
  const access = store.get("dp_access")?.value;
  const refreshToken = store.get("dp_refresh")?.value;
  const search = req.nextUrl.search;
  const url = `${API_URL}/${path.join("/")}${search}`;
  const method = req.method;
  const hasBody = method !== "GET" && method !== "HEAD";
  const rawBody = hasBody ? await req.arrayBuffer() : undefined;

  const doFetch = async (token?: string) => {
    const headers = new Headers();
    const contentType = req.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    if (token) headers.set("authorization", `Bearer ${token}`);
    return fetch(url, {
      method,
      headers,
      body: rawBody,
      // `duplex` is required by undici when forwarding a stream/array body.
      ...(rawBody ? { duplex: "half" } : {}),
    } as RequestInit);
  };

  let res: Response;
  try {
    res = await doFetch(access);
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "API_UNREACHABLE", message: "API service unavailable" } },
      { status: 502 },
    );
  }

  let refreshed: RefreshResult | null = null;
  if (res.status === 401 && refreshToken) {
    refreshed = await tryRefresh(refreshToken);
    if (refreshed?.accessToken) {
      try {
        res = await doFetch(refreshed.accessToken);
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: { code: "API_UNREACHABLE", message: "API service unavailable" },
          },
          { status: 502 },
        );
      }
    }
  }

  const body = await res.arrayBuffer();
  const response = new NextResponse(body, { status: res.status });
  const resContentType = res.headers.get("content-type");
  if (resContentType) response.headers.set("content-type", resContentType);
  if (refreshed?.accessToken) {
    response.cookies.set("dp_access", refreshed.accessToken, { ...COOKIE_OPTS, maxAge: 60 * 15 });
    if (refreshed.refreshToken) {
      response.cookies.set("dp_refresh", refreshed.refreshToken, {
        ...COOKIE_OPTS,
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  }
  return response;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, ctx.params);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, ctx.params);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, ctx.params);
}
