import { getSession, type SessionUser } from "./session";
import { findActiveUser } from "./users";

/**
 * The signed-in user, re-checked against the user directory so a removed or deactivated
 * account loses access (within the directory cache time) and role changes apply without
 * signing in again. Kept apart from session.ts so the proxy does not load the Sheets client.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const sessionUser = await getSession();
  if (!sessionUser) return null;
  try {
    return await findActiveUser(sessionUser.email);
  } catch {
    // The user list is unreachable right now; trust the signed session rather than lock everyone out.
    return sessionUser;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user)
    throw new Error("Your session has expired or your account was deactivated. Sign in again.");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Only admins can do this.");
  return user;
}
