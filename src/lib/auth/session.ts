import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { isUserRole, type UserRole } from "./roles";

export const SESSION_COOKIE = "handong_session";
const secret = () =>
  new TextEncoder().encode(
    process.env.SESSION_SECRET || "local-development-secret-change-before-deploying",
  );
export interface SessionUser {
  email: string;
  name: string;
  role: UserRole;
}
export async function signSession(user: SessionUser) {
  return new SignJWT(user as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}
export async function verifySession(token?: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      email: String(payload.email),
      name: String(payload.name),
      // Sessions issued before roles existed get the least privilege.
      role: isUserRole(payload.role) ? payload.role : "editor",
    };
  } catch {
    return null;
  }
}
export async function getSession() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}
export async function setSession(user: SessionUser, remember = true) {
  const token = await signSession(user);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge: 60 * 60 * 24 * 7 } : {}),
  });
}
export async function clearSession() {
  (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
