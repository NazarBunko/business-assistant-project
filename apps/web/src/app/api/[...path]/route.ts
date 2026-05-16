import { NextRequest, NextResponse } from "next/server";

/** Server-only URL of NestJS (Render). Not exposed to the browser. */
function getBackendUrl(): string {
  const fromEnv =
    process.env.API_URL_INTERNAL ||
    process.env.BACKEND_URL ||
    process.env.NEST_API_URL;

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  // Fallback for this project's Render deployment when env is missing on Vercel
  if (process.env.VERCEL) {
    return "https://business-api-v9p8.onrender.com";
  }

  return "http://localhost:3001";
}

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

async function readJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const backendUrl = getBackendUrl();
  const path = pathSegments.join("/");
  const targetUrl = `${backendUrl}/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const accept = req.headers.get("accept");
  if (accept) headers.set("accept", accept);
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.arrayBuffer() : undefined;

  let backendRes: Response;
  try {
    backendRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch (error) {
    console.error("[api proxy] fetch failed:", targetUrl, error);
    return NextResponse.json(
      {
        message: "API unreachable",
        hint: "Set API_URL_INTERNAL to your Render URL in Vercel environment variables",
        backend: backendUrl,
      },
      { status: 502 },
    );
  }

  const isAuthPost = AUTH_PATHS.has(path) && req.method === "POST";

  if (isAuthPost) {
    const payload = await readJsonSafe(backendRes);

    if (!backendRes.ok) {
      return NextResponse.json(payload ?? { message: "Login failed" }, {
        status: backendRes.status,
      });
    }

    const { accessToken, user } = (payload ?? {}) as {
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
    const data = await readJsonSafe(backendRes);
    const res = NextResponse.json(data ?? {}, { status: backendRes.status });
    res.cookies.delete(AUTH_COOKIE);
    return res;
  }

  const responseHeaders = new Headers();
  const backendContentType = backendRes.headers.get("content-type");
  if (backendContentType) {
    responseHeaders.set("content-type", backendContentType);
  }

  const responseBody = await backendRes.arrayBuffer();
  return new NextResponse(responseBody, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(req: NextRequest, context: RouteContext) {
  try {
    const { path } = await context.params;
    if (!path?.length) {
      return NextResponse.json({ message: "Missing API path" }, { status: 404 });
    }
    return proxyRequest(req, path);
  } catch (error) {
    console.error("[api proxy] unhandled error:", error);
    return NextResponse.json(
      { message: "Internal proxy error" },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
