"use client";
import Link from "next/link";
import { PageHeader } from "./PageHeader";
import { Button, Tag } from "@/components/atoms/ui";
import { Card, CardBody, CardHeader, PersonChip, StatTile } from "@/components/molecules/ui";
import type { OverviewDashboardProps } from "@/features/overview/overview.types";

const channelTone: Record<string, "blue" | "violet" | "red" | "green" | "gray"> = {
  Facebook: "blue",
  TikTok: "violet",
  YouTube: "red",
  LinkedIn: "blue",
  Website: "green",
};
export function OverviewDashboard({
  statistics,
  pipelinePhases,
  recentPublications,
  recentActivity,
  teamMembers,
  onCreateContent,
}: OverviewDashboardProps) {
  return (
    <div className="overview-dashboard">
      <PageHeader
        title="Overview"
        description="A clear view of content flow, deadlines and cross-channel publishing."
        actions={
          <>
            <Link href="/reports" className="overview-dashboard__reports-link">
              <Button className="overview-dashboard__reports-button">View reports</Button>
            </Link>
            <Button
              variant="primary"
              className="overview-dashboard__new-content-button"
              onClick={onCreateContent}
            >
              ＋ New content
            </Button>
          </>
        }
      />
      <section
        aria-label="Key statistics"
        className="overview-dashboard__stats grid grid-cols-4 gap-3 max-[1050px]:grid-cols-2 max-[520px]:grid-cols-1"
      >
        <StatTile
          label="Active content"
          value={statistics.activeContentCount}
          cta="Across all phases"
          tone="brand"
        />
        <StatTile
          label="Waiting for review"
          value={statistics.reviewQueueCount}
          cta="Needs a decision"
          tone={statistics.reviewQueueCount ? "warning" : "ok"}
        />
        <StatTile
          label="Overdue"
          value={statistics.overdueContentCount}
          cta="Past the due date"
          tone={statistics.overdueContentCount ? "danger" : "ok"}
        />
        <StatTile
          label="Posts delivered"
          value={statistics.postedPublicationCount}
          cta={`${statistics.publicationCount} total publications`}
          tone="ok"
        />
      </section>
      <Card className="overview-dashboard__pipeline pipeline-flow mt-4">
        <CardHeader
          title="Production pipeline"
          subtitle="Content moving from idea to publication"
          action={
            <Link
              href="/content?view=board"
              className="pipeline-flow__board-link text-[11px] font-semibold text-brand-text"
            >
              Open board →
            </Link>
          }
        />
        <CardBody className="pipeline-flow__steps grid grid-cols-6 gap-2 max-[900px]:grid-cols-3 max-[520px]:grid-cols-2">
          {pipelinePhases.map((phase, phaseIndex) => {
            return (
              <Link
                href={`/content?view=board&phase=${phase.key}`}
                key={phase.key}
                className="pipeline-flow__step group relative rounded-lane border border-line bg-soft p-3 no-underline transition hover:border-accent"
              >
                <div className="pipeline-flow__step-index text-[9px] font-bold uppercase tracking-[.12em] text-faint">
                  Step {phaseIndex + 1}
                </div>
                <div className="pipeline-flow__step-label mt-2 text-[12px] font-semibold text-ink">
                  {phase.label}
                </div>
                <div className="pipeline-flow__step-count mt-1 text-2xl font-semibold text-brand-text">
                  {phase.contentCount}
                </div>
                <div className="pipeline-flow__step-statuses mt-2 truncate text-[9.5px] text-muted">
                  {phase.statusesLabel}
                </div>
              </Link>
            );
          })}
        </CardBody>
      </Card>
      <div className="overview-dashboard__lower mt-4 grid grid-cols-[minmax(0,1.5fr)_minmax(280px,.7fr)] gap-4 max-[980px]:grid-cols-1">
        <Card className="overview-dashboard__publishing publishing-activity">
          <CardHeader title="Publishing activity" subtitle="Latest scheduled and published items" />
          <div className="publishing-activity__list divide-y divide-line">
            {recentPublications.map((publication) => {
              const publicationUrl = publication.url;
              const rowClassName =
                "publication-row grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3 max-[560px]:grid-cols-[1fr_auto]";
              const rowContent = (
                <>
                  <div className="publication-row__info min-w-0">
                    <div className="publication-row__title truncate font-semibold">
                      {publication.title}
                    </div>
                    <div className="publication-row__account mt-1 text-[10.5px] text-muted">
                      {publication.account}
                    </div>
                  </div>
                  <Tag
                    tone={channelTone[publication.channel] || "gray"}
                    className="publication-row__channel"
                  >
                    {publication.channel}
                  </Tag>
                  <div className="publication-row__meta text-right max-[560px]:col-span-2">
                    <div className="publication-row__date text-[11px] font-medium">
                      {publication.dateLabel}
                    </div>
                    <div className="publication-row__status text-[9.5px] text-muted">
                      {publication.status === "posted" ? "Posted" : "Scheduled"}
                    </div>
                  </div>
                </>
              );
              return publicationUrl ? (
                <a
                  key={publication.id}
                  href={publicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open ${publication.channel} post in a new tab`}
                  className={`${rowClassName} publication-row--link text-inherit no-underline transition hover:bg-soft`}
                >
                  {rowContent}
                </a>
              ) : (
                <div key={publication.id} className={rowClassName}>
                  {rowContent}
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="overview-dashboard__activity recent-activity">
          <CardHeader title="Recent activity" subtitle="Changes in this browser" />
          <CardBody className="recent-activity__body grid gap-4">
            {recentActivity.length ? (
              recentActivity.map((activityEntry) => (
                <div key={activityEntry.id} className="activity-item flex gap-3">
                  <span className="activity-item__dot mt-1 size-2 shrink-0 rounded-full bg-accent" />
                  <div className="activity-item__content">
                    <div className="activity-item__message text-[11.5px]">
                      {activityEntry.message}
                    </div>
                    <div className="activity-item__time mt-0.5 text-[9.5px] text-muted">
                      {activityEntry.timeLabel}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="recent-activity__empty py-8 text-center text-[11px] text-muted">
                Your edits will appear here.
              </div>
            )}
            <div className="team-focus border-t border-line pt-4">
              <div className="team-focus__title mb-2 text-[10px] font-bold uppercase tracking-[.12em] text-faint">
                Team focus
              </div>
              {teamMembers.map((name) => (
                <div key={name} className="team-focus__member mb-2">
                  <PersonChip name={name} />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
