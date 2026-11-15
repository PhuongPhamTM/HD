import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Clears the session cookie and goes to the login page. The dashboard redirects here when a
 * signed session belongs to an account that was removed or deactivated (a layout cannot
 * change cookies, and going straight to /login would bounce back because the cookie is valid).
 */
export function GET(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const reason = request.nextUrl.searchParams.get("reason");
  if (reason) loginUrl.searchParams.set("reason", reason);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
