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
  const removeContent = useHubStore((state) => state.removeContent);
  const publications = useHubStore((state) => state.publications);
  const { checks, stages, stageLabel } = useOptions();

  const publicationCounts: Record<string, number> = {};
  for (const publication of publications) {
    publicationCounts[publication.content] = (publicationCounts[publication.content] ?? 0) + 1;
  }

  const toQueueItem = (contentItem: ContentItem): ProductionQueueItemViewModel => ({
    id: contentItem.id,
    title: contentItem.title,
    format: contentItem.format,
    owner: contentItem.owner,
    status: contentItem.status,
    statusLabel: stageLabel[contentItem.status] ?? contentItem.status,
    checkedKeys: contentItem.checks,
    readiness: getContentReadiness(contentItem, checks),
    visibleChecks: checks
      .filter((check) => check.active || contentItem.checks.includes(check.key))
      .map((check) => ({ key: check.key, label: check.label })),
    statusOptions: selectableOptions(stages, contentItem.status).map((stage) => ({
      key: stage.key,
      label: stage.label,
    })),
    publicationCount: publicationCounts[contentItem.id] ?? 0,
  });

  // One column per status, in workflow order. A retired stage keeps its column while
  // items still use it, so nothing disappears from the board.
  const statusColumns = stages
    .map((stage) => ({
      status: stage.key,
      title: stage.label,
      active: stage.active,
      contentItems: contentItems.filter((contentItem) => contentItem.status === stage.key),
    }))
    .filter((column) => column.active || column.contentItems.length)
    .map(({ status, title, contentItems: columnItems }) => ({
      status,
      title,
      contentItems: columnItems.map(toQueueItem),
    }));

  function changeCheck(contentId: string, checkKey: string, checked: boolean) {
    const contentItem = contentItems.find((candidate) => candidate.id === contentId);
    if (!contentItem) return;
    const otherChecks = contentItem.checks.filter((candidateKey) => candidateKey !== checkKey);
    updateContent(contentId, { checks: checked ? [...otherChecks, checkKey] : otherChecks });
  }

  return {
    statusColumns,
    onCreateContent: openNewContentEditor,
    onEditContent: openContentEditor,
    onDeleteContent: removeContent,
    onCheckChange: changeCheck,
    onStatusChange: (contentId: string, status: ContentStatus) =>
      updateContent(contentId, { status }),
  };
}
