import { addDaysToDateKey, formatDisplayDate } from "@/lib/domain/dates";
import type { ContentItem, Publication } from "@/lib/domain/types";
import type {
  CalendarCellViewModel,
  CalendarEventViewModel,
  CalendarScope,
} from "@/features/calendar/calendar.types";

interface CalendarFilters {
  month: string;
  scope: CalendarScope;
  channel: string;
}

export function defaultCalendarMonth(publications: Publication[], now = new Date()): string {
  const dates = publications
    .map((publication) => publication.date)
    .filter(Boolean)
    .sort();

  return dates.at(-1)?.slice(0, 7) || now.toISOString().slice(0, 7);
}

export function calendarMonthLabel(month: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T12:00:00Z`));
}

export function moveCalendarMonth(month: string, amount: number): string {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
}

/** Orders by date, then time; items without a time go after timed ones on the same date. */
export function compareCalendarEvents(
  a: CalendarEventViewModel,
  b: CalendarEventViewModel,
): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.time !== b.time) {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time < b.time ? -1 : 1;
  }
  return a.title.localeCompare(b.title);
}

export function selectCalendarEvents(
  content: ContentItem[],
  publications: Publication[],
  filters: CalendarFilters,
): CalendarEventViewModel[] {
  return selectUnsortedCalendarEvents(content, publications, filters).sort(compareCalendarEvents);
}

function selectUnsortedCalendarEvents(
  content: ContentItem[],
  publications: Publication[],
  filters: CalendarFilters,
): CalendarEventViewModel[] {
  if (filters.scope === "shooting") {
    return content
      .filter((item) => item.shoot?.startsWith(filters.month))
      .map((item) => ({
        id: item.id,
        entity: "content" as const,
        date: item.shoot,
        time: item.shootTime ?? "",
        dateLabel: formatDisplayDate(item.shoot),
        title: item.title,
        kind: "Shoot",
        status: item.status,
      }));
  }

  const contentTitles = new Map(content.map((item) => [item.id, item.title]));

  return publications
    .filter(
      (publication) =>
        (!filters.channel || publication.channel === filters.channel) &&
        publication.date.startsWith(filters.month),
    )
    .map((publication) => ({
      id: publication.id,
      entity: "publication" as const,
      date: publication.date,
      time: publication.time ?? "",
      dateLabel: formatDisplayDate(publication.date),
      title: contentTitles.get(publication.content) || "Untitled",
      kind: publication.channel,
      status: publication.status,
    }));
}

export function buildCalendarCells(
  month: string,
  events: CalendarEventViewModel[],
): CalendarCellViewModel[] {
  const first = `${month}-01`;
  const firstDate = new Date(`${first}T12:00:00Z`);
  const startOffset = (firstDate.getUTCDay() + 6) % 7;
  const eventsByDate = new Map<string, CalendarEventViewModel[]>();

  for (const event of events) {
    const dailyEvents = eventsByDate.get(event.date) ?? [];
    dailyEvents.push(event);
    eventsByDate.set(event.date, dailyEvents);
  }

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDaysToDateKey(first, index - startOffset);

    return {
      date,
      dayNumber: Number(date.slice(-2)),
      inMonth: date.startsWith(month),
      events: eventsByDate.get(date) ?? [],
    };
  });
}
