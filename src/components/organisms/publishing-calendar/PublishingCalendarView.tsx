import { Button } from "@/components/atoms/ui";
import { Card } from "@/components/molecules/ui";
import type { PublishingCalendarViewProps } from "@/features/calendar/calendar.types";
import { PageHeader } from "../PageHeader";
import { CalendarDayDialog } from "./CalendarDayDialog";
import { CalendarEditDialog } from "./CalendarEditDialog";
import { CalendarToolbar } from "./CalendarToolbar";
import { MonthCalendar } from "./MonthCalendar";

export function PublishingCalendarView({
  monthLabel,
  scope,
  channel,
  channels,
  cells,
  editor,
  selectedDay,
  contentOptions,
  contentStatusOptions,
  publicationStatusOptions,
  onPreviousMonth,
  onNextMonth,
  onScopeChange,
  onChannelChange,
  onEventClick,
  onDayClick,
  onDayAddEvent,
  onDayClose,
  onEditorSave,
  onEditorDelete,
  onEditorClose,
  onAddContent,
}: PublishingCalendarViewProps) {
  return (
    <div className="publishing-calendar-view">
      <PageHeader
        title="Shoot & Publish Calendar"
        description="Coordinate production days and cross-channel publishing in one timeline. Select a date to see and edit everything scheduled on it, or select an event to edit it directly."
        actions={
          <Button variant="primary" onClick={onAddContent}>
            ＋ Add content
          </Button>
        }
      />

      <Card className="publishing-calendar-view__toolbar mb-4">
        <CalendarToolbar
          monthLabel={monthLabel}
          scope={scope}
          channel={channel}
          channels={channels}
          onPreviousMonth={onPreviousMonth}
          onNextMonth={onNextMonth}
          onScopeChange={onScopeChange}
          onChannelChange={onChannelChange}
        />
      </Card>

      <Card className="publishing-calendar-view__month">
        <MonthCalendar cells={cells} onDayClick={onDayClick} onEventClick={onEventClick} />
      </Card>

      {selectedDay && !editor && (
        <CalendarDayDialog
          day={selectedDay}
          scope={scope}
          contentStatusOptions={contentStatusOptions}
          publicationStatusOptions={publicationStatusOptions}
          onEditEvent={onEventClick}
          onAddEvent={onDayAddEvent}
          onClose={onDayClose}
        />
      )}

      {editor && (
        <CalendarEditDialog
          key={`${editor.mode}-${editor.entity}-${editor.id ?? editor.date}`}
          editor={editor}
          contentOptions={contentOptions}
          channels={channels}
          contentStatusOptions={contentStatusOptions}
          publicationStatusOptions={publicationStatusOptions}
          onSave={onEditorSave}
          onDelete={onEditorDelete}
          onClose={onEditorClose}
        />
      )}
    </div>
  );
}
