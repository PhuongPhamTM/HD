"use client";

import { formatDisplayDate, formatRelativeTimestamp } from "@/lib/domain/dates";
import { selectHubStatistics } from "@/lib/domain/selectors";
import { useOptions } from "@/lib/hooks/useOptions";
import { useHubStore } from "@/lib/store/useHubStore";
import { openNewContentEditor } from "@/features/content-editor/contentEditorEvents";
import type { OverviewDashboardProps } from "./overview.types";

export function useOverviewController(): OverviewDashboardProps {
  const hubData = useHubStore();
  const { phases, stageLabel } = useOptions();
  const hubStatistics = selectHubStatistics(hubData);

  const recentPublications = [...hubData.publications]
    .filter((publication) => publication.status !== "cancelled")
    .sort((leftPublication, rightPublication) =>
      rightPublication.date.localeCompare(leftPublication.date),
    )
    .slice(0, 6)
    .map((publication) => ({
      id: publication.id,
      title:
        hubData.content.find((contentItem) => contentItem.id === publication.content)?.title ||
        "Untitled content",
      account: publication.account || "Handong E&C",
      channel: publication.channel,
      dateLabel: formatDisplayDate(publication.date),
      status: publication.status,
      url: publication.url?.trim() ?? "",
    }));

  const pipelinePhases = phases
    .filter((phase) => phase.active)
    .map((phase) => ({
      key: phase.key,
      label: phase.label,
      contentCount: hubData.content.filter((contentItem) =>
        phase.statuses.includes(contentItem.status),
      ).length,
      statusesLabel: phase.statuses.map((status) => stageLabel[status]).join(" · "),
    }));

  const teamMembers = [
    ...new Set(
      hubData.content
        .flatMap((contentItem) => contentItem.owner.split(",").map((ownerName) => ownerName.trim()))
        .filter(Boolean),
    ),
  ].slice(0, 4);

  return {
    statistics: {
      activeContentCount: hubStatistics.contentItems.length,
      reviewQueueCount: hubStatistics.reviewQueueCount,
      overdueContentCount: hubStatistics.overdueContentCount,
      postedPublicationCount: hubStatistics.postedPublicationCount,
      publicationCount: hubStatistics.publications.length,
    },
    pipelinePhases,
    recentPublications,
    recentActivity: hubData.activity.slice(0, 5).map((activityEntry) => ({
      id: activityEntry.id,
      message: activityEntry.message,
      timeLabel: formatRelativeTimestamp(activityEntry.at),
    })),
    teamMembers,
    onCreateContent: openNewContentEditor,
  };
}
