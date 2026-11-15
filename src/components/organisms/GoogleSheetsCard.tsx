"use client";
import { Button, Tag } from "@/components/atoms/ui";
import { Card, CardBody, CardHeader } from "@/components/molecules/ui";
import type { SyncStatus } from "@/lib/store/useHubStore";

const STATE_TAG: Record<
  SyncStatus["state"],
  { tone: "green" | "amber" | "red" | "gray"; label: string }
> = {
  connected: { tone: "green", label: "Connected" },
  not_set_up: { tone: "amber", label: "Needs setup" },
  not_configured: { tone: "gray", label: "Not configured" },
  error: { tone: "red", label: "Error" },
  unknown: { tone: "gray", label: "Checking…" },
};

export function GoogleSheetsCard({
  sync,
  isBusy,
  canManage,
  onSetup,
  onReload,
  onUpload,
}: {
  sync: SyncStatus;
  isBusy: boolean;
  /** Admins only: set up the tabs and replace the Sheet's data. */
  canManage: boolean;
  onSetup(): void;
  onReload(): void;
  onUpload(): void;
}) {
  const stateTag = STATE_TAG[sync.state];
  const isConnected = sync.state === "connected";
  return (
    <Card className="google-sheets-card">
      <CardHeader
        title="Google Sheets"
        subtitle="The shared data store for content, campaigns, publications and options"
        action={<Tag tone={stateTag.tone}>{stateTag.label}</Tag>}
      />
      <CardBody>
        {sync.state === "not_configured" && (
          <p className="mt-0 text-[11px] text-muted">
            The server has no Google credentials yet, so changes are saved in this browser only. Set{" "}
            <code>GOOGLE_SHEETS_ID</code>, <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code> and{" "}
            <code>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code>, then restart the app. See{" "}
            <code>docs/google-sheets.md</code>.
          </p>
        )}
        {sync.state === "not_set_up" && (
          <p className="mt-0 text-[11px] text-muted">
            The Sheet is reachable but missing its tabs.{" "}
            {canManage ? (
              <>
                <strong>Set up Sheet</strong> creates them, adds the Options and Users tabs and
                copies the data from this browser into any empty tab.
              </>
            ) : (
              "Ask an admin to run “Set up Sheet”."
            )}
          </p>
        )}
        {sync.state === "error" && <p className="mt-0 text-[11px] text-danger">{sync.message}</p>}
        {isConnected && (
          <p className="mt-0 text-[11px] text-muted">
            Every change is saved to the Sheet as you work. Edits made directly in the Sheet appear
            here when you reload or come back to this tab. Manage dropdown choices (channels,
            checklist items, stage labels, phases) in the <strong>Options</strong> tab.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {canManage && (sync.state === "not_set_up" || isConnected) && (
            <Button
              variant={isConnected ? "secondary" : "primary"}
              onClick={onSetup}
              disabled={isBusy}
            >
              {isConnected ? "Repair tabs & headers" : "Set up Sheet"}
            </Button>
          )}
          <Button onClick={onReload} disabled={isBusy || sync.loading}>
            {sync.loading ? "Loading…" : "Reload from Sheet"}
          </Button>
          {canManage && isConnected && (
            <Button variant="danger" onClick={onUpload} disabled={isBusy}>
              Replace Sheet with this browser&apos;s data
            </Button>
          )}
          {sync.sheetUrl && (
            <a
              href={sync.sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-2 text-[11px] font-semibold text-brand-text"
            >
              Open Sheet ↗
            </a>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
