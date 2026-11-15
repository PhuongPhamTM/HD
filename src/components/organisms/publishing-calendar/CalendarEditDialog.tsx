import { Button, Input, Select, Textarea } from "@/components/atoms/ui";
import { FormField } from "@/components/molecules/ui";
import type {
  CalendarContentOption,
  CalendarEditorModel,
  CalendarOption,
} from "@/features/calendar/calendar.types";
import { Icon } from "@/components/atoms/icons";

interface CalendarEditDialogProps {
  editor: CalendarEditorModel;
  contentOptions: CalendarContentOption[];
  channels: string[];
  contentStatusOptions: CalendarOption[];
  publicationStatusOptions: CalendarOption[];
  onSave(formData: FormData): void;
  onDelete(): void;
  onClose(): void;
}

export function CalendarEditDialog({
  editor,
  contentOptions,
  channels,
  contentStatusOptions,
  publicationStatusOptions,
  onSave,
  onDelete,
  onClose,
}: CalendarEditDialogProps) {
  const isPublication = editor.entity === "publication";
  const title = editor.mode === "create" ? "Add calendar event" : `Edit ${editor.title}`;

  return (
    <div
      className="calendar-edit-dialog fixed inset-0 z-[80] grid place-items-center bg-[#071120]/55 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-edit-title"
        className="calendar-edit-dialog__panel w-full max-w-[620px] overflow-hidden rounded-card border border-line bg-card text-ink shadow-2xl"
      >
        <header className="calendar-edit-dialog__header flex items-start justify-between border-b border-line px-6 py-4">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[.14em] text-brand-text">
              {isPublication ? "Publishing schedule" : "Shooting schedule"}
            </div>
            <h2 id="calendar-edit-title" className="mb-0 mt-1 text-lg font-semibold">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-ctl text-muted hover:bg-soft"
            aria-label="Close editor"
          >
            <Icon name="x" className="size-4" />
          </button>
        </header>

        <form action={onSave}>
          <div className="calendar-edit-dialog__body grid grid-cols-2 gap-4 p-6 max-[560px]:grid-cols-1">
            <FormField label="Content">
              <Select
                name="contentId"
                className="w-full"
                defaultValue={editor.contentId}
                required
                disabled={editor.entity === "content" && editor.mode === "edit"}
              >
                <option value="">Select content</option>
                {contentOptions.map((content) => (
                  <option key={content.id} value={content.id}>
                    {content.title}
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="grid grid-cols-[1fr_120px] gap-2">
              <FormField label={isPublication ? "Publish date" : "Shoot date"}>
                <Input name="date" type="date" defaultValue={editor.date} required />
              </FormField>
              <FormField label="Time">
                <Input name="time" type="time" step={60} defaultValue={editor.time} />
              </FormField>
            </div>

            {isPublication ? (
              <>
                <FormField label="Channel">
                  <Select name="channel" className="w-full" defaultValue={editor.channel} required>
                    {channels.map((channel) => (
                      <option key={channel}>{channel}</option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Publication status">
                  <Select name="status" className="w-full" defaultValue={editor.status}>
                    {publicationStatusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Account">
                  <Input name="account" defaultValue={editor.account} />
                </FormField>

                <FormField label="Post URL">
                  <Input name="url" type="url" defaultValue={editor.url} />
                </FormField>

                <div className="col-span-2 max-[560px]:col-span-1">
                  <FormField label="Caption">
                    <Textarea name="caption" defaultValue={editor.caption} />
                  </FormField>
                </div>
              </>
            ) : (
              <>
                <FormField label="Production status">
                  <Select name="status" className="w-full" defaultValue={editor.status}>
                    {contentStatusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Owner">
                  <Input name="owner" defaultValue={editor.owner} />
                </FormField>

                <div className="col-span-2 max-[560px]:col-span-1">
                  <FormField label="Location">
                    <Input name="location" defaultValue={editor.location} />
                  </FormField>
                </div>
              </>
            )}
          </div>

          <footer className="calendar-edit-dialog__footer flex items-center justify-between border-t border-line px-6 py-4">
            <div>
              {editor.mode === "edit" && (
                <Button type="button" variant="danger" onClick={onDelete}>
                  {isPublication ? "Delete publication" : "Remove shoot date"}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editor.mode === "create" ? "Add event" : "Save changes"}
              </Button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
