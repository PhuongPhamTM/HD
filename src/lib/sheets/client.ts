import { importPKCS8, SignJWT } from "jose";

/**
 * Minimal Google Sheets REST client authenticated as a service account.
 * Server-only: it reads the service account's private key from the environment.
 */
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_URL = "https://sheets.googleapis.com/v4/spreadsheets";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

export interface SheetsConfig {
  spreadsheetId: string;
  clientEmail: string;
  privateKey: string;
}
export function getSheetsConfig(): SheetsConfig | null {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID?.trim();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  // Env files usually hold the PEM key on one line with literal "\n" sequences.
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!spreadsheetId || !clientEmail || !privateKey) return null;
  return { spreadsheetId, clientEmail, privateKey };
}
export const spreadsheetUrl = (spreadsheetId: string) =>
  `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

export class SheetsError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "SheetsError";
  }
}

let cachedToken: { value: string; expiresAt: number; clientEmail: string } | null = null;
async function getAccessToken(config: SheetsConfig) {
  if (
    cachedToken &&
    cachedToken.clientEmail === config.clientEmail &&
    cachedToken.expiresAt > Date.now() + 60_000
  )
    return cachedToken.value;

  let signingKey: CryptoKey;
  try {
    signingKey = await importPKCS8(config.privateKey, "RS256");
  } catch {
    throw new SheetsError(
      "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is not a valid PKCS#8 private key.",
      500,
    );
  }
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(config.clientEmail)
    .setAudience(TOKEN_URL)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(signingKey);
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!response.ok || !body.access_token)
    throw new SheetsError(
      `Google sign-in failed: ${body.error_description ?? response.statusText}`,
      response.status,
    );
  cachedToken = {
    value: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
    clientEmail: config.clientEmail,
  };
  return cachedToken.value;
}

/** Calls the Sheets API for the configured spreadsheet. `path` is appended to its URL. */
export async function sheetsRequest<T>(
  config: SheetsConfig,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${SHEETS_URL}/${encodeURIComponent(config.spreadsheetId)}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${await getAccessToken(config)}`,
      ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    const message = body.error?.message ?? response.statusText;
    throw new SheetsError(
      response.status === 403 || response.status === 404
        ? `Google Sheets refused access (${message}). Share the Sheet with ${config.clientEmail} as an Editor.`
        : `Google Sheets error: ${message}`,
      response.status,
    );
  }
  return (await response.json()) as T;
}

/** Quotes a tab name for A1 notation, e.g. `'Content'!A1:Z`. */
export const a1 = (tab: string, range = "") =>
  `'${tab.replaceAll("'", "''")}'${range ? `!${range}` : ""}`;
