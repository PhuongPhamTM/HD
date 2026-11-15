import type { CalendarCellViewModel, CalendarEntity } from "@/features/calendar/calendar.types";
import { cn } from "@/lib/cn";
import { CalendarEvent } from "./CalendarEvent";

interface MonthCalendarProps {
  cells: CalendarCellViewModel[];
  onDayClick(date: string): void;
  onEventClick(eventId: string, entity: CalendarEntity): void;
}

export function MonthCalendar({ cells, onDayClick, onEventClick }: MonthCalendarProps) {
  return (
    <div className="month-calendar overflow-hidden">
      <div className="month-calendar__weekdays grid grid-cols-7 border-b border-line bg-soft">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-[9px] font-bold uppercase tracking-[.1em] text-muted"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="month-calendar__grid grid grid-cols-7">
        {cells.map((cell) => (
          <div
            key={cell.date}
            className={cn(
              "month-calendar__day min-h-[112px] border-b border-r border-line p-2",
              cell.inMonth ? "bg-card" : "bg-soft/60 text-faint",
            )}
          >
            <button
              type="button"
              onClick={() => onDayClick(cell.date)}
              aria-label={`View and edit events on ${cell.date}`}
              className="month-calendar__date mb-1 rounded px-1 text-[10px] font-semibold hover:bg-brand-soft hover:text-brand-text"
            >
              {cell.dayNumber}
            </button>

            <div className="month-calendar__events scrollbar-thin grid max-h-[84px] gap-1 overflow-y-auto pr-0.5">
              {cell.events.map((event) => (
                <CalendarEvent key={event.id} event={event} onClick={onEventClick} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
