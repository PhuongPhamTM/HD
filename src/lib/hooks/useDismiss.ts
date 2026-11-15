"use client";
import { useEffect, useRef, type RefObject } from "react";

interface DismissOptions {
  /** Elements that count as "inside" (usually the trigger and the popup). */
  refs: RefObject<HTMLElement | null>[];
  /** Called with `"escape"` when Escape closed it, so focus can go back to the trigger. */
  onDismiss(reason: "outside" | "escape" | "viewport"): void;
  /** Also close on scroll and resize (for fixed-position popups that would drift). */
  closeOnViewportChange?: boolean;
}

/**
 * Closes a dropdown, menu or popover when the user presses outside it or hits Escape.
 * Use it for every popup so they all behave the same way.
 */
export function useDismiss(
  isOpen: boolean,
  { refs, onDismiss, closeOnViewportChange = false }: DismissOptions,
) {
  // Keep the latest callback/refs without re-subscribing on every render.
  const latest = useRef({ refs, onDismiss });
  useEffect(() => {
    latest.current = { refs, onDismiss };
  });

  useEffect(() => {
    if (!isOpen) return;
    const isInside = (target: EventTarget | null) =>
      target instanceof Node && latest.current.refs.some((ref) => ref.current?.contains(target));

    // pointerdown covers mouse, touch and pen, and fires before focus moves elsewhere.
    const handlePointerDown = (event: PointerEvent) => {
      if (!isInside(event.target)) latest.current.onDismiss("outside");
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") latest.current.onDismiss("escape");
    };
    // Tabbing out of the popup also closes it.
    const handleFocusIn = (event: FocusEvent) => {
      if (!isInside(event.target)) latest.current.onDismiss("outside");
    };
    const handleViewportChange = () => latest.current.onDismiss("viewport");

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);
    if (closeOnViewportChange) {
      window.addEventListener("resize", handleViewportChange);
      window.addEventListener("scroll", handleViewportChange, true);
    }
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen, closeOnViewportChange]);
}
