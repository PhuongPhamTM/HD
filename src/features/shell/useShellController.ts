"use client";

import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import type { DashboardShellProps } from "@/components/templates/DashboardShell";
import type { SidebarSyncStatus } from "@/components/organisms/Sidebar";
import { NAV_ITEMS } from "@/lib/domain/constants";
import { selectHubStatistics } from "@/lib/domain/selectors";
import { useHubStore, type SyncStatus } from "@/lib/store/useHubStore";
import { useSheetSync } from "@/lib/hooks/useSheetSync";
import { useShallow } from "zustand/react/shallow";
import { openNewContentEditor } from "@/features/content-editor/contentEditorEvents";

export type ShellControllerResult = Pick<DashboardShellProps, "sidebar" | "topbar">;

function isNavItemActive(href: string, pathname: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function describeSync(sync: SyncStatus): SidebarSyncStatus {
  const isDismissible = Boolean(sync.error);
  if (sync.error)
    return { dotClassName: "bg-danger", title: "Save failed", detail: sync.error, isDismissible };
  if (sync.pendingWrites)
    return {
      dotClassName: "bg-warning",
      title: "Saving…",
      detail: "Writing to Google Sheets",
      isDismissible,
    };
  if (sync.state === "connected")
    return {
      dotClassName: "bg-success",
      title: "Google Sheets synced",
      detail: "Changes save to the shared Sheet",
      isDismissible,
    };
  if (sync.state === "unknown" || sync.loading)
    return {
      dotClassName: "bg-warning",
      title: "Connecting…",
      detail: "Loading from Google Sheets",
      isDismissible,
    };
  if (sync.state === "not_configured")
    return {
      dotClassName: "bg-faint",
      title: "Local only",
      detail: "Changes save in this browser",
      isDismissible,
    };
  return {
    dotClassName: "bg-danger",
    title: sync.state === "not_set_up" ? "Sheet needs setup" : "Sheet unavailable",
    detail: "Changes save in this browser only. Open Settings.",
    isDismissible,
  };
}

export function useShellController(user: { name: string; email: string }): ShellControllerResult {
  useSheetSync(user.name);
  const currentPathname = usePathname();
  // Only the fields the shell shows, so it does not re-render on unrelated store changes.
  const hubData = useHubStore(
    useShallow((state) => ({
      campaigns: state.campaigns,
      content: state.content,
      media: state.media,
      publications: state.publications,
      activity: state.activity,
      sync: state.sync,
      dismissSyncError: state.dismissSyncError,
    })),
  );
  const hubStatistics = selectHubStatistics(hubData);

  const navigationCounts: Record<string, number> = {
    "/content": hubData.content.length,
    "/production": hubStatistics.reviewQueueCount,
    "/campaigns": hubData.campaigns.length,
    "/media": hubData.media.length,
    "/calendar": hubData.publications.length,
  };

  const navItems = NAV_ITEMS.map((navigationItem) => ({
    href: navigationItem.href,
    label: navigationItem.label,
    icon: navigationItem.icon,
    isActive: isNavItemActive(navigationItem.href, currentPathname),
    count: navigationCounts[navigationItem.href],
  }));

  const pageLabel =
    navItems.find((navigationItem) => navigationItem.isActive)?.label || "Content Hub";

  return {
    sidebar: {
      navItems,
      syncStatus: describeSync(hubData.sync),
      onDismissSyncError: hubData.dismissSyncError,
      onCreateContent: openNewContentEditor,
    },
    topbar: {
      user,
      pageLabel,
      onCreateContent: openNewContentEditor,
      signOutAction: logout,
    },
  };
}
