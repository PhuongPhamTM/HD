"use client";

import { selectableOptions } from "@/lib/domain/options";
import { getContentReadiness } from "@/lib/domain/selectors";
import type { ContentItem, ContentStatus } from "@/lib/domain/types";
import { useOptions } from "@/lib/hooks/useOptions";
import { useHubStore } from "@/lib/store/useHubStore";
import {
  openContentEditor,
  openNewContentEditor,
} from "@/features/content-editor/contentEditorEvents";
import type { ProductionQueueItemViewModel, ProductionReviewProps } from "./production.types";

export function useProductionController(): ProductionReviewProps {
  const contentItems = useHubStore((state) => state.content);
  const updateContent = useHubStore((state) => state.updateContent);
  const { checks, stages, stageLabel } = useOptions();

  const toQueueItem = (contentItem: ContentItem): ProductionQueueItemViewModel => ({
    id: contentItem.id,
    title: contentItem.title,
    format: contentItem.format,
    owner: contentItem.owner,
    status: contentItem.status,
    statusLabel: stageLabel[contentItem.status],
    checkedKeys: contentItem.checks,
    readiness: getContentReadiness(contentItem, checks),
    visibleChecks: checks
      .filter((check) => check.active || contentItem.checks.includes(check.key))
      .map((check) => ({ key: check.key, label: check.label })),
    statusOptions: selectableOptions(stages, contentItem.status).map((stage) => ({
      key: stage.key,
      label: stage.label,
    })),
  });

  const productionQueue = contentItems.filter((contentItem) =>
    ["ready_to_shoot", "shot", "editing", "needs_changes", "in_review", "approved"].includes(
      contentItem.status,
    ),
  );
  const queueGroups = [
    {
      key: "production",
      title: "In production",
      contentItems: productionQueue.filter((contentItem) =>
        ["ready_to_shoot", "shot", "editing", "needs_changes"].includes(contentItem.status),
      ),
    },
    {
      key: "review",
      title: "Review queue",
      contentItems: productionQueue.filter((contentItem) => contentItem.status === "in_review"),
    },
    {
      key: "ready",
      title: "Approved",
      contentItems: productionQueue.filter((contentItem) => contentItem.status === "approved"),
    },
  ].map((queueGroup) => ({
    ...queueGroup,
    contentItems: queueGroup.contentItems.map(toQueueItem),
  }));

  function changeCheck(contentId: string, checkKey: string, checked: boolean) {
    const contentItem = contentItems.find((candidate) => candidate.id === contentId);
    if (!contentItem) return;
    const otherChecks = contentItem.checks.filter((candidateKey) => candidateKey !== checkKey);
    updateContent(contentId, { checks: checked ? [...otherChecks, checkKey] : otherChecks });
  }

  return {
    queueGroups,
    onCreateContent: openNewContentEditor,
    onEditContent: openContentEditor,
    onCheckChange: changeCheck,
    onStatusChange: (contentId: string, status: ContentStatus) =>
      updateContent(contentId, { status }),
  };
}
