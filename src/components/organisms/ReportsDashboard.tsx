"use client";
import { PageHeader } from "./PageHeader";
import { Button, ProgressBar, Select, Tag } from "@/components/atoms/ui";
import { Card, CardBody, CardHeader, MetricCard } from "@/components/molecules/ui";
import type { ReportsDashboardProps } from "@/features/reports/reports.types";

export function ReportsDashboard({
  reportingWeekCount,
  plannedTotal,
  postedTotal,
  contentCount,
  weeklyPostedCounts,
  maximumWeeklyPublicationCount,
  channelMetrics,
  onReportingWeekCountChange,
  onExportCsv,
}: ReportsDashboardProps) {
  return (
    <div className="reports-dashboard">
      <PageHeader
        title="Reports"
        description="Publishing cadence and channel delivery from the 2026 content tracker."
        actions={
          <>
            <Select
              value={reportingWeekCount}
              onChange={(selectEvent) =>
                onReportingWeekCountChange(Number(selectEvent.target.value))
              }
            >
              <option value="8">8 weeks</option>
              <option value="12">12 weeks</option>
              <option value="24">24 weeks</option>
            </Select>
            <Button onClick={onExportCsv}>Export CSV</Button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-3 max-[950px]:grid-cols-2 max-[500px]:grid-cols-1">
        <MetricCard label="Planned posts" value={plannedTotal} />
        <MetricCard
          label="Published posts"
          value={postedTotal}
          delta={`${Math.round((postedTotal / Math.max(plannedTotal, 1)) * 100)}% delivery`}
        />
        <MetricCard label="Content created" value={contentCount} />
        <MetricCard label="Active channels" value={channelMetrics.length} />
      </div>
      <div className="mt-4 grid grid-cols-[minmax(0,1.6fr)_minmax(280px,.7fr)] gap-4 max-[920px]:grid-cols-1">
        <Card>
          <CardHeader
            title="Weekly publishing trend"
            subtitle={`${reportingWeekCount} week delivery volume`}
          />
          <CardBody>
            <div className="trend-chart relative h-[280px]">
              <svg
                viewBox={`0 0 ${reportingWeekCount * 42} 220`}
                preserveAspectRatio="none"
                className="h-full w-full"
                role="img"
                aria-label="Weekly publishing trend"
              >
                <defs>
                  <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="var(--accent)" stopOpacity=".3" />
                    <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 55, 110, 165, 220].map((gridLineYPosition) => (
                  <line
                    key={gridLineYPosition}
                    x1="0"
                    x2={reportingWeekCount * 42}
                    y1={gridLineYPosition}
                    y2={gridLineYPosition}
                    stroke="var(--line)"
                  />
                ))}
                <path
                  d={`M 0 220 ${weeklyPostedCounts.map((weeklyPostCount, weekIndex) => `L ${weekIndex * 42 + 21} ${220 - (weeklyPostCount / maximumWeeklyPublicationCount) * 190}`).join(" ")} L ${reportingWeekCount * 42} 220 Z`}
                  fill="url(#area)"
                />
                <polyline
                  points={weeklyPostedCounts
                    .map(
                      (weeklyPostCount, weekIndex) =>
                        `${weekIndex * 42 + 21},${220 - (weeklyPostCount / maximumWeeklyPublicationCount) * 190}`,
                    )
                    .join(" ")}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />
                {weeklyPostedCounts.map((weeklyPostCount, weekIndex) => (
                  <circle
                    key={weekIndex}
                    cx={weekIndex * 42 + 21}
                    cy={220 - (weeklyPostCount / maximumWeeklyPublicationCount) * 190}
                    r="3"
                    fill="var(--card)"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-muted">
              <span className="size-2 rounded-full bg-accent" />
              Posts published per week
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Channel breakdown" subtitle="Share of published output" />
          <CardBody className="grid gap-4">
            {channelMetrics.map((channelMetric) => (
              <div className="channel-breakdown" key={channelMetric.name}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-semibold">{channelMetric.name}</span>
                  <span className="text-[10px] text-muted">{channelMetric.posted} posts</span>
                </div>
                <ProgressBar
                  value={
                    (channelMetric.posted /
                      Math.max(
                        ...channelMetrics.map((candidateMetric) => candidateMetric.posted),
                        1,
                      )) *
                    100
                  }
                />
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader title="Delivery by channel" subtitle="Planned versus posted" />
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-soft text-[9px] uppercase tracking-[.1em] text-muted">
              <tr>
                <th className="px-5 py-2.5">Channel</th>
                <th>Planned</th>
                <th>Posted</th>
                <th>Delivery</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {channelMetrics.map((channelMetric) => (
                <tr key={channelMetric.name}>
                  <td className="px-5 py-3 font-semibold">{channelMetric.name}</td>
                  <td>{channelMetric.total}</td>
                  <td>{channelMetric.posted}</td>
                  <td>{Math.round((channelMetric.posted / channelMetric.total) * 100)}%</td>
                  <td>
                    <Tag
                      tone={channelMetric.posted / channelMetric.total > 0.9 ? "green" : "amber"}
                    >
                      {channelMetric.posted / channelMetric.total > 0.9 ? "On track" : "Watch"}
                    </Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
