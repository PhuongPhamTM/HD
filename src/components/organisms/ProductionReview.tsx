"use client";
import { PageHeader } from "./PageHeader";
import { Button, Checkbox, Select, Tag } from "@/components/atoms/ui";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PersonChip,
  ProgressFraction,
} from "@/components/molecules/ui";
import { Pagination } from "@/components/molecules/Pagination";
import { usePagination } from "@/lib/hooks/usePagination";
import type { ContentStatus } from "@/lib/domain/types";
import { Icon } from "@/components/atoms/icons";
import type {
  ProductionQueueItemViewModel,
  ProductionReviewProps,
} from "@/features/production/production.types";

type QueueItemCallbacks = Pick<
  ProductionReviewProps,
  "onEditContent" | "onCheckChange" | "onStatusChange"
>;

export function ProductionReview({
  queueGroups: productionQueueGroups,
  onCreateContent,
  onEditContent,
  onCheckChange,
  onStatusChange,
}: ProductionReviewProps) {
  return (
    <div className="production-review">
      <PageHeader
        title="Production & Review"
        description="Track readiness, clear review bottlenecks and approve finished work."
        actions={
          <Button variant="primary" onClick={onCreateContent}>
            ＋ Add to queue
          </Button>
        }
      />
      <div className="production-review__summary mb-4 grid grid-cols-3 gap-3 max-[680px]:grid-cols-1">
        {productionQueueGroups.map((queueGroup) => (
          <div key={queueGroup.key} className="rounded-card border border-line bg-card p-4">
            <div className="text-[10px] font-bold uppercase tracking-[.1em] text-muted">
              {queueGroup.title}
            </div>
            <div className="mt-1 text-2xl font-semibold">{queueGroup.contentItems.length}</div>
          </div>
        ))}
      </div>
      <div className="production-review__queues grid grid-cols-3 gap-4 max-[1100px]:grid-cols-1">
        {productionQueueGroups.map((queueGroup) => (
          <ProductionQueueCard
            key={queueGroup.key}
            queueKey={queueGroup.key}
            title={queueGroup.title}
            contentItems={queueGroup.contentItems}
            onEditContent={onEditContent}
            onCheckChange={onCheckChange}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}
const QUEUE_PAGE_SIZE = 6;
function ProductionQueueCard({
  queueKey,
  title,
  contentItems,
  ...queueItemCallbacks
}: QueueItemCallbacks & {
  queueKey: string;
  title: string;
  contentItems: ProductionQueueItemViewModel[];
}) {
  const queuePagination = usePagination(contentItems, QUEUE_PAGE_SIZE);
  return (
    <Card
      className={`production-queue production-queue--${queueKey} flex flex-col overflow-hidden`}
    >
      <CardHeader title={title} subtitle={`${contentItems.length} content items`} />
      <CardBody className="production-queue__items grid flex-1 content-start gap-3 bg-soft/40">
        {contentItems.length ? (
          queuePagination.pageItems.map((contentItem) => (
            <ProductionQueueItem
              key={contentItem.id}
              contentItem={contentItem}
              {...queueItemCallbacks}
            />
          ))
        ) : (
          <EmptyState title="Queue is clear" body="Nothing needs attention here." />
        )}
      </CardBody>
      <Pagination
        pagination={queuePagination}
        compact
        className="production-queue__pagination border-t border-line py-2"
      />
    </Card>
  );
}
function ProductionQueueItem({
  contentItem,
  onEditContent,
  onCheckChange,
  onStatusChange,
}: QueueItemCallbacks & {
  contentItem: ProductionQueueItemViewModel;
}) {
  return (
    <article className="queue-item rounded-[10px] border border-line bg-card p-3">
      <div className="queue-item__meta flex items-start justify-between gap-2">
        <Tag
          tone={
            contentItem.status === "approved"
              ? "green"
              : contentItem.status === "needs_changes"
                ? "red"
                : "amber"
          }
        >
          {contentItem.statusLabel}
        </Tag>
        <div className="queue-item__meta-end flex items-center gap-2">
          <span className="queue-item__format text-[9px] text-faint">{contentItem.format}</span>
          <button
            type="button"
            onClick={() => onEditContent(contentItem.id)}
            aria-label={`Edit ${contentItem.title}`}
            title="Edit content"
            className="queue-item__edit-button cursor-pointer -my-1 grid size-7 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-brand hover:bg-brand-soft hover:text-brand-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Icon name="edit" className="size-3.5" />
          </button>
        </div>
      </div>
      <h3 className="queue-item__title mb-3 mt-2 text-[12px] font-semibold">
        <button
          type="button"
          onClick={() => onEditContent(contentItem.id)}
          className="queue-item__title-button cursor-pointer text-left hover:text-brand-text hover:underline"
        >
          {contentItem.title}
        </button>
      </h3>
      <ProgressFraction {...contentItem.readiness} />
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {contentItem.visibleChecks.map((check) => (
          <Checkbox
            key={check.key}
            label={check.label}
            checked={contentItem.checkedKeys.includes(check.key)}
            onChange={(checkboxEvent) =>
              onCheckChange(contentItem.id, check.key, checkboxEvent.target.checked)
            }
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <PersonChip name={contentItem.owner} />
        <Select
          className="h-7 max-w-28 px-2 text-[9px]"
          value={contentItem.status}
          onChange={(selectEvent) =>
            onStatusChange(contentItem.id, selectEvent.target.value as ContentStatus)
          }
        >
          {contentItem.statusOptions.map((stage) => (
            <option key={stage.key} value={stage.key}>
              {stage.label}
            </option>
          ))}
        </Select>
      </div>
    </article>
  );
}
