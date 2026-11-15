"use client";
import { useState } from "react";
import { Button, Input, Select, Tag } from "@/components/atoms/ui";
import { Icon } from "@/components/atoms/icons";
import {
  Card,
  DueLabel,
  EmptyState,
  PersonChip,
  ProgressFraction,
} from "@/components/molecules/ui";
import { Pagination } from "@/components/molecules/Pagination";
import { DEFAULT_PAGE_SIZE, usePagination } from "@/lib/hooks/usePagination";
import { PageHeader } from "./PageHeader";
import {
  ContentActionMenu,
  DeleteContentDialog,
  isClickOnInteractiveElement,
} from "./ContentActions";
import { selectableOptions, type OptionItem, type PhaseOption } from "@/lib/domain/options";
import { getContentReadiness, isContentOverdue } from "@/lib/domain/selectors";
import { cn } from "@/lib/cn";
import type { ContentItem, ContentStatus } from "@/lib/domain/types";
import type {
  ContentCampaignOption,
  ContentPlannerViewProps,
} from "@/features/content/content.types";

const getContentStatusTone = (
  contentStatus: ContentStatus,
): "blue" | "green" | "amber" | "red" | "violet" | "gray" =>
  contentStatus === "published" || contentStatus === "approved"
    ? "green"
    : contentStatus === "in_review"
      ? "amber"
      : contentStatus === "needs_changes"
        ? "red"
        : contentStatus === "editing" || contentStatus === "writing"
          ? "violet"
          : contentStatus === "paused" || contentStatus === "cancelled"
            ? "gray"
            : "blue";
export function ContentPlanner({
  view: selectedView,
  phase: selectedPhase,
  campaignId: selectedCampaignId,
  searchQuery,
  filterKey,
  campaigns,
  phaseFilters,
  lanes,
  contentItems,
  stages,
  stageLabel,
  checks,
  publicationCounts,
  onSearch,
  onCampaignChange,
  onViewChange,
  onPhaseChange,
  onCreateContent,
  onEditContent,
  onStatusChange,
  onDeleteContent,
}: ContentPlannerViewProps) {
  const [searchInput, setSearchInput] = useState(searchQuery);
  function handleContentDrop(dragEvent: React.DragEvent, targetStatus: ContentStatus) {
    dragEvent.preventDefault();
    const contentId = dragEvent.dataTransfer.getData("text/plain");
    if (contentId) onStatusChange(contentId, targetStatus);
  }
  return (
    <div className="content-planner">
      <PageHeader
        title="Content Plan"
        description="Search, filter and move every content item through the production workflow."
        actions={
          <Button variant="primary" onClick={onCreateContent}>
            ＋ New content
          </Button>
        }
      />
      <Card className="content-toolbar mb-4">
        <div className="content-toolbar__controls flex flex-wrap items-center gap-2 p-3">
          <form
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              onSearch(searchInput);
            }}
            className="content-toolbar__search relative min-w-[220px] flex-1"
          >
            <Icon
              name="search"
              className="content-toolbar__search-icon absolute left-3 top-2.5 size-4 text-faint"
            />
            <Input
              value={searchInput}
              onChange={(inputEvent) => setSearchInput(inputEvent.target.value)}
              placeholder="Search titles, owners, formats…"
              className="content-toolbar__search-input pl-9"
            />
          </form>
          <Select
            value={selectedCampaignId}
            onChange={(selectEvent) => onCampaignChange(selectEvent.target.value)}
            className="content-toolbar__campaign-filter"
          >
            <option value="">All campaigns</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.title}
              </option>
            ))}
          </Select>
          <div className="content-toolbar__view-switch segmented-control inline-flex rounded-ctl bg-soft p-1">
            <button
              onClick={() => onViewChange("table")}
              className={cn(
                "segmented-control__option segmented-control__option--table rounded-md px-3 py-1.5 text-[11px]",
                selectedView === "table" &&
                  "segmented-control__option--active bg-card font-semibold shadow-sm",
              )}
            >
              Table
            </button>
            <button
              onClick={() => onViewChange("board")}
              className={cn(
                "segmented-control__option segmented-control__option--board rounded-md px-3 py-1.5 text-[11px]",
                selectedView === "board" &&
                  "segmented-control__option--active bg-card font-semibold shadow-sm",
              )}
            >
              Board
            </button>
          </div>
        </div>
        <div className="content-toolbar__phase-filters filter-chip-bar scrollbar-thin flex gap-1 overflow-x-auto border-t border-line p-2">
          {phaseFilters.map((phaseFilter) => (
            <button
              key={phaseFilter.key}
              onClick={() => onPhaseChange(phaseFilter.key)}
              className={cn(
                "filter-chip shrink-0 rounded-full border px-3 py-1 text-[10.5px]",
                selectedPhase === phaseFilter.key
                  ? "filter-chip--active border-brand bg-brand-soft font-semibold text-brand-text"
                  : "border-line bg-card text-muted",
              )}
            >
              <span className="filter-chip__label">{phaseFilter.label}</span>{" "}
              <span className="filter-chip__count ml-1 opacity-70">{phaseFilter.count}</span>
            </button>
          ))}
        </div>
      </Card>
      {selectedView === "board" ? (
        <div className="kanban-board scrollbar-thin grid grid-flow-col auto-cols-[260px] gap-3 overflow-x-auto pb-3">
          {lanes.map((lane) => (
            <KanbanLane
              key={lane.phase.key}
              phase={lane.phase}
              contentItems={lane.contentItems}
              filterKey={filterKey}
              stages={stages}
              stageLabel={stageLabel}
              checks={checks}
              onDrop={handleContentDrop}
              onStatusChange={onStatusChange}
              onEditContent={onEditContent}
            />
          ))}
        </div>
      ) : (
        <ContentTable
          contentItems={contentItems}
          campaigns={campaigns}
          filterKey={filterKey}
          stages={stages}
          checks={checks}
          publicationCounts={publicationCounts}
          onStatusChange={onStatusChange}
          onEditContent={onEditContent}
          onDeleteContent={onDeleteContent}
        />
      )}
    </div>
  );
}
const LANE_PAGE_SIZE = 8;
function KanbanLane({
  phase,
  contentItems,
  filterKey,
  stages,
  stageLabel,
  checks,
  onDrop,
  onStatusChange,
  onEditContent,
}: {
  phase: PhaseOption;
  contentItems: ContentItem[];
  filterKey: string;
  stages: OptionItem<ContentStatus>[];
  stageLabel: Record<ContentStatus, string>;
  checks: OptionItem[];
  onDrop: (dragEvent: React.DragEvent, targetStatus: ContentStatus) => void;
  onStatusChange: (contentId: string, status: ContentStatus) => void;
  onEditContent: (contentId: string) => void;
}) {
  const lanePagination = usePagination(contentItems, LANE_PAGE_SIZE, filterKey);
  return (
    <section
      className={`lane lane--${phase.key} flex min-h-[510px] flex-col rounded-lane border border-line bg-soft p-2`}
      onDragOver={(dragEvent) => dragEvent.preventDefault()}
      onDrop={(dragEvent) => onDrop(dragEvent, phase.statuses[0])}
    >
      <header className="lane__header flex items-center justify-between px-2 py-2">
        <div className="lane__heading">
          <div className="lane__title font-semibold">{phase.label}</div>
          <div className="lane__statuses text-[9px] text-muted">
            {phase.statuses.map((status) => stageLabel[status]).join(" · ")}
          </div>
        </div>
        <span className="lane__count rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold text-muted">
          {contentItems.length}
        </span>
      </header>
      <div className="lane__tickets grid gap-2">
        {lanePagination.pageItems.map((contentItem) => (
          <ContentTicket
            key={contentItem.id}
            contentItem={contentItem}
            stages={stages}
            stageLabel={stageLabel}
            checks={checks}
            onStatusChange={onStatusChange}
            onEditContent={onEditContent}
          />
        ))}
      </div>
      {!contentItems.length && (
        <div className="lane__empty p-5 text-center text-[10px] text-faint">Drop content here</div>
      )}
      <Pagination pagination={lanePagination} compact className="lane__pagination mt-auto pt-2" />
    </section>
  );
}
function ContentTicket({
  contentItem,
  stages,
  stageLabel,
  checks,
  onStatusChange,
  onEditContent,
}: {
  contentItem: ContentItem;
  stages: OptionItem<ContentStatus>[];
  stageLabel: Record<ContentStatus, string>;
  checks: OptionItem[];
  onStatusChange: (contentId: string, status: ContentStatus) => void;
  onEditContent: (contentId: string) => void;
}) {
  const contentReadiness = getContentReadiness(contentItem, checks);
  return (
    <article
      draggable
      onDragStart={(dragEvent) => dragEvent.dataTransfer.setData("text/plain", contentItem.id)}
      className={cn(
        "ticket cursor-grab rounded-[10px] border border-line bg-card p-3 shadow-[0_2px_7px_rgba(20,40,80,.04)] active:cursor-grabbing",
        isContentOverdue(contentItem) && "ticket--late border-l-2 border-l-danger",
      )}
    >
      <div className="ticket__meta flex items-center justify-between">
        <Tag tone={getContentStatusTone(contentItem.status)} className="ticket__status">
          {stageLabel[contentItem.status]}
        </Tag>
        <span className="ticket__format text-[9px] text-faint">
          {contentItem.format || "Content"}
        </span>
      </div>
      <h3 className="ticket__title mb-3 mt-2 line-clamp-2 text-[12px] font-semibold">
        <button
          type="button"
          onClick={() => onEditContent(contentItem.id)}
          className="ticket__title-button text-left hover:text-brand-text hover:underline"
        >
          {contentItem.title}
        </button>
      </h3>
      <ProgressFraction {...contentReadiness} />
      <div className="ticket__footer mt-3 flex items-center justify-between">
        <PersonChip name={contentItem.owner} />
        <Select
          value={contentItem.status}
          onChange={(selectEvent) =>
            onStatusChange(contentItem.id, selectEvent.target.value as ContentStatus)
          }
          className="ticket__status-select h-7 max-w-[92px] px-2 text-[9px]"
        >
          {selectableOptions(stages, contentItem.status).map((stage) => (
            <option key={stage.key} value={stage.key}>
              {stage.label}
            </option>
          ))}
        </Select>
      </div>
    </article>
  );
}
function ContentTable({
  contentItems,
  campaigns,
  filterKey,
  stages,
  checks,
  publicationCounts,
  onStatusChange,
  onEditContent,
  onDeleteContent,
}: {
  contentItems: ContentItem[];
  campaigns: ContentCampaignOption[];
  filterKey: string;
  stages: OptionItem<ContentStatus>[];
  checks: OptionItem[];
  publicationCounts: Record<string, number>;
  onStatusChange: (contentId: string, status: ContentStatus) => void;
  onEditContent: (contentId: string) => void;
  onDeleteContent: (contentId: string) => void;
}) {
  const [contentPendingDelete, setContentPendingDelete] = useState<ContentItem | null>(null);
  const tablePagination = usePagination(contentItems, DEFAULT_PAGE_SIZE, filterKey);

  function handleRowClick(clickEvent: React.MouseEvent<HTMLTableRowElement>, contentId: string) {
    // Let the row's own controls (status select, title, actions menu) handle their clicks.
    if (isClickOnInteractiveElement(clickEvent.target)) return;
    onEditContent(contentId);
  }

  if (!contentItems.length)
    return (
      <Card className="content-table content-table--empty">
        <EmptyState title="No content found" body="Try changing your search or filters." />
      </Card>
    );
  return (
    <Card className="content-table overflow-hidden">
      <div className="content-table__scroll scrollbar-thin overflow-x-auto">
        <table className="content-table__table w-full min-w-[920px] border-collapse text-left">
          <thead className="content-table__head">
            <tr className="content-table__head-row bg-soft text-[9.5px] uppercase tracking-[.08em] text-muted">
              {["Content", "Campaign", "Status", "Owner", "Readiness", "Due", ""].map(
                (columnLabel) => (
                  <th
                    key={columnLabel}
                    className={`content-table__heading content-table__heading--${(columnLabel || "actions").toLowerCase()} border-b border-line px-4 py-2.5 font-semibold`}
                  >
                    {columnLabel}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="content-table__body divide-y divide-line">
            {tablePagination.pageItems.map((contentItem) => {
              const contentReadiness = getContentReadiness(contentItem, checks);
              return (
                <tr
                  key={contentItem.id}
                  onClick={(clickEvent) => handleRowClick(clickEvent, contentItem.id)}
                  className={cn(
                    "content-table__row cursor-pointer hover:bg-soft/60",
                    isContentOverdue(contentItem) && "content-table__row--late",
                  )}
                >
                  <td className="content-table__cell content-table__cell--content px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onEditContent(contentItem.id)}
                      className="content-table__title block max-w-[320px] truncate text-left font-semibold hover:text-brand-text hover:underline"
                    >
                      {contentItem.title}
                    </button>
                    <div className="content-table__format mt-0.5 text-[9.5px] text-muted">
                      {contentItem.format || "Content"}
                    </div>
                  </td>
                  <td className="content-table__cell content-table__cell--campaign px-4 py-3 text-[11px] text-muted">
                    {campaigns.find((campaign) => campaign.id === contentItem.campaign)?.title ||
                      "—"}
                  </td>
                  <td className="content-table__cell content-table__cell--status px-4 py-3">
                    <Select
                      value={contentItem.status}
                      onChange={(selectEvent) =>
                        onStatusChange(contentItem.id, selectEvent.target.value as ContentStatus)
                      }
                      className="content-table__status-select h-7 max-w-32 px-2 text-[10px]"
                    >
                      {selectableOptions(stages, contentItem.status).map((stage) => (
                        <option key={stage.key} value={stage.key}>
                          {stage.label}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="content-table__cell content-table__cell--owner px-4 py-3">
                    <PersonChip name={contentItem.owner} />
                  </td>
                  <td className="content-table__cell content-table__cell--readiness px-4 py-3">
                    <ProgressFraction {...contentReadiness} />
                  </td>
                  <td className="content-table__cell content-table__cell--due px-4 py-3">
                    <DueLabel date={contentItem.due} late={isContentOverdue(contentItem)} />
                  </td>
                  <td className="content-table__cell content-table__cell--actions px-4 py-3 text-right">
                    <ContentActionMenu
                      contentItem={contentItem}
                      onEdit={(contentToEdit) => onEditContent(contentToEdit.id)}
                      onDelete={setContentPendingDelete}
                      className="content-table__actions-button"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        pagination={tablePagination}
        itemLabel="content items"
        className="content-table__pagination border-t border-line"
      />
      <DeleteContentDialog
        contentItem={contentPendingDelete}
        publicationCount={
          contentPendingDelete ? (publicationCounts[contentPendingDelete.id] ?? 0) : 0
        }
        onConfirm={(contentToDelete) => onDeleteContent(contentToDelete.id)}
        onClose={() => setContentPendingDelete(null)}
      />
    </Card>
  );
}
