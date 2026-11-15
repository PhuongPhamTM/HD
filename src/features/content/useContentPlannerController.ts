"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getContentPhaseKey } from "@/lib/domain/selectors";
import { useOptions } from "@/lib/hooks/useOptions";
import { useHubStore } from "@/lib/store/useHubStore";
import {
  openContentEditor,
  openNewContentEditor,
} from "@/features/content-editor/contentEditorEvents";
import type { ContentPlannerViewProps } from "./content.types";

export function useContentPlannerController(): ContentPlannerViewProps {
  const contentItems = useHubStore((hubState) => hubState.content);
  const campaigns = useHubStore((hubState) => hubState.campaigns);
  const publications = useHubStore((hubState) => hubState.publications);
  const moveContentToStatus = useHubStore((hubState) => hubState.moveContent);
  const removeContent = useHubStore((hubState) => hubState.removeContent);
  const { phases, stages, stageLabel, checks } = useOptions();
  const searchParameters = useSearchParams();
  const router = useRouter();
  const selectedView = searchParameters.get("view") || "table";
  const selectedPhase = searchParameters.get("phase") || "";
  const selectedCampaignId = searchParameters.get("campaign") || "";
  const searchQuery = searchParameters.get("q") || "";

  function updateSearchParameter(parameterName: string, parameterValue: string) {
    const nextSearchParameters = new URLSearchParams(searchParameters);
    if (parameterValue) nextSearchParameters.set(parameterName, parameterValue);
    else nextSearchParameters.delete(parameterName);
    router.push(`/content?${nextSearchParameters}`);
  }

  // Campaign + search narrow the pool; the phase chips count within it.
  const contentMatchingFilters = contentItems.filter(
    (contentItem) =>
      (!selectedCampaignId || contentItem.campaign === selectedCampaignId) &&
      (!searchQuery ||
        `${contentItem.title} ${contentItem.owner} ${contentItem.format}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())),
  );
  const countContentInPhase = (phaseKey: string) =>
    phaseKey
      ? contentMatchingFilters.filter(
          (contentItem) => getContentPhaseKey(contentItem, phases) === phaseKey,
        ).length
      : contentMatchingFilters.length;
  const filteredContentItems = contentMatchingFilters.filter(
    (contentItem) => !selectedPhase || getContentPhaseKey(contentItem, phases) === selectedPhase,
  );
  const activePhases = phases.filter((phase) => phase.active);

  const publicationCounts: Record<string, number> = {};
  for (const publication of publications) {
    publicationCounts[publication.content] = (publicationCounts[publication.content] ?? 0) + 1;
  }

  return {
    view: selectedView,
    phase: selectedPhase,
    campaignId: selectedCampaignId,
    searchQuery,
    // Any filter change sends paginated lists back to page 1.
    filterKey: [selectedPhase, selectedCampaignId, searchQuery].join("|"),
    campaigns: campaigns.map(({ id, title }) => ({ id, title })),
    phaseFilters: [
      { key: "", label: "All" },
      ...activePhases.map(({ key, label }) => ({ key, label })),
      { key: "paused", label: "Paused" },
      { key: "cancelled", label: "Cancelled" },
    ].map((phaseFilter) => ({ ...phaseFilter, count: countContentInPhase(phaseFilter.key) })),
    lanes: activePhases.map((phase) => ({
      phase,
      contentItems: filteredContentItems.filter((contentItem) =>
        phase.statuses.includes(contentItem.status),
      ),
    })),
    contentItems: filteredContentItems,
    stages,
    stageLabel,
    checks,
    publicationCounts,
    onSearch: (query) => updateSearchParameter("q", query),
    onCampaignChange: (campaignId) => updateSearchParameter("campaign", campaignId),
    onViewChange: (view) => updateSearchParameter("view", view),
    onPhaseChange: (phaseKey) => updateSearchParameter("phase", phaseKey),
    onCreateContent: openNewContentEditor,
    onEditContent: openContentEditor,
    onStatusChange: moveContentToStatus,
    onDeleteContent: removeContent,
  };
}
