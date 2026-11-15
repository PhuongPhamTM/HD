import type { ContentStatus } from "@/lib/domain/types";

export interface ProductionOption {
  key: string;
  label: string;
}

export interface ProductionQueueItemViewModel {
  id: string;
  title: string;
  format: string;
  owner: string;
  status: ContentStatus;
  statusLabel: string;
  /** Keys of the checks ticked on this item. */
  checkedKeys: string[];
  readiness: { done: number; total: number };
  /** Active checks plus any retired check still ticked on this item. */
  visibleChecks: ProductionOption[];
  statusOptions: ProductionOption[];
  /** Scheduled publications that are deleted along with this item. */
  publicationCount: number;
}

/** One board column: every content item currently in `status`. */
export interface ProductionStatusColumn {
  status: ContentStatus;
  title: string;
  contentItems: ProductionQueueItemViewModel[];
}

export interface ProductionReviewProps {
  statusColumns: ProductionStatusColumn[];
  onCreateContent(): void;
  onEditContent(contentId: string): void;
  /** Deletes the item and its publications; the UI confirms first. */
  onDeleteContent(contentId: string): void;
  onCheckChange(contentId: string, checkKey: string, checked: boolean): void;
  onStatusChange(contentId: string, status: ContentStatus): void;
}
