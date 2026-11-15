"use client";
import { useState } from "react";

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

export interface PaginationState<Item> {
  /** Current page, 1-based and always within [1, totalPages]. */
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  /** 1-based index of the first item on this page (0 when the list is empty). */
  rangeStart: number;
  /** 1-based index of the last item on this page (0 when the list is empty). */
  rangeEnd: number;
  pageItems: Item[];
  setPage: (page: number) => void;
  /** Changes the page size and jumps back to page 1. */
  setPageSize: (pageSize: number) => void;
}

/**
 * Client-side pagination for an in-memory list.
 *
 * `resetKey` should change whenever the list's filters change (search, campaign, …):
 * the page then jumps back to 1. The page is also clamped, so shrinking the list
 * (e.g. an item moved to another lane) never leaves you on an empty page.
 * The chosen page size survives filter changes.
 */
export function usePagination<Item>(
  items: Item[],
  initialPageSize: number = DEFAULT_PAGE_SIZE,
  resetKey = "",
): PaginationState<Item> {
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [pageState, setPageState] = useState({ page: 1, resetKey });
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const requestedPage = pageState.resetKey === resetKey ? pageState.page : 1;
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  return {
    page,
    totalPages,
    pageSize,
    totalItems,
    rangeStart: totalItems ? startIndex + 1 : 0,
    rangeEnd: endIndex,
    pageItems: items.slice(startIndex, endIndex),
    setPage: (nextPage) =>
      setPageState({ page: Math.min(Math.max(1, nextPage), totalPages), resetKey }),
    setPageSize: (nextPageSize) => {
      setPageSizeState(nextPageSize);
      setPageState({ page: 1, resetKey });
    },
  };
}
