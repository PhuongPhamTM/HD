"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/atoms/icons";
import { cn } from "@/lib/cn";
import { useDismiss } from "@/lib/hooks/useDismiss";

export interface ActionMenuItem {
  key: string;
  label: string;
  icon?: string;
  tone?: "default" | "danger";
  onSelect(): void;
}

interface ActionMenuProps {
  label: string;
  items: ActionMenuItem[];
  className?: string;
}

const MENU_WIDTH = 160;

/**
 * A "⋯" button with a dropdown. The menu is fixed-positioned so it isn't clipped by
 * scrolling/overflow-hidden containers such as tables inside cards.
 */
export function ActionMenu({ label, items, className }: ActionMenuProps) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const isOpen = position !== null;

  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const estimatedHeight = items.length * 36 + 8;
    const opensUp = rect.bottom + estimatedHeight + 8 > window.innerHeight;
    setPosition({
      top: opensUp ? rect.top - estimatedHeight - 4 : rect.bottom + 4,
      left: Math.max(8, rect.right - MENU_WIDTH),
    });
  }

  function closeMenu(restoreFocus = false) {
    setPosition(null);
    if (restoreFocus) triggerRef.current?.focus();
  }

  useEffect(() => {
    if (isOpen) menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
  }, [isOpen]);
  useDismiss(isOpen, {
    refs: [triggerRef, menuRef],
    onDismiss: (reason) => closeMenu(reason === "escape"),
    closeOnViewportChange: true,
  });

  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const menuItems = [
      ...(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? []),
    ];
    const currentIndex = menuItems.indexOf(document.activeElement as HTMLButtonElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    menuItems[(currentIndex + step + menuItems.length) % menuItems.length]?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        title={label}
        className={cn(
          "action-menu__trigger grid size-7 shrink-0 cursor-pointer place-items-center rounded-full border border-line bg-card text-muted transition hover:border-brand hover:bg-brand-soft hover:text-brand-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          isOpen && "action-menu__trigger--open border-brand bg-brand-soft text-brand-text",
          className,
        )}
      >
        <Icon name="more" className="size-4" />
      </button>

      {position && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
          className="action-menu fixed z-[70] grid gap-0.5 rounded-ctl border border-line bg-card p-1 text-left shadow-xl"
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              onClick={() => {
                closeMenu();
                item.onSelect();
              }}
              className={cn(
                `action-menu__item action-menu__item--${item.key} flex h-8 items-center gap-2 rounded-md px-2.5 text-[12px] font-medium outline-none`,
                item.tone === "danger"
                  ? "text-danger hover:bg-danger-soft focus-visible:bg-danger-soft"
                  : "text-ink hover:bg-soft focus-visible:bg-soft",
              )}
            >
              {item.icon && <Icon name={item.icon} className="size-3.5" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
