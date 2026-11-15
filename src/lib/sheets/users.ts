import { isUserRole, type UserRole } from "@/lib/auth/roles";
import { a1, type SheetsConfig } from "./client";
import {
  appendRows,
  batchGet,
  getTabIds,
  headerOf,
  updateSpreadsheet,
  withWriteLock,
  writeValues,
} from "./repository";
import { fromRow, toRow, USERS_TAB } from "./schema";

/** A row of the Users tab. Server-only: it carries the password hash. */
export interface StoredUser {
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

function toStoredUser(record: Record<string, unknown>): StoredUser | null {
  const email = normalizeEmail(String(record.email ?? ""));
  if (!email) return null;
  return {
    email,
    name: String(record.name ?? "").trim() || email,
    passwordHash: String(record.passwordHash ?? "").trim(),
    // An unknown role gets the least privilege.
    role: isUserRole(String(record.role ?? "").trim())
      ? (String(record.role).trim() as UserRole)
      : "editor",
    active:
      String(record.active ?? "")
        .trim()
        .toUpperCase() !== "FALSE",
    createdAt: String(record.createdAt ?? ""),
    updatedAt: String(record.updatedAt ?? ""),
  };
}

/** Reads the Users tab. Returns `null` when the tab does not exist yet. */
export async function readUsers(config: SheetsConfig): Promise<StoredUser[] | null> {
  const tabIds = await getTabIds(config);
  if (!tabIds.has(USERS_TAB.tab)) return null;
  const [values] = await batchGet(config, [a1(USERS_TAB.tab)]);
  const header = headerOf(values);
  const seen = new Set<string>();
  return values
    .slice(1)
    .map((row) => toStoredUser(fromRow(USERS_TAB, header, row)))
    .filter(
      (user): user is StoredUser =>
        Boolean(user) && !seen.has(user!.email) && Boolean(seen.add(user!.email)),
    );
}

/**
 * Creates or updates the row for the user that `buildUser` returns. `buildUser` runs inside the
 * write lock with the current rows (and may throw to cancel), so rules such as "keep at least
 * one active admin" cannot race another save.
 */
export function writeUser(
  config: SheetsConfig,
  buildUser: (existingUsers: StoredUser[]) => StoredUser,
) {
  return withWriteLock(async () => {
    const tabIds = await getTabIds(config);
    if (!tabIds.has(USERS_TAB.tab))
      throw new Error('The Sheet has no Users tab yet. Run "Set up Sheet" in Settings first.');
    const [values] = await batchGet(config, [a1(USERS_TAB.tab)]);
    const header = headerOf(values);
    const emailColumn = header.indexOf("email");
    if (emailColumn < 0) throw new Error('The Users tab has no "email" column. Run "Repair tabs".');
    const existingUsers = values
      .slice(1)
      .map((row) => toStoredUser(fromRow(USERS_TAB, header, row)))
      .filter((user): user is StoredUser => Boolean(user));

    const user = buildUser(existingUsers);
    const rowIndex = values
      .slice(1)
      .findIndex((row) => normalizeEmail(String(row[emailColumn] ?? "")) === user.email);
    const row = toRow(USERS_TAB, { ...user, active: user.active ? "TRUE" : "FALSE" }, header);
    if (rowIndex >= 0)
      await writeValues(config, [{ range: a1(USERS_TAB.tab, `A${rowIndex + 2}`), values: [row] }]);
    else await appendRows(config, USERS_TAB.tab, [row]);
    return user;
  });
}

/**
 * Deletes the Users-tab row for `email`. `check` runs inside the write lock with the user as
 * it is stored right now and may throw to refuse (for example, for an admin).
 */
export function deleteUser(config: SheetsConfig, email: string, check: (user: StoredUser) => void) {
  return withWriteLock(async () => {
    const tabIds = await getTabIds(config);
    const sheetId = tabIds.get(USERS_TAB.tab);
    if (sheetId === undefined) throw new Error("The Sheet has no Users tab.");
    const [values] = await batchGet(config, [a1(USERS_TAB.tab)]);
    const header = headerOf(values);
    const rowIndex = values
      .slice(1)
      .findIndex((row) => toStoredUser(fromRow(USERS_TAB, header, row))?.email === email);
    if (rowIndex < 0) throw new Error("That user no longer exists.");
    const user = toStoredUser(fromRow(USERS_TAB, header, values[rowIndex + 1]))!;
    check(user);
    // Row 1 is the header, so data row `rowIndex` is sheet row index `rowIndex + 1`.
    await updateSpreadsheet(config, [
      {
        deleteDimension: {
          range: { sheetId, dimension: "ROWS", startIndex: rowIndex + 1, endIndex: rowIndex + 2 },
        },
      },
    ]);
    return user;
  });
}
