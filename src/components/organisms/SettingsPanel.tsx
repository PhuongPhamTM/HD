"use client";
import { useRef, type ReactNode } from "react";
import { PageHeader } from "./PageHeader";
import { Button } from "@/components/atoms/ui";
import { Card, CardBody, CardHeader } from "@/components/molecules/ui";
import type { SyncStatus } from "@/lib/store/useHubStore";
import { GoogleSheetsCard } from "./GoogleSheetsCard";

export interface SettingsPanelProps {
  /** Admins also manage users and whole-Sheet actions. */
  isAdmin: boolean;
  /** Message from the last Sheet/backup task; empty hides the banner. */
  notice: string;
  sync: SyncStatus;
  isSyncing: boolean;
  workspaceCounts: { content: number; publications: number; campaigns: number };
  /** The users UI (shown to admins only). */
  usersSlot: ReactNode;
  onNoticeDismiss(): void;
  onSetupSheet(): void;
  onReloadSheet(): void;
  onUploadToSheet(): void;
  onExportJson(): void;
  onImportBackup(backupFile: File): void;
  onExportContentPlanCsv(): void;
  onExportChannelReportCsv(): void;
  onResetData(): void;
}

/** Editors see exports and sync status; admins also manage users and whole-Sheet actions. */
export function SettingsPanel({
  isAdmin,
  notice,
  sync,
  isSyncing,
  workspaceCounts,
  usersSlot,
  onNoticeDismiss,
  onSetupSheet,
  onReloadSheet,
  onUploadToSheet,
  onExportJson,
  onImportBackup,
  onExportContentPlanCsv,
  onExportChannelReportCsv,
  onResetData,
}: SettingsPanelProps) {
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  function handleBackupFileChange(changeEvent: React.ChangeEvent<HTMLInputElement>) {
    const backupFile = changeEvent.target.files?.[0];
    changeEvent.target.value = "";
    if (!backupFile) return;
    onImportBackup(backupFile);
  }
  return (
    <div className="settings-panel">
      <PageHeader
        title="Settings & Integrations"
        description="Manage the Google Sheets data store, backups and exports."
      />
      {notice && (
        <div
          role="status"
          className="settings-panel__notice mb-4 flex items-center justify-between rounded-ctl border border-brand/20 bg-brand-soft px-4 py-3 text-brand-text"
        >
          <span>{notice}</span>
          <button onClick={onNoticeDismiss} className="font-bold">
            ×
          </button>
        </div>
      )}
      <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)] gap-4 max-[900px]:grid-cols-1">
        <div className="grid gap-4">
          <GoogleSheetsCard
            sync={sync}
            isBusy={isSyncing}
            canManage={isAdmin}
            onSetup={onSetupSheet}
            onReload={onReloadSheet}
            onUpload={onUploadToSheet}
          />
          {isAdmin && usersSlot}
          <Card>
            <CardHeader title="Data backup" subtitle="Move the full workspace between browsers" />
            <CardBody>
              <div className="flex flex-wrap gap-2">
                <Button onClick={onExportJson}>Export JSON backup</Button>
                {isAdmin && (
                  <Button onClick={() => backupFileInputRef.current?.click()}>Import backup</Button>
                )}
                <input
                  ref={backupFileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={handleBackupFileChange}
                />
              </div>
              <div className="mt-5 rounded-ctl bg-soft p-4 text-[11px] text-muted">
                <strong className="mb-1 block text-ink">Current workspace</strong>
                {workspaceCounts.content} content items · {workspaceCounts.publications}{" "}
                publications · {workspaceCounts.campaigns} campaigns
              </div>
            </CardBody>
          </Card>
        </div>
        <div className="grid content-start gap-4">
          <Card>
            <CardHeader title="CSV exports" subtitle="Open in Sheets, Excel or BI tools" />
            <CardBody className="grid gap-2">
              <Button onClick={onExportContentPlanCsv}>Export content plan</Button>
              <Button onClick={onExportChannelReportCsv}>Export channel report</Button>
            </CardBody>
          </Card>
          {isAdmin && (
            <Card>
              <CardHeader title="Reset data" subtitle="Restore the original tracker snapshot" />
              <CardBody>
                <p className="mt-0 text-[11px] text-muted">
                  Restore the original Jan–Oct 2026 tracker snapshot
                  {sync.state === "connected" ? " into the Google Sheet" : ""}. Export a backup
                  first if you need your edits.
                </p>
                <Button variant="danger" onClick={onResetData}>
                  Restore original data
                </Button>
              </CardBody>
            </Card>
          )}
          <Card>
            <CardBody>
              <div className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">
                About
              </div>
              <div className="mt-2 text-[14px] font-semibold">Handong Content Hub</div>
              <div className="mt-1 text-[10.5px] text-muted">
                Next.js dashboard · Google Sheets data · Vietnam timezone
              </div>
              <a
                href="/styleguide"
                className="mt-3 inline-block text-[11px] font-semibold text-brand-text"
              >
                Open UI styleguide →
              </a>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
