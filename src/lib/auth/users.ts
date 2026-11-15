import bcrypt from "bcryptjs";
import { getSheetsConfig } from "@/lib/sheets/client";
import { normalizeEmail, readUsers } from "@/lib/sheets/users";
import type { UserRole } from "./roles";

/**
 * Sign-in accounts come from two places, and both work at the same time:
 * - **Root admins** in the HUB_USERS environment variable. They always work (even when the
 *   Sheet is unreachable), are always admins, and are never stored in or editable from the Sheet.
 * - **Users** in the Users tab of the Google Sheet, managed in Settings → Users.
 * If an email is in both, the root admin wins.
 */
export interface DirectoryUser {
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  /** True for HUB_USERS accounts. */
  root: boolean;
  passwordHash?: string;
}
export interface Directory {
  users: DirectoryUser[];
  /** Whether users can be managed in the app (the Sheet is configured and has a Users tab). */
  sheetReady: boolean;
}
export interface AuthenticatedUser {
  email: string;
  name: string;
  role: UserRole;
}

export function rootAdmins(): DirectoryUser[] {
  const raw = process.env.HUB_USERS ?? "";
  if (!raw.trim()) {
    warnAboutHubUsers("HUB_USERS is not set (or empty) in the server environment.");
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    warnAboutHubUsers(
      `HUB_USERS is not valid JSON, so every root admin is ignored: ${(error as Error).message}. ` +
      `It starts with ${JSON.stringify(raw.slice(0, 2))} and is ${raw.length} characters long. ` +
      `Keep it on ONE line, wrapped in single quotes: HUB_USERS='[{"email":"…","name":"…","passwordHash":"$2b$12$…"}]'`,
    );
    return [];
  }
  if (!Array.isArray(parsed)) {
    warnAboutHubUsers('HUB_USERS must be a JSON array: [{"email":…}, …].');
    return [];
  }
  const admins = parsed
    .filter((entry) => entry && typeof entry.email === "string")
    .map((entry) => ({
      email: normalizeEmail(entry.email),
      name: String(entry.name || entry.email),
      role: "admin" as const,
      active: entry.active !== false,
      root: true,
      passwordHash: typeof entry.passwordHash === "string" ? entry.passwordHash : undefined,
    }));
  if (admins.length < parsed.length)
    warnAboutHubUsers(
      `${parsed.length - admins.length} HUB_USERS entries have no "email" and are ignored.`,
    );
  for (const admin of admins)
    if (!/^\$2[aby]\$\d{2}\$.{53}$/.test(admin.passwordHash ?? ""))
      warnAboutHubUsers(
        `HUB_USERS entry "${admin.email}" has no valid "passwordHash" (a 60-character bcrypt hash), so it cannot sign in.`,
      );
  return admins;
}

/** Explains HUB_USERS problems on the server console, once per message. Never prints the value. */
const reportedHubUsersWarnings = new Set<string>();
function warnAboutHubUsers(message: string) {
  if (reportedHubUsersWarnings.has(message)) return;
  reportedHubUsersWarnings.add(message);
  console.warn(`[auth] ${message}`);
}

/** Short cache so every request does not read the Users tab; cleared when users change. */
const CACHE_MS = 30_000;
let cachedDirectory: { directory: Directory; at: number } | null = null;
export function invalidateDirectory() {
  cachedDirectory = null;
}

export async function loadDirectory(): Promise<Directory> {
  if (cachedDirectory && Date.now() - cachedDirectory.at < CACHE_MS)
    return cachedDirectory.directory;
  const roots = rootAdmins();
  const config = getSheetsConfig();
  let sheetUsers: Awaited<ReturnType<typeof readUsers>> = null;
  if (config) {
    try {
      sheetUsers = await readUsers(config);
    } catch (error) {
      // The Sheet is unreachable: root admins can still sign in; nobody else can. Not cached.
      if (roots.length) return { users: roots, sheetReady: false };
      throw error;
    }
  }
  const rootEmails = new Set(roots.map((user) => user.email));
  const directory: Directory = {
    users: [
      ...roots,
      ...(sheetUsers ?? [])
        .filter((user) => !rootEmails.has(user.email))
        .map((user) => ({ ...user, root: false })),
    ],
    sheetReady: sheetUsers !== null,
  };
  cachedDirectory = { directory, at: Date.now() };
  return directory;
}

/** A valid hash to compare against for unknown emails, so timing does not reveal accounts. */
const UNKNOWN_USER_HASH = bcrypt.hashSync("unknown-user-placeholder", 10);

export async function authenticate(
  email: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  const { users } = await loadDirectory();
  const user = users.find((candidate) => candidate.email === normalizeEmail(email));
  if (!user || !user.active) {
    await bcrypt.compare(password, UNKNOWN_USER_HASH);
    explainRejection(email, user ? "the account is inactive" : "no account has this email", users);
    return null;
  }
  // Only bcrypt hashes are accepted; an account without one cannot sign in.
  const hasValidHash = BCRYPT_HASH.test(user.passwordHash ?? "");
  const passwordMatches = await bcrypt.compare(
    password,
    hasValidHash ? user.passwordHash! : UNKNOWN_USER_HASH,
  );
  if (!hasValidHash || !passwordMatches) {
    explainRejection(
      email,
      hasValidHash
        ? "the password does not match"
        : `the passwordHash is not a bcrypt hash (length ${user.passwordHash?.length ?? 0}, expected 60)`,
      users,
    );
    return null;
  }
  return { email: user.email, name: user.name, role: user.role };
}

const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$.{53}$/;
/**
 * In development, says on the server console why a sign-in was refused. The login form only
 * says "incorrect" (so it does not reveal which emails exist); this is for the person running
 * the server. Never logs passwords or hashes.
 */
function explainRejection(email: string, reason: string, users: DirectoryUser[]) {
  if (process.env.NODE_ENV === "production") return;
  console.warn(
    `[auth] Sign-in refused for "${normalizeEmail(email)}": ${reason}. Known accounts: ${users.map((user) => `${user.email}${user.root ? " (root)" : ""}`).join(", ") || "none"
    }.`,
  );
}

/** The current record for a signed-in email, or null if it was removed or deactivated. */
export async function findActiveUser(email: string): Promise<AuthenticatedUser | null> {
  const { users } = await loadDirectory();
  const user = users.find((candidate) => candidate.email === normalizeEmail(email));
  if (!user?.active && process.env.NODE_ENV !== "production")
    console.warn(
      `[auth] Session for "${normalizeEmail(email)}" ended: ${user ? "the account is inactive" : "no account has this email any more"}.`,
    );
  return user?.active ? { email: user.email, name: user.name, role: user.role } : null;
}

/** True when no account exists anywhere, so the login page can explain how to add one. */
export async function hasNoAccounts() {
  try {
    return (await loadDirectory()).users.length === 0;
  } catch {
    return false;
  }
}
