import type { ContentStatus, PublicationStatus } from "@/lib/domain/types";

export type CalendarScope = "publishing" | "shooting";
export type CalendarEntity = "publication" | "content";

export interface CalendarEventViewModel {
  id: string;
  entity: CalendarEntity;
  date: string;
  /** "HH:mm", or "" when the item has no scheduled time. */
  time: string;
  dateLabel: string;
  title: string;
  kind: string;
  status: ContentStatus | PublicationStatus;
}

export interface CalendarCellViewModel {
  date: string;
  dayNumber: number;
  inMonth: boolean;
  events: CalendarEventViewModel[];
}

export interface CalendarDayModel {
  date: string;
  dateLabel: string;
  events: CalendarEventViewModel[];
}

export interface CalendarEditorModel {
  mode: "create" | "edit";
  entity: CalendarEntity;
  id?: string;
  date: string;
  time: string;
  title: string;
  contentId: string;
  channel: string;
  account: string;
  status: ContentStatus | PublicationStatus;
  caption: string;
  url: string;
  owner: string;
  location: string;
}

export interface CalendarEditorInput {
  date: string;
  time: string;
  contentId: string;
  channel: string;
  account: string;
  status: ContentStatus | PublicationStatus;
  caption: string;
  url: string;
  owner: string;
  location: string;
}

export interface CalendarOption {
  value: string;
  label: string;
}

export interface CalendarContentOption {
  id: string;
  title: string;
}

export interface PublishingCalendarViewProps {
  monthLabel: string;
  scope: CalendarScope;
  channel: string;
  channels: string[];
  cells: CalendarCellViewModel[];
  editor: CalendarEditorModel | null;
  selectedDay: CalendarDayModel | null;
  contentOptions: CalendarContentOption[];
  contentStatusOptions: CalendarOption[];
  publicationStatusOptions: CalendarOption[];
  onPreviousMonth(): void;
  onNextMonth(): void;
  onScopeChange(scope: CalendarScope): void;
  onChannelChange(channel: string): void;
  onEventClick(eventId: string, entity: CalendarEntity): void;
  onDayClick(date: string): void;
  onDayAddEvent(date: string): void;
  onDayClose(): void;
  onEditorSave(formData: FormData): void;
  onEditorDelete(): void;
  onEditorClose(): void;
  onAddContent(): void;
}
