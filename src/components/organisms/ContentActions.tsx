"use client";
import { ActionMenu } from "@/components/molecules/ActionMenu";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
/** Anything with a title: a content item, or a view model of one (e.g. a media asset). */
type TitledItem = { title: string };

/**
 * True when a click came from a control inside a clickable row/card (select, checkbox,
 * button, the actions menu…), so the container shouldn't also react to it.
 */
export function isClickOnInteractiveElement(target: EventTarget) {
  return Boolean(
    (target as HTMLElement).closest("button, a, input, select, textarea, label, [role=menu]"),
  );
}

/** "⋯" menu with Edit and Delete for a content item. */
export function ContentActionMenu<Item extends TitledItem>({
  contentItem,
  onEdit,
  onDelete,
  className,
}: {
  contentItem: Item;
  // NoInfer: `Item` comes from `contentItem`, not from how the callbacks are typed.
  onEdit(contentItem: NoInfer<Item>): void;
  onDelete(contentItem: NoInfer<Item>): void;
  className?: string;
}) {
  return (
    <ActionMenu
      label={`Actions for ${contentItem.title}`}
      className={className}
      items={[
        {
          key: "edit",
          label: "Edit",
          icon: "edit",
          onSelect: () => onEdit(contentItem),
        },
        {
          key: "delete",
          label: "Delete",
          icon: "trash",
          tone: "danger",
          onSelect: () => onDelete(contentItem),
        },
      ]}
    />
  );
}

/** Confirms deleting a content item (and its publications); the delete itself is `onConfirm`. */
export function DeleteContentDialog<Item extends TitledItem>({
  contentItem,
  publicationCount,
  onConfirm,
  onClose,
}: {
  contentItem: Item | null;
  /** Publications of `contentItem` that will be deleted with it. */
  publicationCount: number;
  onConfirm(contentItem: NoInfer<Item>): void;
  onClose(): void;
}) {
  return (
    <ConfirmDialog
      open={contentItem !== null}
      tone="danger"
      title="Delete content?"
      description={
        <>
          <p className="m-0">
            <strong className="text-ink">{contentItem?.title}</strong> will be permanently removed
            from the content plan.
          </p>
          {publicationCount > 0 && (
            <p className="m-0 mt-2">
              Its {publicationCount} scheduled{" "}
              {publicationCount === 1 ? "publication" : "publications"} will be deleted too.
            </p>
          )}
        </>
      }
      confirmLabel="Delete content"
      onConfirm={() => {
        if (contentItem) onConfirm(contentItem);
        onClose();
      }}
      onCancel={onClose}
    />
  );
}
