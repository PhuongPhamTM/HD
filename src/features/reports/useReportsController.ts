"use client";
import { downloadFile } from "@/lib/browser/downloadFile";

import { useState } from "react";
import { createChannelReportCsv } from "@/lib/domain/csv";
import { buildPublishingReport } from "@/lib/domain/reports";
import { useHubStore } from "@/lib/store/useHubStore";
import type { ReportsDashboardProps } from "./reports.types";

export function useReportsController(): ReportsDashboardProps {
  const hubData = useHubStore();
  const [reportingWeekCount, setReportingWeekCount] = useState(12);
  const publishingReport = buildPublishingReport(hubData, reportingWeekCount);
  const channelMetrics = [
    ...new Set(hubData.publications.map((publication) => publication.channel)),
  ]
    .map((channelName) => ({
      name: channelName,
      total: hubData.publications.filter((publication) => publication.channel === channelName)
        .length,
      posted: hubData.publications.filter(
        (publication) => publication.channel === channelName && publication.status === "posted",
      ).length,
    }))
    .sort(
      (leftChannelMetrics, rightChannelMetrics) =>
        rightChannelMetrics.total - leftChannelMetrics.total,
    );

  return {
    reportingWeekCount,
    plannedTotal: publishingReport.plannedTotal,
    postedTotal: publishingReport.postedTotal,
    contentCount: hubData.content.length,
    weeklyPostedCounts: publishingReport.posted,
    maximumWeeklyPublicationCount: Math.max(...publishingReport.planned, 1),
    channelMetrics,
    onReportingWeekCountChange: setReportingWeekCount,
    onExportCsv: () =>
      downloadFile("handong-report.csv", createChannelReportCsv(hubData), "text/csv"),
  };
}
