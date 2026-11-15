"use client";

import { useState } from "react";
import type { ActionResult } from "@/app/actions/hub";
import type { SettingsPanelProps } from "@/components/organisms/SettingsPanel";
import { createChannelReportCsv, createContentPlanCsv } from "@/lib/domain/csv";
import type { HubData } from "@/lib/domain/types";
import { useHubStore } from "@/lib/store/useHubStore";
import { downloadFile } from "@/lib/browser/downloadFile";

export type SettingsControllerResult = Omit<SettingsPanelProps, "usersSlot">;

export function useSettingsController(isAdmin: boolean): SettingsControllerResult {
  const hubData = useHubStore();
  const [settingsNotice, setSettingsNotice] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const sync = hubData.sync;

  async function runSheetTask(task: () => Promise<ActionResult>, successMessage: string) {
    setIsSyncing(true);
    try {
      const result = await task();
      setSettingsNotice(result.ok ? result.message || successMessage : result.message);
    } finally {
      setIsSyncing(false);
    }
  }

  async function importBackupFile(backupFile: File) {
    let backupData: HubData;
    try {
      backupData = JSON.parse(await backupFile.text()) as HubData;
    } catch {
      setSettingsNotice("That file is not a valid Content Hub backup.");
      return;
    }
    if (
      sync.state === "connected" &&
      !window.confirm(`Replace all data in the Google Sheet with ${backupFile.name}?`)
    )
      return;
    await runSheetTask(() => hubData.importData(backupData), `Imported ${backupFile.name}.`);
  }

  function exportJsonBackup() {
    const hubDataSnapshot = {
      version: 1,
      demo: false,
      campaigns: hubData.campaigns,
      content: hubData.content,
      media: hubData.media,
      publications: hubData.publications,
      activity: hubData.activity,
    };
    downloadFile(
      `handong-content-hub-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(hubDataSnapshot, null, 2),
      "application/json",
    );
  }

  return {
    isAdmin,
    notice: settingsNotice,
    sync,
    isSyncing,
    workspaceCounts: {
      content: hubData.content.length,
      publications: hubData.publications.length,
      campaigns: hubData.campaigns.length,
    },
    onNoticeDismiss: () => setSettingsNotice(""),
    onSetupSheet: () => void runSheetTask(hubData.setupSheet, "The Google Sheet is ready."),
    onReloadSheet: () =>
      void runSheetTask(async () => {
        await hubData.loadFromSheet();
        return { ok: true };
      }, "Reloaded the latest data from Google Sheets."),
    onUploadToSheet: () => {
      if (
        window.confirm(
          "Replace every row in the Google Sheet with the data in this browser? Changes made in the Sheet since will be lost.",
        )
      )
        void runSheetTask(hubData.uploadToSheet, "Uploaded this browser's data to the Sheet.");
    },
    onExportJson: exportJsonBackup,
    onImportBackup: (backupFile) => void importBackupFile(backupFile),
    onExportContentPlanCsv: () =>
      downloadFile("content-plan.csv", createContentPlanCsv(hubData), "text/csv;charset=utf-8"),
    onExportChannelReportCsv: () =>
      downloadFile(
        "publishing-report.csv",
        createChannelReportCsv(hubData),
        "text/csv;charset=utf-8",
      ),
    onResetData: () => {
      if (
        window.confirm(
          sync.state === "connected"
            ? "Restore the original tracker snapshot? Every row in the Google Sheet will be replaced."
            : "Restore the original tracker snapshot? Your local edits will be replaced.",
        )
      )
        void runSheetTask(hubData.resetData, "Original tracker snapshot restored.");
    },
  };
}
