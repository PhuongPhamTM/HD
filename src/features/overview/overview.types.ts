import type { PublicationStatus } from "@/lib/domain/types";

export interface OverviewStatistics {
  activeContentCount: number;
  reviewQueueCount: number;
  overdueContentCount: number;
  postedPublicationCount: number;
  publicationCount: number;
}

export interface OverviewPipelinePhase {
  key: string;
  label: string;
  contentCount: number;
  /** Stage labels of the phase, joined for display. */
  statusesLabel: string;
}

export interface OverviewPublicationViewModel {
  id: string;
  title: string;
  account: string;
  channel: string;
  dateLabel: string;
  status: PublicationStatus;
  /** Trimmed post URL, or "" when the publication has no link. */
  url: string;
}

export interface OverviewActivityViewModel {
  id: string;
  message: string;
  timeLabel: string;
}

export interface OverviewDashboardProps {
  statistics: OverviewStatistics;
  pipelinePhases: OverviewPipelinePhase[];
  recentPublications: OverviewPublicationViewModel[];
  recentActivity: OverviewActivityViewModel[];
  teamMembers: string[];
  onCreateContent(): void;
}
