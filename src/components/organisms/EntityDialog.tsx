"use client";
import { Icon } from "@/components/atoms/icons";
import { Button, Input, Select, Textarea } from "@/components/atoms/ui";
import { FormField } from "@/components/molecules/ui";
import type {
  ContentEditorOption,
  ContentEditorViewProps,
} from "@/features/content-editor/contentEditor.types";
import type { ContentItem } from "@/lib/domain/types";
import { useEffect, useRef, useState } from "react";

const FORMAT_OPTIONS = ["Short Video", "Post (Image)", "Post (Video)", "Article"];
const PRIORITY_OPTIONS = ["Normal", "High", "Low"];

/** Keeps a value that isn't in the preset list selectable, so saving doesn't silently change it. */
function withCurrentOption(options: string[], currentValue = "") {
  return currentValue && !options.includes(currentValue) ? [currentValue, ...options] : options;
}

export function EntityDialog({
  open,
  sessionKey,
  editingContent,
  initialTitle,
  campaigns,
  statusOptions,
  onSave,
  onClose,
}: ContentEditorViewProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open, sessionKey]);

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="entity-dialog m-auto w-[min(620px,calc(100%-28px))] rounded-card border border-line bg-card p-0 text-ink shadow-2xl backdrop:bg-[#071120]/55"
    >
      <ContentEditorForm
        key={sessionKey}
        editingContent={editingContent}
        initialTitle={initialTitle}
        campaigns={campaigns}
        statusOptions={statusOptions}
        onSave={onSave}
        onCancel={closeDialog}
      />
    </dialog>
  );
}

function ContentEditorForm({
  editingContent,
  initialTitle,
  campaigns,
  statusOptions,
  onSave,
  onCancel,
}: {
  editingContent: ContentItem | undefined;
  initialTitle: string;
  campaigns: ContentEditorOption[];
  statusOptions: ContentEditorOption[];
  onSave: ContentEditorViewProps["onSave"];
  onCancel(): void;
}) {
  const [contentTitle, setContentTitle] = useState(initialTitle);
  const [saveError, setSaveError] = useState("");
  const isEditing = Boolean(editingContent);

  function submitForm(formData: FormData) {
    const error = onSave({
      title: String(formData.get("title")),
      campaign: String(formData.get("campaign")),
      owner: String(formData.get("owner")),
      location: String(formData.get("location")),
      status: String(formData.get("status")) as ContentItem["status"],
      shoot: String(formData.get("shoot")),
      due: String(formData.get("due")),
      script: String(formData.get("script")),
      format: String(formData.get("format")),
      priority: String(formData.get("priority")),
      thumbnail: String(formData.get("thumbnail") ?? ""),
    });
    setSaveError(error ?? "");
  }

  return (
    <form action={submitForm}>
      <div className="entity-dialog__header flex items-start justify-between border-b border-line px-6 py-4">
        <div>
          <h2 className="m-0 text-lg font-semibold">
            {isEditing ? "Edit content" : "Create content"}
          </h2>
          <p className="m-0 mt-1 text-[11px] text-muted">
            {isEditing
              ? "Update this item's details in your production workflow."
              : "Start a new item in your production workflow."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close dialog"
          className="grid size-8 place-items-center rounded-ctl text-muted hover:bg-soft"
        >
          <Icon name="x" className="size-4" />
        </button>
      </div>
      <div className="entity-dialog__body grid grid-cols-2 gap-4 p-6 max-[560px]:grid-cols-1">
        <FormField label="Title">
          <Input
            name="title"
            required
            value={contentTitle}
            onChange={(changeEvent) => setContentTitle(changeEvent.target.value)}
            autoFocus
          />
        </FormField>
        <FormField label="Campaign">
          <Select name="campaign" className="w-full" defaultValue={editingContent?.campaign}>
            <option value="">No campaign</option>
            {campaigns.map((campaign) => (
              <option value={campaign.value} key={campaign.value}>
                {campaign.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status">
          <Select name="status" className="w-full" defaultValue={editingContent?.status}>
            {statusOptions.map((contentStage) => (
              <option value={contentStage.value} key={contentStage.value}>
                {contentStage.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Owner">
          <Input name="owner" placeholder="Name or team" defaultValue={editingContent?.owner} />
        </FormField>
        <FormField label="Format">
          <Select name="format" className="w-full" defaultValue={editingContent?.format}>
            {withCurrentOption(FORMAT_OPTIONS, editingContent?.format).map((format) => (
              <option key={format}>{format}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Priority">
          <Select
            name="priority"
            className="w-full"
            defaultValue={isEditing ? editingContent?.priority : "Normal"}
          >
            {isEditing && !editingContent?.priority && <option value="">Not set</option>}
            {withCurrentOption(PRIORITY_OPTIONS, editingContent?.priority).map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Shoot date">
          <Input type="date" name="shoot" defaultValue={editingContent?.shoot} />
        </FormField>
        <FormField label="Due date">
          <Input type="date" name="due" defaultValue={editingContent?.due} />
        </FormField>
        <div className="col-span-2 max-[560px]:col-span-1">
          <FormField label="Location">
            <Input name="location" defaultValue={editingContent?.location} />
          </FormField>
        </div>
        <div className="col-span-2 max-[560px]:col-span-1">
          <FormField label="Thumbnail URL" hint="Image shown on the Asset Library card.">
            <Input
              type="url"
              name="thumbnail"
              placeholder="https://…/image.jpg"
              defaultValue={editingContent?.thumbnail ?? ""}
              aria-invalid={Boolean(saveError)}
              onChange={() => setSaveError("")}
            />
          </FormField>
          {saveError && (
            <p role="alert" className="mb-0 mt-1.5 text-[11px] text-danger">
              {saveError}
            </p>
          )}
        </div>
        <div className="col-span-2 max-[560px]:col-span-1">
          <FormField label="Script / notes">
            <Textarea name="script" defaultValue={editingContent?.script} />
          </FormField>
        </div>
      </div>
      <div className="entity-dialog__footer flex justify-end gap-2 border-t border-line px-6 py-4">
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!contentTitle.trim()}>
          {isEditing ? "Save changes" : "Create content"}
        </Button>
      </div>
    </form>
  );
}
