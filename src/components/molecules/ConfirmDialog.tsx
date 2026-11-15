"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/atoms/ui";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm(): void;
  onCancel(): void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      // Escape key or backdrop click both count as cancelling.
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      className="confirm-dialog m-auto w-[min(420px,calc(100%-28px))] rounded-card border border-line bg-card p-0 text-ink shadow-2xl backdrop:bg-[#071120]/55"
    >
      <div className="confirm-dialog__body px-6 py-5">
        <h2 id="confirm-dialog-title" className="confirm-dialog__title m-0 text-lg font-semibold">
          {title}
        </h2>
        <div
          id="confirm-dialog-description"
          className="confirm-dialog__description mt-2 text-[12px] text-muted"
        >
          {description}
        </div>
      </div>
      <div className="confirm-dialog__footer flex justify-end gap-2 border-t border-line px-6 py-4">
        <Button type="button" onClick={onCancel} autoFocus>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={tone === "danger" ? "danger" : "primary"}
          onClick={onConfirm}
          className="confirm-dialog__confirm"
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
