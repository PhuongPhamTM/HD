import { Button, Tag } from "@/components/atoms/ui";
import { EmptyState } from "@/components/molecules/ui";
import { Icon } from "@/components/atoms/icons";
import type {
  CalendarDayModel,
  CalendarEntity,
  CalendarOption,
  CalendarScope,
} from "@/features/calendar/calendar.types";
import { calendarEventTone } from "./CalendarEvent";

interface CalendarDayDialogProps {
  day: CalendarDayModel;
  scope: CalendarScope;
  contentStatusOptions: CalendarOption[];
  publicationStatusOptions: CalendarOption[];
  onEditEvent(eventId: string, entity: CalendarEntity): void;
  onAddEvent(date: string): void;
  onClose(): void;
}

export function CalendarDayDialog({
  day,
  scope,
  contentStatusOptions,
  publicationStatusOptions,
  onEditEvent,
  onAddEvent,
  onClose,
}: CalendarDayDialogProps) {
  const statusLabels = new Map(
    [...contentStatusOptions, ...publicationStatusOptions].map((option) => [
      option.value,
      option.label,
    ]),
  );

  return (
    <div
      className="calendar-day-dialog fixed inset-0 z-[80] grid place-items-center bg-[#071120]/55 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-day-title"
        className="calendar-day-dialog__panel w-full max-w-[520px] overflow-hidden rounded-card border border-line bg-card text-ink shadow-2xl"
      >
        <header className="calendar-day-dialog__header flex items-start justify-between border-b border-line px-6 py-4">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[.14em] text-brand-text">
              {scope === "publishing" ? "Publishing schedule" : "Shooting schedule"}
            </div>
            <h2 id="calendar-day-title" className="mb-0 mt-1 text-lg font-semibold">
              {day.dateLabel}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-ctl text-muted hover:bg-soft"
            aria-label="Close day view"
          >
            <Icon name="x" className="size-4" />
          </button>
        </header>

        <div className="calendar-day-dialog__body scrollbar-thin max-h-[60vh] overflow-y-auto">
          {day.events.length === 0 ? (
            <EmptyState title="Nothing scheduled" body="Add an event to plan this date." />
          ) : (
            <ul className="m-0 list-none divide-y divide-line p-0">
              {day.events.map((event) => (
                <li
                  key={`${event.entity}-${event.id}`}
                  className="calendar-day-dialog__event flex items-center gap-3 px-6 py-3"
                >
                  <span className="calendar-day-dialog__time w-10 shrink-0 text-[12px] font-semibold tabular-nums text-muted">
                    {event.time || "—"}
                  </span>
                  <Tag tone={calendarEventTone(event.kind)} className="shrink-0">
                    {event.kind}
                  </Tag>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{event.title}</div>
                    <div className="text-[11px] text-muted">
                      {statusLabels.get(event.status) ?? event.status}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => onEditEvent(event.id, event.entity)}>
                    Edit
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="calendar-day-dialog__footer flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          <Button type="button" onClick={onClose}>
            Close
          </Button>
          <Button type="button" variant="primary" onClick={() => onAddEvent(day.date)}>
            ＋ Add event
          </Button>
        </footer>
      </section>
    </div>
  );
}
