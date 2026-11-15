import { addDaysToDateKey, formatVietnamDateKey } from "./dates";
import type { HubData } from "./types";

export function buildPublishingReport(
  hubData: HubData,
  reportingWeekCount = 12,
  referenceDate = new Date(),
) {
  const currentDateKey = formatVietnamDateKey(referenceDate);
  const currentWeekday = new Date(`${currentDateKey}T12:00:00Z`).getUTCDay();
  const currentWeekStart = addDaysToDateKey(currentDateKey, -((currentWeekday + 6) % 7));
  const reportingPeriodStart = addDaysToDateKey(currentWeekStart, -7 * (reportingWeekCount - 1));
  const weekStartDates = Array.from({ length: reportingWeekCount }, (_, weekIndex) =>
    addDaysToDateKey(reportingPeriodStart, weekIndex * 7),
  );
  const countPublicationsByWeek = (dateField: "date" | "posted") =>
    weekStartDates.map((weekStartDate) => {
      const nextWeekStartDate = addDaysToDateKey(weekStartDate, 7);
      return hubData.publications.filter(
        (publication) =>
          publication.status !== "cancelled" &&
          publication[dateField] >= weekStartDate &&
          publication[dateField] < nextWeekStartDate &&
          (dateField !== "posted" || publication.status === "posted"),
      ).length;
    });
  const plannedPublicationCounts = countPublicationsByWeek("date");
  const postedPublicationCounts = countPublicationsByWeek("posted");
  return {
    today: currentDateKey,
    from: reportingPeriodStart,
    days: weekStartDates,
    planned: plannedPublicationCounts,
    posted: postedPublicationCounts,
    plannedTotal: plannedPublicationCounts.reduce(
      (totalCount, weeklyCount) => totalCount + weeklyCount,
      0,
    ),
    postedTotal: postedPublicationCounts.reduce(
      (totalCount, weeklyCount) => totalCount + weeklyCount,
      0,
    ),
  };
}

export const calculatePercentageDelta = (currentValue: number, previousValue: number) =>
  previousValue
    ? Math.round(((currentValue - previousValue) / previousValue) * 100)
    : currentValue
      ? 100
      : 0;
