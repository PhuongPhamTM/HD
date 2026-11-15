"use server";
import { requireAdmin, requireUser } from "@/lib/auth/current-user";
import { invalidateDirectory } from "@/lib/auth/users";
import { buildOptions, type HubOptions } from "@/lib/domain/options";
import type { HubData } from "@/lib/domain/types";
import { getSheetsConfig, SheetsError, spreadsheetUrl } from "@/lib/sheets/client";
import {
  applyChanges,
  readWorkspace,
  replaceWorkspace,
  SheetNotReadyError,
  setupSpreadsheet,
  type HubChanges,
} from "@/lib/sheets/repository";
import { COLLECTIONS } from "@/lib/sheets/schema";

/**
 * Server actions behind the Google Sheets data store. Every action requires a signed-in,
 * active user; replacing or setting up the whole Sheet requires an admin. The service account
 * credentials never leave the server.
 */
export type SheetState = "connected" | "not_configured" | "not_set_up" | "error";
export type WorkspaceResult =
  | { state: "connected"; data: HubData; options: HubOptions; sheetUrl: string }
  | { state: Exclude<SheetState, "connected">; message: string; sheetUrl?: string };
export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

const NOT_CONFIGURED =
  "Google Sheets is not configured. Set GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.";
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unexpected Google Sheets error.";

export async function loadWorkspace(): Promise<WorkspaceResult> {
  await requireUser();
  const config = getSheetsConfig();
  if (!config) return { state: "not_configured", message: NOT_CONFIGURED };
  const sheetUrl = spreadsheetUrl(config.spreadsheetId);
  try {
    const { data, optionRows } = await readWorkspace(config);
    return { state: "connected", data, options: buildOptions(optionRows), sheetUrl };
  } catch (error) {
    if (error instanceof SheetNotReadyError)
      return { state: "not_set_up", message: error.message, sheetUrl };
    return { state: "error", message: errorMessage(error), sheetUrl };
  }
}

/** Accepts only known collections and records with an id, since the client is untrusted. */
function sanitizeChanges(changes: HubChanges): HubChanges {
  const sanitized: HubChanges = { upsert: {}, remove: {} };
  for (const name of COLLECTIONS) {
    const upserts = changes.upsert?.[name];
    if (Array.isArray(upserts))
      sanitized.upsert![name] = upserts.filter(
        (record) =>
          record && typeof record === "object" && typeof record.id === "string" && record.id,
      );
    const removals = changes.remove?.[name];
    if (Array.isArray(removals))
      sanitized.remove![name] = removals.filter((id) => typeof id === "string" && id);
  }
  return sanitized;
}

export async function saveChanges(changes: HubChanges): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const config = getSheetsConfig();
    if (!config) return { ok: false, message: NOT_CONFIGURED };
    const sanitized = sanitizeChanges(changes);
    // The activity log records who made the change, taken from the session, not the client.
    sanitized.upsert!.activity = sanitized.upsert!.activity?.map((entry) => ({
      ...entry,
      actor: user.name,
    }));
    await applyChanges(config, sanitized);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

const isHubData = (data: unknown): data is HubData =>
  Boolean(data) &&
  typeof data === "object" &&
  COLLECTIONS.every((name) => Array.isArray((data as Record<string, unknown>)[name]));

/** Creates the tabs; fills any empty collection tab from `seed` (the browser's data). */
export async function setupSheet(seed: HubData | null): Promise<ActionResult> {
  try {
    await requireAdmin();
    const config = getSheetsConfig();
    if (!config) return { ok: false, message: NOT_CONFIGURED };
    const { createdTabs, seeded } = await setupSpreadsheet(config, isHubData(seed) ? seed : null);
    // The Users tab may have just been created, which changes where sign-in reads accounts.
    invalidateDirectory();
    return {
      ok: true,
      message: [
        createdTabs.length ? `Created tabs: ${createdTabs.join(", ")}.` : "All tabs already exist.",
        seeded.length ? `Copied ${seeded.join(", ")} from this browser.` : "",
      ]
        .filter(Boolean)
        .join(" "),
    };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

/** Overwrites every collection tab with `data`. Used for imports, resets and first uploads. */
export async function replaceSheetData(data: HubData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const config = getSheetsConfig();
    if (!config) return { ok: false, message: NOT_CONFIGURED };
    if (!isHubData(data)) return { ok: false, message: "That is not a valid workspace." };
    await replaceWorkspace(config, data);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof SheetsError ? error.message : errorMessage(error),
    };
  }
}
