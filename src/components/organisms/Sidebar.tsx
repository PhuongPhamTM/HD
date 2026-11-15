"use client";
import Link from "next/link";
import { BrandMark, Button, CountBadge } from "@/components/atoms/ui";
import { Icon } from "@/components/atoms/icons";
import { cn } from "@/lib/cn";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: string;
  isActive: boolean;
  /** Shown as a badge when defined. */
  count?: number;
}

export interface SidebarSyncStatus {
  /** Tailwind background class for the status dot, e.g. "bg-success". */
  dotClassName: string;
  title: string;
  detail: string;
  /** Shows the dismiss button (only when there is an error to dismiss). */
  isDismissible: boolean;
}

export interface SidebarProps {
  navItems: SidebarNavItem[];
  syncStatus: SidebarSyncStatus;
  onDismissSyncError(): void;
  onCreateContent(): void;
  onClose(): void;
}

export function Sidebar({
  navItems,
  syncStatus,
  onDismissSyncError,
  onCreateContent,
  onClose,
}: SidebarProps) {
  return (
    <aside className="dashboard-shell__sidebar fixed inset-y-0 left-0 flex w-[236px] flex-col border-r border-line bg-card transition-transform duration-200">
      <div className="sidebar__brand flex h-[74px] items-center gap-3 px-5">
        <BrandMark />
        <div>
          <div className="text-[14px] font-bold tracking-[.02em]">Handong</div>
          <div className="text-[9px] font-bold tracking-[.18em] text-muted">CONTENT HUB</div>
        </div>
        <button
          className="ml-auto hidden text-muted max-[760px]:block"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <Icon name="x" className="size-5" />
        </button>
      </div>
      <div className="sidebar__create px-4 pb-4">
        <Button variant="primary" className="w-full" onClick={onCreateContent}>
          <Icon name="plus" className="size-4" />
          New content
        </Button>
      </div>
      <nav className="sidebar__nav scrollbar-thin flex-1 overflow-y-auto px-3">
        <div className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[.16em] text-faint">
          Workspace
        </div>
        {navItems.map((navigationItem) => (
          <Link
            key={navigationItem.href}
            href={navigationItem.href}
            onClick={onClose}
            className={cn(
              "nav-item mb-1 flex min-h-10 items-center gap-3 rounded-ctl px-3 text-[12px] font-medium text-muted transition hover:bg-soft hover:text-ink",
              navigationItem.isActive && "nav-item--active bg-brand-soft text-brand-text",
            )}
          >
            <Icon name={navigationItem.icon} className="size-[17px] shrink-0" />
            <span className="nav-item__label flex-1">{navigationItem.label}</span>
            {navigationItem.count !== undefined && <CountBadge>{navigationItem.count}</CountBadge>}
          </Link>
        ))}
      </nav>
      <div className="sidebar__footer border-t border-line p-4">
        <SyncIndicator syncStatus={syncStatus} onDismiss={onDismissSyncError} />
      </div>
    </aside>
  );
}

function SyncIndicator({
  syncStatus,
  onDismiss,
}: {
  syncStatus: SidebarSyncStatus;
  onDismiss(): void;
}) {
  const { dotClassName, title, detail, isDismissible } = syncStatus;
  return (
    <div className="sync-indicator rounded-ctl bg-soft p-3" role="status">
      <div className="flex items-center gap-2 text-[11px] font-semibold">
        <span className={cn("size-2 shrink-0 rounded-full", dotClassName)} />
        <span className="flex-1">{title}</span>
        {isDismissible && (
          <button onClick={onDismiss} aria-label="Dismiss" className="text-muted">
            ×
          </button>
        )}
      </div>
      <div className="mt-1 text-[10px] text-muted">{detail}</div>
    </div>
  );
}
