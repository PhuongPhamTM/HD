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
}

export interface ProductionQueueGroup {
  key: string;
  title: string;
  contentItems: ProductionQueueItemViewModel[];
}

export interface ProductionReviewProps {
  queueGroups: ProductionQueueGroup[];
  onCreateContent(): void;
  onEditContent(contentId: string): void;
  onCheckChange(contentId: string, checkKey: string, checked: boolean): void;
  onStatusChange(contentId: string, status: ContentStatus): void;
}
