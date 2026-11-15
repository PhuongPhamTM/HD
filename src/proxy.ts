import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/logout") return NextResponse.next();
  if (pathname === "/login") {
    const user = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
    if (user) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }
  const user = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
