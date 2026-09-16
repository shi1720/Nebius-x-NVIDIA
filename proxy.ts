import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin"),
    allowed = process.env.APP_ORIGIN;
  if (request.method === "OPTIONS") {
    if (!origin || origin !== allowed)
      return new NextResponse(null, { status: 403 });
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "600",
        Vary: "Origin",
      },
    });
  }
  const response = NextResponse.next();
  if (origin && origin === allowed)
    response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Vary", "Origin");
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
export const config = { matcher: "/api/:path*" };
