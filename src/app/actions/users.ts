"use server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth/current-user";
import { isUserRole, type UserRole } from "@/lib/auth/roles";
import { invalidateDirectory, loadDirectory, rootAdmins } from "@/lib/auth/users";
import { getSheetsConfig } from "@/lib/sheets/client";
import {
  deleteUser,
  normalizeEmail,
  readUsers,
  writeUser,
  type StoredUser,
} from "@/lib/sheets/users";

/** What the Settings → Users screen sees. Password hashes never leave the server. */
export interface ManagedUser {
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  /** HUB_USERS root admin: read-only here, managed in the server environment. */
  root: boolean;
}
export type UserListResult =
  | {
      ok: true;
      /** Root admins first, then the Users tab. */
      users: ManagedUser[];
      /** Whether the Sheet has a Users tab, i.e. users can be saved. */
      canManage: boolean;
      currentEmail: string;
    }
  | { ok: false; message: string };
export interface UserInput {
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  /** Required for a new user; when set for an existing user it resets the password. */
  password?: string;
}
export type SaveUserResult =
  { ok: true; message: string; signInAgain: boolean } | { ok: false; message: string };

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));
const toManagedUser = ({ passwordHash: _passwordHash, ...user }: StoredUser): ManagedUser => ({
  ...user,
  root: false,
});

export async function listUsers(): Promise<UserListResult> {
  try {
    const admin = await requireAdmin();
    const config = getSheetsConfig();
    const sheetUsers = config ? await readUsers(config) : null;
    const roots = rootAdmins();
    const rootEmails = new Set(roots.map((user) => user.email));
    return {
      ok: true,
      users: [
        ...roots.map(({ email, name, role, active }) => ({
          email,
          name,
          role,
          active,
          createdAt: "",
          updatedAt: "",
          root: true,
        })),
        ...(sheetUsers ?? []).filter((user) => !rootEmails.has(user.email)).map(toManagedUser),
      ],
      canManage: sheetUsers !== null,
      currentEmail: admin.email,
    };
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }
}

export async function saveUser(input: UserInput): Promise<SaveUserResult> {
  try {
    const admin = await requireAdmin();
    const config = getSheetsConfig();
    if (!config) return { ok: false, message: "Google Sheets is not configured on the server." };

    const email = normalizeEmail(String(input.email ?? ""));
    const name = String(input.name ?? "").trim();
    const password = typeof input.password === "string" ? input.password : "";
    if (!EMAIL_PATTERN.test(email)) return { ok: false, message: "Enter a valid email address." };
    if (!name) return { ok: false, message: "Enter a name." };
    if (!isUserRole(input.role)) return { ok: false, message: "Choose a role." };
    if (password && password.length < MIN_PASSWORD_LENGTH)
      return {
        ok: false,
        message: `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`,
      };
    const roots = rootAdmins();
    if (roots.some((user) => user.email === email))
      return {
        ok: false,
        message: "That email is a root admin (HUB_USERS). Change it in the server environment.",
      };
    const passwordHash = password ? await bcrypt.hash(password, 12) : "";

    let isNew = false;
    const saved = await writeUser(config, (existingUsers) => {
      const existing = existingUsers.find((user) => user.email === email);
      isNew = !existing;
      if (!existing && !passwordHash) throw new Error("Set a password for the new user.");
      const now = new Date().toISOString();
      const next: StoredUser = {
        email,
        name,
        role: input.role,
        active: Boolean(input.active),
        passwordHash: passwordHash || existing!.passwordHash,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      // Checked against the rows as they are right now, inside the write lock.
      const usersAfter = [...roots, ...existingUsers.filter((user) => user.email !== email), next];
      if (!usersAfter.some((user) => user.role === "admin" && user.active))
        throw new Error("Keep at least one active admin, or add a root admin to HUB_USERS.");
      return next;
    });
    invalidateDirectory();

    // An admin who just deactivated themselves has to leave.
    const { users } = await loadDirectory();
    const stillValid = users.some((user) => user.email === admin.email && user.active);
    const action = isNew ? "Added" : password ? "Updated (password reset)" : "Updated";
    return { ok: true, message: `${action} ${saved.name}.`, signInAgain: !stillValid };
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }
}

/**
 * Removes a user from the Users tab. Admin accounts cannot be removed: root admins live in
 * HUB_USERS, and a Sheet admin has to be changed to editor first. Nobody can remove themselves.
 */
export async function removeUser(email: string): Promise<ActionResultLike> {
  try {
    const admin = await requireAdmin();
    const config = getSheetsConfig();
    if (!config) return { ok: false, message: "Google Sheets is not configured on the server." };
    const target = normalizeEmail(String(email ?? ""));
    if (target === admin.email)
      return { ok: false, message: "You cannot remove your own account." };
    if (rootAdmins().some((user) => user.email === target))
      return {
        ok: false,
        message: "Root admins are managed in HUB_USERS and cannot be removed here.",
      };
    const removed = await deleteUser(config, target, (user) => {
      if (user.role === "admin")
        throw new Error("Admin accounts cannot be removed. Change the role to editor first.");
    });
    invalidateDirectory();
    return {
      ok: true,
      message: `Removed ${removed.name}. Their open sessions end within 30 seconds.`,
    };
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }
}
type ActionResultLike = { ok: true; message: string } | { ok: false; message: string };
