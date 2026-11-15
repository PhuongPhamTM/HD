"use client";
import { useId, useRef, useState } from "react";
import { Avatar } from "@/components/atoms/ui";
import { cn } from "@/lib/cn";
import { useDismiss } from "@/lib/hooks/useDismiss";

export interface UserMenuProps {
  user: { name: string; email: string };
  /** Form action of the "Sign out" item. */
  signOutAction(): Promise<void>;
}

/** The avatar button in the top bar with the account dropdown. */
export function UserMenu({ user, signOutAction }: UserMenuProps) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useDismiss(isOpen, {
    refs: [triggerRef, menuRef],
    onDismiss(reason) {
      setIsOpen(false);
      if (reason === "escape") triggerRef.current?.focus();
    },
  });

  return (
    <div className="topbar__user relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((wasOpen) => !wasOpen)}
        className={cn(
          "user-menu__trigger flex cursor-pointer items-center gap-2 rounded-full pr-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          isOpen && "user-menu__trigger--open",
        )}
      >
        <Avatar name={user.name} />
        <span className="max-w-24 truncate text-[11px] font-semibold max-[900px]:hidden">
          {user.name}
        </span>
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Account"
          className="user-menu absolute right-0 top-11 z-50 w-56 rounded-card border border-line bg-card p-2 shadow-xl"
        >
          <div className="border-b border-line px-3 py-2">
            <div className="font-semibold">{user.name}</div>
            <div className="truncate text-[10px] text-muted">{user.email}</div>
          </div>
          <form action={signOutAction}>
            <button
              role="menuitem"
              className="mt-1 w-full rounded-ctl px-3 py-2 text-left text-[12px] text-muted hover:bg-soft hover:text-ink focus-visible:bg-soft focus-visible:outline-none"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
