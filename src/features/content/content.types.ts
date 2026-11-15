import type { OptionItem, PhaseOption } from "@/lib/domain/options";
import type { ContentItem, ContentStatus } from "@/lib/domain/types";

export interface ContentCampaignOption {
  id: string;
  title: string;
}

export interface ContentPhaseFilter {
  /** "" means "All". */
  key: string;
  label: string;
  count: number;
}

export interface ContentLaneModel {
  phase: PhaseOption;
  contentItems: ContentItem[];
}

export interface ContentPlannerViewProps {
  /** Raw `view` URL param: "board" shows the kanban, anything else the table. */
  view: string;
  phase: string;
  campaignId: string;
  searchQuery: string;
  /** Changes whenever the filters change; paginated lists go back to page 1. */
  filterKey: string;
  campaigns: ContentCampaignOption[];
  phaseFilters: ContentPhaseFilter[];
  /** Board lanes (active phases), each with its filtered content. */
  lanes: ContentLaneModel[];
  /** Filtered content for the table view. */
  contentItems: ContentItem[];
  stages: OptionItem<ContentStatus>[];
  stageLabel: Record<ContentStatus, string>;
  checks: OptionItem[];
  /** Number of publications per content id (for the delete confirmation). */
  publicationCounts: Record<string, number>;
  onSearch(query: string): void;
  onCampaignChange(campaignId: string): void;
  onViewChange(view: "table" | "board"): void;
  onPhaseChange(phaseKey: string): void;
  onCreateContent(): void;
  onEditContent(contentId: string): void;
  onStatusChange(contentId: string, status: ContentStatus): void;
  onDeleteContent(contentId: string): void;
}
