"use client";

import { useState } from "react";
import {
  buildCalendarCells,
  calendarMonthLabel,
  defaultCalendarMonth,
  moveCalendarMonth,
  selectCalendarEvents,
} from "@/lib/domain/calendar/selectors";
import { formatDisplayDate } from "@/lib/domain/dates";
import { useHubStore } from "@/lib/store/useHubStore";
import { activeOptions, selectableOptions } from "@/lib/domain/options";
import { useOptions } from "@/lib/hooks/useOptions";
import { openNewContentEditor } from "@/features/content-editor/contentEditorEvents";
import type { ContentStatus, Publication, PublicationStatus } from "@/lib/domain/types";
import type {
  CalendarEditorModel,
  CalendarEntity,
  CalendarScope,
  PublishingCalendarViewProps,
} from "./calendar.types";

const createEmptyCalendarEditor = (
  entity: CalendarEntity,
  date: string,
  contentId = "",
): CalendarEditorModel => ({
  mode: "create",
  entity,
  date,
  time: "",
  title: "",
  contentId,
  channel: "",
  account: "Handong E&C",
  status: entity === "publication" ? "planned" : "ready_to_shoot",
  caption: "",
  url: "",
  owner: "",
  location: "",
});

export function usePublishingCalendarController(): PublishingCalendarViewProps {
  const contentItems = useHubStore((state) => state.content);
  const publications = useHubStore((state) => state.publications);
  const addPublication = useHubStore((state) => state.addPublication);
  const updatePublication = useHubStore((state) => state.updatePublication);
  const updateContent = useHubStore((state) => state.updateContent);
  const remove = useHubStore((state) => state.remove);
  const options = useOptions();

  const [visibleMonth, setVisibleMonth] = useState(() => defaultCalendarMonth(publications));
  const [selectedChannel, setSelectedChannel] = useState("");
  const [calendarScope, setCalendarScope] = useState<CalendarScope>("publishing");
  const [calendarEditor, setCalendarEditor] = useState<CalendarEditorModel | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Channels from the Options tab first (in their order), then any older ones still in use.
  const availableChannels = [
    ...new Set([
      ...activeOptions(options.channels).map((channel) => channel.key),
      ...publications
        .map((publication) => publication.channel)
        .filter(Boolean)
        .sort(),
    ]),
  ];
  const calendarEvents = selectCalendarEvents(contentItems, publications, {
    month: visibleMonth,
    channel: selectedChannel,
    scope: calendarScope,
  });
  const calendarCells = buildCalendarCells(visibleMonth, calendarEvents);
  const selectedDay = selectedDate
    ? {
        date: selectedDate,
        dateLabel: formatDisplayDate(selectedDate),
        events: selectCalendarEvents(contentItems, publications, {
          month: selectedDate.slice(0, 7),
          channel: selectedChannel,
          scope: calendarScope,
        }).filter((event) => event.date === selectedDate),
      }
    : null;

  function openCalendarEventEditor(eventId: string, entity: CalendarEntity) {
    if (entity === "content") {
      const contentItem = contentItems.find((candidate) => candidate.id === eventId);
      if (!contentItem) return;

      setCalendarEditor({
        mode: "edit",
        entity,
        id: contentItem.id,
        date: contentItem.shoot,
        time: contentItem.shootTime ?? "",
        title: contentItem.title,
        contentId: contentItem.id,
        channel: "",
        account: "",
        status: contentItem.status,
        caption: "",
        url: "",
        owner: contentItem.owner,
        location: contentItem.location,
      });
      return;
    }

    const publication = publications.find((candidate) => candidate.id === eventId);
    if (!publication) return;

    setCalendarEditor({
      mode: "edit",
      entity,
      id: publication.id,
      date: publication.date,
      time: publication.time ?? "",
      title:
        contentItems.find((contentItem) => contentItem.id === publication.content)?.title ??
        "Untitled",
      contentId: publication.content,
      channel: publication.channel,
      account: publication.account,
      status: publication.status,
      caption: publication.caption,
      url: publication.url,
      owner: "",
      location: "",
    });
  }

  function openCalendarDay(date: string) {
    setSelectedDate(date);
  }

  function openCalendarDayEditor(date: string) {
    setCalendarEditor(
      createEmptyCalendarEditor(calendarScope === "publishing" ? "publication" : "content", date),
    );
  }

  function saveCalendarEditor(formData: FormData) {
    if (!calendarEditor) return;

    const date = String(formData.get("date") ?? "");
    const time = String(formData.get("time") ?? "");
    const contentId = String(formData.get("contentId") ?? "");

    if (calendarEditor.entity === "content") {
      const targetContentId = calendarEditor.id ?? contentId;
      if (!targetContentId) return;
      const existingContent = contentItems.find(
        (contentItem) => contentItem.id === targetContentId,
      );
      const owner = String(formData.get("owner") ?? "");
      const location = String(formData.get("location") ?? "");

      updateContent(targetContentId, {
        shoot: date,
        shootTime: time,
        owner: calendarEditor.mode === "edit" ? owner : owner || existingContent?.owner,
        location: calendarEditor.mode === "edit" ? location : location || existingContent?.location,
        status: String(formData.get("status") ?? "ready_to_shoot") as ContentStatus,
      });
      setCalendarEditor(null);
      return;
    }

    if (!contentId) return;

    const status = String(formData.get("status") ?? "planned") as PublicationStatus;
    const existingPublication = calendarEditor.id
      ? publications.find((publication) => publication.id === calendarEditor.id)
      : undefined;
    const publicationPatch: Partial<Publication> = {
      content: contentId,
      date,
      time,
      channel: String(formData.get("channel") ?? ""),
      account: String(formData.get("account") ?? ""),
      status,
      posted: status === "posted" ? existingPublication?.posted || date : "",
      caption: String(formData.get("caption") ?? ""),
      url: String(formData.get("url") ?? ""),
      scheduleUnknown: false,
    };

    if (calendarEditor.mode === "edit" && calendarEditor.id) {
      updatePublication(calendarEditor.id, publicationPatch);
    } else {
      addPublication({
        id: crypto.randomUUID(),
        content: contentId,
        channel: publicationPatch.channel ?? "",
        account: publicationPatch.account ?? "",
        date,
        time,
        posted: status === "posted" ? date : "",
        status,
        url: publicationPatch.url ?? "",
        caption: publicationPatch.caption ?? "",
        hashtags: "",
        scheduleUnknown: false,
      });
    }

    setCalendarEditor(null);
  }

  function deleteCalendarEditor() {
    if (!calendarEditor?.id) return;
    if (!window.confirm("Remove this event from the calendar?")) return;

    if (calendarEditor.entity === "publication") {
      remove("publications", calendarEditor.id);
    } else {
      updateContent(calendarEditor.id, { shoot: "", shootTime: "" });
    }

    setCalendarEditor(null);
  }

  return {
    monthLabel: calendarMonthLabel(visibleMonth),
    scope: calendarScope,
    channel: selectedChannel,
    channels: availableChannels,
    cells: calendarCells,
    editor: calendarEditor,
    selectedDay,
    contentOptions: contentItems.map((contentItem) => ({
      id: contentItem.id,
      title: contentItem.title,
    })),
    contentStatusOptions: selectableOptions(options.stages, calendarEditor?.status).map(
      (status) => ({
        value: status.key,
        label: status.label,
      }),
    ),
    publicationStatusOptions: selectableOptions(
      options.publicationStatuses,
      calendarEditor?.status,
    ).map((status) => ({
      value: status.key,
      label: status.label,
    })),
    onPreviousMonth: () => setVisibleMonth((currentMonth) => moveCalendarMonth(currentMonth, -1)),
    onNextMonth: () => setVisibleMonth((currentMonth) => moveCalendarMonth(currentMonth, 1)),
    onScopeChange: setCalendarScope,
    onChannelChange: setSelectedChannel,
    onEventClick: openCalendarEventEditor,
    onDayClick: openCalendarDay,
    onDayAddEvent: openCalendarDayEditor,
    onDayClose: () => setSelectedDate(null),
    onEditorSave: saveCalendarEditor,
    onEditorDelete: deleteCalendarEditor,
    onEditorClose: () => setCalendarEditor(null),
    onAddContent: openNewContentEditor,
  };
}
