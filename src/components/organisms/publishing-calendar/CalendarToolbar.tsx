import { Button, Select } from "@/components/atoms/ui";
import type { CalendarScope } from "@/features/calendar/calendar.types";
import { cn } from "@/lib/cn";

interface CalendarToolbarProps {
  scope: CalendarScope;
  channel: string;
  channels: string[];
  monthLabel: string;
  onScopeChange(scope: CalendarScope): void;
  onChannelChange(channel: string): void;
  onPreviousMonth(): void;
  onNextMonth(): void;
}

export function CalendarToolbar({
  scope,
  channel,
  channels,
  monthLabel,
  onScopeChange,
  onChannelChange,
  onPreviousMonth,
  onNextMonth,
}: CalendarToolbarProps) {
  return (
    <div className="calendar-toolbar flex flex-wrap items-center gap-2 p-3">
      <div className="calendar-toolbar__scope inline-flex rounded-ctl bg-soft p-1">
        <button
          type="button"
          aria-pressed={scope === "publishing"}
          onClick={() => onScopeChange("publishing")}
          className={cn(
            "rounded-md px-3 py-1.5 text-[11px]",
            scope === "publishing" ? "bg-card font-semibold shadow-sm" : "text-muted",
          )}
        >
          Publishing
        </button>
        <button
          type="button"
          aria-pressed={scope === "shooting"}
          onClick={() => onScopeChange("shooting")}
          className={cn(
            "rounded-md px-3 py-1.5 text-[11px]",
            scope === "shooting" ? "bg-card font-semibold shadow-sm" : "text-muted",
          )}
        >
          Shooting
        </button>
      </div>

      <Select
        aria-label="Filter by channel"
        value={channel}
        onChange={(event) => onChannelChange(event.target.value)}
        disabled={scope === "shooting"}
      >
        <option value="">All channels</option>
        {channels.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </Select>

      <div className="calendar-toolbar__navigation ml-auto flex items-center gap-2">
        <Button size="sm" onClick={onPreviousMonth} aria-label="Previous month">
          ←
        </Button>
        <strong className="calendar-toolbar__month min-w-32 text-center text-[13px]">
          {monthLabel}
        </strong>
        <Button size="sm" onClick={onNextMonth} aria-label="Next month">
          →
        </Button>
      </div>
    </div>
  );
}
