export const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

export function parseVietnamDate(value?: string | null) {
  if (!value) return null;
  let text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) text += "T00:00:00+07:00";
  else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(text)) text += "+07:00";
  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? date : null;
}
export function formatVietnamDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function addDaysToDateKey(dateKey: string, numberOfDays: number) {
  const adjustedDate = new Date(`${dateKey}T12:00:00Z`);
  adjustedDate.setUTCDate(adjustedDate.getUTCDate() + numberOfDays);
  return adjustedDate.toISOString().slice(0, 10);
}

export function getDateKeyDayDifference(dateKey: string, referenceDate = new Date()) {
  const targetDate = parseVietnamDate(dateKey);
  const currentVietnamDate = parseVietnamDate(formatVietnamDateKey(referenceDate));
  return targetDate && currentVietnamDate
    ? Math.round((targetDate.getTime() - currentVietnamDate.getTime()) / 86400000)
    : 0;
}

export function formatRelativeDate(dateKey: string, referenceDate = new Date()) {
  const dayDifference = getDateKeyDayDifference(dateKey, referenceDate);
  return dayDifference < -1
    ? `${-dayDifference} days overdue`
    : dayDifference === -1
      ? "1 day overdue"
      : dayDifference === 0
        ? "today"
        : dayDifference === 1
          ? "tomorrow"
          : `in ${dayDifference} days`;
}

export function formatRelativeTimestamp(isoTimestamp: string, referenceDate = new Date()) {
  const timestampDate = new Date(isoTimestamp);
  const elapsedMinutes = Math.round((referenceDate.getTime() - timestampDate.getTime()) / 60000);
  if (!Number.isFinite(elapsedMinutes)) return "";
  if (elapsedMinutes < 1) return "just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;
  if (elapsedMinutes < 1440) return `${Math.round(elapsedMinutes / 60)} hr ago`;
  if (elapsedMinutes < 2880) return "yesterday";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: VIETNAM_TIME_ZONE,
  }).format(timestampDate);
}

export function formatDisplayDate(dateKey?: string) {
  const parsedDate = parseVietnamDate(dateKey);
  return parsedDate
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: VIETNAM_TIME_ZONE,
      }).format(parsedDate)
    : "—";
}
