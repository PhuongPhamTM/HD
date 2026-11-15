"use client";

/**
 * App-wide commands for the content editor dialog. Containers call these; the dialog's
 * container listens for them. Presentational components never call them directly; they
 * receive callbacks such as `onEditContent` / `onCreateContent` instead.
 */
export const NEW_CONTENT_EVENT = "hub:new-content";
export const EDIT_CONTENT_EVENT = "hub:edit-content";

export function openNewContentEditor() {
  window.dispatchEvent(new Event(NEW_CONTENT_EVENT));
}

export function openContentEditor(contentId: string) {
  window.dispatchEvent(new CustomEvent(EDIT_CONTENT_EVENT, { detail: { id: contentId } }));
}

/** Subscribes to both commands; returns the unsubscribe function. */
export function subscribeToContentEditor(handlers: {
  onCreate(): void;
  onEdit(contentId: string): void;
}) {
  const handleCreate = () => handlers.onCreate();
  const handleEdit = (event: Event) => {
    const contentId = (event as CustomEvent<{ id: string }>).detail?.id;
    if (contentId) handlers.onEdit(contentId);
  };
  window.addEventListener(NEW_CONTENT_EVENT, handleCreate);
  window.addEventListener(EDIT_CONTENT_EVENT, handleEdit);
  return () => {
    window.removeEventListener(NEW_CONTENT_EVENT, handleCreate);
    window.removeEventListener(EDIT_CONTENT_EVENT, handleEdit);
  };
}
