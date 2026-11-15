"use client";
import { useEffect, useRef, useState, type ComponentProps, type RefObject } from "react";
import { cn } from "@/lib/cn";
import { PageHeader } from "./PageHeader";
import { Button, Checkbox, ProgressBar, Select, Tag } from "@/components/atoms/ui";
import { PersonChip } from "@/components/molecules/ui";
import type { ContentStatus } from "@/lib/domain/types";
import { ContentActionMenu, DeleteContentDialog } from "./ContentActions";
import type {
  ProductionQueueItemViewModel,
  ProductionReviewProps,
  ProductionStatusColumn,
} from "@/features/production/production.types";

type QueueItemCallbacks = Pick<
  ProductionReviewProps,
  "onEditContent" | "onCheckChange" | "onStatusChange"
> & {
  /** Opens the delete confirmation for this item. */
  onRequestDelete(contentItem: ProductionQueueItemViewModel): void;
};
type Tone = NonNullable<ComponentProps<typeof Tag>["tone"]>;

const STATUS_TONES: Partial<Record<ContentStatus, Tone>> = {
  idea: "gray",
  writing: "violet",
  ready_to_shoot: "blue",
  shot: "amber",
  editing: "amber",
  needs_changes: "red",
  in_review: "violet",
  approved: "green",
  published: "green",
  paused: "gray",
  cancelled: "gray",
};
const TONE_DOT: Record<Tone, string> = {
  gray: "bg-faint",
  violet: "bg-violet",
  blue: "bg-brand",
  amber: "bg-warning",
  red: "bg-danger",
  green: "bg-success",
};
const statusDot = (status: ContentStatus) => TONE_DOT[STATUS_TONES[status] ?? "gray"];

const LANE_WIDTH = 280;
const LANE_GAP = 12;
/** Space kept below the board so it ends just above the window's bottom edge. */
const BOARD_BOTTOM_GAP = 20;
const MIN_BOARD_HEIGHT = 420;
/** While dragging a card within this many px of the board's side edge, the board scrolls. */
const DRAG_SCROLL_EDGE = 80;
const DRAG_SCROLL_STEP = 18;

/**
 * Sizes an element to fill the window from its current position down, so the board's own
 * horizontal scrollbar stays on screen and each lane scrolls on its own.
 */
function useFillWindowHeight(elementRef: RefObject<HTMLElement | null>) {
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    function measure() {
      const element = elementRef.current;
      if (!element) return;
      const topInDocument = element.getBoundingClientRect().top + window.scrollY;
      setHeight(Math.max(MIN_BOARD_HEIGHT, window.innerHeight - topInDocument - BOARD_BOTTOM_GAP));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [elementRef]);
  return height;
}

export function ProductionReview({
  statusColumns,
  onCreateContent,
  onEditContent,
  onDeleteContent,
  onCheckChange,
  onStatusChange,
}: ProductionReviewProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [contentPendingDelete, setContentPendingDelete] =
    useState<ProductionQueueItemViewModel | null>(null);
  const boardHeight = useFillWindowHeight(boardRef);

  function handleContentDrop(dragEvent: React.DragEvent, targetStatus: ContentStatus) {
    dragEvent.preventDefault();
    const contentId = dragEvent.dataTransfer.getData("text/plain");
    const sourceColumn = statusColumns.find((column) =>
      column.contentItems.some((contentItem) => contentItem.id === contentId),
    );
    if (contentId && sourceColumn?.status !== targetStatus) onStatusChange(contentId, targetStatus);
  }

  function scrollBoardWhileDragging(dragEvent: React.DragEvent<HTMLDivElement>) {
    const board = dragEvent.currentTarget;
    const { left, right } = board.getBoundingClientRect();
    if (dragEvent.clientX < left + DRAG_SCROLL_EDGE) board.scrollLeft -= DRAG_SCROLL_STEP;
    else if (dragEvent.clientX > right - DRAG_SCROLL_EDGE) board.scrollLeft += DRAG_SCROLL_STEP;
  }

  function scrollBoardBy(direction: -1 | 1) {
    boardRef.current?.scrollBy({
      left: direction * (LANE_WIDTH + LANE_GAP) * 2,
      behavior: "smooth",
    });
  }

  function jumpToLane(status: ContentStatus) {
    const board = boardRef.current;
    const lane = board?.querySelector<HTMLElement>(`[data-status="${status}"]`);
    if (board && lane)
      board.scrollTo({ left: lane.offsetLeft - board.offsetLeft, behavior: "smooth" });
  }

  return (
    // -mb-14 cancels the shell's bottom padding so the window-height board doesn't make the page scroll.
    <div className="production-review -mb-14">
      <PageHeader
        title="Production & Review"
        description="Track readiness, clear review bottlenecks and approve finished work."
        actions={
          <Button variant="primary" onClick={onCreateContent}>
            ＋ Add to queue
          </Button>
        }
      />
      <nav
        aria-label="Jump to status"
        className="production-board__nav mb-3 flex items-center gap-2"
      >
        <Button
          size="sm"
          variant="ghost"
          aria-label="Scroll board left"
          onClick={() => scrollBoardBy(-1)}
        >
          ‹
        </Button>
        <div className="production-board__chips scrollbar-thin flex flex-1 gap-1.5 overflow-x-auto py-0.5">
          {statusColumns.map((column) => (
            <button
              key={column.status}
              type="button"
              onClick={() => jumpToLane(column.status)}
              className="production-board__chip flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-medium text-ink transition hover:border-brand hover:bg-brand-soft"
            >
              <span aria-hidden className={cn("size-1.5 rounded-full", statusDot(column.status))} />
              {column.title}
              <span className="text-muted">{column.contentItems.length}</span>
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          aria-label="Scroll board right"
          onClick={() => scrollBoardBy(1)}
        >
          ›
        </Button>
      </nav>
      <div
        ref={boardRef}
        onDragOver={scrollBoardWhileDragging}
        style={{ height: boardHeight, gridAutoColumns: LANE_WIDTH, columnGap: LANE_GAP }}
        className="production-board scrollbar-thin grid grid-flow-col overflow-x-auto overflow-y-hidden pb-2"
      >
        {statusColumns.map((column) => (
          <ProductionStatusLane
            key={column.status}
            column={column}
            onDrop={handleContentDrop}
            onEditContent={onEditContent}
            onRequestDelete={setContentPendingDelete}
            onCheckChange={onCheckChange}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
      <DeleteContentDialog
        contentItem={contentPendingDelete}
        publicationCount={contentPendingDelete?.publicationCount ?? 0}
        onConfirm={(contentToDelete) => onDeleteContent(contentToDelete.id)}
        onClose={() => setContentPendingDelete(null)}
      />
    </div>
  );
}

function ProductionStatusLane({
  column,
  onDrop,
  ...queueItemCallbacks
}: QueueItemCallbacks & {
  column: ProductionStatusColumn;
  onDrop: (dragEvent: React.DragEvent, targetStatus: ContentStatus) => void;
}) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  return (
    <section
      data-status={column.status}
      className={cn(
        `production-lane production-lane--${column.status} flex min-h-0 flex-col rounded-lane border border-line bg-soft transition-colors`,
        isDropTarget && "border-brand bg-brand-soft/40",
      )}
      onDragOver={(dragEvent) => {
        dragEvent.preventDefault();
        setIsDropTarget(true);
      }}
      onDragLeave={(dragEvent) => {
        if (!dragEvent.currentTarget.contains(dragEvent.relatedTarget as Node)) {
          setIsDropTarget(false);
        }
      }}
      onDrop={(dragEvent) => {
        setIsDropTarget(false);
        onDrop(dragEvent, column.status);
      }}
    >
      <header className="production-lane__header flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
        <div className="production-lane__title flex items-center gap-2 font-semibold">
          <span aria-hidden className={cn("size-2 rounded-full", statusDot(column.status))} />
          {column.title}
        </div>
        <span className="production-lane__count rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold text-muted">
          {column.contentItems.length}
        </span>
      </header>
      <div className="production-lane__items scrollbar-thin grid min-h-0 flex-1 content-start gap-2 overflow-y-auto px-2 pb-2">
        {column.contentItems.map((contentItem) => (
          <ProductionQueueItem
            key={contentItem.id}
            contentItem={contentItem}
            {...queueItemCallbacks}
          />
        ))}
        {!column.contentItems.length && (
          <div className="production-lane__empty rounded-[10px] border border-dashed border-line p-5 text-center text-[10px] text-faint">
            Drop content here
          </div>
        )}
      </div>
    </section>
  );
}

function ProductionQueueItem({
  contentItem,
  onEditContent,
  onRequestDelete,
  onCheckChange,
  onStatusChange,
}: QueueItemCallbacks & {
  contentItem: ProductionQueueItemViewModel;
}) {
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const { done, total } = contentItem.readiness;
  return (
    <article
      draggable
      onDragStart={(dragEvent) => dragEvent.dataTransfer.setData("text/plain", contentItem.id)}
      className="queue-item cursor-grab rounded-[10px] border border-line bg-card p-3 active:cursor-grabbing"
    >
      <div className="queue-item__meta flex items-start justify-between gap-2">
        <h3 className="queue-item__title m-0 text-[12px] font-semibold leading-snug">
          <button
            type="button"
            onClick={() => onEditContent(contentItem.id)}
            className="queue-item__title-button cursor-pointer text-left hover:text-brand-text hover:underline"
          >
            {contentItem.title}
          </button>
        </h3>
        <ContentActionMenu
          contentItem={contentItem}
          onEdit={(item) => onEditContent(item.id)}
          onDelete={onRequestDelete}
          className="queue-item__actions -my-1"
        />
      </div>
      {contentItem.format && (
        <div className="queue-item__format mt-1 text-[9px] text-faint">{contentItem.format}</div>
      )}
      {total > 0 && (
        <div className="queue-item__checklist mt-2.5">
          <button
            type="button"
            aria-expanded={isChecklistOpen}
            onClick={() => setIsChecklistOpen(!isChecklistOpen)}
            className="queue-item__checklist-toggle flex w-full cursor-pointer items-center justify-between text-[10px] text-muted hover:text-ink"
          >
            <span>
              Checklist <span aria-hidden>{isChecklistOpen ? "▴" : "▾"}</span>
            </span>
            <b>
              {done}/{total}
            </b>
          </button>
          <ProgressBar value={(done / total) * 100} className="mt-1" />
          {isChecklistOpen && (
            <div className="mt-2.5 grid grid-cols-2 gap-1.5">
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
          )}
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2.5">
        {contentItem.owner ? (
          <PersonChip name={contentItem.owner} />
        ) : (
          <span className="text-[10px] text-faint">No owner</span>
        )}
        <Select
          aria-label={`Status of ${contentItem.title}`}
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
