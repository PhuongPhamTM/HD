"use client";
import { Button, Tag } from "@/components/atoms/ui";
import { Icon } from "@/components/atoms/icons";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

export interface TopbarProps {
  user: { name: string; email: string };
  /** Breadcrumb label of the current page. */
  pageLabel: string;
  onCreateContent(): void;
  onOpenNav(): void;
  /** Form action of the "Sign out" item in the user menu. */
  signOutAction(): Promise<void>;
}

export function Topbar({
  user,
  pageLabel,
  onCreateContent,
  onOpenNav,
  signOutAction,
}: TopbarProps) {
  return (
    <header className="topbar sticky top-0 z-40 flex h-[58px] items-center gap-3 border-b border-line bg-card/95 px-6 backdrop-blur max-[760px]:px-3">
      <button
        onClick={onOpenNav}
        className="topbar__menu hidden size-9 place-items-center rounded-ctl border border-line text-muted max-[760px]:grid"
        aria-label="Open navigation"
      >
        <Icon name="menu" className="size-5" />
      </button>
      <div className="topbar__breadcrumb flex-1 text-muted">
        <span>Content Hub</span>
        <span className="mx-2 text-faint">/</span>
        <strong className="text-ink">{pageLabel}</strong>
      </div>
      <Tag tone="blue">2026 workspace</Tag>
      <ThemeToggle />
      <Button variant="primary" size="sm" className="max-[560px]:hidden" onClick={onCreateContent}>
        <Icon name="plus" className="size-4" />
        Create
      </Button>
      <UserMenu user={user} signOutAction={signOutAction} />
    </header>
  );
}
