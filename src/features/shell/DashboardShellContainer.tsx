"use client";

import { DashboardShell } from "@/components/templates/DashboardShell";
import { ContentEditorContainer } from "@/features/content-editor/ContentEditorContainer";
import { useShellController } from "./useShellController";

export function DashboardShellContainer({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
}) {
  const shellProps = useShellController(user);

  return (
    <DashboardShell {...shellProps} overlays={<ContentEditorContainer />}>
      {children}
    </DashboardShell>
  );
}
