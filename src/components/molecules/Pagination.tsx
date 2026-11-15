import { Select } from "@/components/atoms/ui";
import { cn } from "@/lib/cn";
import { PAGE_SIZE_OPTIONS, type PaginationState } from "@/lib/hooks/usePagination";

/** Page numbers to show, with "…" gaps: 1 … 4 5 6 … 12 */
function getVisiblePageNumbers(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const windowStart = Math.max(2, Math.min(page - 1, totalPages - 4));
  const windowEnd = Math.min(totalPages - 1, Math.max(page + 1, 5));
  const middlePages = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, index) => windowStart + index,
  );
  return [
    1,
    ...(windowStart > 2 ? (["gap"] as const) : []),
    ...middlePages,
    ...(windowEnd < totalPages - 1 ? (["gap"] as const) : []),
    totalPages,
  ];
}

const pageButtonClassName =
  "pagination__button grid h-7 min-w-7 place-items-center rounded-md px-2 text-[11px] text-muted transition hover:bg-soft hover:text-ink disabled:pointer-events-none disabled:opacity-40";

export function Pagination({
  pagination,
  itemLabel = "items",
  compact = false,
  className,
}: {
  pagination: Omit<PaginationState<unknown>, "pageItems">;
  itemLabel?: string;
  /** Compact: just ‹ 2 / 5 › — for narrow containers such as board lanes. No size selector. */
  compact?: boolean;
  className?: string;
}) {
  const { page, totalPages, totalItems, pageSize, rangeStart, rangeEnd, setPage, setPageSize } =
    pagination;
  // With a size selector, stay visible while a smaller page size would still paginate,
  // so the user can always switch back after choosing a large size.
  const isHidden = compact ? totalPages <= 1 : totalItems <= Math.min(...PAGE_SIZE_OPTIONS);
  if (isHidden) return null;

  const previousButton = (
    <button
      type="button"
      onClick={() => setPage(page - 1)}
      disabled={page <= 1}
      aria-label="Previous page"
      className={cn(pageButtonClassName, "pagination__previous")}
    >
      ‹
    </button>
  );
  const nextButton = (
    <button
      type="button"
      onClick={() => setPage(page + 1)}
      disabled={page >= totalPages}
      aria-label="Next page"
      className={cn(pageButtonClassName, "pagination__next")}
    >
      ›
    </button>
  );

  if (compact)
    return (
      <nav
        aria-label="Pagination"
        className={cn(
          "pagination pagination--compact flex items-center justify-center gap-1",
          className,
        )}
      >
        {previousButton}
        <span className="pagination__position text-[10px] tabular-nums text-muted">
          {page} / {totalPages}
        </span>
        {nextButton}
      </nav>
    );

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "pagination flex flex-wrap items-center justify-between gap-2 px-4 py-2.5",
        className,
      )}
    >
      <div className="pagination__info flex items-center gap-3">
        <span className="pagination__summary text-[10.5px] tabular-nums text-muted">
          Showing {rangeStart}–{rangeEnd} of {totalItems} {itemLabel}
        </span>
        <label className="pagination__page-size flex items-center gap-1.5 text-[10.5px] text-muted">
          Per page
          <Select
            value={pageSize}
            onChange={(selectEvent) => setPageSize(Number(selectEvent.target.value))}
            className="pagination__page-size-select h-7 px-2 text-[11px]"
          >
            {PAGE_SIZE_OPTIONS.map((pageSizeOption) => (
              <option key={pageSizeOption} value={pageSizeOption}>
                {pageSizeOption}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <div className="pagination__pages flex items-center gap-0.5">
        {previousButton}
        {getVisiblePageNumbers(page, totalPages).map((pageNumber, index) =>
          pageNumber === "gap" ? (
            <span key={`gap-${index}`} className="pagination__gap px-1 text-[11px] text-faint">
              …
            </span>
          ) : (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              aria-current={pageNumber === page ? "page" : undefined}
              className={cn(
                pageButtonClassName,
                "tabular-nums",
                pageNumber === page &&
                  "pagination__button--active bg-brand-soft font-semibold text-brand-text hover:bg-brand-soft hover:text-brand-text",
              )}
            >
              {pageNumber}
            </button>
          ),
        )}
        {nextButton}
      </div>
    </nav>
  );
}
