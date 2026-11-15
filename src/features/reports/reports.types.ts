export interface ChannelMetric {
  name: string;
  total: number;
  posted: number;
}

export interface ReportsDashboardProps {
  reportingWeekCount: number;
  plannedTotal: number;
  postedTotal: number;
  contentCount: number;
  /** Posts published per week, oldest first; one entry per reporting week. */
  weeklyPostedCounts: number[];
  /** Largest weekly planned count (at least 1), used to scale the trend chart. */
  maximumWeeklyPublicationCount: number;
  channelMetrics: ChannelMetric[];
  onReportingWeekCountChange(weekCount: number): void;
  onExportCsv(): void;
}
