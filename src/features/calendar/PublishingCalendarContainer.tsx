"use client";

import { PublishingCalendarView } from "@/components/organisms/publishing-calendar/PublishingCalendarView";
import { usePublishingCalendarController } from "./usePublishingCalendar";

export function PublishingCalendarContainer() {
  const calendarViewProps = usePublishingCalendarController();

  return <PublishingCalendarView {...calendarViewProps} />;
}
