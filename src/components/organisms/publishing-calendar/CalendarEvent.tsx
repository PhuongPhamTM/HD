import { Tag } from "@/components/atoms/ui";
import type { CalendarEventViewModel } from "@/features/calendar/calendar.types";

type CalendarEventTone = "blue" | "violet" | "red" | "green" | "gray";

const tone: Record<string, CalendarEventTone> = {
  Facebook: "blue",
  TikTok: "violet",
  YouTube: "red",
  LinkedIn: "blue",
  Website: "green",
};

export function calendarEventTone(kind: string): CalendarEventTone {
  return tone[kind] || "gray";
}

interface CalendarEventProps {
  event: CalendarEventViewModel;
  onClick(eventId: string, entity: CalendarEventViewModel["entity"]): void;
}

export function CalendarEvent({ event, onClick }: CalendarEventProps) {
  return (
    <button
      type="button"
      title={`${event.title} — ${event.dateLabel}${event.time ? ` ${event.time}` : ""}`}
      onClick={() => onClick(event.id, event.entity)}
      className="calendar-event block w-full truncate rounded-md bg-soft px-1.5 py-1 text-left text-[9px] transition hover:bg-brand-soft focus-visible:z-10"
    >
      <Tag tone={calendarEventTone(event.kind)} className="mr-1 px-1 py-0">
        {event.kind.slice(0, 2)}
      </Tag>
      {event.time && (
        <span className="calendar-event__time mr-1 font-semibold tabular-nums text-muted">
          {event.time}
        </span>
      )}
      {event.title}
    </button>
  );
}
