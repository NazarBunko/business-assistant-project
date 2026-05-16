import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.API_URL_INTERNAL?.replace(/\/$/, "") ||
  "http://localhost:3001";

const AUTH_COOKIE = "accessToken";
const AUTH_PATHS = new Set([
  "auth/login",
  "auth/register",
  "auth/register/employee",
]);

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24,
  };
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join("/");
  const targetUrl = `${BACKEND_URL}/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const backendRes = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  });

  const isAuthLogin = AUTH_PATHS.has(path) && req.method === "POST";

  if (isAuthLogin && backendRes.ok) {
    const payload = await backendRes.json();
    const { accessToken, user } = payload as {
      accessToken?: string;
      user?: unknown;
    };
    const clientBody = user ?? payload;
    const res = NextResponse.json(clientBody, { status: backendRes.status });

    if (accessToken) {
      res.cookies.set(AUTH_COOKIE, accessToken, getCookieOptions());
    }

    return res;
  }

  if (path === "auth/logout" && req.method === "POST") {
    const data = await backendRes.json().catch(() => ({}));
    const res = NextResponse.json(data, { status: backendRes.status });
    res.cookies.delete(AUTH_COOKIE);
    return res;
  }

  const responseHeaders = new Headers();
  const backendContentType = backendRes.headers.get("content-type");
  if (backendContentType) {
    responseHeaders.set("content-type", backendContentType);
  }

  return new NextResponse(await backendRes.arrayBuffer(), {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(req, path);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
