import { describe, expect, it } from "vitest";
import {
  buildCalendarCells,
  calendarMonthLabel,
  defaultCalendarMonth,
  moveCalendarMonth,
  selectCalendarEvents,
} from "./selectors";
import type { ContentItem, Publication } from "@/lib/domain/types";

const content: ContentItem[] = [
  {
    id: "content-1",
    title: "Launch film",
    campaign: "",
    owner: "Mai",
    location: "Studio",
    status: "ready_to_shoot",
    shoot: "2026-10-12",
    edit: "",
    due: "",
    script: "",
    format: "Short Video",
    priority: "Normal",
    pillar: "",
    checks: [],
  },
];

const publications: Publication[] = [
  {
    id: "publication-1",
    content: "content-1",
    channel: "Facebook",
    account: "Handong E&C",
    date: "2026-10-15",
    posted: "",
    status: "scheduled",
    url: "",
    caption: "Launch day",
    hashtags: "",
  },
];

describe("calendar selectors", () => {
  it("selects publication and shooting events independently", () => {
    const publishing = selectCalendarEvents(content, publications, {
      month: "2026-10",
      scope: "publishing",
      channel: "Facebook",
    });
    const shooting = selectCalendarEvents(content, publications, {
      month: "2026-10",
      scope: "shooting",
      channel: "",
    });

    expect(publishing[0]).toMatchObject({ entity: "publication", title: "Launch film" });
    expect(shooting[0]).toMatchObject({ entity: "content", date: "2026-10-12" });
  });

  it("builds a Monday-first six-week calendar", () => {
    const events = selectCalendarEvents(content, publications, {
      month: "2026-10",
      scope: "publishing",
      channel: "",
    });
    const cells = buildCalendarCells("2026-10", events);

    expect(cells).toHaveLength(42);
    expect(cells[0].date).toBe("2026-09-28");
    expect(cells.find((cell) => cell.date === "2026-10-15")?.events).toHaveLength(1);
  });

  it("handles month labels and navigation", () => {
    expect(calendarMonthLabel("2026-10")).toBe("October 2026");
    expect(moveCalendarMonth("2026-12", 1)).toBe("2027-01");
    expect(defaultCalendarMonth(publications)).toBe("2026-10");
  });
});
